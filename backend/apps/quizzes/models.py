from django.db import models
from django.conf import settings
from apps.documents.models import Document, Chunk


class Quiz(models.Model):
    SCOPE_CHOICES = (
        ('FULL', 'Entire Document'),
        ('CHAPTER', 'Chapter'),
        ('COMPLEX', 'Complex Concepts'),
    )
    DIFFICULTY_CHOICES = (
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
        ('ADAPTIVE', 'Adaptive'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quizzes')
    documents = models.ManyToManyField(Document, related_name='quizzes')
    title = models.CharField(max_length=255)
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default='FULL')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='MEDIUM')
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
    options = models.JSONField(default=list, blank=True, help_text="List of options for MCQ/TF")
    correct_answer = models.TextField()
    explanation = models.TextField()
    difficulty = models.CharField(max_length=10, default='MEDIUM')
    source_chunk_ids = models.JSONField(default=list, blank=True, help_text="List of chunk IDs used to generate this question")

    def __str__(self):
        return self.question_text[:50]


class Result(models.Model):
    quiz = models.OneToOneField(Quiz, on_delete=models.CASCADE, related_name='result')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    score = models.FloatField()
    total = models.IntegerField(default=0)
    detailed_answers = models.JSONField(default=dict, help_text="User answers mapping question_id -> user_answer")
    evaluation_feedback = models.JSONField(default=dict, help_text="AI evaluation per question")
    created_at = models.DateTimeField(auto_now_add=True)
