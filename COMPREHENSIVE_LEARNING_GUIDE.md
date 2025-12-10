# 📚 PeerUP - Complete Learning Guide
## Understanding Every Part of Your Project

This guide will help you understand **everything** about your PeerUP project - from how it works to why we made certain choices. Let's break it down in simple terms!

---

## 🎯 Table of Contents

1. [What is PeerUP?](#what-is-peerup)
2. [Project Architecture Overview](#project-architecture-overview)
3. [Tech Stack Explained](#tech-stack-explained)
4. [Frontend Deep Dive](#frontend-deep-dive)
5. [Backend & API Routes](#backend--api-routes)
6. [Database (Firestore) Structure](#database-firestore-structure)
7. [Authentication System](#authentication-system)
8. [Key Features & How They Work](#key-features--how-they-work)
9. [Libraries & Why We Use Them](#libraries--why-we-use-them)
10. [Data Flow Examples](#data-flow-examples)
11. [Common Patterns & Best Practices](#common-patterns--best-practices)
12. [How to Extend the Project](#how-to-extend-the-project)

---

## 🎯 What is PeerUP?

**PeerUP** is a platform that connects:
- **Buddies**: Study partners who work together
- **Mentors**: Experienced people who guide others
- **Mentees**: Learners seeking help

**Think of it like LinkedIn + Discord + Zoom combined** - but specifically for learning and collaboration!

---

## 🏗️ Project Architecture Overview

### The Big Picture

```
User's Browser
    ↓
Next.js App (Frontend + Backend)
    ↓
Firebase Services
    ├── Authentication (Who you are)
    ├── Firestore (Database - stores data)
    ├── Storage (Files - profile pictures)
    └── Real-time Updates (Live changes)
```

### What Happens When You Use the App?

1. **You open the website** → Next.js serves the React app
2. **You log in** → Firebase Authentication verifies you
3. **You see your dashboard** → App reads data from Firestore
4. **You upload a picture** → Firebase Storage saves it
5. **You send a message** → Firestore updates in real-time
6. **Other person sees it instantly** → Real-time listeners update UI

---

## 🛠️ Tech Stack Explained

### Frontend Technologies

#### 1. **Next.js 15.2.6** (The Framework)
**What it is**: A React framework that makes building web apps easier

**Why we use it**:
- **Server-Side Rendering (SSR)**: Pages load faster
- **File-based Routing**: Create a file = create a route (easy!)
- **API Routes**: Can build backend in the same project
- **Built-in Optimizations**: Images, fonts, etc. optimized automatically

**Example**: 
- File: `app/dashboard/page.tsx` → URL: `/dashboard`
- File: `app/auth/signin/page.tsx` → URL: `/auth/signin`

#### 2. **React 18.3.1** (The UI Library)
**What it is**: JavaScript library for building user interfaces

**Key Concepts**:
- **Components**: Reusable pieces of UI (like buttons, cards)
- **State**: Data that changes (like form inputs, user info)
- **Props**: Data passed between components
- **Hooks**: Functions that let you use React features (`useState`, `useEffect`)

**Example**:
```tsx
// Component that shows user name
function UserCard({ name }) {
  const [likes, setLikes] = useState(0); // State
  
  return (
    <div>
      <h1>{name}</h1>
      <button onClick={() => setLikes(likes + 1)}>
        Likes: {likes}
      </button>
    </div>
  );
}
```

#### 3. **TypeScript** (Type-Safe JavaScript)
**What it is**: JavaScript with types (like saying "this variable is a string")

**Why we use it**:
- **Catches errors early**: Before code runs
- **Better IDE support**: Autocomplete, suggestions
- **Self-documenting**: Code explains itself

**Example**:
```typescript
// JavaScript (can cause errors)
let age = "25";
age = age + 1; // "251" (wrong!)

// TypeScript (catches the error)
let age: number = 25;
age = age + 1; // 26 (correct!)
```

#### 4. **Tailwind CSS** (Styling)
**What it is**: Utility-first CSS framework

**Why we use it**:
- **Fast development**: Write styles directly in HTML
- **Consistent design**: Pre-built classes
- **Responsive**: Easy mobile/desktop layouts

**Example**:
```tsx
// Instead of writing separate CSS file
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Hello!
</div>
// This creates: blue background, white text, padding, rounded corners
```

#### 5. **Radix UI + shadcn/ui** (Component Library)
**What it is**: Pre-built, accessible UI components

**Why we use it**:
- **Accessible**: Works with screen readers
- **Customizable**: Easy to style
- **Professional**: Production-ready components

**Components we use**:
- `Button`, `Input`, `Dialog`, `Toast`, `Select`, etc.

### Backend Technologies

#### 1. **Firebase Firestore** (Database)
**What it is**: NoSQL cloud database (like MongoDB but by Google)

**Why we use it**:
- **Real-time**: Changes appear instantly
- **No server needed**: Google hosts it
- **Scalable**: Handles millions of users
- **Easy queries**: Simple syntax

**Structure**:
```
Collections (like tables)
  └── Documents (like rows)
      └── Fields (like columns)
```

**Example**:
```
users (Collection)
  └── abc123 (Document - user ID)
      ├── name: "John"
      ├── email: "john@example.com"
      └── role: "mentor"
```

#### 2. **Firebase Authentication**
**What it is**: Service that handles user login/signup

**Features**:
- Email/Password authentication
- Google OAuth (sign in with Google)
- Secure token management
- Session handling

**How it works**:
1. User signs up → Firebase creates account
2. User logs in → Firebase gives them a token
3. Token proves who they are → App uses it for requests

#### 3. **Firebase Storage**
**What it is**: File storage (like Google Drive)

**What we store**:
- Profile pictures
- (Future: resumes, documents)

**How it works**:
1. User uploads file → Goes to Firebase Storage
2. Firebase gives back URL → We save URL in database
3. App displays image using URL

#### 4. **Next.js API Routes** (Backend Endpoints)
**What it is**: Server-side code that runs when you call a URL

**Example**:
```javascript
// pages/api/ai/breakdown-goal.js
export default async function handler(req, res) {
  // This runs on the server
  const response = await callAIService();
  res.json(response);
}
```

**When to use**:
- Need to hide API keys (AI services)
- Need server-side processing
- Need to call external APIs securely

---

## 🎨 Frontend Deep Dive

### File Structure

```
app/
├── layout.tsx          # Root layout (wraps all pages)
├── page.tsx            # Home page (/)
├── auth/
│   ├── signin/         # Sign in page
│   └── signup/         # Sign up page
└── dashboard/
    ├── layout.tsx      # Dashboard layout (sidebar)
    ├── page.tsx        # Dashboard home
    ├── profile/        # Profile page
    ├── match/          # Matching system
    └── chats/          # Chat page
```

### How Pages Work

#### 1. **Layout Files** (`layout.tsx`)
**Purpose**: Wraps pages with common elements

**Example** (`app/layout.tsx`):
```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>  {/* Provides auth to all pages */}
          {children}     {/* The actual page content */}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**What happens**:
- Every page gets wrapped with `AuthProvider`
- All pages can access user data via `useAuth()`

#### 2. **Page Files** (`page.tsx`)
**Purpose**: The actual page content

**Example** (`app/dashboard/page.tsx`):
```tsx
export default function DashboardPage() {
  const { user } = useAuth(); // Get current user
  
  if (!user) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome {user.name}!</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### State Management

#### Context API (`lib/auth-context.tsx`)
**What it is**: React's built-in state management

**How it works**:
```tsx
// 1. Create Context
const AuthContext = createContext();

// 2. Create Provider (wraps app)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  // Functions to update user
  const signIn = async (email, password) => {
    // ... sign in logic
    setUser(userData);
  };
  
  return (
    <AuthContext.Provider value={{ user, signIn }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Use in components
export function useAuth() {
  return useContext(AuthContext);
}
```

**Why we use it**:
- **Simple**: No extra libraries needed
- **Global state**: User data available everywhere
- **Reactive**: When user changes, all components update

### Client vs Server Components

#### Client Components (`"use client"`)
**When to use**: 
- Need interactivity (buttons, forms)
- Need browser APIs (localStorage, window)
- Need React hooks (useState, useEffect)

**Example**:
```tsx
"use client"; // Must be at top

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

#### Server Components (default)
**When to use**:
- Static content
- Data fetching (can access database directly)
- No interactivity needed

**Example**:
```tsx
// No "use client" = Server Component
export default async function UserList() {
  // Can fetch data directly (runs on server)
  const users = await getUsers();
  
  return (
    <ul>
      {users.map(user => <li>{user.name}</li>)}
    </ul>
  );
}
```

---

## 🔧 Backend & API Routes

### API Routes Structure

```
pages/api/
├── ai/
│   └── breakdown-goal.js    # AI goal breakdown
├── auth/
│   └── NextAuth.js          # NextAuth config (legacy)
├── match/
│   └── buddy.js             # Buddy matching
└── matching/
    └── find-matches.js      # Find matches
```

### How API Routes Work

**Example** (`pages/api/ai/breakdown-goal.js`):
```javascript
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { goal } = req.body;
  
  // Call AI service (runs on server - API key is safe)
  const response = await callGeminiAPI(goal);
  
  // Send response back
  res.status(200).json({ tasks: response });
}
```

**Why use API routes**:
1. **Hide API keys**: Keys stay on server, never exposed to browser
2. **Server-side processing**: Can do heavy work without slowing browser
3. **Security**: Can validate requests before processing

### Calling API Routes from Frontend

```tsx
const response = await fetch('/api/ai/breakdown-goal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ goal: 'Learn React' })
});

const data = await response.json();
```

---

## 💾 Database (Firestore) Structure

### Collections Overview

```
Firestore Database
├── users/                    # User profiles
├── matches/                  # Partnerships (buddy/mentor-mentee)
│   └── {matchId}/
│       └── goals/            # Goals for this partnership
│           └── {goalId}/
│               └── tasks/    # Tasks for this goal
├── matchRequests/           # Match requests (pending)
├── chats/                    # Chat conversations
│   └── {chatId}/
│       └── messages/         # Messages in this chat
├── callRooms/                # Active call rooms
├── scheduleRequests/         # Session scheduling
└── callLogs/                # Call history
```

### User Document Structure

```typescript
{
  uid: "abc123",                    // Firebase Auth user ID
  email: "user@example.com",
  name: "John Doe",
  role: "mentor" | "buddy" | "mentee",
  age: "25",
  location: "New York",
  linkedin: "https://linkedin.com/...",
  skills: ["React", "TypeScript", "Node.js"],
  interests: ["Web Development", "AI"],
  goals: "Become a senior developer",
  availability: ["Weekdays", "Evenings"],
  interaction: "video" | "voice" | "chat" | "mixed",
  profilePicUrl: "https://storage.../photo.jpg",
  resumeUrl: "https://...",         // Required for mentors
  status: "active" | "pending_review",
  createdAt: "2024-01-01T00:00:00Z",
  settings: {
    emailUpdates: true,
    matchAlerts: true,
    // ... more settings
  }
}
```

### Match Document Structure

```typescript
{
  id: "match123",
  participants: ["uid1", "uid2"],  // User IDs
  type: "buddy" | "mentor-mentee",
  createdAt: "2024-01-01T00:00:00Z",
  status: "active"
}
```

### Goal Document Structure

```typescript
{
  id: "goal123",
  matchId: "match123",              // Which partnership
  title: "Learn React",
  description: "Master React fundamentals",
  status: "in_progress" | "completed",
  taskCount: 5,
  completedTaskCount: 2,
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Task Document Structure

```typescript
{
  id: "task123",
  goalId: "goal123",
  text: "Complete React tutorial",
  details: "Finish the official React tutorial",
  durationDays: 7,
  isComplete: false,
  unlocked: true,                   // Can user see this task?
  completedBy: {                   // Who completed it
    "uid1": true,
    "uid2": false
  },
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Security Rules (`firestore.rules`)

**Why we need them**: Prevent unauthorized access

**Example**:
```javascript
match /users/{userId} {
  // Anyone authenticated can read
  allow read: if request.auth != null;
  
  // Only the user themselves can update
  allow update: if request.auth != null && request.auth.uid == userId;
}
```

**What this means**:
- ✅ Logged-in users can view any profile
- ✅ Only you can edit your own profile
- ❌ No one can delete profiles (not allowed)

---

## 🔐 Authentication System

### How Authentication Works

#### 1. **Sign Up Flow**

```
User fills form
    ↓
signUp() called (lib/auth-context.tsx)
    ↓
Firebase Auth creates account
    ↓
Create user document in Firestore
    ↓
User automatically logged in
    ↓
onAuthStateChanged triggers
    ↓
User data loaded into app
```

**Code Flow**:
```tsx
// 1. User submits signup form
const handleSignup = async () => {
  await signUp({
    email: "user@example.com",
    password: "password123",
    name: "John",
    role: "mentor"
  });
};

// 2. signUp function (lib/auth-context.tsx)
const signUp = async (userData) => {
  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth, 
    userData.email, 
    userData.password
  );
  
  // Create Firestore document
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    ...userData,
    uid: userCredential.user.uid,
    status: 'active',
    createdAt: new Date().toISOString()
  });
};
```

#### 2. **Sign In Flow**

```
User enters email/password
    ↓
signIn() called
    ↓
Firebase Auth verifies credentials
    ↓
onAuthStateChanged triggers
    ↓
Fetch user data from Firestore
    ↓
User data loaded into app
```

#### 3. **Session Management**

**How it works**:
- Firebase stores session token in browser
- Token automatically refreshes
- `onAuthStateChanged` listens for changes
- When token expires → User logged out automatically

**Code**:
```tsx
useEffect(() => {
  // Listen for auth state changes
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // User is logged in - fetch their data
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      setUser(userDoc.data());
    } else {
      // User is logged out
      setUser(null);
    }
  });
  
  return () => unsubscribe(); // Cleanup
}, []);
```

### Password Visibility Toggle (What We Fixed)

**How it works**:
```tsx
const [showPassword, setShowPassword] = useState(false);

<Input
  type={showPassword ? "text" : "password"}  // Toggle type
  value={password}
/>
<button onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff /> : <Eye />}      // Toggle icon
</button>
```

### Form Persistence (What We Fixed)

**How it works**:
```tsx
// Save to localStorage when user types
useEffect(() => {
  localStorage.setItem("signup_form_data", JSON.stringify(formData));
}, [formData]);

// Load from localStorage on page load
useEffect(() => {
  const saved = localStorage.getItem("signup_form_data");
  if (saved) {
    setFormData(JSON.parse(saved));
  }
}, []);
```

**Why**: Prevents data loss when user switches tabs or refreshes

---

## 🎯 Key Features & How They Work

### 1. Matching System

#### How It Works

**Location**: `lib/matching-engine.js`

**Algorithm**:
1. Get all users (except current user)
2. Calculate similarity score for each:
   - **Skills match**: 30-40% weight
   - **Interests match**: 20-25% weight
   - **Goals match**: 20-30% weight
   - **Availability match**: 10-15% weight
   - **Location match**: 5-10% weight
3. Sort by score (highest first)
4. Return top matches

**Code Example**:
```javascript
function calculateMatchScore(user, candidate) {
  let score = 0;
  
  // Skills similarity (Jaccard index)
  const skillsMatch = calculateJaccard(user.skills, candidate.skills);
  score += skillsMatch * 0.35; // 35% weight
  
  // Interests similarity
  const interestsMatch = calculateJaccard(user.interests, candidate.interests);
  score += interestsMatch * 0.25; // 25% weight
  
  // Goals similarity (text matching)
  const goalsMatch = calculateTextSimilarity(user.goals, candidate.goals);
  score += goalsMatch * 0.25; // 25% weight
  
  // Availability overlap
  const availabilityMatch = calculateOverlap(user.availability, candidate.availability);
  score += availabilityMatch * 0.15; // 15% weight
  
  return score; // 0 to 1 (0% to 100% match)
}
```

**Jaccard Similarity**:
```
Jaccard = (Items in both) / (Items in either)
Example:
  User skills: [React, TypeScript, Node]
  Candidate skills: [React, Python, Node]
  Common: [React, Node] = 2 items
  Total unique: [React, TypeScript, Node, Python] = 4 items
  Jaccard = 2/4 = 0.5 (50% similar)
```

### 2. Goals & Tasks System

#### How It Works

**Location**: `lib/goals.ts`, `components/GoalsView.tsx`

**Flow**:
1. User creates goal for a partnership
2. AI breaks down goal into tasks (optional)
3. Tasks unlock sequentially (complete one → next unlocks)
4. Multiple users can complete tasks
5. Goal completes when all tasks done

**Creating a Goal**:
```typescript
// lib/goals.ts
export async function createGoal(matchId, goalData) {
  const goalRef = doc(collection(db, 'matches', matchId, 'goals'));
  
  await setDoc(goalRef, {
    title: goalData.title,
    description: goalData.description,
    status: 'in_progress',
    taskCount: 0,
    completedTaskCount: 0,
    createdAt: serverTimestamp()
  });
}
```

**AI Task Breakdown**:
```typescript
// pages/api/ai/breakdown-goal.js
export default async function handler(req, res) {
  const { goal } = req.body;
  
  // Call Gemini API
  const response = await fetch('https://generativelanguage.googleapis.com/...', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.VERTEX_AI_API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Break down this goal into tasks: ${goal}`
        }]
      }]
    })
  });
  
  const data = await response.json();
  const tasks = parseAITasks(data); // Extract tasks from response
  
  res.json({ tasks });
}
```

**Task Unlocking**:
```typescript
// When user completes a task
await updateDoc(taskRef, { isComplete: true });

// Check if next task should unlock
const nextTask = getNextTask(goalId);
if (nextTask && !nextTask.unlocked) {
  await updateDoc(nextTaskRef, { unlocked: true });
}
```

### 3. Chat System

#### How It Works

**Location**: `lib/chat.ts`, `app/dashboard/chats/page.tsx`

**Real-time Updates**:
```typescript
// Listen for new messages
useEffect(() => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  // onSnapshot = real-time listener
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMessages(messages); // UI updates automatically!
  });
  
  return () => unsubscribe();
}, [chatId]);
```

**Sending a Message**:
```typescript
export async function sendMessage(chatId, text, senderId) {
  // Add message
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text,
    senderId,
    timestamp: serverTimestamp()
  });
  
  // Update chat metadata
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text,
    lastMessageTimestamp: serverTimestamp(),
    lastMessageSenderId: senderId
  });
  
  // Increment unread count for other participant
  await incrementUnreadCount(chatId, otherUserId);
}
```

**Unread Counts**:
```typescript
// When user opens chat
export async function markAsRead(chatId, userId) {
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCounts.${userId}`]: 0  // Reset to 0
  });
}
```

### 4. Profile Picture Upload (What We Fixed)

#### How It Works

**Location**: `app/dashboard/profile/page.tsx`

**Flow**:
1. User selects image file
2. Create preview (blob URL)
3. On save, upload to Firebase Storage
4. Get download URL
5. Save URL to Firestore

**Code**:
```typescript
// 1. User selects file
const handleFileChange = (e) => {
  const file = e.target.files[0];
  setProfilePic(file);
  
  // Create preview
  const previewUrl = URL.createObjectURL(file);
  setProfilePicUrl(previewUrl);
};

// 2. Upload on save
const handleSave = async () => {
  if (profilePic) {
    // Upload to Firebase Storage
    const fileRef = ref(
      storage, 
      `profile-pictures/${user.uid}/${Date.now()}-${profilePic.name}`
    );
    await uploadBytes(fileRef, profilePic);
    
    // Get public URL
    const uploadedUrl = await getDownloadURL(fileRef);
    
    // Save URL to Firestore
    await updateProfile({ profilePicUrl: uploadedUrl });
  }
};
```

**Why We Needed Storage Rules**:
- Without rules: Firebase blocks all uploads (CORS error)
- With rules: Authenticated users can upload to their folder
- Rules ensure: Users can only upload to their own folder

---

## 📦 Libraries & Why We Use Them

### Core Libraries

#### 1. **firebase** (^12.0.0)
**What**: Firebase SDK for JavaScript
**Why**: 
- Authentication
- Database (Firestore)
- File storage
- Real-time updates

**Key Imports**:
```typescript
import { auth, db, storage } from './lib/firebase';
import { 
  signInWithEmailAndPassword,  // Login
  createUserWithEmailAndPassword,  // Signup
  onAuthStateChanged  // Listen for auth changes
} from 'firebase/auth';
import {
  collection,  // Get collection
  doc,  // Get document
  getDoc,  // Read document
  setDoc,  // Create/update document
  onSnapshot  // Real-time listener
} from 'firebase/firestore';
```

#### 2. **next** (^15.2.6)
**What**: React framework
**Why**: 
- File-based routing
- Server-side rendering
- API routes
- Built-in optimizations

#### 3. **react** (^18.3.1) & **react-dom** (^18.3.1)
**What**: UI library
**Why**: 
- Component-based architecture
- Reactive updates
- Hooks for state management

#### 4. **typescript** (^5.0.0)
**What**: Typed JavaScript
**Why**: 
- Catch errors early
- Better IDE support
- Self-documenting code

### UI Libraries

#### 5. **@radix-ui/react-*** (Multiple)
**What**: Headless UI components
**Why**: 
- Accessible (WCAG compliant)
- Unstyled (we style them)
- Flexible

**Components we use**:
- `@radix-ui/react-dialog` → Modals
- `@radix-ui/react-dropdown-menu` → Dropdowns
- `@radix-ui/react-toast` → Notifications
- And 20+ more...

#### 6. **lucide-react** (^0.454.0)
**What**: Icon library
**Why**: 
- Beautiful icons
- Tree-shakeable (only imports what you use)
- Consistent style

**Usage**:
```tsx
import { User, Mail, Lock } from 'lucide-react';

<User className="w-5 h-5" />  // User icon
```

#### 7. **tailwindcss** (^3.4.17)
**What**: Utility-first CSS
**Why**: 
- Fast development
- Consistent design
- Responsive by default

#### 8. **framer-motion** (^12.23.12)
**What**: Animation library
**Why**: 
- Smooth animations
- Easy to use
- Performance optimized

**Usage**:
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Form Libraries

#### 9. **react-hook-form** (^7.54.1)
**What**: Form state management
**Why**: 
- Less re-renders (better performance)
- Easy validation
- Simple API

**Usage**:
```tsx
const { register, handleSubmit } = useForm();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("email", { required: true })} />
</form>
```

#### 10. **zod** (^3.24.1)
**What**: Schema validation
**Why**: 
- Type-safe validation
- Works with TypeScript
- Clear error messages

**Usage**:
```typescript
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

const result = schema.parse(data); // Validates and types
```

### Utility Libraries

#### 11. **date-fns** (^3.6.0)
**What**: Date manipulation
**Why**: 
- Format dates easily
- Calculate differences
- Timezone support

**Usage**:
```typescript
import { format, differenceInDays } from 'date-fns';

format(new Date(), 'MMM dd, yyyy'); // "Jan 01, 2024"
differenceInDays(date1, date2); // 5
```

#### 12. **fuse.js** (^7.1.0)
**What**: Fuzzy search
**Why**: 
- Search even with typos
- Fast
- Configurable

**Usage**:
```typescript
const fuse = new Fuse(items, { keys: ['name', 'email'] });
const results = fuse.search('john'); // Finds "John", "Johnson", etc.
```

---

## 🔄 Data Flow Examples

### Example 1: User Signs Up

```
1. User fills form (app/auth/signup/page.tsx)
   ↓
2. handleSignup() called
   ↓
3. signUp() from auth-context.tsx
   ↓
4. createUserWithEmailAndPassword() → Firebase Auth
   ↓
5. setDoc() → Firestore (create user document)
   ↓
6. onAuthStateChanged() triggers
   ↓
7. getDoc() → Fetch user data from Firestore
   ↓
8. setUser() → Update React state
   ↓
9. All components using useAuth() re-render
   ↓
10. User redirected to /dashboard
```

### Example 2: User Sends a Message

```
1. User types message (app/dashboard/chats/page.tsx)
   ↓
2. User clicks send
   ↓
3. sendMessage() from lib/chat.ts
   ↓
4. addDoc() → Add message to Firestore
   ↓
5. updateDoc() → Update chat metadata
   ↓
6. onSnapshot() listener detects change
   ↓
7. UI automatically updates (React re-renders)
   ↓
8. Other user's onSnapshot() also triggers
   ↓
9. Other user sees message instantly
```

### Example 3: User Uploads Profile Picture

```
1. User selects file (app/dashboard/profile/page.tsx)
   ↓
2. handleFileChange() → Creates blob preview
   ↓
3. User clicks "Save Changes"
   ↓
4. handleSave() called
   ↓
5. uploadBytes() → Upload to Firebase Storage
   ↓
6. getDownloadURL() → Get public URL
   ↓
7. updateProfile() → Save URL to Firestore
   ↓
8. updateDoc() → Update user document
   ↓
9. UI updates with new picture
```

---

## 🎨 Common Patterns & Best Practices

### 1. Error Handling Pattern

```typescript
try {
  await someAsyncOperation();
  setSuccess(true);
} catch (error: any) {
  console.error("Error:", error);
  setError(error.message || "Something went wrong");
} finally {
  setLoading(false); // Always runs
}
```

**Why**: 
- User sees helpful error messages
- App doesn't crash
- Loading state always resets

### 2. Loading States Pattern

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await doSomething();
  } finally {
    setLoading(false); // Always reset
  }
};

<button disabled={loading}>
  {loading ? "Loading..." : "Submit"}
</button>
```

**Why**: 
- Prevents double-submission
- Shows user something is happening
- Better UX

### 3. Real-time Data Pattern

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setData(data);
  });
  
  return () => unsubscribe(); // Cleanup on unmount
}, [dependencies]);
```

**Why**: 
- Data updates automatically
- No need to refresh
- Cleanup prevents memory leaks

### 4. Form Validation Pattern

```typescript
const [errors, setErrors] = useState({});

