import os
from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from django.conf import settings

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.7
    )

def create_orchestrator_agent():
    return Agent(
        role='Orchestrator',
        goal='Classify the user intent (QA, summary, quiz generation) and route the task appropriately.',
        backstory='You are the main coordinator of the EdTech AI platform, ensuring user requests are handled by the right expert.',
        verbose=True,
        allow_delegation=True,
        llm=get_llm()
    )

def create_rag_agent():
    return Agent(
        role='RAG Specialist',
        goal='Retrieve the most relevant context from the vector database to answer the user query without hallucinations.',
        backstory='You are an expert at searching through dense vector embeddings and finding exactly the right information.',
        verbose=True,
        allow_delegation=False,
        llm=get_llm()
    )

def create_pedagogical_agent():
    return Agent(
        role='Pedagogical Tutor',
        goal='Explain concepts clearly and adapt to the learner\'s level based on the retrieved context.',
        backstory='You are an experienced teacher who knows how to break down complex topics into easy-to-understand explanations.',
        verbose=True,
        allow_delegation=False,
        llm=get_llm()
    )

def create_quiz_generator_agent():
    return Agent(
        role='Quiz Generator',
        goal='Generate engaging and educational quizzes (MCQ, True/False, Open) based on the provided document context.',
        backstory='You are an instructional designer who excels at creating challenging and fair assessments.',
        verbose=True,
        allow_delegation=False,
        llm=get_llm()
    )

def create_evaluation_agent():
    return Agent(
        role='Evaluation Specialist',
        goal='Correct user quiz submissions and provide semantic grading with constructive feedback.',
        backstory='You are a fair and detail-oriented grader who provides actionable feedback to students.',
        verbose=True,
        allow_delegation=False,
        llm=get_llm()
    )

def create_notification_agent():
    return Agent(
        role='Notification Manager',
        goal='Compose and send personalized emails to learners regarding their progress and upcoming tasks.',
        backstory='You are a supportive academic advisor ensuring students stay on track and informed.',
        verbose=True,
        allow_delegation=False,
        llm=get_llm()
    )
