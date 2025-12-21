import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

async def migrate_usernames():
    """Add username field to existing users and update shayaris with authorUsername"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔄 Starting username migration...")
    
    # Get all users without username field
    users = await db.users.find({"username": {"$exists": False}}, {"_id": 0}).to_list(1000)
    
    if not users:
        print("✅ All users already have username field")
    else:
        print(f"📝 Found {len(users)} users without username field")
        
        for user in users:
            # Generate username from firstName + lastName
            username = f"{user['firstName']}{user['lastName']}"
            
            # Update user with username
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"username": username}}
            )
            print(f"   ✅ Updated user {user['firstName']} {user['lastName']} -> @{username}")
    
    # Get all shayaris without authorUsername field
    shayaris = await db.shayaris.find({"authorUsername": {"$exists": False}}, {"_id": 0}).to_list(1000)
    
    if not shayaris:
        print("✅ All shayaris already have authorUsername field")
    else:
        print(f"📝 Found {len(shayaris)} shayaris without authorUsername field")
        
        for shayari in shayaris:
            # Get the author's username
            author = await db.users.find_one({"id": shayari["authorId"]}, {"_id": 0})
            if author and "username" in author:
                await db.shayaris.update_one(
                    {"id": shayari["id"]},
                    {"$set": {"authorUsername": author["username"]}}
                )
                print(f"   ✅ Updated shayari '{shayari['title']}' -> @{author['username']}")
            else:
                # Fallback: generate username from authorName
                author_name_parts = shayari["authorName"].split()
                fallback_username = "".join(author_name_parts)
                await db.shayaris.update_one(
                    {"id": shayari["id"]},
                    {"$set": {"authorUsername": fallback_username}}
                )
                print(f"   ⚠️  Updated shayari '{shayari['title']}' -> @{fallback_username} (fallback)")
    
    client.close()
    print("\n✨ Username migration completed successfully!")
    print("\n📋 Summary:")
    print("   - All users now have username field")
    print("   - All shayaris now have authorUsername field")
    print("   - Pen names will be displayed correctly in signatures")

if __name__ == "__main__":
    asyncio.run(migrate_usernames())