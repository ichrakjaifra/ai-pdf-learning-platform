from crewai import Crew, Process
from .agents import (
    create_orchestrator_agent, create_rag_agent,
    create_pedagogical_agent, create_quiz_generator_agent
)
from .tasks import (
    task_classify_intent, task_retrieve_context, 
    task_generate_answer, task_generate_quiz
)
from .tools import VectorSearchTool

def handle_chat_query(user_query, document_ids):
    orchestrator = create_orchestrator_agent()
    
    # 1. Classify Intent
    intent_task = task_classify_intent(orchestrator, user_query)
    intent_crew = Crew(agents=[orchestrator], tasks=[intent_task], verbose=True)
    intent = intent_crew.kickoff().strip().upper()
    
    if intent == 'QUIZ':
        quiz_agent = create_quiz_generator_agent()
        # For a quiz, we might retrieve context first or use the whole document
        # Simplified: trigger quiz flow
        return {"type": "quiz", "content": "Triggered quiz generation."}
        
    # Standard QA or SUMMARY Flow
    rag_agent = create_rag_agent()
    rag_agent.tools = [VectorSearchTool()]
    
    tutor_agent = create_pedagogical_agent()
    
    retrieve_task = task_retrieve_context(rag_agent, user_query, document_ids)
    answer_task = task_generate_answer(tutor_agent, user_query, retrieve_task.output) # Will use the output of retrieve_task
    
    qa_crew = Crew(
        agents=[rag_agent, tutor_agent],
        tasks=[retrieve_task, answer_task],
        process=Process.sequential,
        verbose=True
    )
    
    result = qa_crew.kickoff()
    return {"type": "answer", "content": result}
