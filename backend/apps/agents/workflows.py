from crewai import Crew, Process
from .agents import PlatformAgents
from .tasks import PlatformTasks

def generate_quiz_with_crewai(context_text, prompt_spec):
    agents = PlatformAgents()
    tasks = PlatformTasks()
    
    generator = agents.quiz_generator_agent()
    task = tasks.generate_quiz_task(generator, context_text, prompt_spec)
    
    crew = Crew(
        agents=[generator],
        tasks=[task],
        process=Process.sequential,
        verbose=False
    )
    
    result = crew.kickoff()
    return result

def evaluate_open_questions_with_crewai(grading_prompt):
    agents = PlatformAgents()
    tasks = PlatformTasks()
    
    evaluator = agents.evaluation_agent()
    task = tasks.evaluate_answers_task(evaluator, grading_prompt)
    
    crew = Crew(
        agents=[evaluator],
        tasks=[task],
        process=Process.sequential,
        verbose=False
    )
    
    result = crew.kickoff()
    return result
