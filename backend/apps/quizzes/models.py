from django.db import models
from django.conf import settings
from apps.documents.models import Document, Chunk

class Quiz(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quizzes')
    documents = models.ManyToManyField(Document, related_name='quizzes')
    title = models.CharField(max_length=255)
    score = models.FloatField(null=True, blank=True)
    total_questions = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

class Question(models.Model):
    TYPE_CHOICES = (
        ('MCQ', 'Multiple Choice'),
        ('TF', 'True/False'),
        ('OPEN', 'Open Ended'),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    chunk = models.ForeignKey(Chunk, on_delete=models.SET_NULL, null=True, blank=True)
    question_text = models.TextField()
    question_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    options = models.JSONField(default=list, blank=True, help_text="List of options for MCQ")
    correct_answer = models.TextField()
    explanation = models.TextField()

    def __str__(self):
        return self.question_text[:50]

class Result(models.Model):
    quiz = models.OneToOneField(Quiz, on_delete=models.CASCADE, related_name='result')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    score = models.FloatField()
    detailed_answers = models.JSONField(default=dict, help_text="User answers mapping question_id -> user_answer")
    evaluation_feedback = models.JSONField(default=dict, help_text="AI evaluation per question")
    created_at = models.DateTimeField(auto_now_add=True)
