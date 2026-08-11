from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, MessageSerializer
from django.conf import settings
from pgvector.django import L2Distance

# Global initialization
import google.generativeai as genai
from sentence_transformers import SentenceTransformer

# Only configure if key exists
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

class ChatSessionListView(generics.ListCreateAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from django.shortcuts import get_object_or_404
from apps.documents.models import Document

class ChatSessionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def get_object(self):
        # The 'pk' parameter can be either a ChatSession ID or a Document ID.
        pk = self.kwargs.get('pk')
        user = self.request.user
        
        # 1. Try to fetch by ChatSession ID
        try:
            return ChatSession.objects.get(pk=pk, user=user)
        except ChatSession.DoesNotExist:
            pass
            
        # 2. Fallback: Assume it's a Document ID.
        # Find if a chat session already exists for this document
        existing_session = ChatSession.objects.filter(user=user, documents__id=pk).first()
        if existing_session:
            return existing_session
            
        # 3. Create a new ChatSession for this document
        doc = get_object_or_404(Document, pk=pk, user=user)
        new_session = ChatSession.objects.create(
            user=user,
            title=f"Chat about {doc.title}"
        )
        new_session.documents.add(doc)
        return new_session

class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Deserialize user message
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Verify ownership
        chat_session = serializer.validated_data['chat_session']
        if chat_session.user != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        user_message = serializer.save(role='user')
        
        try:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not configured in environment variables.")

            # 1. Embed query
            query_embedding = embedding_model.encode(user_message.content).tolist()
            
            # 2. Vector search in session documents
            documents = chat_session.documents.all()
            if not documents.exists():
                raise ValueError("No documents associated with this chat session.")
                
            from apps.documents.models import Chunk
            # Search chunks within this chat's documents, ordered by similarity
            chunks = Chunk.objects.filter(document__in=documents).annotate(
                distance=L2Distance('embedding', query_embedding)
            ).order_by('distance')[:5]
            
            if not chunks.exists():
                context_text = "No relevant document context found."
            else:
                context_text = "\n\n".join([f"Excerpt from page {c.page_number}:\n{c.content}" for c in chunks])
            
            # 3. Call Gemini
            target_model = 'gemini-3.5-flash'
            available_models = [m.name.replace('models/', '') for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            
            if target_model not in available_models and available_models:
                target_model = available_models[0]
            
            model = genai.GenerativeModel(target_model)
            prompt = f"Context information is below.\n---------------------\n{context_text}\n---------------------\nBased on the context, answer the user's query. If the answer is not in the context, say so.\nQuery: {user_message.content}"
            
            response = model.generate_content(prompt)
            ai_text = response.text
            
            # 4. Save AI message
            ai_message = Message.objects.create(
                chat_session=chat_session,
                role='ai',
                content=ai_text
            )
            # Link citations
            ai_message.citations.set(chunks)
            
            # Update chat session timestamp
            chat_session.save(update_fields=['updated_at'])
            
            # 5. Return the AI message to frontend
            ai_serializer = self.get_serializer(ai_message)
            return Response(ai_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("RAG Pipeline Error: %s", str(e), exc_info=True)
            
            error_msg = str(e)
            if "API key not valid" in error_msg or "API_KEY_INVALID" in error_msg:
                error_msg = "Invalid AI model API Key. Please configure a valid GEMINI_API_KEY."
                
            # Return friendly fallback error
            return Response({'error': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class MessageClearView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, *args, **kwargs):
        session_id = self.kwargs.get('pk')
        try:
            chat_session = ChatSession.objects.get(pk=session_id, user=request.user)
            deleted_count, _ = chat_session.messages.all().delete()
            return Response({'message': f'Cleared {deleted_count} messages.'}, status=status.HTTP_200_OK)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
