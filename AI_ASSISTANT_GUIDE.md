# 🤖 AI Assistant Guide for PeerUP Web Application

This document is designed to help AI assistants (like Gemini, Claude, ChatGPT, etc.) understand and work with the PeerUP codebase effectively.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Key Features & Components](#key-features--components)
5. [Data Models & Firebase Structure](#data-models--firebase-structure)
6. [Authentication Flow](#authentication-flow)
7. [Common Patterns & Conventions](#common-patterns--conventions)
8. [Development Workflow](#development-workflow)
9. [Deployment Information](#deployment-information)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 Project Overview

**PeerUP** is a peer-to-peer learning and mentorship platform that connects:
- **Buddies**: Study partners who collaborate and stay motivated together
- **Mentors**: Experienced individuals who guide and share expertise
- **Mentees**: Learners seeking guidance and mentorship

### Core Value Proposition
- AI-powered matching based on skills, interests, goals, and availability
- Collaborative goal setting with AI-generated task breakdowns
- Real-time communication (chat, voice/video calls)
- Scheduling system for structured sessions
- Role-based workflows and permissions

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 15.2.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Context API (`lib/auth-context.tsx`)
- **Icons**: Lucide React

### Backend & Services
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Authentication (Email/Password + Google OAuth)
- **Storage**: Firebase Storage
- **Real-time**: Firestore listeners (`onSnapshot`)
- **AI Integration**: Google Gemini API (for goal breakdown)

### Deployment
- **Platform**: Netlify
- **Build**: Next.js static export + serverless functions
- **Environment**: Node.js 20+

---

## 📁 Project Structure

```
peerup/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication pages
│   │   ├── signin/page.tsx       # Sign in page
│   │   └── signup/page.tsx       # Multi-step signup form
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Main dashboard (stats overview)
│   │   ├── chats/page.tsx        # Chat interface
│   │   ├── goals/page.tsx        # List of partnerships/goals
│   │   ├── match/                # Matching system
│   │   │   ├── page.tsx          # Find matches (buddies/mentors/mentees)
│   │   │   ├── mutual/page.tsx   # Mutual matches (accepted partnerships)
│   │   │   ├── requests/page.tsx # Match requests (incoming/outgoing)
│   │   │   └── [partnershipId]/goals/page.tsx  # Partnership-specific goals
│   │   ├── profile/page.tsx      # User profile management
│   │   ├── schedule/page.tsx     # Schedule requests & sessions
│   │   └── settings/page.tsx     # User settings
│   ├── call/page.tsx             # WebRTC call interface
│   └── layout.tsx                # Root layout with AuthProvider
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── GoalsView.tsx             # Goals & tasks management
│   ├── IncomingCallModal.tsx    # Call notification modal
│   └── GoogleSignInButton.tsx    # Google OAuth button
│
├── lib/                          # Core libraries & utilities
│   ├── firebase.js               # Firebase initialization
│   ├── auth-context.tsx          # Authentication context provider
│   ├── chat.ts                   # Chat functions (send, listen, mark read)
│   ├── calling.ts                # WebRTC call functions
│   ├── goals.ts                  # Goals & tasks CRUD operations
│   ├── matching-engine.js        # AI matching algorithm
│   ├── matchRequests.ts          # Match request management
│   ├── scheduling.ts             # Schedule request functions
│   └── profile-options.ts        # Profile tags/skills/interests
│
├── pages/api/                    # API routes (Next.js Pages Router)
│   ├── ai/breakdown-goal.js     # AI goal breakdown endpoint
│   └── auth/NextAuth.js         # NextAuth configuration (legacy)
│
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
├── netlify.toml                  # Netlify configuration
└── package.json                  # Dependencies
```

---

## 🔑 Key Features & Components

### 1. Authentication System
**Location**: `lib/auth-context.tsx`, `app/auth/`

**Key Functions**:
- `signUp(userData)`: Creates Firebase auth user + Firestore profile
- `signIn(email, password)`: Authenticates user
- `signOut()`: Signs out user
- `updateProfile(updates)`: Updates user profile

**User Roles**:
- `buddy`: Study partners
- `mentor`: Guides mentees (requires portfolio/resume)
- `mentee`: Seeks mentorship

**Status**:
- `active`: Normal users (buddies, mentees)
- `pending_review`: Mentors awaiting approval

### 2. Matching System
**Location**: `lib/matching-engine.js`, `app/dashboard/match/`

**Algorithm**:
- Jaccard similarity for skills/interests
- Weighted scoring:
  - Skills: 30-40%
  - Interests: 20-25%
  - Goals: 20-30%
  - Availability: 10-15%
  - Location: 5-10%

**Flow**:
1. User views potential matches (`/dashboard/match`)
2. Sends match request (`lib/matchRequests.ts`)
3. Receiver accepts/declines (`/dashboard/match/requests`)
4. Accepted → Mutual match (`/dashboard/match/mutual`)

### 3. Goals & Tasks
**Location**: `components/GoalsView.tsx`, `lib/goals.ts`

**Features**:
- Create goals for partnerships
- AI-powered task generation (Gemini API)
- Sequential task unlocking
- Multi-participant task completion
- Task editing/deletion

**Data Structure**:
```
matches/{partnershipId}/
  └── goals/{goalId}/
      ├── title, description, status
      ├── taskCount, completedTaskCount
      └── tasks/{taskId}/
          ├── text, details, durationDays
          ├── isComplete, unlocked
          └── completedBy: { userId: boolean }
```

### 4. Chat System
**Location**: `lib/chat.ts`, `app/dashboard/chats/page.tsx`

**Features**:
- Real-time messaging
- Unread message counts
- Auto-mark as read on open
- Participant name loading

**Data Structure**:
```
chats/{chatId}/
  ├── participants: [uid1, uid2]
  ├── lastMessage, lastMessageTimestamp
  ├── lastMessageSenderId
  ├── unreadCounts: { uid: number }
  └── messages/{messageId}/
      ├── text, senderId
      └── timestamp
```

### 5. Calling System
**Location**: `lib/calling.ts`, `app/call/page.tsx`

**Features**:
- WebRTC peer-to-peer calls
- Voice-only and video calls
- Call room management (Firestore)
- ICE candidate exchange
- Call outcome logging

**Flow**:
1. User initiates call → Creates `callRooms/{partnershipId}`
2. Callee receives notification → `IncomingCallModal`
3. Both join → WebRTC connection established
4. Call ends → Logged to `callLogs` collection

### 6. Scheduling System
**Location**: `lib/scheduling.ts`, `app/dashboard/schedule/page.tsx`

**Features**:
- Propose up to 3 time slots
- Accept/decline requests
- Confirmed sessions → Join video calls
- Real-time status updates

---

## 💾 Data Models & Firebase Structure

### Collections

#### `users/{userId}`
```typescript
{
  uid: string
  email: string
  name: string
  role: 'buddy' | 'mentor' | 'mentee'
  status: 'active' | 'pending_review'
  age?: string
  location?: string
  skills?: string[]
  interests?: string[]
  goals?: string
  availability?: string[]
  profilePicUrl?: string
  resumeUrl?: string
  linkedin?: string
  createdAt: string
  settings?: UserSettings
}
```

#### `matches/{matchId}`
```typescript
{
  participants: string[]  // [uid1, uid2]
  matchType?: 'buddy' | 'mentor'
  menteeId?: string  // For mentor matches
  createdAt: Timestamp
}
```

#### `matchRequests/{requestId}`
```typescript
{
  requesterId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Timestamp
}
```

#### `chats/{chatId}`
```typescript
{
  participants: string[]
  lastMessage?: string
  lastMessageTimestamp?: Timestamp
  lastMessageSenderId?: string
  unreadCounts?: Record<string, number>
}
```

#### `callRooms/{partnershipId}`
```typescript
{
  status: 'idle' | 'ringing' | 'connected' | 'ended'
  callerId: string
  calleeId: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
}
```

#### `scheduleRequests/{requestId}`
```typescript
{
  requesterId: string
  receiverId: string
  participants: string[]
  timeSlots: Array<{ start: Timestamp, end: Timestamp }>
  status: 'pending' | 'confirmed' | 'declined'
  selectedSlotIndex?: number
  createdAt: Timestamp
}
```

---

## 🔐 Authentication Flow

1. **Sign Up**:
   - User fills multi-step form (`app/auth/signup/page.tsx`)
   - Creates Firebase auth account (`createUserWithEmailAndPassword`)
   - Creates Firestore user document
   - Mentors → `status: 'pending_review'`
   - Others → `status: 'active'`

2. **Sign In**:
   - Email/password or Google OAuth
   - `onAuthStateChanged` listener updates context
   - Fetches user data from Firestore
   - Redirects to `/dashboard`

3. **Protected Routes**:
   - All `/dashboard/*` routes require authentication
   - `AuthProvider` wraps app (`app/layout.tsx`)
   - `useAuth()` hook provides user state

---

## 🎨 Common Patterns & Conventions

### Component Structure
```typescript
"use client";  // Client component marker
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function Component() {
  const { user } = useAuth();
  const [state, setState] = useState();
  
  useEffect(() => {
    // Side effects
  }, []);
  
  return (
    // JSX
  );
}
```

### Firebase Patterns
```typescript
// Listen to real-time updates
const unsubscribe = onSnapshot(
  query(collection(db, 'collection'), where(...)),
  (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setState(data);
  }
);
return () => unsubscribe();

// Create document
await addDoc(collection(db, 'collection'), { ...data });

// Update document
await updateDoc(doc(db, 'collection', id), { ...updates });

// Delete document
await deleteDoc(doc(db, 'collection', id));
```

### Error Handling
- Always wrap async operations in try/catch
- Show user-friendly error messages
- Log errors to console for debugging

### Styling
- Use Tailwind CSS utility classes
- Dark mode via `dark:` prefix
- Responsive: `md:`, `lg:` breakpoints
- Custom colors: `primary`, `accent`, `pear` (defined in `tailwind.config.ts`)

---

## 🛠️ Development Workflow

### Local Setup
1. Install dependencies: `npm install`
2. Create `.env.local` with Firebase config
3. Run dev server: `npm run dev`
4. Build: `npm run build`

### Environment Variables
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_GEMINI_API_KEY=...
```

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Async/await for promises
- Descriptive variable names
- Comments for complex logic

---

## 🚀 Deployment Information

### Netlify Configuration
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 20+
- **Plugin**: `@netlify/plugin-nextjs`

### Important Files
- `netlify.toml`: Build configuration
- `firestore.rules`: Security rules (deploy separately)
- `firestore.indexes.json`: Index definitions

### Post-Deployment
1. Add Netlify domain to Firebase authorized domains
2. Update `NEXTAUTH_URL` to production URL
3. Verify environment variables are set

---

## 🐛 Troubleshooting Guide

### Common Issues

**1. Authentication not working**
- Check Firebase authorized domains
- Verify environment variables
- Check browser console for errors

**2. Real-time updates not working**
- Verify Firestore rules allow read access
- Check network tab for WebSocket connections
- Ensure user is authenticated

**3. Build errors**
- Check Next.js version (15.2.6+)
- Verify all dependencies installed
- Check for TypeScript errors

**4. Mobile layout issues**
- Sidebar should be hidden on mobile (`hidden md:block`)
- Use hamburger menu for mobile navigation
- Ensure main content has `ml-0 md:ml-64`

**5. Email validation**
- Uses regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Validates in both signup and signin forms
- Shows error: "Please enter a valid email address"

---

## 📝 Notes for AI Assistants

### When Making Changes:
1. **Always check existing patterns** - Follow the codebase conventions
2. **Update TypeScript types** - Keep types consistent
3. **Test on mobile** - Ensure responsive design
4. **Check Firestore rules** - Ensure security rules allow operations
5. **Update documentation** - Keep this guide updated

### Key Principles:
- **Security first**: Never expose secrets, validate inputs
- **User experience**: Clear error messages, loading states
- **Performance**: Use Firestore listeners efficiently, avoid unnecessary re-renders
- **Accessibility**: Use semantic HTML, proper ARIA labels

### File Naming:
- Components: PascalCase (`GoalsView.tsx`)
- Utilities: camelCase (`auth-context.tsx`)
- Pages: lowercase (`page.tsx`, `layout.tsx`)

---

## 🔗 Important Links

- **Firebase Console**: https://console.firebase.google.com
- **Netlify Dashboard**: https://app.netlify.com
- **Next.js Docs**: https://nextjs.org/docs
- **Firebase Docs**: https://firebase.google.com/docs

---

**Last Updated**: December 2024
**Next.js Version**: 15.2.6
**Node Version**: 20+

---

*This document should be updated whenever significant architectural changes are made to the codebase.*

