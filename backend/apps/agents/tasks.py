from crewai import Task

class PlatformTasks:
    def generate_quiz_task(self, agent, context, spec):
        return Task(
            description=f"""Create a quiz based on the following context.
            
Context:
{context}

Requirements:
{spec}

Your final answer must be ONLY a valid JSON array of question objects as specified in the requirements. No markdown formatting, no comments, just raw JSON.
""",
            agent=agent,
            expected_output="A raw JSON array containing the generated quiz questions."
        )

    def evaluate_answers_task(self, agent, grading_prompt):
        return Task(
            description=f"""Grade the following student answers.
            
{grading_prompt}

Your final answer must be ONLY a valid JSON array of grading result objects. No markdown formatting, no comments, just raw JSON.
""",
            agent=agent,
            expected_output="A raw JSON array containing the grading results."
        )

    def draft_notification_task(self, agent, context):
        return Task(
            description=f"""Draft an email notification based on the following context.
            
Context:
{context}

Your final answer must be the exact text of the email. No introductory remarks.
""",
            agent=agent,
            expected_output="The final draft of the email."
        )
