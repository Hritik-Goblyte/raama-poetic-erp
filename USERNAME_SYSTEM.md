# 👤 Username System Documentation

Complete guide to the username/pen name system in Raama Poetry Platform.

## 📋 User Data Structure

### Database Schema
```javascript
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Kabir",        // Real first name
  "lastName": "Das",           // Real last name  
  "username": "KabirDas",      // Pen name (used in signatures)
  "role": "writer",
  "createdAt": "ISO datetime"
}
```

### Shayari Schema
```javascript
{
  "id": "uuid",
  "authorId": "uuid",
  "authorName": "Kabir Das",        // Full real name
  "authorUsername": "KabirDas",     // Pen name
  "title": "शायरी का शीर्षक",
  "content": "शायरी की सामग्री...",
  "likes": 0,
  "createdAt": "ISO datetime"
}
```

## 🎯 Display Logic

### Shayari Signatures
- **Other users**: Shows `~ {authorUsername}` (e.g., "~ KabirDas")
- **Current user**: Shows `~ you`

### User Profiles
- **Full Name**: `{firstName} {lastName}` (e.g., "Kabir Das")
- **Pen Name**: `@{username}` (e.g., "@KabirDas")
- **Current User**: Adds "(you)" indicator

### Writer Cards
```
Kabir Das (you)
@KabirDas
kabir@example.com
```

## 🔧 Implementation Details

### Frontend Components

#### ShayariModal.js
```javascript
const getPenName = () => {
  if (isCurrentUser) {
    return "you";
  }
  return shayari.authorUsername || shayari.authorName.split(' ').pop();
};
```

#### Writers.js
```javascript
<h3>{writer.firstName} {writer.lastName}</h3>
<p className="text-orange-500">@{writer.username}</p>
```

#### Registration Form
```javascript
<input placeholder="First Name" value={formData.firstName} />
<input placeholder="Last Name" value={formData.lastName} />
<input placeholder="Pen Name (Username)" value={formData.username} />
```

### Backend Models

#### User Model
```python
class User(BaseModel):
    firstName: str
    lastName: str
    username: str  # Pen name
    email: EmailStr
    role: str = "reader"
```

#### Shayari Creation
```python
shayari = Shayari(
    authorName=f"{current_user.firstName} {current_user.lastName}",
    authorUsername=current_user.username,
    # ... other fields
)
```

## 🚀 Migration Guide

### For Existing Data
Run the migration script to add usernames to existing users:

```bash
cd scripts
python migrate_usernames.py
```

This will:
1. Add `username` field to all users (generated from firstName + lastName)
2. Add `authorUsername` field to all shayaris
3. Update display logic throughout the app

### For New Installations
1. Use the updated seed script: `python seed_db.py`
2. Create admin user: `python create_admin.py`
3. All new registrations will include username field

## 📱 User Experience

### Registration Flow
1. **First Name**: User's real first name
2. **Last Name**: User's real last name
3. **Pen Name**: Creative username for poetry (e.g., "MoonlightPoet")
4. **Email**: Contact email
5. **Role**: Reader or Writer

### Display Examples

#### Shayari Card
```
दिल की बातें
By: Kabir Das

[Shayari content...]

~ KabirDas  (signature)
```

#### Writer Profile
```
Kabir Das (you)
@KabirDas
kabir@example.com
Writer • Joined Jan 2024
15 Shayaris
```

#### Admin Dashboard
```
Kabir Das
@KabirDas
kabir@example.com
Role: Writer
```

## 🎨 UI Guidelines

### Colors & Styling
- **Real Names**: White/primary text color
- **Pen Names**: Orange accent color (`text-orange-500`)
- **Current User**: Orange "(you)" indicator
- **Signatures**: Italic, right-aligned, Style Script font

### Typography
- **Real Names**: Bold, larger font
- **Pen Names**: Medium weight, smaller font with @ prefix
- **Signatures**: Cursive font, elegant styling

## 🔍 Search & Discovery

### Username Features
- **Unique Identifiers**: Usernames help identify poets
- **Branding**: Poets can build recognition with consistent pen names
- **Search**: Future feature to search by username
- **Mentions**: Future @ mention functionality

## 🛠️ Development Notes

### Adding Username to New Components
1. **Display Full Name**: Use `{user.firstName} {user.lastName}`
2. **Display Pen Name**: Use `@{user.username}`
3. **Signatures**: Use `getPenName()` function
4. **Current User Check**: Add "(you)" indicator

### Database Queries
```javascript
// Get user with username
const user = await db.users.findOne({username: "KabirDas"});

// Create shayari with author info
const shayari = {
  authorName: `${user.firstName} ${user.lastName}`,
  authorUsername: user.username,
  // ... other fields
};
```

## 🚨 Important Notes

### Data Consistency
- Always include both `authorName` and `authorUsername` in shayaris
- Ensure username is unique (future enhancement)
- Handle missing username gracefully with fallbacks

### User Privacy
- Real names used for formal identification
- Pen names used for creative expression
- Users control their creative identity

### Future Enhancements
- Username uniqueness validation
- Username change functionality
- @ mention system
- Search by username
- Username availability checker

---

**✨ The username system provides a perfect balance between real identity and creative expression, allowing poets to build their brand while maintaining authenticity.**