const validate = () => {
  const newErrors = {};
  
  if (!email) newErrors.email = "Email required";
  else if (!isValidEmail(email)) newErrors.email = "Invalid email";
  
  if (!password) newErrors.password = "Password required";
  else if (password.length < 6) newErrors.password = "Too short";
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Why**: 
- Better UX (errors before submit)
- Catches mistakes early
- Clear feedback

### 5. Protected Routes Pattern

```typescript
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return null; // Will redirect
  
  return <div>Dashboard content</div>;
}
```

**Why**: 
- Prevents unauthorized access
- Redirects to login if needed
- Handles loading state

---

## 🚀 How to Extend the Project

### Adding a New Feature

#### Step 1: Plan the Data Structure
**Question**: What data do I need to store?

**Example**: Adding "Comments" feature
```
comments/{commentId}
  ├── postId: "post123"
  ├── userId: "user123"
  ├── text: "Great post!"
  └── timestamp: Timestamp
```

#### Step 2: Create Firestore Collection
1. Go to Firebase Console
2. Create collection: `comments`
3. Add security rules:
```javascript
match /comments/{commentId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null 
    && request.auth.uid == resource.data.userId;
}
```

#### Step 3: Create Library Functions
**File**: `lib/comments.ts`
```typescript
export async function createComment(postId, text, userId) {
  await addDoc(collection(db, 'comments'), {
    postId,
    text,
    userId,
    timestamp: serverTimestamp()
  });
}

export function listenToComments(postId, callback) {
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(comments);
  });
}
```

#### Step 4: Create UI Component
**File**: `components/Comments.tsx`
```tsx
"use client";

export default function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  
  useEffect(() => {
    const unsubscribe = listenToComments(postId, setComments);
    return () => unsubscribe();
  }, [postId]);
  
  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>{comment.text}</div>
      ))}
    </div>
  );
}
```

#### Step 5: Add to Page
```tsx
import Comments from '@/components/Comments';

export default function PostPage() {
  return (
    <div>
      <h1>Post Title</h1>
      <Comments postId="post123" />
    </div>
  );
}
```

### Adding a New Page

#### Step 1: Create File
**File**: `app/notifications/page.tsx`
```tsx
export default function NotificationsPage() {
  return <div>Notifications</div>;
}
```

**Result**: Automatically available at `/notifications`

#### Step 2: Add Navigation
**File**: `app/dashboard/layout.tsx`
```tsx
<Link href="/dashboard/notifications">
  Notifications
</Link>
```

### Adding a New API Route

#### Step 1: Create File
**File**: `pages/api/notifications/send.js`
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { userId, message } = req.body;
  
  // Do something
  await sendNotification(userId, message);
  
  res.status(200).json({ success: true });
}
```

**Result**: Available at `/api/notifications/send`

#### Step 2: Call from Frontend
```typescript
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, message })
});
```

---

## 🎓 Key Concepts to Master

### 1. **React Hooks**
- `useState`: Store data that changes
- `useEffect`: Run code on mount/update
- `useContext`: Access global state
- `useRef`: Store mutable values

### 2. **Async/Await**
```typescript
// Instead of:
fetch(url).then(response => response.json()).then(data => ...)

