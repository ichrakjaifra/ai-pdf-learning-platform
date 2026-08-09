from rest_framework import serializers
from .models import ChatSession, Message
from apps.documents.serializers import ChunkSerializer

class MessageSerializer(serializers.ModelSerializer):
    citations_details = ChunkSerializer(source='citations', many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = ('id', 'chat_session', 'role', 'content', 'citations_details', 'created_at')
        read_only_fields = ('created_at',)

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ('id', 'user', 'title', 'documents', 'messages', 'created_at', 'updated_at')
        read_only_fields = ('user', 'messages', 'created_at', 'updated_at')
