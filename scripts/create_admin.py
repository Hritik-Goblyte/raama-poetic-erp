import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

async def create_admin_user():
    """Create an admin user for the Raama platform"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    if existing_admin:
        print("❌ Admin user already exists!")
        print(f"   Email: {existing_admin['email']}")
        print(f"   Name: {existing_admin['firstName']} {existing_admin['lastName']}")
        client.close()
        return
    
    admin_id = str(uuid.uuid4())
    admin_password = "admin123"  # Change this to a secure password
    admin_secret = "admin-secret-2024"  # Individual admin secret key
    
    admin_user = {
    "id": admin_id,
    "email": "admin@raama.com",
    "password": pwd_context.hash(admin_password),
    "adminSecret": pwd_context.hash(admin_secret),
    "firstName": "Admin",
    "lastName": "User",
    "username": "AdminUser",
    "role": "admin",
    "createdAt": datetime.now(timezone.utc).isoformat()
}

    
    await db.users.insert_one(admin_user)
    
    print("✅ Admin user created successfully!")
    print("\n📋 Admin Login Credentials:")
    print(f"   Email: admin@raama.com")
    print(f"   Password: {admin_password}")
    print(f"   Admin Secret: {admin_secret}")
    print("\n🔐 Security Notes:")
    print("   1. Change the password after first login")
    print("   2. Update the admin secret in production")
    print("   3. Access admin dashboard at: http://localhost:3001")
    print("\n⚠️  IMPORTANT: Keep these credentials secure!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())