import json
import logging
import random

import google.generativeai as genai
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.documents.models import Document, Chunk
from apps.users.permissions import IsOwnerOrAdmin
from .models import Quiz, Question, Result
from .serializers import QuizSerializer, ResultSerializer, QuestionDetailSerializer
from apps.agents.workflows import generate_quiz_with_crewai, evaluate_open_questions_with_crewai

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


def get_gemini_model():
    """Dynamically pick the best available Gemini model that supports generateContent."""
    preferred = 'gemini-3.5-flash'
    try:
        available = [
            m.name.replace('models/', '')
            for m in genai.list_models()
            if 'generateContent' in m.supported_generation_methods
        ]
        if preferred in available:
            return genai.GenerativeModel(preferred)
        if available:
            return genai.GenerativeModel(available[0])
    except Exception as e:
        logger.warning("Could not list models, defaulting to %s: %s", preferred, e)
    return genai.GenerativeModel(preferred)


class QuizListView(generics.ListAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMINISTRATEUR':
            return Quiz.objects.all().order_by('-created_at')
        return Quiz.objects.filter(user=self.request.user).order_by('-created_at')


class QuizDetailView(generics.RetrieveAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        if self.request.user.role == 'ADMINISTRATEUR':
            return Quiz.objects.all()
        return Quiz.objects.filter(user=self.request.user)


class QuizGenerateView(APIView):
    """
    POST /api/quizzes/generate/
    Body: { document_id, scope, num_questions, question_types, difficulty }
    Generates a quiz using Gemini with sourced document chunks.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            document_id = request.data.get('document_id')
            scope = request.data.get('scope', 'FULL')
            num_questions = min(int(request.data.get('num_questions', 5)), 50)
            question_types = request.data.get('question_types', ['MCQ'])
            difficulty = request.data.get('difficulty', 'MEDIUM')

            if not document_id:
                return Response({'error': 'document_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                if request.user.role == 'ADMINISTRATEUR':
                    doc = Document.objects.get(pk=document_id)
                else:
                    doc = Document.objects.get(pk=document_id, user=request.user)
            except (Document.DoesNotExist, ValueError):
                logger.warning(f"Invalid or missing document_id requested: {document_id}")
                return Response({'error': 'Document not found or invalid ID format.'}, status=status.HTTP_404_NOT_FOUND)

            # --- 1. Retrieve chunks based on scope ---
            chunks_qs = Chunk.objects.filter(document=doc)
            if scope == 'COMPLEX':
                # Use longer chunks for complex concept questions
                chunks_qs = chunks_qs.filter(content__len__gt=300)
            
            chunks = list(chunks_qs)
            if not chunks:
                return Response({'error': 'No document content found. Please ensure the document has been processed.'}, status=status.HTTP_400_BAD_REQUEST)

            # Sample chunks: use more chunks for larger quizzes
            sample_size = min(len(chunks), max(num_questions * 2, 10))
            sampled_chunks = random.sample(chunks, sample_size)
            
            chunk_context = "\n\n---\n\n".join([
                f"[CHUNK_ID:{c.id}] (Page {c.page_number}):\n{c.content}"
                for c in sampled_chunks
            ])
            chunk_id_map = {c.id: c for c in sampled_chunks}

            # --- 2. Build Gemini prompt ---
            types_description = {
                'MCQ': 'Multiple Choice (4 options)',
                'TF': 'True/False',
                'OPEN': 'Open-Ended (short answer)',
            }
            requested_types = ", ".join([types_description.get(t, t) for t in question_types])
            
            difficulty_instructions = {
                'EASY': 'Keep questions simple and factual — directly from the text.',
                'MEDIUM': 'Mix factual recall with light comprehension and inference.',
                'HARD': 'Focus on deep understanding, analysis, and synthesis across multiple chunks.',
                'ADAPTIVE': 'Start with easy factual questions, then progress to harder analytical ones.',
            }

            prompt = f"""You are an expert educational quiz creator. Based on the following document excerpts, generate exactly {num_questions} quiz questions.

DOCUMENT EXCERPTS:
{chunk_context}

REQUIREMENTS:
- Question types to use: {requested_types}
- Difficulty level: {difficulty} — {difficulty_instructions.get(difficulty, '')}
- Each question MUST reference the CHUNK_ID(s) it was derived from.
- For MCQ questions, provide exactly 4 answer options.
- For True/False questions, options must be exactly ["True", "False"].
- For Open questions, provide a model answer as correct_answer.
- Explanations must be detailed and educational.

Return ONLY a valid JSON array. No markdown, no extra text, only raw JSON.
Each element must have this exact structure:
{{
  "question": "...",
  "question_type": "MCQ" | "TF" | "OPEN",
  "options": ["A", "B", "C", "D"],
  "correct_answer": "The exact correct option text",
  "explanation": "Why this is correct...",
  "difficulty": "{difficulty}",
  "source_chunk_ids": [CHUNK_ID, ...]
}}"""

            try:
                crewai_result = generate_quiz_with_crewai(chunk_context, prompt)
                
                if hasattr(crewai_result, 'raw'):
                    response_text = crewai_result.raw
                else:
                    response_text = str(crewai_result)

                clean_json = response_text.replace("```json", "").replace("```", "").strip()
                questions_data = json.loads(clean_json)
                
                # LLMs sometimes return an object like {"questions": [...]} instead of an array
                if isinstance(questions_data, dict):
                    # Try to extract the first list value found in the dict
                    extracted_list = next((v for v in questions_data.values() if isinstance(v, list)), None)
                    if extracted_list:
                        questions_data = extracted_list
                    else:
                        raise ValueError("AI returned a JSON object, but no question array was found inside.")
                        
                if not isinstance(questions_data, list):
                    raise ValueError(f"AI returned {type(questions_data).__name__} instead of a JSON array.")
                    
            except json.JSONDecodeError as e:
                logger.error("Gemini returned invalid JSON: %s", e)
                return Response({'error': 'AI returned malformed JSON. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                logger.error("Gemini generation error: %s", e, exc_info=True)
                return Response({'error': f"Failed to generate quiz with AI: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # --- 3. Persist Quiz and Questions ---
            quiz = Quiz.objects.create(
                user=request.user,
                title=f"Quiz: {doc.title}",
                scope=scope,
                difficulty=difficulty,
                total_questions=len(questions_data),
            )
            quiz.documents.add(doc)

            for q_data in questions_data:
                q_type = q_data.get('question_type', 'MCQ')
                source_ids = q_data.get('source_chunk_ids', [])
                
                # Find the primary chunk reference
                primary_chunk = None
                for cid in source_ids:
                    if cid in chunk_id_map:
                        primary_chunk = chunk_id_map[cid]
                        break

                Question.objects.create(
                    quiz=quiz,
                    chunk=primary_chunk,
                    question_text=q_data.get('question', ''),
                    question_type=q_type,
                    options=q_data.get('options', []),
                    correct_answer=q_data.get('correct_answer', q_data.get('answer', '')),
                    explanation=q_data.get('explanation', ''),
                    difficulty=q_data.get('difficulty', difficulty),
                    source_chunk_ids=source_ids,
                )

            serializer = QuizSerializer(quiz)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error("Unhandled error in QuizGenerateView: %s", str(e), exc_info=True)
            return Response({'error': f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuizSubmitView(APIView):
    """
    POST /api/quizzes/<pk>/submit/
    Body: { answers: { "<question_id>": "<user_answer>", ... } }
    Grades the quiz. Uses exact match for MCQ/TF, Gemini semantic grading for OPEN.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            try:
                if request.user.role == 'ADMINISTRATEUR':
                    quiz = Quiz.objects.get(pk=pk)
                else:
                    quiz = Quiz.objects.get(pk=pk, user=request.user)
            except Quiz.DoesNotExist:
                return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

            if hasattr(quiz, 'result'):
                return Response({'error': 'This quiz has already been submitted.'}, status=status.HTTP_400_BAD_REQUEST)

            answers = request.data.get('answers', {})
            questions = quiz.questions.all()
            
            correct_count = 0
            evaluation_feedback = {}
            open_questions_to_grade = []

            for q in questions:
                user_answer = answers.get(str(q.id), '').strip()
                
                source_chunks = []
                if q.source_chunk_ids:
                    chunks = Chunk.objects.filter(id__in=q.source_chunk_ids)
                    source_chunks = [{'id': c.id, 'page_number': c.page_number, 'content': c.content} for c in chunks]

                if q.question_type in ('MCQ', 'TF'):
                    is_correct = user_answer.strip().lower() == q.correct_answer.strip().lower()
                    if is_correct:
                        correct_count += 1
                    evaluation_feedback[str(q.id)] = {
                        'user_answer': user_answer,
                        'correct_answer': q.correct_answer,
                        'is_correct': is_correct,
                        'explanation': q.explanation,
                        'source_chunks': source_chunks,
                    }
                elif q.question_type == 'OPEN':
                    open_questions_to_grade.append((q, user_answer))

            # --- Semantic grading for OPEN questions ---
            if open_questions_to_grade:
                try:
                    grading_prompt_parts = []
                    for q, user_ans in open_questions_to_grade:
                        grading_prompt_parts.append(
                            f"Question ID {q.id}: {q.question_text}\n"
                            f"Model Answer: {q.correct_answer}\n"
                            f"Student Answer: {user_ans}"
                        )

                    grading_prompt = f"""You are a strict but fair educational evaluator. Grade each open-ended student answer below.

{chr(10).join(grading_prompt_parts)}

For each question, return a JSON object with:
- "question_id": <int>
- "is_correct": <bool> (true if the student demonstrates understanding of the key concept)
- "score": <float between 0.0 and 1.0>
- "feedback": "<one sentence feedback explaining the grade>"

Return a JSON array of these objects. Only raw JSON, no markdown."""

                    crewai_result = evaluate_open_questions_with_crewai(grading_prompt)
                    
                    if hasattr(crewai_result, 'raw'):
                        response_text = crewai_result.raw
                    else:
                        response_text = str(crewai_result)
                        
                    clean_json = response_text.replace("```json", "").replace("```", "").strip()
                    grading_results = json.loads(clean_json)
                    for gr in grading_results:
                        qid = str(gr.get('question_id'))
                        q_obj = next((q for q, _ in open_questions_to_grade if str(q.id) == qid), None)
                        if q_obj:
                            partial_credit = gr.get('score', 0.0)
                            correct_count += partial_credit
                            
                            source_chunks = []
                            if q_obj.source_chunk_ids:
                                chunks = Chunk.objects.filter(id__in=q_obj.source_chunk_ids)
                                source_chunks = [{'id': c.id, 'page_number': c.page_number, 'content': c.content} for c in chunks]
                                
                            evaluation_feedback[qid] = {
                                'user_answer': answers.get(qid, ''),
                                'correct_answer': q_obj.correct_answer,
                                'is_correct': gr.get('is_correct', False),
                                'score': partial_credit,
                                'feedback': gr.get('feedback', ''),
                                'explanation': q_obj.explanation,
                                'source_chunks': source_chunks,
                            }
                except Exception as e:
                    logger.error("Open question grading error: %s", e, exc_info=True)
                    # Fallback: mark as ungraded
                    for q, user_ans in open_questions_to_grade:
                        source_chunks = []
                        if q.source_chunk_ids:
                            chunks = Chunk.objects.filter(id__in=q.source_chunk_ids)
                            source_chunks = [{'id': c.id, 'page_number': c.page_number, 'content': c.content} for c in chunks]
                            
                        evaluation_feedback[str(q.id)] = {
                            'user_answer': user_ans,
                            'correct_answer': q.correct_answer,
                            'is_correct': False,
                            'feedback': 'Could not grade automatically. Please review manually.',
                            'explanation': q.explanation,
                            'source_chunks': source_chunks,
                        }

            total = quiz.total_questions
            final_score = round((correct_count / total) * 100, 1) if total > 0 else 0.0

            result = Result.objects.create(
                quiz=quiz,
                user=request.user,
                score=final_score,
                total=total,
                detailed_answers=answers,
                evaluation_feedback=evaluation_feedback,
            )

            quiz.score = final_score
            quiz.completed_at = timezone.now()
            quiz.save(update_fields=['score', 'completed_at'])

            return Response({
                'quiz_id': quiz.id,
                'score': final_score,
                'total': total,
                'correct': correct_count,
                'evaluation_feedback': evaluation_feedback,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error("Unhandled error in QuizSubmitView: %s", str(e), exc_info=True)
            return Response({'error': f"Failed to submit quiz: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
