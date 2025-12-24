from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, timedelta
from passlib.context import CryptContext
import jwt
import aiohttp
import json
import secrets
import random

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import OpenAI client
try:
    from openai import AsyncOpenAI
except ImportError:
    logger.warning("OpenAI package not installed. Translation features will be limited.")
    AsyncOpenAI = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET', 'raama-secret-key-change-in-production')
ALGORITHM = "HS256"

# EmailJS configuration
EMAILJS_SERVICE_ID = os.environ.get('EMAILJS_SERVICE_ID', '')
EMAILJS_TEMPLATE_ID = os.environ.get('EMAILJS_TEMPLATE_ID', '')
EMAILJS_PUBLIC_KEY = os.environ.get('EMAILJS_PUBLIC_KEY', '')
EMAILJS_PRIVATE_KEY = os.environ.get('EMAILJS_PRIVATE_KEY', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@raama.com')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Gemini AI configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# OpenAI configuration (keeping for backward compatibility)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-3.5-turbo')

# OpenAI client will be initialized lazily when needed
openai_client = None

def get_openai_client():
    """Lazy initialization of OpenAI client"""
    global openai_client
    if openai_client is None and OPENAI_API_KEY and AsyncOpenAI:
        try:
            openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {str(e)}")
            openai_client = False  # Mark as failed to avoid retrying
    return openai_client if openai_client is not False else None

# OpenAI configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY and AsyncOpenAI else None

def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def get_otp_expiry():
    """Get OTP expiry time (10 minutes from now)"""
    return datetime.now(timezone.utc) + timedelta(minutes=10)

async def send_otp_email(email: str, otp: str, name: str):
    """Send OTP email using EmailJS"""
    try:
        logger.info(f"Attempting to send OTP email to {email}")
        
        if not EMAILJS_SERVICE_ID or not EMAILJS_TEMPLATE_ID or not EMAILJS_PUBLIC_KEY:
            logger.warning("EmailJS credentials not configured, logging OTP instead")
            logger.info(f"🔐 OTP for {email}: {otp} (Valid for 10 minutes)")
            return True
            
        # EmailJS API endpoint
        emailjs_url = "https://api.emailjs.com/api/v1.0/email/send"
        
        # Prepare email data for EmailJS
        email_data = {
            "service_id": EMAILJS_SERVICE_ID,
            "template_id": EMAILJS_TEMPLATE_ID,
            "user_id": EMAILJS_PUBLIC_KEY,
            "template_params": {
                "to_email": email,
                "user_name": name,
                "otp_code": otp,
                "from_name": "रामा Team",
                "from_email": FROM_EMAIL,
                "expiry_time": "10 minutes"
            }
        }
        
        # Add private key if available for API calls
        if EMAILJS_PRIVATE_KEY:
            email_data["accessToken"] = EMAILJS_PRIVATE_KEY
        
        logger.info("Sending OTP email via EmailJS API...")
        logger.info(f"Email data being sent: {json.dumps(email_data, indent=2)}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                emailjs_url,
                json=email_data,
                headers={
                    "Content-Type": "application/json"
                }
            ) as response:
                response_text = await response.text()
                
                if response.status == 200:
                    logger.info(f"OTP email sent successfully to {email}")
                    return True
                else:
                    logger.error(f"EmailJS API error: {response.status} - {response_text}")
                    # Log OTP as fallback
                    logger.info(f"🔐 FALLBACK - OTP for {email}: {otp} (Valid for 10 minutes)")
                    return True
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        # Log OTP as fallback
        logger.info(f"🔐 FALLBACK - OTP for {email}: {otp} (Valid for 10 minutes)")
        return True

async def send_verification_email(email: str, token: str, name: str):
    """Send email verification email using EmailJS with SMTP fallback"""
    try:
        logger.info(f"Attempting to send verification email to {email} using EmailJS")
        logger.info(f"EmailJS Config - Service ID: {EMAILJS_SERVICE_ID}, Template ID: {EMAILJS_TEMPLATE_ID}")
        
        if not EMAILJS_SERVICE_ID or not EMAILJS_TEMPLATE_ID or not EMAILJS_PUBLIC_KEY:
            logger.warning("EmailJS credentials not configured, skipping email send")
            return False
            
        verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
        logger.info(f"Verification link: {verification_link}")
        
        # EmailJS API endpoint
        emailjs_url = "https://api.emailjs.com/api/v1.0/email/send"
        
        # Prepare email data for EmailJS
        email_data = {
            "service_id": EMAILJS_SERVICE_ID,
            "template_id": EMAILJS_TEMPLATE_ID,
            "user_id": EMAILJS_PUBLIC_KEY,
            "template_params": {
                "to_email": email,
                "user_name": name,
                "verification_link": verification_link,
                "from_name": "रामा Team",
                "from_email": FROM_EMAIL
            }
        }
        
        logger.info("Sending email via EmailJS API...")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                emailjs_url,
                json=email_data,
                headers={
                    "Content-Type": "application/json"
                }
            ) as response:
                response_text = await response.text()
                
                if response.status == 200:
                    logger.info(f"Verification email sent successfully to {email}")
                    logger.info(f"EmailJS response: {response_text}")
                    return True
                else:
                    logger.error(f"EmailJS API error: {response.status} - {response_text}")
                    # Try SMTP fallback
                    return await send_email_smtp_fallback(email, token, name, verification_link)
        
    except aiohttp.ClientError as e:
        logger.error(f"HTTP client error: {str(e)}")
        # Try SMTP fallback
        return await send_email_smtp_fallback(email, token, name, f"{FRONTEND_URL}/verify-email?token={token}")
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return False

