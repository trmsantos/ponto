from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.authentication import JWTAuthentication

def jwt_required(func):
    def wrapper(request, *args, **kwargs):
        try:
            JWTAuthentication().authenticate(request)
        except InvalidToken:
            return Response({'error': 'Invalid token'}, status=401)
        return func(request, *args, **kwargs)
    return wrapper