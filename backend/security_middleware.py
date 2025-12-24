"""
Security middleware for रामा (Raama) backend
Implements rate limiting, request validation, and security headers
"""

import time
import re
from collections import defaultdict, deque
from typing import Dict, Deque
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent abuse
    Different limits for different endpoint types
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Store request timestamps per IP
        self.requests: Dict[str, Deque[float]] = defaultdict(lambda: deque())
        
        # Rate limits: (requests, time_window_seconds)
        self.limits = {
            # Authentication endpoints - stricter limits
            '/api/auth/login': (5, 300),  # 5 attempts per 5 minutes
            '/api/auth/register': (3, 300),  # 3 registrations per 5 minutes
            '/api/auth/admin-login': (3, 300),  # 3 admin login attempts per 5 minutes
            
            # General API endpoints
            'default': (100, 60),  # 100 requests per minute
            
            # Write operations - moderate limits
            '/api/shayaris': (10, 60),  # 10 shayari creations per minute
            '/api/writer-requests': (1, 3600),  # 1 writer request per hour
            
            # Admin endpoints - stricter limits
            '/api/admin/': (50, 60),  # 50 admin requests per minute
        }
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Check rate limit
        if not self.is_allowed(client_ip, request.url.path, request.method):
            logger.warning(f"Rate limit exceeded for {client_ip} on {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": 60
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Check for forwarded headers (for reverse proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"
    
    def is_allowed(self, client_ip: str, path: str, method: str) -> bool:
        """Check if request is within rate limits"""
        current_time = time.time()
        
        # Determine rate limit for this endpoint
        limit_key = self.get_limit_key(path, method)
        max_requests, time_window = self.limits.get(limit_key, self.limits['default'])
        
        # Clean old requests outside time window
        client_requests = self.requests[client_ip]
        while client_requests and client_requests[0] < current_time - time_window:
            client_requests.popleft()
        
        # Check if limit exceeded
        if len(client_requests) >= max_requests:
            return False
        
        # Add current request
        client_requests.append(current_time)
        return True
    
    def get_limit_key(self, path: str, method: str) -> str:
        """Determine which rate limit to apply"""
        # Exact path matches
        if path in self.limits:
            return path
        
        # Pattern matches
        if path.startswith('/api/admin/'):
            return '/api/admin/'
        
        # POST requests to shayaris endpoint
        if path == '/api/shayaris' and method == 'POST':
            return '/api/shayaris'
        
        return 'default'

class SecurityValidationMiddleware(BaseHTTPMiddleware):
    """
    Security validation middleware
    Validates request content and blocks suspicious patterns
    """
    
    def __init__(self, app):
        super().__init__(app)
        
        # Suspicious patterns to block
        self.blocked_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'on\w+\s*=',  # Event handlers
            r'<iframe[^>]*>.*?</iframe>',  # Iframes
            r'eval\s*\(',  # eval() calls
            r'document\.',  # DOM access
            r'window\.',  # Window object access
        ]
        
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.blocked_patterns]
    
    async def dispatch(self, request: Request, call_next):
        # Validate request size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"error": "Request too large", "max_size": "10MB"}
            )
        
        # Validate content type for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith(("application/json", "multipart/form-data")):
                return JSONResponse(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    content={"error": "Unsupported media type"}
                )
        
        # Check for suspicious patterns in URL
        if self.contains_suspicious_content(str(request.url)):
            logger.warning(f"Suspicious URL pattern detected: {request.url}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Invalid request"}
            )
        
        response = await call_next(request)
        return response
    
    def contains_suspicious_content(self, content: str) -> bool:
        """Check if content contains suspicious patterns"""
        for pattern in self.compiled_patterns:
            if pattern.search(content):
                return True
        return False

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Request logging middleware for monitoring and debugging
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.logger = logging.getLogger("request_logger")
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        self.logger.info(f"Request: {request.method} {request.url.path} from {client_ip}")
        
        # Process request
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        self.logger.info(
            f"Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )
        
        # Log slow requests
        if process_time > 2.0:  # Requests taking more than 2 seconds
            self.logger.warning(
                f"Slow request: {request.method} {request.url.path} - "
                f"Time: {process_time:.3f}s"
            )
        
        return response

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength
    Returns (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    # Check for common weak passwords
    weak_passwords = [
        "password", "123456", "password123", "admin", "qwerty",
        "letmein", "welcome", "monkey", "dragon", "master"
    ]
    
    if password.lower() in weak_passwords:
        return False, "Password is too common. Please choose a stronger password"
    
    return True, ""

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks
    """
    if not text:
        return text
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove JavaScript
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    
    # Remove event handlers
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    
    # Limit length
    if len(text) > 10000:  # 10KB limit for text fields
        text = text[:10000]
    
    return text.strip()

def validate_email_format(email: str) -> bool:
    """
    Validate email format
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username_format(username: str) -> tuple[bool, str]:
    """
    Validate username format
    Returns (is_valid, error_message)
    """
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 30:
        return False, "Username must be less than 30 characters"
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username can only contain letters, numbers, and underscores"
    
    if username.startswith('_') or username.endswith('_'):
        return False, "Username cannot start or end with underscore"
    
    # Reserved usernames
    reserved = [
        'admin', 'root', 'api', 'www', 'mail', 'ftp', 'localhost',
        'test', 'demo', 'guest', 'anonymous', 'null', 'undefined'
    ]
    
    if username.lower() in reserved:
        return False, "Username is reserved. Please choose another"
    
    return True, ""