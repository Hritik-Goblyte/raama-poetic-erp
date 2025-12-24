#!/usr/bin/env python3
"""
Database Index Creation Script for रामा (Raama)
Creates essential indexes for optimal performance
"""

import asyncio
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'raama_production')

async def create_indexes():
    """Create all necessary database indexes for optimal performance"""
    print(f"🔗 Connecting to MongoDB: {MONGO_URL}")
    print(f"📊 Database: {DB_NAME}")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
        
        print("\n📝 Creating indexes...")
        
        # User Collection Indexes
        print("👥 Creating user indexes...")
        await db.users.create_index("email", unique=True, name="idx_users_email")
        await db.users.create_index("username", unique=True, name="idx_users_username")
        await db.users.create_index("role", name="idx_users_role")
        await db.users.create_index("createdAt", name="idx_users_created")
        await db.users.create_index("emailVerified", name="idx_users_verified")
        print("  ✅ User indexes created")
        
        # Shayari Collection Indexes
        print("📜 Creating shayari indexes...")
        await db.shayaris.create_index("authorId", name="idx_shayaris_author")
        await db.shayaris.create_index([("createdAt", -1)], name="idx_shayaris_created_desc")
        await db.shayaris.create_index("tags", name="idx_shayaris_tags")
        await db.shayaris.create_index("isFeatured", name="idx_shayaris_featured")
        await db.shayaris.create_index([("authorId", 1), ("createdAt", -1)], name="idx_shayaris_author_created")
        await db.shayaris.create_index("likedBy", name="idx_shayaris_liked_by")
        print("  ✅ Shayari indexes created")
        
        # Notification Collection Indexes
        print("🔔 Creating notification indexes...")
        await db.notifications.create_index("userId", name="idx_notifications_user")
        await db.notifications.create_index([("userId", 1), ("read", 1)], name="idx_notifications_user_read")
        await db.notifications.create_index([("userId", 1), ("createdAt", -1)], name="idx_notifications_user_created")
        await db.notifications.create_index("type", name="idx_notifications_type")
        print("  ✅ Notification indexes created")
        
        # Follow Collection Indexes
        print("👥 Creating follow indexes...")
        await db.follows.create_index("followerId", name="idx_follows_follower")
        await db.follows.create_index("followingId", name="idx_follows_following")
        await db.follows.create_index([("followerId", 1), ("followingId", 1)], unique=True, name="idx_follows_unique")
        await db.follows.create_index("createdAt", name="idx_follows_created")
        print("  ✅ Follow indexes created")
        
        # Collection Collection Indexes
        print("📚 Creating collection indexes...")
        await db.collections.create_index("creatorId", name="idx_collections_creator")
        await db.collections.create_index("isPublic", name="idx_collections_public")
        await db.collections.create_index([("isPublic", 1), ("createdAt", -1)], name="idx_collections_public_created")
        await db.collections.create_index("tags", name="idx_collections_tags")
        print("  ✅ Collection indexes created")
        
        # Bookmark Collection Indexes
        print("🔖 Creating bookmark indexes...")
        await db.bookmarks.create_index("userId", name="idx_bookmarks_user")
        await db.bookmarks.create_index([("userId", 1), ("shayariId", 1)], unique=True, name="idx_bookmarks_unique")
        await db.bookmarks.create_index([("userId", 1), ("createdAt", -1)], name="idx_bookmarks_user_created")
        await db.bookmarks.create_index("tags", name="idx_bookmarks_tags")
        print("  ✅ Bookmark indexes created")
        
        # Writer Request Collection Indexes
        print("✍️ Creating writer request indexes...")
        await db.writer_requests.create_index("userId", name="idx_writer_requests_user")
        await db.writer_requests.create_index("status", name="idx_writer_requests_status")
        await db.writer_requests.create_index([("status", 1), ("createdAt", -1)], name="idx_writer_requests_status_created")
        print("  ✅ Writer request indexes created")
        
        # User Activity Collection Indexes
        print("📊 Creating user activity indexes...")
        await db.user_activities.create_index("userId", name="idx_activities_user")
        await db.user_activities.create_index("action", name="idx_activities_action")
        await db.user_activities.create_index("targetType", name="idx_activities_target_type")
        await db.user_activities.create_index([("userId", 1), ("createdAt", -1)], name="idx_activities_user_created")
        print("  ✅ User activity indexes created")
        
        # Search History Collection Indexes
        print("🔍 Creating search history indexes...")
        await db.search_history.create_index("userId", name="idx_search_user")
        await db.search_history.create_index([("userId", 1), ("createdAt", -1)], name="idx_search_user_created")
        await db.search_history.create_index("query", name="idx_search_query")
        print("  ✅ Search history indexes created")
        
        # User Preferences Collection Indexes
        print("⚙️ Creating user preferences indexes...")
        await db.user_preferences.create_index("userId", unique=True, name="idx_preferences_user")
        await db.user_preferences.create_index("lastActive", name="idx_preferences_active")
        print("  ✅ User preferences indexes created")
        
        print("\n📋 Listing all created indexes...")
        
        # List indexes for verification
        collections = [
            'users', 'shayaris', 'notifications', 'follows', 
            'collections', 'bookmarks', 'writer_requests', 
            'user_activities', 'search_history', 'user_preferences'
        ]
        
        for collection_name in collections:
            collection = db[collection_name]
            indexes = await collection.list_indexes().to_list(None)
            print(f"\n{collection_name.upper()} INDEXES:")
            for idx in indexes:
                name = idx.get('name', 'unnamed')
                key = idx.get('key', {})
                unique = ' (UNIQUE)' if idx.get('unique') else ''
                print(f"  • {name}: {dict(key)}{unique}")
        
        print(f"\n✨ All indexes created successfully!")
        print(f"🚀 Database performance should be significantly improved!")
        
        # Performance recommendations
        print(f"\n💡 Performance Tips:")
        print(f"  • Monitor slow queries with MongoDB profiler")
        print(f"  • Consider adding compound indexes for complex queries")
        print(f"  • Regularly analyze index usage with db.collection.getIndexStats()")
        print(f"  • Drop unused indexes to save storage space")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error creating indexes: {str(e)}")
        sys.exit(1)