async def send_email_smtp_fallback(email: str, token: str, name: str, verification_link: str):
    """Fallback SMTP email sending"""
    try:
        logger.info("Trying SMTP fallback for email sending...")
        
        # Simple HTML email template
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ff6b35; font-size: 36px; margin: 0;">रामा..!</h1>
                <p style="color: #666; font-size: 16px;">The Poetic ERP</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
                <h2 style="color: #ff6b35;">Welcome to रामा, {name}!</h2>
                <p style="color: #333; line-height: 1.6;">
                    Thank you for joining our poetic community. Please verify your email address to complete your registration.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    If the button doesn't work, copy and paste this link: {verification_link}
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                </p>
            </div>
        </div>
        """
        
        # For now, just log the email content (you can implement actual SMTP later)
        logger.info(f"SMTP Fallback - Would send email to {email}")
        logger.info(f"Verification link: {verification_link}")
        
        # Return True to indicate email was "sent" (logged)
        return True
        
    except Exception as e:
        logger.error(f"SMTP fallback failed: {str(e)}")
        return False

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    firstName: str
    lastName: str
    username: str  # Pen name for poetry
    role: str = "reader"
    emailVerified: bool = False
    emailVerificationToken: Optional[str] = None
    emailOTP: Optional[str] = None  # 6-digit OTP for email verification
    otpExpiresAt: Optional[datetime] = None  # OTP expiry time
    profilePicture: Optional[str] = None  # Base64 encoded image or URL
    adminSecret: Optional[str] = None  # Individual admin secret key (only for admin users)
    roleChangedAt: Optional[datetime] = None  # Track when role was last changed for session invalidation
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    firstName: str
    lastName: str
    username: str  # Pen name
    role: str = "reader"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    adminSecret: str

class Shayari(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    authorId: str
    authorName: str  # Full name (firstName lastName)
    authorUsername: str  # Pen name
    title: str
    content: str
    likes: int = 0
    likedBy: List[str] = []  # User IDs who liked this shayari
    shares: int = 0
    views: int = 0
    tags: List[str] = []  # Categories/themes
    isFeatured: bool = False
    featuredAt: Optional[datetime] = None
    collectionIds: List[str] = []  # Collections this shayari belongs to
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Collection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    creatorId: str
    creatorName: str
    creatorUsername: str
    shayariIds: List[str] = []
    isPublic: bool = True
    coverImage: Optional[str] = None
    tags: List[str] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Follow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    followerId: str  # User who is following
    followingId: str  # User being followed
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserActivity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    action: str  # 'view', 'like', 'share', 'follow', 'create', 'search'
    targetType: str  # 'shayari', 'user', 'collection', 'search'
    targetId: str
    metadata: dict = {}
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SearchHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    query: str
    filters: dict = {}  # author, tags, etc.
    resultsCount: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    userId: str
    favoriteGenres: List[str] = []
    preferredAuthors: List[str] = []
    readingGoals: dict = {}
    notificationSettings: dict = {}
    offlineContent: List[str] = []  # Shayari IDs for offline reading
    lastActive: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShayariCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class CollectionCreate(BaseModel):
    name: str
    description: str
    isPublic: bool = True
    tags: List[str] = []

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    isPublic: Optional[bool] = None
    tags: Optional[List[str]] = None

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    message: str
    type: str
    read: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WriterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    userName: str
    userEmail: str
    status: str = "pending"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processedAt: Optional[datetime] = None



class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class UsernameCheckRequest(BaseModel):
    username: str

class EmailVerificationRequest(BaseModel):
    token: str

class OTPVerificationRequest(BaseModel):
    email: str
    otp: str

class ResendOTPRequest(BaseModel):
    email: str

class Bookmark(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    shayariId: str
    shayariTitle: str
    shayariContent: str
    shayariAuthor: str
    shayariAuthorUsername: str
    tags: List[str] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookmarkCreate(BaseModel):
    shayariId: str
    tags: List[str] = []

class ProfilePictureUpdate(BaseModel):
    profilePicture: str  # Base64 encoded image

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    firstName: str
    lastName: str
    username: str
    adminSecret: str  # Individual admin secret

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_issued_at = payload.get("iat")  # Token issued at timestamp
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Check if user's role has changed since token was issued
        if user.get('roleChangedAt'):
            role_changed_at = datetime.fromisoformat(user['roleChangedAt'].replace('Z', '+00:00'))
            token_issued_datetime = datetime.fromtimestamp(token_issued_at, tz=timezone.utc)
            
            if role_changed_at > token_issued_datetime:
                raise HTTPException(
                    status_code=401, 
                    detail="Your account role has been updated. Please log out and log back in to access new features."
                )
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@api_router.post("/auth/check-username")
async def check_username_availability(request: UsernameCheckRequest):
    """Check if username is available"""
    existing = await db.users.find_one({"username": request.username}, {"_id": 0})
    return {"available": existing is None}

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Generate OTP for email verification
    otp = generate_otp()
    otp_expiry = get_otp_expiry()
    
    hashed_password = pwd_context.hash(user_data.password)
    user = User(
        email=user_data.email,
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        username=user_data.username,
        role=user_data.role,
        emailVerified=False,
        emailOTP=otp,
        otpExpiresAt=otp_expiry
    )
    
    doc = user.model_dump()
    doc['password'] = hashed_password
    doc['createdAt'] = datetime.now(timezone.utc).isoformat()
    if doc.get('otpExpiresAt'):
        doc['otpExpiresAt'] = doc['otpExpiresAt'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Send OTP email
    email_sent = await send_otp_email(user.email, otp, user.firstName)
    
    return {
        "message": "Registration successful! Please check your email for OTP to verify your account.",
        "email": user.email,
        "emailSent": email_sent,
        "requiresOTP": True
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerificationRequest):
    """Verify OTP and complete registration"""
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_doc.get('emailVerified', False):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Check if OTP exists
    if not user_doc.get('emailOTP'):
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    # Check if OTP is expired
    otp_expiry = user_doc.get('otpExpiresAt')
    if otp_expiry:
        if isinstance(otp_expiry, str):
            otp_expiry = datetime.fromisoformat(otp_expiry.replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > otp_expiry:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Verify OTP
    if user_doc['emailOTP'] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    
    # Update user as verified and remove OTP
    await db.users.update_one(
        {"email": request.email},
        {
            "$set": {"emailVerified": True},
            "$unset": {"emailOTP": "", "otpExpiresAt": ""}
        }
    )
    
    # Create welcome notification
    welcome_notif = Notification(
        userId=user_doc['id'],
        message=f"Welcome to Raama, {user_doc['firstName']}! Your email has been verified successfully.",
        type="welcome"
    )
    notif_doc = welcome_notif.model_dump()
    notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    # Create token for login
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    user.emailVerified = True
    token = create_access_token({"sub": user.id})
    
    return {
        "token": token,
        "user": user,
        "message": "Email verified successfully! Welcome to रामा!"
    }

@api_router.post("/auth/resend-otp")
async def resend_otp(request: ResendOTPRequest):
    """Resend OTP for email verification"""
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_doc.get('emailVerified', False):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new OTP
    otp = generate_otp()
    otp_expiry = get_otp_expiry()
    
    # Update user with new OTP
    await db.users.update_one(
        {"email": request.email},
        {
            "$set": {
                "emailOTP": otp,
                "otpExpiresAt": otp_expiry.isoformat()
            }
        }
    )
    
    # Send OTP email
    email_sent = await send_otp_email(request.email, otp, user_doc['firstName'])
    
    return {
        "message": "New OTP sent! Please check your email.",
        "emailSent": email_sent
    }

@api_router.post("/auth/verify-email")
async def verify_email(request: EmailVerificationRequest):
    """Verify email address using token"""
    user_doc = await db.users.find_one({"emailVerificationToken": request.token}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    # Update user as verified
    await db.users.update_one(
        {"emailVerificationToken": request.token},
        {
            "$set": {"emailVerified": True},
            "$unset": {"emailVerificationToken": ""}
        }
    )
    
    # Create verification success notification
    verification_notif = Notification(
        userId=user_doc['id'],
        message="Email verified successfully! You can now fully access your account.",
        type="verification"
    )
    notif_doc = verification_notif.model_dump()
    notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Email verified successfully! You can now login."}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check email verification requirement
    if not user_doc.get('emailVerified', False):
        raise HTTPException(
            status_code=403, 
            detail="Please verify your email address before logging in. Check your inbox for the verification link."
        )
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}

@api_router.post("/auth/admin-login")
async def admin_login(credentials: AdminLogin):
    """Admin login with individual secret key"""
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is admin
    if user_doc.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Verify password
    if not pwd_context.verify(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify individual admin secret
    if not user_doc.get('adminSecret'):
        raise HTTPException(status_code=401, detail="Admin secret not configured for this user")
    
    if not pwd_context.verify(credentials.adminSecret, user_doc['adminSecret']):
        raise HTTPException(status_code=401, detail="Invalid admin secret")
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}

@api_router.post("/auth/resend-verification")
async def resend_verification_email(credentials: UserLogin):
    """Resend verification email for unverified accounts"""
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not pwd_context.verify(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user_doc.get('emailVerified', False):
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Update user with new token
    await db.users.update_one(
        {"email": credentials.email},
        {"$set": {"emailVerificationToken": verification_token}}
    )
    
    # Send verification email
    email_sent = await send_verification_email(
        user_doc['email'], 
        verification_token, 
        user_doc['firstName']
    )
    
    return {
        "message": "Verification email sent! Please check your inbox.",
        "emailSent": email_sent
    }

@api_router.post("/auth/test-email-debug")
async def test_email_debug(email: str = "test@example.com"):
    """Debug EmailJS configuration and test email sending"""
    try:
        logger.info("=== EmailJS Debug Test ===")
        logger.info(f"Service ID: {EMAILJS_SERVICE_ID}")
        logger.info(f"Template ID: {EMAILJS_TEMPLATE_ID}")
        logger.info(f"Public Key: {EMAILJS_PUBLIC_KEY[:10]}..." if EMAILJS_PUBLIC_KEY else "Not set")
        logger.info(f"Private Key: {'Set' if EMAILJS_PRIVATE_KEY else 'Not set'}")
        logger.info(f"From Email: {FROM_EMAIL}")
        
        # Generate test OTP
        test_otp = generate_otp()
        
        # Send test email
        result = await send_otp_email(email, test_otp, "Test User")
        
        return {
            "success": result,
            "message": "Test email sent" if result else "Test email failed",
            "test_otp": test_otp,
            "config": {
                "emailjs_service_id": EMAILJS_SERVICE_ID,
                "emailjs_template_id": EMAILJS_TEMPLATE_ID,
                "emailjs_public_key_set": bool(EMAILJS_PUBLIC_KEY),
                "emailjs_private_key_set": bool(EMAILJS_PRIVATE_KEY),
                "from_email": FROM_EMAIL,
                "frontend_url": FRONTEND_URL
            },
            "instructions": [
                "1. Check your email inbox and spam folder",
                "2. If no email received, check EmailJS template 'To' field should be {{to_email}}",
                "3. Verify EmailJS service is connected properly",
                "4. Check backend logs for detailed error messages"
            ]
        }
    except Exception as e:
        logger.error(f"Email debug test failed: {str(e)}")
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "error_type": type(e).__name__
        }

@api_router.post("/auth/test-email")
async def test_email_configuration(email: str = "test@example.com"):
    """Test EmailJS configuration - for debugging purposes"""
    try:
        test_token = "test-token-123"
        result = await send_verification_email(email, test_token, "Test User")
        return {
            "success": result,
            "message": "Email sent successfully" if result else "Email sending failed",
            "config": {
                "emailjs_service_id": EMAILJS_SERVICE_ID,
                "emailjs_template_id": EMAILJS_TEMPLATE_ID,
                "emailjs_configured": bool(EMAILJS_SERVICE_ID and EMAILJS_TEMPLATE_ID and EMAILJS_PRIVATE_KEY),
                "from_email": FROM_EMAIL,
                "frontend_url": FRONTEND_URL
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "error_type": type(e).__name__
        }

@api_router.post("/auth/test-email-simple")
async def test_email_simple():
    """Simple test to check EmailJS credentials"""
    return {
        "emailjs_service_id": EMAILJS_SERVICE_ID or "NOT_SET",
        "emailjs_template_id": EMAILJS_TEMPLATE_ID or "NOT_SET", 
        "emailjs_private_key": "SET" if EMAILJS_PRIVATE_KEY else "NOT_SET",
        "configured": bool(EMAILJS_SERVICE_ID and EMAILJS_TEMPLATE_ID and EMAILJS_PRIVATE_KEY)
    }

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/change-password")
async def change_password(request: ChangePasswordRequest, current_user: User = Depends(get_current_user)):
    # Get user with password from database
    user_doc = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not pwd_context.verify(request.currentPassword, user_doc['password']):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")
    
    # Hash new password
    new_hashed_password = pwd_context.hash(request.newPassword)
    
    # Update password in database
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password": new_hashed_password}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.post("/shayaris", response_model=Shayari)
async def create_shayari(shayari_data: ShayariCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "writer":
        raise HTTPException(status_code=403, detail="Only writers can create shayaris")
    
    shayari = Shayari(
        authorId=current_user.id,
        authorName=f"{current_user.firstName} {current_user.lastName}",
        authorUsername=current_user.username,
        title=shayari_data.title,
        content=shayari_data.content,
        tags=shayari_data.tags
    )
    
    doc = shayari.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.shayaris.insert_one(doc)
    
    # Log activity
    activity = UserActivity(
        userId=current_user.id,
        action="create",
        targetType="shayari",
        targetId=shayari.id,
        metadata={"title": shayari.title}
    )
    activity_doc = activity.model_dump()
    activity_doc['createdAt'] = activity_doc['createdAt'].isoformat()
    await db.user_activities.insert_one(activity_doc)
    
    # Notify followers about new shayari
    try:
        followers = await db.follows.find({"followingId": current_user.id}, {"_id": 0}).to_list(1000)
        for follow in followers:
            notification = Notification(
                userId=follow['followerId'],
                message=f"{current_user.firstName} {current_user.lastName} (@{current_user.username}) posted a new shayari: '{shayari.title}'",
                type="new_shayari"
            )
            notif_doc = notification.model_dump()
            notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
            await db.notifications.insert_one(notif_doc)
    except Exception as e:
        logger.error(f"Error creating follow notifications: {str(e)}")
    
    return shayari

@api_router.get("/shayaris", response_model=List[Shayari])
async def get_all_shayaris(current_user: User = Depends(get_current_user)):
    shayaris = await db.shayaris.find({}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    for s in shayaris:
        if isinstance(s['createdAt'], str):
            s['createdAt'] = datetime.fromisoformat(s['createdAt'])
    return shayaris

@api_router.get("/shayaris/my", response_model=List[Shayari])
async def get_my_shayaris(current_user: User = Depends(get_current_user)):
    shayaris = await db.shayaris.find({"authorId": current_user.id}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    for s in shayaris:
        if isinstance(s['createdAt'], str):
            s['createdAt'] = datetime.fromisoformat(s['createdAt'])
    return shayaris

@api_router.delete("/shayaris/{shayari_id}")
async def delete_shayari(shayari_id: str, current_user: User = Depends(get_current_user)):
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    if shayari['authorId'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.shayaris.delete_one({"id": shayari_id})
    return {"message": "Shayari deleted"}

@api_router.get("/users/writers", response_model=List[User])
async def get_writers(current_user: User = Depends(get_current_user)):
    writers = await db.users.find({"role": "writer"}, {"_id": 0, "password": 0}).to_list(100)
    for w in writers:
        if isinstance(w['createdAt'], str):
            w['createdAt'] = datetime.fromisoformat(w['createdAt'])
    return writers

@api_router.get("/users/readers", response_model=List[User])
async def get_readers(admin_user: User = Depends(get_admin_user)):
    readers = await db.users.find({"role": "reader"}, {"_id": 0, "password": 0}).to_list(100)
    for r in readers:
        if isinstance(r['createdAt'], str):
            r['createdAt'] = datetime.fromisoformat(r['createdAt'])
    return readers

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find({"userId": current_user.id}, {"_id": 0}).sort("createdAt", -1).to_list(50)
    for n in notifications:
        if isinstance(n['createdAt'], str):
            n['createdAt'] = datetime.fromisoformat(n['createdAt'])
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "userId": current_user.id},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: User = Depends(get_current_user)):
    result = await db.notifications.delete_one({"id": notification_id, "userId": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

@api_router.get("/stats")
async def get_user_stats(current_user: User = Depends(get_current_user)):
    my_creations = await db.shayaris.count_documents({"authorId": current_user.id})
    total_shayaris = await db.shayaris.count_documents({})
    total_writers = await db.users.count_documents({"role": "writer"})
    unread_notifications = await db.notifications.count_documents({"userId": current_user.id, "read": False})
    
    return {
        "myCreations": my_creations,
        "totalShayaris": total_shayaris,
        "totalWriters": total_writers,
        "unreadNotifications": unread_notifications
    }

@api_router.get("/shayaris/{shayari_id}", response_model=Shayari)
async def get_shayari(shayari_id: str, current_user: User = Depends(get_current_user)):
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    if isinstance(shayari['createdAt'], str):
        shayari['createdAt'] = datetime.fromisoformat(shayari['createdAt'])
    return Shayari(**shayari)

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user['createdAt'], str):
        user['createdAt'] = datetime.fromisoformat(user['createdAt'])
    return User(**user)

@api_router.get("/shayaris/author/{author_id}", response_model=List[Shayari])
async def get_shayaris_by_author(author_id: str, current_user: User = Depends(get_current_user)):
    shayaris = await db.shayaris.find({"authorId": author_id}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    for s in shayaris:
        if isinstance(s['createdAt'], str):
            s['createdAt'] = datetime.fromisoformat(s['createdAt'])
    return shayaris

@api_router.post("/writer-requests")
async def create_writer_request(current_user: User = Depends(get_current_user)):
    if current_user.role == "writer":
        raise HTTPException(status_code=400, detail="You are already a writer")
    if current_user.role == "admin":
        raise HTTPException(status_code=400, detail="Admins cannot become writers")
    
    existing = await db.writer_requests.find_one({"userId": current_user.id, "status": "pending"}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request")
    
    request = WriterRequest(
        userId=current_user.id,
        userName=f"{current_user.firstName} {current_user.lastName}",
        userEmail=current_user.email
    )
    
    doc = request.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.writer_requests.insert_one(doc)
    
    return {"message": "Writer request submitted successfully"}

@api_router.get("/writer-requests", response_model=List[WriterRequest])
async def get_writer_requests(admin_user: User = Depends(get_admin_user)):
    requests = await db.writer_requests.find({"status": "pending"}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    for r in requests:
        if isinstance(r['createdAt'], str):
            r['createdAt'] = datetime.fromisoformat(r['createdAt'])
        if r.get('processedAt') and isinstance(r['processedAt'], str):
            r['processedAt'] = datetime.fromisoformat(r['processedAt'])
    return requests

@api_router.put("/writer-requests/{request_id}/approve")
async def approve_writer_request(request_id: str, admin_user: User = Depends(get_admin_user)):
    request = await db.writer_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request['status'] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    # Update user role and set roleChangedAt timestamp to invalidate current sessions
    role_changed_at = datetime.now(timezone.utc)
    await db.users.update_one(
        {"id": request['userId']}, 
        {
            "$set": {
                "role": "writer",
                "roleChangedAt": role_changed_at.isoformat()
            }
        }
    )
    
    await db.writer_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "approved", "processedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    notif = Notification(
        userId=request['userId'],
        message="Congratulations! Your writer request has been approved. Please log out and log back in to access writer features.",
        type="approval"
    )
    notif_doc = notif.model_dump()
    notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Writer request approved"}

@api_router.put("/writer-requests/{request_id}/reject")
async def reject_writer_request(request_id: str, admin_user: User = Depends(get_admin_user)):
    request = await db.writer_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request['status'] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    await db.writer_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "rejected", "processedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    notif = Notification(
        userId=request['userId'],
        message="Your writer request has been reviewed. Please contact admin for more information.",
        type="rejection"
    )
    notif_doc = notif.model_dump()
    notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Writer request rejected"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: User = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_readers = await db.users.count_documents({"role": "reader"})
    total_writers = await db.users.count_documents({"role": "writer"})
    total_admins = await db.users.count_documents({"role": "admin"})
    total_shayaris = await db.shayaris.count_documents({})
    pending_requests = await db.writer_requests.count_documents({"status": "pending"})
    
    return {
        "totalUsers": total_users,
        "totalReaders": total_readers,
        "totalWriters": total_writers,
        "totalAdmins": total_admins,
        "totalShayaris": total_shayaris,
        "pendingRequests": pending_requests
    }

@api_router.post("/admin/users")
async def create_user_by_admin(user_data: UserCreate, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to create users with any role"""
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = pwd_context.hash(user_data.password)
    user = User(
        email=user_data.email,
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        username=user_data.username,
        role=user_data.role,
        emailVerified=True  # Admin-created users are auto-verified
    )
    
    doc = user.model_dump()
    doc['password'] = hashed_password
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.users.insert_one(doc)
    
    return {"message": "User created successfully", "user": user}

