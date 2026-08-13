import os
from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from django.conf import settings

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.2
    )

class PlatformAgents:
    def __init__(self):
        self.llm = get_llm()

    def orchestrator_agent(self):
        return Agent(
            role='System Orchestrator',
            goal='Coordinate other agents to fulfill complex educational requests',
            backstory='You are the central coordinator for an EdTech platform. You break down complex tasks and delegate them to specialized agents.',
            verbose=True,
            allow_delegation=True,
            llm=self.llm
        )
        
    def rag_agent(self):
        return Agent(
            role='RAG Specialist',
            goal='Retrieve and synthesize relevant information from documents to answer user queries',
            backstory='You are an expert at searching through vectorized documents, retrieving the exact context needed, and formulating accurate answers with citations.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def pedagogical_agent(self):
        return Agent(
            role='Pedagogical Advisor',
            goal='Ensure that all content generated is educationally sound and tailored to the learner\'s level',
            backstory='You are a master teacher with a deep understanding of learning sciences. You review educational content to ensure it maximizes knowledge retention.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def quiz_generator_agent(self):
        return Agent(
            role='Quiz Generator',
            goal='Generate high-quality, educational quizzes based on provided document context',
            backstory='You are an expert educator with years of experience creating assessments that accurately measure student understanding without being unnecessarily tricky.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
    def evaluation_agent(self):
        return Agent(
            role='Strict Academic Evaluator',
            goal='Evaluate student answers to open-ended questions against the correct model answer',
            backstory='You are a rigorous but fair grader who focuses on semantic understanding rather than exact keyword matches. You provide constructive feedback.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def notification_agent(self):
        return Agent(
            role='Communications Specialist',
            goal='Draft professional, motivating emails and notifications for users based on their activity and performance',
            backstory='You are an expert in learner engagement. You write emails that celebrate success, encourage persistence, and clearly communicate administrative updates.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
