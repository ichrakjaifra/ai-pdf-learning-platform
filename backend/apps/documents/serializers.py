from rest_framework import serializers
from .models import Document, Chunk

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'title', 'file_url', 'file_size', 'status', 'error_message', 'created_at', 'updated_at')
        read_only_fields = ('status', 'error_message', 'file_url', 'file_size')

class ChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chunk
        fields = ('id', 'document', 'page_number', 'content')
