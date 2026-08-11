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
    document_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ('id', 'user', 'title', 'documents', 'document_details', 'messages', 'created_at', 'updated_at')
        read_only_fields = ('user', 'messages', 'created_at', 'updated_at')
        
    def get_document_details(self, obj):
        docs = obj.documents.all()
        if docs:
            # Return details of the first document (assuming 1-to-1 chat for now)
            doc = docs.first()
            return {
                'id': doc.id,
                'title': doc.title,
                'file_url': doc.file_url
            }
        return None