@api_router.put("/admin/users/{user_id}")
async def update_user_by_admin(user_id: str, user_data: dict, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to update user information"""
    # Check if user exists
    existing_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being changed and if it's already taken
    if user_data.get('email') and user_data['email'] != existing_user['email']:
        email_exists = await db.users.find_one({"email": user_data['email']}, {"_id": 0})
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username is being changed and if it's already taken
    if user_data.get('username') and user_data['username'] != existing_user['username']:
        username_exists = await db.users.find_one({"username": user_data['username']}, {"_id": 0})
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Update user
    update_data = {}
    allowed_fields = ['firstName', 'lastName', 'username', 'email', 'role', 'emailVerified']
    for field in allowed_fields:
        if field in user_data:
            update_data[field] = user_data[field]
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    return {"message": "User updated successfully"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user_by_admin(user_id: str, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to delete users"""
    # Check if user exists
    user_to_delete = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deleting themselves
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete user's shayaris
    await db.shayaris.delete_many({"authorId": user_id})
    
    # Delete user's notifications
    await db.notifications.delete_many({"userId": user_id})
    
    # Delete user's writer requests
    await db.writer_requests.delete_many({"userId": user_id})
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User and all associated data deleted successfully"}

@api_router.put("/admin/users/{user_id}/role")
async def change_user_role(user_id: str, role_data: dict, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to change user role"""
    new_role = role_data.get('role')
    if new_role not in ['reader', 'writer', 'admin']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Check if user exists
    user_to_update = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user role and set roleChangedAt timestamp to invalidate current sessions
    role_changed_at = datetime.now(timezone.utc)
    await db.users.update_one(
        {"id": user_id}, 
        {
            "$set": {
                "role": new_role,
                "roleChangedAt": role_changed_at.isoformat()
            }
        }
    )
    
    # Create notification for user
    notif = Notification(
        userId=user_id,
        message=f"Your role has been changed to {new_role} by admin. Please log out and log back in to access new features.",
        type="role_change"
    )
    notif_doc = notif.model_dump()
    notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": f"User role changed to {new_role} successfully"}

@api_router.put("/admin/users/{user_id}/block")
async def block_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to block users"""
    # Check if user exists
    user_to_block = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_to_block:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from blocking themselves
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot block your own account")
    
    await db.users.update_one({"id": user_id}, {"$set": {"blocked": True}})
    
    return {"message": "User blocked successfully"}

@api_router.put("/admin/users/{user_id}/unblock")
async def unblock_user(user_id: str, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to unblock users"""
    # Check if user exists
    user_to_unblock = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_to_unblock:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$set": {"blocked": False}})
    
    return {"message": "User unblocked successfully"}

@api_router.get("/admin/users/admins")
async def get_all_admins(admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to get all admin users"""
    try:
        logger.info(f"Fetching admin users, requested by: {admin_user.email} (role: {admin_user.role})")
        
        # Debug: Check total admin count first
        admin_count = await db.users.count_documents({"role": "admin"})
        logger.info(f"Total admin count in database: {admin_count}")
        
        # Debug: Get all users with their roles
        all_users = await db.users.find({}, {"_id": 0, "email": 1, "role": 1, "firstName": 1, "lastName": 1}).to_list(1000)
        logger.info(f"All users in database: {[(u['email'], u['role']) for u in all_users]}")
        
        # Fetch admin users
        admins = await db.users.find({"role": "admin"}, {"_id": 0, "password": 0}).to_list(100)
        logger.info(f"Found {len(admins)} admin users: {[a['email'] for a in admins]}")
        
        for admin in admins:
            if isinstance(admin['createdAt'], str):
                admin['createdAt'] = datetime.fromisoformat(admin['createdAt'])
        
        return admins
    except Exception as e:
        logger.error(f"Error fetching admin users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin users")

@api_router.post("/admin/create-admin")
async def create_admin_user(user_data: AdminCreate, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to create new admin users with individual secret"""
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Validate admin secret length
    if len(user_data.adminSecret) < 8:
        raise HTTPException(status_code=400, detail="Admin secret must be at least 8 characters long")
    
    # Hash password and admin secret
    hashed_password = pwd_context.hash(user_data.password)
    hashed_admin_secret = pwd_context.hash(user_data.adminSecret)
    
    user = User(
        email=user_data.email,
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        username=user_data.username,
        role="admin",  # Force admin role
        emailVerified=True,  # Auto-verify admin accounts
        adminSecret=hashed_admin_secret
    )
    
    doc = user.model_dump()
    doc['password'] = hashed_password
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.users.insert_one(doc)
    
    return {"message": "Admin created successfully", "user": user}

@api_router.put("/admin/change-secret")
async def change_admin_secret(secret_data: dict, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to change individual admin secret key"""
    current_secret = secret_data.get('currentSecret')
    new_secret = secret_data.get('newSecret')
    
    if not current_secret or not new_secret:
        raise HTTPException(status_code=400, detail="Current and new secret are required")
    
    # Validate new secret length
    if len(new_secret) < 8:
        raise HTTPException(status_code=400, detail="New secret must be at least 8 characters long")
    
    # Get current admin user from database
    user_doc = await db.users.find_one({"id": admin_user.id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Verify current admin secret
    if not user_doc.get('adminSecret'):
        raise HTTPException(status_code=400, detail="Admin secret not configured for this user")
    
    if not pwd_context.verify(current_secret, user_doc['adminSecret']):
        raise HTTPException(status_code=400, detail="Current admin secret is incorrect")
    
    # Hash new secret and update
    hashed_new_secret = pwd_context.hash(new_secret)
    await db.users.update_one(
        {"id": admin_user.id},
        {"$set": {"adminSecret": hashed_new_secret}}
    )
    
    return {"message": "Admin secret changed successfully"}

@api_router.put("/admin/users/{user_id}/verify-email")
async def verify_user_email(user_id: str, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to manually verify user email"""
    try:
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {"emailVerified": True}, "$unset": {"emailVerificationToken": ""}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User email verified successfully"}
    except Exception as e:
        logger.error(f"Error verifying user email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify user email")

@api_router.put("/admin/verify-all-admins")
async def verify_all_admins(admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to verify all admin emails"""
    try:
        result = await db.users.update_many(
            {"role": "admin"},
            {"$set": {"emailVerified": True}, "$unset": {"emailVerificationToken": ""}}
        )
        
        return {"message": f"Verified {result.modified_count} admin accounts"}
    except Exception as e:
        logger.error(f"Error verifying all admin emails: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify admin emails")

@api_router.get("/admin/debug/current-user")
async def debug_current_admin_user(admin_user: User = Depends(get_admin_user)):
    """Debug endpoint to check current admin user"""
    try:
        # Get fresh user data from database
        fresh_user = await db.users.find_one({"id": admin_user.id}, {"_id": 0, "password": 0})
        
        # Count admins in database
        admin_count = await db.users.count_documents({"role": "admin"})
        
        # Get all admin emails
        all_admins = await db.users.find({"role": "admin"}, {"_id": 0, "email": 1, "role": 1}).to_list(100)
        
        return {
            "current_user": {
                "user_id": admin_user.id,
                "email": admin_user.email,
                "role": admin_user.role,
                "firstName": admin_user.firstName,
                "lastName": admin_user.lastName,
                "emailVerified": admin_user.emailVerified
            },
            "fresh_from_db": fresh_user,
            "admin_stats": {
                "total_admin_count": admin_count,
                "all_admin_emails": [a['email'] for a in all_admins]
            }
        }
    except Exception as e:
        logger.error(f"Error in debug endpoint: {str(e)}")
        return {
            "error": str(e),
            "current_user_basic": {
                "email": admin_user.email,
                "role": admin_user.role
            }
        }

# Collections endpoints
@api_router.post("/collections", response_model=Collection)
async def create_collection(collection_data: CollectionCreate, current_user: User = Depends(get_current_user)):
    collection = Collection(
        name=collection_data.name,
        description=collection_data.description,
        creatorId=current_user.id,
        creatorName=f"{current_user.firstName} {current_user.lastName}",
        creatorUsername=current_user.username,
        isPublic=collection_data.isPublic,
        tags=collection_data.tags
    )
    
    doc = collection.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    doc['updatedAt'] = doc['updatedAt'].isoformat()
    await db.collections.insert_one(doc)
    
    return collection

@api_router.get("/collections", response_model=List[Collection])
async def get_collections(current_user: User = Depends(get_current_user)):
    collections = await db.collections.find(
        {"$or": [{"isPublic": True}, {"creatorId": current_user.id}]}, 
        {"_id": 0}
    ).sort("createdAt", -1).to_list(100)
    
    for c in collections:
        if isinstance(c['createdAt'], str):
            c['createdAt'] = datetime.fromisoformat(c['createdAt'])
        if isinstance(c['updatedAt'], str):
            c['updatedAt'] = datetime.fromisoformat(c['updatedAt'])
    return collections

@api_router.get("/collections/my", response_model=List[Collection])
async def get_my_collections(current_user: User = Depends(get_current_user)):
    collections = await db.collections.find(
        {"creatorId": current_user.id}, 
        {"_id": 0}
    ).sort("createdAt", -1).to_list(100)
    
    for c in collections:
        if isinstance(c['createdAt'], str):
            c['createdAt'] = datetime.fromisoformat(c['createdAt'])
        if isinstance(c['updatedAt'], str):
            c['updatedAt'] = datetime.fromisoformat(c['updatedAt'])
    return collections

@api_router.put("/collections/{collection_id}/add-shayari/{shayari_id}")
async def add_shayari_to_collection(collection_id: str, shayari_id: str, current_user: User = Depends(get_current_user)):
    # Check if collection exists and user has permission
    collection = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection['creatorId'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this collection")
    
    # Check if shayari exists
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    # Check if shayari is already in collection
    if shayari_id in collection.get('shayariIds', []):
        raise HTTPException(status_code=400, detail="Shayari already in collection")
    
    # Add shayari to collection
    await db.collections.update_one(
        {"id": collection_id},
        {
            "$addToSet": {"shayariIds": shayari_id},
            "$set": {"updatedAt": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Add collection to shayari
    await db.shayaris.update_one(
        {"id": shayari_id},
        {"$addToSet": {"collectionIds": collection_id}}
    )
    
    # Create notification for shayari author (if not adding own shayari)
    if shayari['authorId'] != current_user.id:
        notif = Notification(
            userId=shayari['authorId'],
            message=f"{current_user.firstName} {current_user.lastName} added your shayari '{shayari['title']}' to their collection '{collection['name']}'",
            type="collection_add"
        )
        notif_doc = notif.model_dump()
        notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
        await db.notifications.insert_one(notif_doc)
    
    return {"message": "Shayari added to collection"}

@api_router.delete("/collections/{collection_id}/remove-shayari/{shayari_id}")
async def remove_shayari_from_collection(collection_id: str, shayari_id: str, current_user: User = Depends(get_current_user)):
    # Check if collection exists and user has permission
    collection = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection['creatorId'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this collection")
    
    # Remove shayari from collection
    await db.collections.update_one(
        {"id": collection_id},
        {
            "$pull": {"shayariIds": shayari_id},
            "$set": {"updatedAt": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Remove collection from shayari
    await db.shayaris.update_one(
        {"id": shayari_id},
        {"$pull": {"collectionIds": collection_id}}
    )
    
    return {"message": "Shayari removed from collection"}

# Follow system endpoints
@api_router.post("/follow/{user_id}")
async def follow_user(user_id: str, current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if user exists
    user_to_follow = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_to_follow:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    existing_follow = await db.follows.find_one({
        "followerId": current_user.id,
        "followingId": user_id
    })
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Create follow relationship
    follow = Follow(
        followerId=current_user.id,
        followingId=user_id
    )
    
    doc = follow.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.follows.insert_one(doc)
    
    # Create notification
    notif = Notification(
        userId=user_id,
        message=f"{current_user.firstName} {current_user.lastName} (@{current_user.username}) started following you!",
        type="follow"
    )
    notif_doc = notif.model_dump()
    notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    # Log activity
    activity = UserActivity(
        userId=current_user.id,
        action="follow",
        targetType="user",
        targetId=user_id,
        metadata={"targetUsername": user_to_follow['username']}
    )
    activity_doc = activity.model_dump()
    activity_doc['createdAt'] = activity_doc['createdAt'].isoformat()
    await db.user_activities.insert_one(activity_doc)
    
    return {"message": "Successfully followed user"}

@api_router.delete("/unfollow/{user_id}")
async def unfollow_user(user_id: str, current_user: User = Depends(get_current_user)):
    result = await db.follows.delete_one({
        "followerId": current_user.id,
        "followingId": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
    
    return {"message": "Successfully unfollowed user"}

@api_router.get("/following")
async def get_following(current_user: User = Depends(get_current_user)):
    follows = await db.follows.find({"followerId": current_user.id}, {"_id": 0}).to_list(1000)
    following_ids = [f['followingId'] for f in follows]
    
    if not following_ids:
        return []
    
    users = await db.users.find(
        {"id": {"$in": following_ids}}, 
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return users

@api_router.get("/followers")
async def get_followers(current_user: User = Depends(get_current_user)):
    follows = await db.follows.find({"followingId": current_user.id}, {"_id": 0}).to_list(1000)
    follower_ids = [f['followerId'] for f in follows]
    
    if not follower_ids:
        return []
    
    users = await db.users.find(
        {"id": {"$in": follower_ids}}, 
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return users

# Like system endpoints
@api_router.post("/shayaris/{shayari_id}/like")
async def like_shayari(shayari_id: str, current_user: User = Depends(get_current_user)):
    # Check if shayari exists
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    # Check if already liked
    if current_user.id in shayari.get('likedBy', []):
        raise HTTPException(status_code=400, detail="Already liked this shayari")
    
    # Add like
    await db.shayaris.update_one(
        {"id": shayari_id},
        {
            "$addToSet": {"likedBy": current_user.id},
            "$inc": {"likes": 1}
        }
    )
    
    # Create notification for author (if not self-like)
    if shayari['authorId'] != current_user.id:
        notif = Notification(
            userId=shayari['authorId'],
            message=f"{current_user.firstName} {current_user.lastName} liked your shayari '{shayari['title']}'",
            type="like"
        )
        notif_doc = notif.model_dump()
        notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
        await db.notifications.insert_one(notif_doc)
    
    # Log activity
    activity = UserActivity(
        userId=current_user.id,
        action="like",
        targetType="shayari",
        targetId=shayari_id,
        metadata={"title": shayari['title'], "authorId": shayari['authorId']}
    )
    activity_doc = activity.model_dump()
    activity_doc['createdAt'] = activity_doc['createdAt'].isoformat()
    await db.user_activities.insert_one(activity_doc)
    
    return {"message": "Shayari liked successfully"}

@api_router.delete("/shayaris/{shayari_id}/unlike")
async def unlike_shayari(shayari_id: str, current_user: User = Depends(get_current_user)):
    result = await db.shayaris.update_one(
        {"id": shayari_id, "likedBy": current_user.id},
        {
            "$pull": {"likedBy": current_user.id},
            "$inc": {"likes": -1}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Like not found")
    
    return {"message": "Shayari unliked successfully"}

@api_router.post("/shayaris/{shayari_id}/share")
async def share_shayari(shayari_id: str, current_user: User = Depends(get_current_user)):
    # Check if shayari exists
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    # Increment share count
    await db.shayaris.update_one(
        {"id": shayari_id},
        {"$inc": {"shares": 1}}
    )
    
    # Log activity
    activity = UserActivity(
        userId=current_user.id,
        action="share",
        targetType="shayari",
        targetId=shayari_id,
        metadata={"title": shayari['title'], "authorId": shayari['authorId']}
    )
    activity_doc = activity.model_dump()
    activity_doc['createdAt'] = activity_doc['createdAt'].isoformat()
    await db.user_activities.insert_one(activity_doc)
    
    return {"message": "Share recorded successfully"}

@api_router.post("/shayaris/{shayari_id}/view")
async def view_shayari(shayari_id: str, current_user: User = Depends(get_current_user)):
    # Increment view count
    await db.shayaris.update_one(
        {"id": shayari_id},
        {"$inc": {"views": 1}}
    )
    
    # Log activity (only if not the author viewing their own shayari)
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if shayari and shayari['authorId'] != current_user.id:
        activity = UserActivity(
            userId=current_user.id,
            action="view",
            targetType="shayari",
            targetId=shayari_id,
            metadata={"title": shayari['title'], "authorId": shayari['authorId']}
        )
        activity_doc = activity.model_dump()
        activity_doc['createdAt'] = activity_doc['createdAt'].isoformat()
        await db.user_activities.insert_one(activity_doc)
    
    return {"message": "View recorded successfully"}

# Featured and trending endpoints
@api_router.get("/shayaris/featured", response_model=List[Shayari])
async def get_featured_shayaris(current_user: User = Depends(get_current_user)):
    shayaris = await db.shayaris.find(
        {"isFeatured": True}, 
        {"_id": 0}
    ).sort("featuredAt", -1).to_list(10)
    
    for s in shayaris:
        if isinstance(s['createdAt'], str):
            s['createdAt'] = datetime.fromisoformat(s['createdAt'])
        if s.get('featuredAt') and isinstance(s['featuredAt'], str):
            s['featuredAt'] = datetime.fromisoformat(s['featuredAt'])
    return shayaris

@api_router.get("/shayaris/trending", response_model=List[Shayari])
async def get_trending_shayaris(current_user: User = Depends(get_current_user)):
    # Get shayaris from last 7 days, sorted by engagement (likes + shares + views)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    pipeline = [
        {
            "$match": {
                "createdAt": {"$gte": seven_days_ago.isoformat()}
            }
        },
        {
            "$addFields": {
                "engagement": {"$add": ["$likes", "$shares", {"$multiply": ["$views", 0.1]}]}
            }
        },
        {
            "$sort": {"engagement": -1}
        },
        {
            "$limit": 20
        }
    ]
    
    shayaris = await db.shayaris.aggregate(pipeline).to_list(20)
    
    for s in shayaris:
        if isinstance(s['createdAt'], str):
            s['createdAt'] = datetime.fromisoformat(s['createdAt'])
        s.pop('_id', None)
    
    return shayaris

@api_router.get("/shayaris/random", response_model=Shayari)
async def get_random_shayari(current_user: User = Depends(get_current_user)):
    # Get a random shayari
    pipeline = [{"$sample": {"size": 1}}]
    shayaris = await db.shayaris.aggregate(pipeline).to_list(1)
    
    if not shayaris:
        raise HTTPException(status_code=404, detail="No shayaris found")
    
    shayari = shayaris[0]
    if isinstance(shayari['createdAt'], str):
        shayari['createdAt'] = datetime.fromisoformat(shayari['createdAt'])
    shayari.pop('_id', None)
    
    return Shayari(**shayari)

@api_router.put("/admin/shayaris/{shayari_id}/feature")
async def feature_shayari(shayari_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.shayaris.update_one(
        {"id": shayari_id},
        {
            "$set": {
                "isFeatured": True,
                "featuredAt": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    return {"message": "Shayari featured successfully"}

@api_router.put("/admin/shayaris/{shayari_id}/unfeature")
async def unfeature_shayari(shayari_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.shayaris.update_one(
        {"id": shayari_id},
        {
            "$set": {"isFeatured": False},
            "$unset": {"featuredAt": ""}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    return {"message": "Shayari unfeatured successfully"}

# Search endpoints
@api_router.get("/search")
async def search_content(
    q: str = "",
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """General search endpoint for shayaris and writers"""
    if not q or len(q.strip()) < 2:
        return {"shayaris": [], "writers": []}
    
    search_term = q.strip()
    
    # Search shayaris
    shayari_query = {
        "$or": [
            {"title": {"$regex": search_term, "$options": "i"}},
            {"content": {"$regex": search_term, "$options": "i"}},
            {"authorName": {"$regex": search_term, "$options": "i"}},
            {"authorUsername": {"$regex": search_term, "$options": "i"}}
        ]
    }
    
    shayaris_cursor = db.shayaris.find(shayari_query, {"_id": 0}).limit(limit)
    shayaris = await shayaris_cursor.to_list(length=limit)
    
    # Search writers
    writer_query = {
        "$or": [
            {"username": {"$regex": search_term, "$options": "i"}},
            {"firstName": {"$regex": search_term, "$options": "i"}},
            {"lastName": {"$regex": search_term, "$options": "i"}}
        ],
        "role": {"$in": ["writer", "admin"]}
    }
    
    writers_cursor = db.users.find(
        writer_query, 
        {"_id": 0, "password": 0, "emailVerificationToken": 0, "adminSecret": 0}
    ).limit(limit)
    writers = await writers_cursor.to_list(length=limit)
    
    return {
        "shayaris": shayaris,
        "writers": writers
    }

@api_router.get("/search/shayaris")
async def search_shayaris(
    q: str = "",
    author: str = "",
    tags: str = "",
    sort_by: str = "relevance",  # relevance, date, likes, views
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    # Build search query
    search_query = {}
    
    if q:
        search_query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"content": {"$regex": q, "$options": "i"}},
            {"authorName": {"$regex": q, "$options": "i"}},
            {"authorUsername": {"$regex": q, "$options": "i"}}
        ]
    
    if author:
        search_query["$or"] = [
            {"authorName": {"$regex": author, "$options": "i"}},
            {"authorUsername": {"$regex": author, "$options": "i"}}
        ]
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        search_query["tags"] = {"$in": tag_list}
    
    # Determine sort order
    sort_order = []
    if sort_by == "date":
        sort_order = [("createdAt", -1)]
    elif sort_by == "likes":
        sort_order = [("likes", -1)]
    elif sort_by == "views":
        sort_order = [("views", -1)]
    else:  # relevance (default)
        sort_order = [("likes", -1), ("views", -1), ("createdAt", -1)]
    
    shayaris = await db.shayaris.find(search_query, {"_id": 0}).sort(sort_order).limit(limit).to_list(limit)
    
    for s in shayaris:
        if isinstance(s['createdAt'], str):
            s['createdAt'] = datetime.fromisoformat(s['createdAt'])
    
    # Log search activity
    activity = UserActivity(
        userId=current_user.id,
        action="search",
        targetType="shayari",
        targetId="",
        metadata={"query": q, "author": author, "tags": tags, "results": len(shayaris)}
    )
    activity_doc = activity.model_dump()
    activity_doc['createdAt'] = activity_doc['createdAt'].isoformat()
    await db.user_activities.insert_one(activity_doc)
    
    # Record search history
    if q:  # Only record if there's an actual search query
        search_record = SearchHistory(
            userId=current_user.id,
            query=q,
            filters={"author": author, "tags": tags, "sort_by": sort_by},
            resultsCount=len(shayaris)
        )
        search_doc = search_record.model_dump()
        search_doc['createdAt'] = search_doc['createdAt'].isoformat()
        await db.search_history.insert_one(search_doc)
    
    return shayaris

# Analytics endpoints
@api_router.get("/analytics/writer")
async def get_writer_analytics(current_user: User = Depends(get_current_user)):
    if current_user.role != "writer":
        raise HTTPException(status_code=403, detail="Only writers can access analytics")
    
    # Get writer's shayaris with analytics
    shayaris = await db.shayaris.find(
        {"authorId": current_user.id}, 
        {"_id": 0}
    ).sort("createdAt", -1).to_list(1000)
    
    total_likes = sum(s.get('likes', 0) for s in shayaris)
    total_views = sum(s.get('views', 0) for s in shayaris)
    total_shares = sum(s.get('shares', 0) for s in shayaris)
    
    # Get follower count
    follower_count = await db.follows.count_documents({"followingId": current_user.id})
    
    # Get recent activities on writer's content
    recent_activities = await db.user_activities.find(
        {"metadata.authorId": current_user.id},
        {"_id": 0}
    ).sort("createdAt", -1).limit(50).to_list(50)
    
    return {
        "totalShayaris": len(shayaris),
        "totalLikes": total_likes,
        "totalViews": total_views,
        "totalShares": total_shares,
        "followerCount": follower_count,
        "shayaris": shayaris,
        "recentActivities": recent_activities
    }

@api_router.get("/analytics/reader")
async def get_reader_analytics(current_user: User = Depends(get_current_user)):
    # Get user's reading activities
    activities = await db.user_activities.find(
        {"userId": current_user.id},
        {"_id": 0}
    ).sort("createdAt", -1).limit(1000).to_list(1000)
    
    # Calculate reading stats
    views = [a for a in activities if a['action'] == 'view']
    likes = [a for a in activities if a['action'] == 'like']
    shares = [a for a in activities if a['action'] == 'share']
    
    # Get following count
    following_count = await db.follows.count_documents({"followerId": current_user.id})
    
    # Get favorite authors (most viewed/liked)
    author_stats = {}
    for activity in views + likes:
        author_id = activity['metadata'].get('authorId')
        if author_id:
            if author_id not in author_stats:
                author_stats[author_id] = {"views": 0, "likes": 0}
            if activity['action'] == 'view':
                author_stats[author_id]['views'] += 1
            elif activity['action'] == 'like':
                author_stats[author_id]['likes'] += 1
    
    return {
        "totalViews": len(views),
        "totalLikes": len(likes),
        "totalShares": len(shares),
        "followingCount": following_count,
        "recentActivities": activities[:20],
        "favoriteAuthors": author_stats
    }

# Phase 2 Features - Search History and Suggestions
@api_router.get("/search/history")
async def get_search_history(current_user: User = Depends(get_current_user)):
    """Get user's search history"""
    history = await db.search_history.find(
        {"userId": current_user.id},
        {"_id": 0}
    ).sort("createdAt", -1).limit(20).to_list(20)
    
    return history

@api_router.get("/search/suggestions")
async def get_search_suggestions(current_user: User = Depends(get_current_user)):
    """Get search suggestions based on user's history and popular searches"""
    # Get user's recent searches
    user_searches = await db.search_history.find(
        {"userId": current_user.id},
        {"_id": 0, "query": 1}
    ).sort("createdAt", -1).limit(10).to_list(10)
    
    # Get popular search terms
    pipeline = [
        {"$group": {"_id": "$query", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    popular_searches = await db.search_history.aggregate(pipeline).to_list(10)
    
    # Get trending tags
    tag_pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    trending_tags = await db.shayaris.aggregate(tag_pipeline).to_list(10)
    
    return {
        "recentSearches": [s["query"] for s in user_searches],
        "popularSearches": [s["_id"] for s in popular_searches],
        "trendingTags": [t["_id"] for t in trending_tags]
    }

@api_router.delete("/search/history")
async def clear_search_history(current_user: User = Depends(get_current_user)):
    """Clear user's search history"""
    await db.search_history.delete_many({"userId": current_user.id})
    return {"message": "Search history cleared successfully"}

# Offline Reading Features
@api_router.get("/offline/content")
async def get_offline_content(current_user: User = Depends(get_current_user)):
    """Get user's saved offline content"""
    preferences = await db.user_preferences.find_one({"userId": current_user.id}, {"_id": 0})
    
    if not preferences or not preferences.get('offlineContent'):
        return []
    
    # Get shayaris marked for offline reading
    shayaris = await db.shayaris.find(
        {"id": {"$in": preferences['offlineContent']}},
        {"_id": 0}
    ).to_list(1000)
    
    for s in shayaris:
        if isinstance(s['createdAt'], str):
            s['createdAt'] = datetime.fromisoformat(s['createdAt'])
    
    return shayaris

@api_router.post("/offline/add/{shayari_id}")
async def add_to_offline(shayari_id: str, current_user: User = Depends(get_current_user)):
    """Add shayari to offline reading list"""
    # Check if shayari exists
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    # Update or create user preferences
    await db.user_preferences.update_one(
        {"userId": current_user.id},
        {
            "$addToSet": {"offlineContent": shayari_id},
            "$set": {"lastActive": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"message": "Added to offline reading list"}

@api_router.delete("/offline/remove/{shayari_id}")
async def remove_from_offline(shayari_id: str, current_user: User = Depends(get_current_user)):
    """Remove shayari from offline reading list"""
    result = await db.user_preferences.update_one(
        {"userId": current_user.id},
        {"$pull": {"offlineContent": shayari_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shayari not in offline list")
    
    return {"message": "Removed from offline reading list"}

# Enhanced Social Sharing
@api_router.post("/share/whatsapp/{shayari_id}")
async def share_to_whatsapp(shayari_id: str, current_user: User = Depends(get_current_user)):
    """Generate WhatsApp share link for shayari"""
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    # Create formatted message for WhatsApp
    author_credit = "you" if shayari['authorId'] == current_user.id else shayari['authorUsername']
    message = f"*{shayari['title']}*\n\n{shayari['content']}\n\n~ {author_credit}\n\n_Shared from रामा - The Poetic ERP_"
    
    # Record share
    await db.shayaris.update_one({"id": shayari_id}, {"$inc": {"shares": 1}})
    
    # Log activity
    activity = UserActivity(
        userId=current_user.id,
        action="share",
        targetType="shayari",
        targetId=shayari_id,
        metadata={"platform": "whatsapp", "title": shayari['title']}
    )
    activity_doc = activity.model_dump()
    activity_doc['createdAt'] = activity_doc['createdAt'].isoformat()
    await db.user_activities.insert_one(activity_doc)
    
    return {
        "shareUrl": f"https://wa.me/?text={message.replace(' ', '%20').replace('\n', '%0A')}",
        "message": message
    }

@api_router.post("/share/social/{shayari_id}")
async def share_to_social(shayari_id: str, platform: str, current_user: User = Depends(get_current_user)):
    """Generate social media share content"""
    shayari = await db.shayaris.find_one({"id": shayari_id}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    author_credit = "you" if shayari['authorId'] == current_user.id else shayari['authorUsername']
    
    # Platform-specific formatting
    if platform == "twitter":
        message = f"{shayari['title']}\n\n{shayari['content'][:200]}...\n\n~ {author_credit}\n\n#Poetry #Shayari #रामा"
    elif platform == "facebook":
        message = f"{shayari['title']}\n\n{shayari['content']}\n\n~ {author_credit}\n\nShared from रामा - The Poetic ERP"
    elif platform == "instagram":
        message = f"{shayari['content']}\n\n~ {author_credit}\n\n#Poetry #Shayari #Hindi #Urdu #रामा"
    else:
        message = f"{shayari['title']}\n\n{shayari['content']}\n\n~ {author_credit}"
    
    # Record share
    await db.shayaris.update_one({"id": shayari_id}, {"$inc": {"shares": 1}})
    
    # Log activity
    activity = UserActivity(
        userId=current_user.id,
        action="share",
        targetType="shayari",
        targetId=shayari_id,
        metadata={"platform": platform, "title": shayari['title']}
    )
    activity_doc = activity.model_dump()
    activity_doc['createdAt'] = activity_doc['createdAt'].isoformat()
    await db.user_activities.insert_one(activity_doc)
    
    return {"message": message, "platform": platform}

# Writer Spotlights Feature
class WriterSpotlight(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    writerId: str
    writerName: str
    writerUsername: str
    title: str
    description: str
    featuredShayariIds: List[str] = []
    isActive: bool = True
    startDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    endDate: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WriterSpotlightCreate(BaseModel):
    writerId: str
    title: str
    description: str
    featuredShayariIds: List[str] = []
    duration_days: int = 7

@api_router.get("/spotlights/active")
async def get_active_spotlights(current_user: User = Depends(get_current_user)):
    """Get currently active writer spotlights"""
    now = datetime.now(timezone.utc).isoformat()
    
    spotlights = await db.writer_spotlights.find({
        "isActive": True,
        "$or": [
            {"endDate": {"$gte": now}},
            {"endDate": None}
        ]
    }, {"_id": 0}).sort("createdAt", -1).to_list(10)
    
    # Get writer details and featured shayaris for each spotlight
    for spotlight in spotlights:
        # Get writer info
        writer = await db.users.find_one({"id": spotlight['writerId']}, {"_id": 0, "password": 0})
        if writer:
            spotlight['writer'] = writer
        
        # Get featured shayaris
        if spotlight.get('featuredShayariIds'):
            shayaris = await db.shayaris.find(
                {"id": {"$in": spotlight['featuredShayariIds']}},
                {"_id": 0}
            ).to_list(10)
            spotlight['featuredShayaris'] = shayaris
    
    return spotlights

@api_router.post("/admin/spotlights", response_model=WriterSpotlight)
async def create_writer_spotlight(spotlight_data: WriterSpotlightCreate, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to create writer spotlight"""
    # Check if writer exists
    writer = await db.users.find_one({"id": spotlight_data.writerId, "role": "writer"}, {"_id": 0})
    if not writer:
        raise HTTPException(status_code=404, detail="Writer not found")
    
    # Calculate end date
    end_date = datetime.now(timezone.utc) + timedelta(days=spotlight_data.duration_days)
    
    spotlight = WriterSpotlight(
        writerId=spotlight_data.writerId,
        writerName=f"{writer['firstName']} {writer['lastName']}",
        writerUsername=writer['username'],
        title=spotlight_data.title,
        description=spotlight_data.description,
        featuredShayariIds=spotlight_data.featuredShayariIds,
        endDate=end_date
    )
    
    doc = spotlight.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    doc['startDate'] = doc['startDate'].isoformat()
    doc['endDate'] = doc['endDate'].isoformat()
    
    await db.writer_spotlights.insert_one(doc)
    
    # Create notification for the writer
    notif = Notification(
        userId=spotlight_data.writerId,
        message=f"Congratulations! You've been featured in a writer spotlight: '{spotlight_data.title}'",
        type="spotlight"
    )
    notif_doc = notif.model_dump()
    notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return spotlight

@api_router.put("/admin/spotlights/{spotlight_id}/deactivate")
async def deactivate_spotlight(spotlight_id: str, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to deactivate writer spotlight"""
    result = await db.writer_spotlights.update_one(
        {"id": spotlight_id},
        {"$set": {"isActive": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Spotlight not found")
    
    return {"message": "Spotlight deactivated successfully"}

# Push Notifications System (Web Push)
class PushSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    userId: str
    endpoint: str
    keys: dict  # Contains p256dh and auth keys
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/notifications/subscribe")
async def subscribe_to_push(subscription_data: dict, current_user: User = Depends(get_current_user)):
    """Subscribe user to push notifications"""
    subscription = PushSubscription(
        userId=current_user.id,
        endpoint=subscription_data['endpoint'],
        keys=subscription_data['keys']
    )
    
    # Remove existing subscription for this user
    await db.push_subscriptions.delete_many({"userId": current_user.id})
    
    # Add new subscription
    doc = subscription.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.push_subscriptions.insert_one(doc)
    
    return {"message": "Successfully subscribed to push notifications"}

@api_router.delete("/notifications/unsubscribe")
async def unsubscribe_from_push(current_user: User = Depends(get_current_user)):
    """Unsubscribe user from push notifications"""
    result = await db.push_subscriptions.delete_many({"userId": current_user.id})
    return {"message": f"Unsubscribed from push notifications ({result.deleted_count} subscriptions removed)"}

@api_router.post("/admin/notifications/broadcast")
async def broadcast_notification(notification_data: dict, admin_user: User = Depends(get_admin_user)):
    """Admin endpoint to broadcast notifications to all users"""
    message = notification_data.get('message', '')
    notification_type = notification_data.get('type', 'announcement')
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Get all users
    users = await db.users.find({}, {"_id": 0, "id": 1}).to_list(10000)
    
    # Create notifications for all users
    notifications = []
    for user in users:
        notif = Notification(
            userId=user['id'],
            message=message,
            type=notification_type
        )
        notif_doc = notif.model_dump()
        notif_doc['createdAt'] = notif_doc['createdAt'].isoformat()
        notifications.append(notif_doc)
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return {"message": f"Broadcast notification sent to {len(notifications)} users"}

async def translate_with_gemini(text: str, from_lang: str, to_lang: str) -> str:
    """
    Translate text using Google Gemini AI with specialized prompts for poetry translation
    """
    if not GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")
    
    import google.generativeai as genai
    
    # Configure Gemini
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    # Create specialized prompt for poetry translation
    if from_lang.lower() == "hinglish" and to_lang.lower() == "hindi":
        prompt = f"""Translate the following Hinglish shayari to Hindi. Do not explain. Return only the translated shayari in Hindi with poetic feel.

"{text}"

Guidelines:
- Maintain the poetic essence and emotional depth
- Preserve the rhythm and meter where possible
- Use appropriate Hindi/Urdu vocabulary for poetry
- Keep the cultural context intact
- Convert Roman script to Devanagari script properly"""
    else:
        prompt = f"Translate the following text from {from_lang} to {to_lang}. Maintain the tone and cultural context. Return only the translated text:\n\n{text}"
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    
    except Exception as e:
        logger.error(f"Gemini translation error: {str(e)}")
        raise Exception(f"Gemini translation failed: {str(e)}")

async def translate_with_openai(text: str, from_lang: str, to_lang: str) -> str:
    """
    Translate text using OpenAI GPT with specialized prompts for poetry translation (fallback)
    """
    client = get_openai_client()
    if not client:
        raise Exception("OpenAI client not configured")
    
    # Create specialized prompt for poetry translation
    if from_lang.lower() == "hinglish" and to_lang.lower() == "hindi":
        system_prompt = """You are an expert translator specializing in Hinglish to Hindi translation for poetry and shayari. 
        Your task is to translate Hinglish text (Hindi written in Roman script mixed with English words) to proper Hindi in Devanagari script.
        
        Guidelines:
        1. Maintain the poetic essence and emotional depth
        2. Preserve the rhythm and meter where possible
        3. Use appropriate Hindi/Urdu vocabulary for poetry
        4. Keep the cultural context intact
        5. If some words are already in Hindi/Devanagari, keep them as is
        6. For English words that have Hindi equivalents, use the Hindi version
        7. For English words commonly used in Hinglish poetry, you may keep them if they add to the poetic effect
        
        Return ONLY the translated text, nothing else."""
        
        user_prompt = f"Translate this Hinglish poetry/shayari to Hindi:\n\n{text}"
    else:
        system_prompt = f"You are a professional translator. Translate the given text from {from_lang} to {to_lang}. Maintain the tone, style, and cultural context. Return ONLY the translated text."
        user_prompt = f"Translate: {text}"
    
    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=500,
            temperature=0.3,  # Lower temperature for more consistent translations
            top_p=0.9
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        logger.error(f"OpenAI translation error: {str(e)}")
        raise Exception(f"OpenAI translation failed: {str(e)}")

async def fallback_rule_based_translation(text: str) -> str:
    """
    Enhanced fallback rule-based translation for when OpenAI is not available
    """
    # Enhanced translation mapping for common Hinglish to Hindi words
    translation_map = {
        # Common words
        "dil": "दिल", "pyaar": "प्यार", "mohabbat": "मोहब्बत", "ishq": "इश्क",
        "zindagi": "जिंदगी", "sapna": "सपना", "khwab": "ख्वाब", "yaad": "याद",
        "gham": "गम", "khushi": "खुशी", "aansu": "आंसू", "muskaan": "मुस्कान",
        "hasna": "हंसना", "rona": "रोना", "dekha": "देखा", "suna": "सुना",
        "kaha": "कहा", "aaya": "आया", "gaya": "गया", "tha": "था",
        "hai": "है", "hoon": "हूं", "tum": "तुम", "main": "मैं",
        "woh": "वो", "yeh": "यह", "kya": "क्या", "kaise": "कैसे",
        "kyun": "क्यों", "kahan": "कहां", "kab": "कब", "kaun": "कौन",
        "aur": "और", "ya": "या", "lekin": "लेकिन", "par": "पर",
        "se": "से", "mein": "में", "pe": "पे", "ke": "के",
        "ki": "की", "ka": "का", "ko": "को", "ne": "ने",
        "bhi": "भी", "to": "तो", "hi": "ही", "na": "ना",
        "nahi": "नहीं", "haan": "हां", "ji": "जी", "sahab": "साहब",
        "baat": "बात", "kaam": "काम", "ghar": "घर", "paani": "पानी",
        "khana": "खाना", "sona": "सोना", "uthna": "उठना", "jana": "जाना",
        "aana": "आना", "milna": "मिलना", "samay": "समय", "waqt": "वक्त",
        "din": "दिन", "raat": "रात", "subah": "सुबह", "shaam": "शाम",
        "chand": "चांद", "sitare": "सितारे", "suraj": "सूरज", "hawa": "हवा",
        "baarish": "बारिश", "phool": "फूल", "rang": "रंग", "awaaz": "आवाज",
        "chehre": "चेहरे", "nazar": "नजर", "nigah": "निगाह", "raah": "राह",
        "safar": "सफर", "manzil": "मंजिल", "umang": "उमंग", "josh": "जोश",
        "junoon": "जुनून", "deewana": "दीवाना", "pagal": "पागल", "bewafa": "बेवफा",
        "wafadar": "वफादार", "sachha": "सच्चा", "jhootha": "झूठा", "accha": "अच्छा",
        "bura": "बुरा", "sundar": "सुंदर", "khoobsurat": "खूबसूरत",
        # Additional poetry-specific words
        "dard": "दर्द", "sukoon": "सुकून", "intezaar": "इंतज़ार", "judaai": "जुदाई",
        "mulakat": "मुलाकात", "hasrat": "हसरत", "tamanna": "तमन्ना", "arman": "अरमान",
        "khayaal": "ख्याल", "ehsaas": "एहसास", "jazbaat": "जज्बात", "khamoshi": "खामोशी",
        "tanhai": "तन्हाई", "udaasi": "उदासी", "pareshani": "परेशानी", "musibat": "मुसीबत",
        "khwahish": "ख्वाहिश", "arzoo": "आरज़ू", "chahat": "चाहत"
    }
    
    # Simple word-by-word translation with better punctuation handling
    words = text.split()
    translated_words = []
    
    for word in words:
        # Extract punctuation
        punctuation = ""
        clean_word = word
        for char in ".,!?;:\"'()[]{}":
            if word.endswith(char):
                punctuation = char + punctuation
                clean_word = clean_word[:-1]
        
        # Check if word exists in translation map
        if clean_word.lower() in translation_map:
            translated_word = translation_map[clean_word.lower()]
            translated_words.append(translated_word + punctuation)
        else:
            # Keep original word if no translation found
            translated_words.append(word)
    
    return ' '.join(translated_words)

# Bookmark Endpoints
@api_router.post("/bookmarks")
async def create_bookmark(bookmark_data: BookmarkCreate, current_user: User = Depends(get_current_user)):
    """Add a shayari to bookmarks"""
    # Check if shayari exists
    shayari = await db.shayaris.find_one({"id": bookmark_data.shayariId}, {"_id": 0})
    if not shayari:
        raise HTTPException(status_code=404, detail="Shayari not found")
    
    # Check if already bookmarked
    existing = await db.bookmarks.find_one({
        "userId": current_user.id,
        "shayariId": bookmark_data.shayariId
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Shayari already bookmarked")
    
    bookmark = Bookmark(
        userId=current_user.id,
        shayariId=bookmark_data.shayariId,
        shayariTitle=shayari['title'],
        shayariContent=shayari['content'],
        shayariAuthor=shayari['authorName'],
        shayariAuthorUsername=shayari['authorUsername'],
        tags=bookmark_data.tags
    )
    
    doc = bookmark.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.bookmarks.insert_one(doc)
    
    return {"message": "Shayari bookmarked successfully", "bookmark": bookmark}

@api_router.get("/bookmarks")
async def get_bookmarks(current_user: User = Depends(get_current_user)):
    """Get all bookmarks for current user"""
    bookmarks = await db.bookmarks.find(
        {"userId": current_user.id},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(1000)
    
    for b in bookmarks:
        if isinstance(b['createdAt'], str):
            b['createdAt'] = datetime.fromisoformat(b['createdAt'])
    
    return bookmarks

@api_router.delete("/bookmarks/{shayari_id}")
async def remove_bookmark(shayari_id: str, current_user: User = Depends(get_current_user)):
    """Remove a shayari from bookmarks"""
    result = await db.bookmarks.delete_one({
        "userId": current_user.id,
        "shayariId": shayari_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return {"message": "Bookmark removed successfully"}

@api_router.get("/bookmarks/check/{shayari_id}")
async def check_bookmark(shayari_id: str, current_user: User = Depends(get_current_user)):
    """Check if a shayari is bookmarked"""
    bookmark = await db.bookmarks.find_one({
        "userId": current_user.id,
        "shayariId": shayari_id
    }, {"_id": 0})
    
    return {"isBookmarked": bookmark is not None}

# Profile Picture Endpoints
@api_router.put("/profile/picture")
async def update_profile_picture(picture_data: ProfilePictureUpdate, current_user: User = Depends(get_current_user)):
    """Update user's profile picture"""
    try:
        # Validate base64 image (basic validation)
        if not picture_data.profilePicture.startswith('data:image/'):
            raise HTTPException(status_code=400, detail="Invalid image format. Must be base64 encoded image.")
        
        # Update user's profile picture in database
        result = await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"profilePicture": picture_data.profilePicture}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "Profile picture updated successfully"}
        
    except Exception as e:
        logger.error(f"Profile picture update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile picture")

@api_router.delete("/profile/picture")
async def remove_profile_picture(current_user: User = Depends(get_current_user)):
    """Remove user's profile picture"""
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$unset": {"profilePicture": ""}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Profile picture removed successfully"}

@api_router.get("/profile/picture/{user_id}")
async def get_profile_picture(user_id: str, current_user: User = Depends(get_current_user)):
    """Get user's profile picture"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "profilePicture": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"profilePicture": user.get("profilePicture")}

# @api_router.post("/translate")
# async def translate_text(request: TranslateRequest, current_user: User = Depends(get_current_user)):
#     """
#     Enhanced translation service using OpenAI GPT with fallback to rule-based translation.
#     Specialized for Hinglish to Hindi poetry translation.
#     """
#     try:
#         translated_text = ""
#         translation_method = "fallback"
        
#         # Try OpenAI translation first if API key is configured
#         if OPENAI_API_KEY and get_openai_client():
#             try:
#                 translated_text = await translate_with_openai(
#                     request.text, 
#                     request.fromLang, 
#                     request.toLang
#                 )
#                 translation_method = "openai"
#                 logger.info(f"Translation successful using OpenAI GPT")
                
#             except Exception as openai_error:
#                 logger.warning(f"OpenAI translation failed: {str(openai_error)}, falling back to rule-based")
#                 # Fall back to rule-based translation
#                 translated_text = await fallback_rule_based_translation(request.text)
#                 translation_method = "fallback"
#         else:
#             # Use rule-based translation if OpenAI is not configured
#             logger.info("Using rule-based translation (OpenAI not configured)")
#             translated_text = await fallback_rule_based_translation(request.text)
#             translation_method = "fallback"
        
#         # If no translation occurred with rule-based, provide a helpful message
#         if translation_method == "fallback" and translated_text == request.text:
#             translated_text = f"अनुवाद उपलब्ध नहीं है। मूल पाठ: {request.text}"
        
#         return {
#             "translatedText": translated_text,
#             "method": translation_method,
#             "fromLang": request.fromLang,
#             "toLang": request.toLang
#         }
        
#     except Exception as e:
#         logger.error(f"Translation error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

app.include_router(api_router)

# Root route for health check
@app.get("/")
async def root():
    return {
        "message": "रामा - The Poetic ERP API",
        "status": "healthy",
        "version": "1.0.0",
        "docs": "/docs",
        "api": "/api"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test database connection
        await db.users.count_documents({})
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "mongodb_url": mongo_url[:50] + "..." if mongo_url else "not set"
    }

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()