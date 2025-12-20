# 🔥 Firestore Database Setup Guide

This guide will help you recreate your Firestore database structure after deletion.

## 📋 Step-by-Step Setup

### Step 1: Deploy Firestore Security Rules

Your Firestore security rules are already defined in `firestore.rules`. Deploy them:

```bash
# Make sure you have Firebase CLI installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 2: Deploy Firestore Indexes

Your indexes are defined in `firestore.indexes.json`. Deploy them:

```bash
firebase deploy --only firestore:indexes
```

**Note:** Indexes may take a few minutes to build. You can check their status in the Firebase Console.

### Step 3: Verify Collections Structure

The following collections will be created automatically when your app runs, but here's the structure:

#### Collections Overview

1. **`users`** - User profiles
2. **`chats`** - Chat conversations (with `messages` subcollection)
3. **`callRooms`** - Active call rooms (with `offerCandidates` and `answerCandidates` subcollections)
4. **`scheduleRequests`** - Schedule requests
5. **`matches`** - Matches between users (with `goals` subcollection)
6. **`callLogs`** - Call history
7. **`matchRequests`** - Match requests
8. **`feedback`** - User feedback

### Step 4: Test the Setup

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Create a test user:**
   - Go to `http://localhost:3000/auth/signup`
   - Sign up with email/password or Google
   - Complete the profile creation flow

3. **Verify in Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to **Firestore Database**
   - You should see a `users` collection with your test user document

### Step 5: Verify Collections Are Created

Collections are created automatically when:
- A user signs up → Creates `users/{userId}` document
- A user sends a message → Creates `chats/{chatId}` and `chats/{chatId}/messages/{messageId}`
- A user initiates a call → Creates `callRooms/{roomId}`
- A user sends a match request → Creates `matchRequests/{requestId}`
- A match is created → Creates `matches/{matchId}`
- A goal is created → Creates `matches/{matchId}/goals/{goalId}`
- A task is created → Creates `matches/{matchId}/goals/{goalId}/tasks/{taskId}`
- A schedule request is sent → Creates `scheduleRequests/{requestId}`
- A call ends → Creates `callLogs/{logId}`
- Feedback is submitted → Creates `feedback/{feedbackId}`

## 📊 Collection Structures

### 1. `users/{userId}`

```typescript
{
  uid: string
  email: string
  name: string
  role: 'mentor' | 'buddy' | 'mentee'
  status: 'active' | 'pending_review'
  age?: string
  location?: string
  linkedin?: string
  skills?: string[]
  interests?: string[]
  goals?: string
  availability?: string[]
  interaction?: 'video' | 'voice' | 'chat' | 'mixed'
  profilePicUrl?: string
  resumeUrl?: string  // Required for mentors
  createdAt: string  // ISO timestamp
  settings?: {
    emailUpdates: boolean
    matchAlerts: boolean
    callReminders: boolean
    digestFrequency: 'daily' | 'weekly' | 'off'
    profileVisibility: 'community' | 'matches-only'
    timezone: string
  }
}
```

### 2. `chats/{chatId}`

```typescript
{
  participants: string[]  // [uid1, uid2]
  lastMessage?: string
  lastMessageTimestamp?: Timestamp
  lastMessageSenderId?: string
  unreadCounts?: Record<string, number>  // { [uid]: count }
}
```

**Subcollection:** `chats/{chatId}/messages/{messageId}`
```typescript
{
  chatId: string
  senderId: string
  text: string
  timestamp: Timestamp
}
```

### 3. `callRooms/{roomId}`

```typescript
{
  status: 'idle' | 'ringing' | 'connected' | 'ended'
  callerId: string
  calleeId: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  createdAt: Timestamp
}
```

**Subcollections:**
- `callRooms/{roomId}/offerCandidates/{candidateId}`
- `callRooms/{roomId}/answerCandidates/{candidateId}`

### 4. `matches/{matchId}`

```typescript
{
  participants: string[]  // [uid1, uid2]
  matchType?: 'buddy' | 'mentor'
  menteeId?: string  // For mentor matches
  createdAt: Timestamp
}
```

**Subcollection:** `matches/{matchId}/goals/{goalId}`
```typescript
{
  title: string
  description?: string
  status: 'in-progress' | 'completed'
  taskCount: number
  completedTaskCount: number
  createdBy: string
  createdAt: Timestamp
}
```

**Subcollection:** `matches/{matchId}/goals/{goalId}/tasks/{taskId}`
```typescript
{
  text: string
  details?: string
  durationDays?: number
  isComplete: boolean
  order: number
  unlocked?: boolean
  completedBy?: Record<string, boolean>  // { [uid]: true }
  createdAt: Timestamp
}
```

### 5. `matchRequests/{requestId}`

```typescript
{
  requesterId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Timestamp
}
```

### 6. `scheduleRequests/{requestId}`

```typescript
{
  requesterId: string
  receiverId: string
  participants: string[]  // [requesterId, receiverId]
  timeSlots: Array<{
    start: Timestamp
    end: Timestamp
  }>
  status: 'pending' | 'confirmed' | 'declined'
  selectedSlotIndex?: number
  createdAt: Timestamp
}
```

### 7. `callLogs/{logId}`

```typescript
{
  callerId: string
  calleeId: string
  participants: string[]  // [callerId, calleeId]
  status: 'missed' | 'answered' | 'ended'
  duration?: number  // in seconds
  createdAt: Timestamp
}
```

### 8. `feedback/{feedbackId}`

```typescript
{
  userId: string
  feedback: string
  rating?: number
  createdAt: Timestamp
}
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Firestore rules deployed successfully
- [ ] Firestore indexes deployed successfully
- [ ] Can create a new user account
- [ ] User document appears in `users` collection
- [ ] Can send a message (creates `chats` collection)
- [ ] Can send a match request (creates `matchRequests` collection)
- [ ] Can accept a match (creates `matches` collection)
- [ ] Can create a goal (creates `matches/{matchId}/goals` subcollection)
- [ ] Can initiate a call (creates `callRooms` collection)
- [ ] Can send a schedule request (creates `scheduleRequests` collection)

## 🚨 Important Notes

1. **Collections are created automatically** - You don't need to manually create empty collections. They're created when the first document is added.

2. **Indexes are required** - Some queries require composite indexes. If you see an error about missing indexes, Firebase will provide a link to create them automatically.

3. **Security Rules** - Make sure your rules are deployed. Without proper rules, your app may not work correctly.

4. **Authentication** - Users must be authenticated (via Firebase Auth) to create/read documents. Make sure Authentication is set up in Firebase Console.

## 🔧 Troubleshooting

### "Missing or insufficient permissions" error
- Check that Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Verify the user is authenticated
- Check the rules in Firebase Console → Firestore → Rules

### "Index not found" error
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Wait a few minutes for indexes to build
- Check index status in Firebase Console → Firestore → Indexes

### Collections not appearing
- Collections only appear after the first document is created
- Try creating a test user or sending a message
- Check Firebase Console → Firestore → Data

## 📚 Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)