async def drop_all_indexes():
    """Drop all custom indexes (keep only _id index)"""
    print("⚠️  WARNING: This will drop all custom indexes!")
    confirm = input("Are you sure? Type 'yes' to continue: ")
    
    if confirm.lower() != 'yes':
        print("Operation cancelled.")
        return
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    collections = [
        'users', 'shayaris', 'notifications', 'follows', 
        'collections', 'bookmarks', 'writer_requests', 
        'user_activities', 'search_history', 'user_preferences'
    ]
    
    for collection_name in collections:
        try:
            collection = db[collection_name]
            await collection.drop_indexes()
            print(f"✅ Dropped indexes for {collection_name}")
        except Exception as e:
            print(f"❌ Error dropping indexes for {collection_name}: {str(e)}")
    
    client.close()
    print("🗑️  All custom indexes dropped!")

async def analyze_performance():
    """Analyze current database performance"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("📊 Database Performance Analysis")
    print("=" * 50)
    
    # Collection stats
    collections = ['users', 'shayaris', 'notifications', 'follows']
    
    for collection_name in collections:
        try:
            collection = db[collection_name]
            stats = await db.command("collStats", collection_name)
            count = stats.get('count', 0)
            size = stats.get('size', 0) / 1024 / 1024  # MB
            avg_obj_size = stats.get('avgObjSize', 0)
            
            print(f"\n{collection_name.upper()}:")
            print(f"  Documents: {count:,}")
            print(f"  Size: {size:.2f} MB")
            print(f"  Avg Object Size: {avg_obj_size:.0f} bytes")
            
            # Index stats
            indexes = await collection.list_indexes().to_list(None)
            print(f"  Indexes: {len(indexes)}")
            
        except Exception as e:
            print(f"❌ Error analyzing {collection_name}: {str(e)}")
    
    client.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Database Index Management for रामा')
    parser.add_argument('action', choices=['create', 'drop', 'analyze'], 
                       help='Action to perform')
    
    args = parser.parse_args()
    
    if args.action == 'create':
        asyncio.run(create_indexes())
    elif args.action == 'drop':
        asyncio.run(drop_all_indexes())
    elif args.action == 'analyze':
        asyncio.run(analyze_performance())