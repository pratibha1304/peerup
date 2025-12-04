# PeerUP Setup Guide

## 🚀 Quick Start

Your PeerUP application is now ready with:
- ✅ Real Firebase Authentication
- ✅ AI-Powered Matching Engine
- ✅ Role-based Dashboard Logic
- ✅ Modern UI with Gen-Z animations

## 🔧 Configuration Required

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication (Email/Password + Google)
4. Enable Firestore Database
5. Get your project credentials

### 2. Environment Variables

Create a `.env.local` file in your project root with:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

<<<<<<< HEAD
# Google Gemini/Vertex AI (for AI goal breakdown)
# Option 1: Use Gemini API directly (simpler, recommended)
VERTEX_AI_API_KEY=your_gemini_api_key_here
# OR
GEMINI_API_KEY=your_gemini_api_key_here

# Option 2: Use Vertex AI (requires service account)
# GOOGLE_CLOUD_PROJECT_ID=your_project_id
# GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
# VERTEX_AI_LOCATION=us-central1
```

**To get a Gemini API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env.local` file as `VERTEX_AI_API_KEY`

=======
# Google Gemini API (for AI roadmap)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
### 3. Generate NextAuth Secret

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## 🎯 Features Implemented

### Authentication System
- **Real Firebase Auth**: Replaced localStorage simulation
- **Google OAuth**: Integrated Google sign-in
- **Email/Password**: Traditional authentication
- **User Profiles**: Complete profile management

<<<<<<< HEAD
### Voice Calling
- **Voice-only calls**: Audio-only communication between matched users
- **WebRTC integration**: Real-time peer-to-peer connection
- **Schedule-integrated**: Join calls from confirmed schedule sessions

### Scheduling System
- **Meeting requests**: Propose up to 3 time slots
- **Accept/decline**: Users can confirm or decline requests
- **Confirmed sessions**: View and join calls from confirmed schedules
- **Real-time updates**: Live status updates for all requests

### Goals & Tasks
- **AI-powered task generation**: Vertex AI automatically breaks down goals into actionable tasks
- **Goal tracking**: Visual progress indicators
- **Task management**: Check off completed tasks
- **Role-based permissions**: Mentees can check tasks in mentor relationships

=======
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
### AI Matching Engine
- **Smart Algorithm**: Uses Jaccard similarity for skills/interests
- **Role-based Matching**: 
  - Buddies match with buddies
  - Mentors match with mentees
  - Mentees match with mentors
- **Compatibility Scoring**: 
  - Skills (30-40% weight)
  - Interests (20-25% weight)
  - Goals (20-30% weight)
  - Availability (10-15% weight)
  - Location (5-10% weight)
- **Match Reasons**: Explains why users match
- **Filtering**: Advanced search and filter options

### Dashboard Logic
- **Role Detection**: Automatically shows relevant matches
- **Dynamic UI**: Changes based on user role
- **Real-time Updates**: Live match refreshing

## 🎨 UI Features

- **Gen-Z Animations**: Funky, eye-catching transitions
- **Modern Design**: Clean, minimalist aesthetic
- **Responsive**: Works on all devices
- **Color Scheme**: 
  - Pear (#CBD83B) for accents
  - Indigo (#A88AED) for highlights
  - Ivory (#FFFFEEC) for backgrounds

## 🔄 How It Works

### User Flow
1. **Sign Up**: Users choose role (buddy/mentor/mentee)
2. **Profile Setup**: Complete skills, interests, goals
3. **Matching**: AI finds compatible users
4. **Connection**: Users can connect and chat

### Matching Algorithm
1. **Data Collection**: Gathers user preferences
2. **Normalization**: Standardizes skills/interests
3. **Scoring**: Calculates compatibility percentages
4. **Ranking**: Sorts by match quality
5. **Filtering**: Applies user preferences

<<<<<<< HEAD
### Mentor/Mentee Workflow
- **Role-based matching**: Mentors find mentees and vice versa
- **Match requests**: Send connection requests
- **Mutual matches**: View accepted partnerships
- **Goals & tasks**: Collaborative goal setting with AI assistance
- **Scheduling**: Book mentoring sessions
- **Messaging**: Direct communication

=======
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
## 🚀 Next Steps

1. **Configure Firebase**: Add your project credentials
2. **Test Authentication**: Try signing up/in
3. **Add Sample Data**: Create test users
4. **Test Matching**: Verify the algorithm works
5. **Deploy**: Push to production

## 🐛 Troubleshooting

### Common Issues
- **Firebase not connecting**: Check environment variables
- **No matches showing**: Ensure users have complete profiles
- **Authentication errors**: Verify Firebase Auth is enabled

### Debug Mode
- Check browser console for errors
- Verify Firebase project settings
- Test API endpoints directly

## 📱 Testing

1. Create multiple test accounts with different roles
2. Fill out complete profiles
3. Test the matching system
4. Verify role-based filtering works

Your PeerUP application is now ready for the world! 🌟
