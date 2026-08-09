from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from apps.documents.models import Chunk
from sentence_transformers import SentenceTransformer
from pgvector.django import L2Distance

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

class VectorSearchInput(BaseModel):
    query: str = Field(..., description="The query to search for.")
    document_ids: list[int] = Field(..., description="List of document IDs to search within.")

class VectorSearchTool(BaseTool):
    name: str = "Vector Search Tool"
    description: str = "Search for relevant text chunks in specific documents based on a query using semantic similarity."
    args_schema: type[BaseModel] = VectorSearchInput

    def _run(self, query: str, document_ids: list[int]) -> str:
        # Generate embedding for the query
        query_embedding = embedding_model.encode(query).tolist()
        
        # Perform similarity search using pgvector L2 distance
        chunks = Chunk.objects.filter(
            document_id__in=document_ids
        ).annotate(
            distance=L2Distance('embedding', query_embedding)
        ).order_by('distance')[:5]
        
        if not chunks:
            return "No relevant information found in the specified documents."
            
        results = []
        for chunk in chunks:
            results.append(f"[Chunk ID: {chunk.id}, Page: {chunk.page_number}] {chunk.content}")
            
        return "\n\n".join(results)