// Use:
const response = await fetch(url);
const data = await response.json();
```

### 3. **Firestore Queries**
```typescript
// Get all users
const usersRef = collection(db, 'users');
const snapshot = await getDocs(usersRef);

// Get specific user
const userRef = doc(db, 'users', userId);
const userDoc = await getDoc(userRef);

// Query with conditions
const q = query(
  collection(db, 'users'),
  where('role', '==', 'mentor'),
  orderBy('name', 'asc'),
  limit(10)
);
```

### 4. **Real-time Listeners**
```typescript
// Listen for changes
const unsubscribe = onSnapshot(query, (snapshot) => {
  // This runs every time data changes
  const data = snapshot.docs.map(doc => doc.data());
  setData(data);
});

// Don't forget to cleanup!
return () => unsubscribe();
```

### 5. **Error Boundaries**
```typescript
// Catch errors in components
try {
  await riskyOperation();
} catch (error) {
  // Handle error gracefully
  setError(error.message);
  // Don't crash the app!
}
```

---

## 📝 Quick Reference

### Common Firebase Operations

```typescript
// Read
const doc = await getDoc(doc(db, 'users', userId));
const data = doc.data();

// Create
await setDoc(doc(db, 'users', userId), userData);

// Update
await updateDoc(doc(db, 'users', userId), { name: 'New Name' });

