# Authentication utilities for hashing passwords with bcrypt and managing JWTs with pyjwt
import os
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt

JWT_SECRET = os.environ.get("JWT_SECRET")

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_jwt(user_id: str, is_admin: bool) -> str:
    """Create a signed JWT token valid for 7 days."""
    if not JWT_SECRET:
        raise ValueError("JWT_SECRET environment variable is not configured")
    
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt(token: str) -> dict | None:
    """Verify a JWT token and return its decoded payload, or None if invalid/expired."""
    if not JWT_SECRET:
        raise ValueError("JWT_SECRET environment variable is not configured")
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None

def get_auth_token(headers) -> str | None:
    """Extract JWT token from Authorization header or Cookie."""
    from http.cookies import SimpleCookie
    # 1. Try Authorization header
    auth_header = headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split("Bearer ")[1].strip()
        
    # 2. Try Cookie header
    cookie_header = headers.get("Cookie")
    if cookie_header:
        try:
            cookie = SimpleCookie(cookie_header)
            if "token" in cookie:
                return cookie["token"].value
        except Exception:
            pass
            
    return None

def authenticate_request(headers) -> dict | None:
    """Extract and verify the JWT token from headers. Returns decoded payload or None if unauthorized."""
    token = get_auth_token(headers)
    if not token:
        return None
    return verify_jwt(token)

