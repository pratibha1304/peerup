import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Fuse from 'fuse.js';

// Initialize Firebase Admin if not already initialized
let db: any;
try {
  if (getApps().length === 0) {
    // Only initialize if we have the required environment variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      db = getFirestore();
    } else {
      console.warn('Firebase Admin environment variables not found. API will return mock data.');
    }
  } else {
    db = getFirestore();
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  // For development, we'll handle this gracefully
}

// Curated master skill list
const masterSkills = [
  'graphic design', 'web development', 'ui/ux', 'content writing',
  'marketing', 'python', 'java', 'javascript', 'freelancing',
  'data science', 'machine learning', 'react', 'node.js', 'typescript',
  'mobile development', 'ios', 'android', 'swift', 'kotlin',
  'business', 'entrepreneurship', 'finance', 'accounting',
  'design', 'illustration', 'photography', 'video editing',
  'music', 'writing', 'blogging', 'social media',
  'languages', 'spanish', 'french', 'german', 'chinese',
  'fitness', 'nutrition', 'yoga', 'meditation',
  'cooking', 'gardening', 'travel', 'photography'
];

// Fuzzy matcher instance
const fuse = new Fuse(masterSkills, { threshold: 0.3 });

// Normalize a skill to your master list (handles typos, variants)
function normalizeSkill(input: string) {
  if (!input) return "";
  input = input.trim().toLowerCase();
  const result = fuse.search(input);
  return result.length ? result[0].item : input;
}

// Match-scoring algorithm
function matchScore(user: any, candidate: any) {
  let score = 0;
  
  // Skills (fuzzy normalized)
  const userSkills = (user.skills || []).map(normalizeSkill);
  const candidateSkills = (candidate.skills || []).map(normalizeSkill);
  userSkills.forEach((skill: string) => {
    if (candidateSkills.includes(skill)) score += 3;
  });
  
  // Interests
  const userInterests = (user.interests || []).map((s: string) => s.toLowerCase());
  const candidateInterests = (candidate.interests || []).map((s: string) => s.toLowerCase());
  userInterests.forEach((interest: string) => {
    if (candidateInterests.includes(interest)) score += 2;
  });
  
  // Availability
  const userAvail = (user.availability || []).map((a: string) => a.toLowerCase());
  const candidateAvail = (candidate.availability || []).map((a: string) => a.toLowerCase());
  userAvail.forEach((a: string) => {
    if (candidateAvail.includes(a)) score += 2;
  });
  
  // Goal alignment (basic: goal is substring of any candidate skill)
  if (user.goals) {
    const goalsLower = user.goals.toLowerCase();
    candidateSkills.forEach((skill: string) => {
      if (goalsLower.includes(skill)) score += 2;
    });
  }
  
  // Bonus for having any skills/interests in common
  if (userSkills.length > 0 && candidateSkills.length > 0) {
    const commonSkills = userSkills.filter((skill: string) => candidateSkills.includes(skill));
    if (commonSkills.length > 0) score += 1;
  }
  
  if (userInterests.length > 0 && candidateInterests.length > 0) {
    const commonInterests = userInterests.filter((interest: string) => candidateInterests.includes(interest));
    if (commonInterests.length > 0) score += 1;
  }
  
  // Minimum score for any valid candidate
  if (score === 0) score = 1;
  
  return score;
}

export async function POST(request: NextRequest) {
  try {
    const { userProfile } = await request.json();
    
    if (!userProfile) {
      return NextResponse.json({ error: 'Missing userProfile in body' }, { status: 400 });
    }

    console.log('Received match request for user:', userProfile?.uid);
    console.log('User role:', userProfile?.role);

    // Check if Firebase is properly initialized
    if (!db) {
      // Return mock data for development
      const mockMatches = [
        {
          id: 'mock-1',
          name: 'John Doe',
          role: userProfile.role === 'student' ? 'mentor' : 'student',
          skills: ['javascript', 'react', 'web development'],
          interests: ['coding', 'technology'],
          availability: ['weekdays', 'evenings'],
          matchScore: 8
        },
        {
          id: 'mock-2',
          name: 'Jane Smith',
          role: userProfile.role === 'student' ? 'mentor' : 'student',
          skills: ['python', 'data science'],
          interests: ['machine learning', 'analytics'],
          availability: ['weekends'],
          matchScore: 6
        }
      ];

      return NextResponse.json({
        success: true,
        matches: mockMatches,
        totalCandidates: mockMatches.length,
        message: 'Using mock data - Firebase not configured'
      });
    }

    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    const allUsers = usersSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    // Filter candidates based on role
    const candidates = allUsers.filter((user: any) => {
      if (userProfile.uid === user.id) return false; // Exclude self
      if (userProfile.role === 'student') {
        return user.role === 'mentor';
      } else if (userProfile.role === 'mentor') {
        return user.role === 'student';
      }
      return user.role === userProfile.role; // Same role matching
    });

    // Calculate match scores
    const scoredCandidates = candidates.map((candidate: any) => ({
      ...candidate,
      matchScore: matchScore(userProfile, candidate)
    }));

    // Sort by match score (highest first)
    const sortedCandidates = scoredCandidates.sort((a: any, b: any) => b.matchScore - a.matchScore);

    // Return top matches
    const topMatches = sortedCandidates.slice(0, 10);

    return NextResponse.json({
      success: true,
      matches: topMatches,
      totalCandidates: candidates.length
    });

  } catch (error) {
    console.error('Match API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'PeerUp backend is running!', 
    timestamp: new Date().toISOString() 
  });
} 