import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

async def seed_database():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    await db.users.delete_many({})
    await db.shayaris.delete_many({})
    await db.notifications.delete_many({})
    
    writer_id = str(uuid.uuid4())
    reader_id = str(uuid.uuid4())
    
    users = [
        {
            "id": writer_id,
            "email": "writer@raama.com",
            "password": pwd_context.hash("password123"),
            "firstName": "Kabir",
            "lastName": "Das",
            "username": "KabirDas",  # Pen name
            "role": "writer",
            "createdAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": reader_id,
            "email": "reader@raama.com",
            "password": pwd_context.hash("password123"),
            "firstName": "Rahim",
            "lastName": "Khan", 
            "username": "RahimKhan",  # Pen name
            "role": "reader",
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.users.insert_many(users)
    print("✅ Users created")
    
    shayaris = [
        {
            "id": str(uuid.uuid4()),
            "authorId": writer_id,
            "authorName": "Kabir Das",
            "authorUsername": "KabirDas",
            "title": "दिल की बातें",
            "content": "दिल की बातें दिल में रह जाती हैं,\\nकुछ ख्वाब अधूरे रह जाते हैं।\\nहम चाहते हैं कह दें सब कुछ,\\nपर होंठों पर शब्द ठहर जाते हैं।",
            "likes": 5,
            "createdAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "authorId": writer_id,
            "authorName": "Kabir Das",
            "authorUsername": "KabirDas",
            "title": "चांदनी रात",
            "content": "चांदनी रात में तेरी याद आई,\\nदिल की किताब में नई बात आई।\\nतू नहीं था पर तेरी बातें थीं,\\nहर सांस में तेरी सौगात आई।",
            "likes": 8,
            "createdAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "authorId": writer_id,
            "authorName": "Kabir Das",
            "authorUsername": "KabirDas",
            "title": "जिंदगी का सफर",
            "content": "जिंदगी का सफर है ये कैसा सफर,\\nकोई साथ चले तो कटे ये सफर।\\nहम अकेले हैं फिर भी खुश हैं यहाँ,\\nक्योंकि अपने हैं साथ यादों का घर।",
            "likes": 12,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.shayaris.insert_many(shayaris)
    print("✅ Shayaris created")
    
    notifications = [
        {
            "id": str(uuid.uuid4()),
            "userId": writer_id,
            "message": "Welcome to Raama, Kabir! Start your poetic journey.",
            "type": "welcome",
            "read": False,
            "createdAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "userId": reader_id,
            "message": "Welcome to Raama, Rahim! Start your poetic journey.",
            "type": "welcome",
            "read": False,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.notifications.insert_many(notifications)
    print("✅ Notifications created")
    
    client.close()
    print("\n✨ Database seeded successfully!")
    print("\n📝 Demo Accounts:")
    print("Writer: writer@raama.com / password123")
    print("Reader: reader@raama.com / password123")

if __name__ == "__main__":
    asyncio.run(seed_database())
