from crewai import Task

def task_classify_intent(orchestrator, user_query):
    return Task(
        description=f"Analyze this user query: '{user_query}'. Determine if it is a general question, a request for a summary, or a request to generate a quiz. Output only the category: QA, SUMMARY, or QUIZ.",
        expected_output="A single word: QA, SUMMARY, or QUIZ.",
        agent=orchestrator
    )

def task_retrieve_context(rag_agent, user_query, document_ids):
    return Task(
        description=f"Using the provided custom search tool, retrieve the top relevant text chunks for the query: '{user_query}' across documents: {document_ids}.",
        expected_output="A compiled string of the most relevant retrieved text chunks with their IDs.",
        agent=rag_agent
    )

def task_generate_answer(pedagogical_agent, user_query, retrieved_context):
    return Task(
        description=f"Answer the query '{user_query}' STRICTLY based on the following context: {retrieved_context}. Do not hallucinate. Include citation chunk IDs in your response.",
        expected_output="A clear, pedagogical answer with citations to the provided chunks.",
        agent=pedagogical_agent
    )

def task_generate_quiz(quiz_agent, context, num_questions):
    return Task(
        description=f"Generate {num_questions} questions (mix of MCQ, True/False) based on this context: {context}. Format output as valid JSON.",
        expected_output="A JSON array of question objects.",
        agent=quiz_agent
    )