// Delete
await deleteDoc(doc(db, 'users', userId));

// Query
const q = query(collection(db, 'users'), where('role', '==', 'mentor'));
const snapshot = await getDocs(q);

// Real-time
onSnapshot(query, (snapshot) => { /* handle updates */ });
```

### Common React Patterns

```typescript
// State
const [value, setValue] = useState(initialValue);

// Effect
useEffect(() => {
  // Run on mount/update
  return () => {
    // Cleanup
  };
}, [dependencies]);

// Context
const value = useContext(MyContext);
```

### Common Next.js Patterns

```typescript
// Navigation
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');

// Link
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>

// Image
import Image from 'next/image';
<Image src="/logo.png" width={100} height={100} alt="Logo" />
```

---

## 🎯 Practice Exercises

### Exercise 1: Add a "Like" Feature
1. Create `likes` collection in Firestore
2. Add security rules
3. Create `lib/likes.ts` with like/unlike functions
4. Create `LikeButton` component
5. Add to a page

### Exercise 2: Add Search Functionality
1. Create search API route
2. Use Fuse.js for fuzzy search
3. Create search component
4. Add to navigation

### Exercise 3: Add Notifications
1. Create `notifications` collection
2. Add real-time listener
3. Create notification badge component
4. Show unread count

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property of undefined"
**Solution**: Always check if data exists
```typescript
if (user && user.name) {
  return <div>{user.name}</div>;
}
```

### Issue: "Too many re-renders"
**Solution**: Check useEffect dependencies
```typescript
useEffect(() => {
  // Don't call setState here if it's in dependencies!
}, [state]); // Remove state from deps if you're setting it
```

### Issue: "Firestore permission denied"
**Solution**: Check security rules
```javascript
// Make sure rules allow the operation
allow read: if request.auth != null;
```

### Issue: "CORS error"
**Solution**: Check Firebase Storage rules are deployed
```bash
firebase deploy --only storage
```

---

## 📚 Additional Resources

### Official Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Learning Resources
- [Next.js Learn](https://nextjs.org/learn)
- [React Tutorial](https://react.dev/learn)
- [Firebase Tutorial](https://firebase.google.com/docs/web/setup)

---

## 🎉 Conclusion

You now understand:
- ✅ How the project is structured
- ✅ How frontend and backend work
- ✅ How the database is organized
- ✅ How authentication works
- ✅ How real-time updates work
- ✅ How to extend the project

**Next Steps**:
1. Read the code in `lib/` folder
2. Experiment with small changes
3. Add a new feature
4. Read Firebase documentation
5. Practice with React hooks

**Remember**: The best way to learn is by doing! Start small, experiment, and don't be afraid to break things (you can always revert with git).

Good luck! 🚀

