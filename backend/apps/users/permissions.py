from rest_framework import permissions

class IsAdministrateur(permissions.BasePermission):
    """
    Allows access only to users with the ADMINISTRATEUR role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMINISTRATEUR')

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Allows access to the owner of the object or an admin.
    Assumes the model instance has a `user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.role == 'ADMINISTRATEUR':
            return True
            
        # Support objects that have a user foreign key directly, 
        # or via document (like chats/quizzes)
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'document') and hasattr(obj.document, 'user'):
            return obj.document.user == request.user
            
        return False
