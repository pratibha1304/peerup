import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import Fuse from 'fuse.js';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const masterSkills = [
  'graphic design', 'web development', 'ui/ux', 'content writing',
  'marketing', 'python', 'java', 'javascript', 'freelancing',
  // ...extend with other popular skills
];
const fuse = new Fuse(masterSkills, { threshold: 0.3 });

function normalizeSkill(input) {
  if (!input) return "";
  input = input.trim().toLowerCase();
  const result = fuse.search(input);
  return result.length ? result[0].item : input;
}

function matchScore(user, candidate) {
  let score = 0;
  // Skills (fuzzy normalized)
  const userSkills = (user.skills || []).map(normalizeSkill);
  const candidateSkills = (candidate.skills || []).map(normalizeSkill);
  userSkills.forEach(skill => {
    if (candidateSkills.includes(skill)) score += 3;
  });
  // Interests
  const userInterests = (user.interests || []).map(s => s.toLowerCase());
  const candidateInterests = (candidate.interests || []).map(s => s.toLowerCase());
  userInterests.forEach(interest => {
    if (candidateInterests.includes(interest)) score += 2;
  });
  // Availability
  const userAvail = (user.availability || []).map(a => a.toLowerCase());
  const candidateAvail = (candidate.availability || []).map(a => a.toLowerCase());
  userAvail.forEach(a => {
    if (candidateAvail.includes(a)) score += 2;
  });
  // Goal alignment
  if (user.goals) {
    const goalsLower = user.goals.toLowerCase();
    candidateSkills.forEach(skill => {
      if (goalsLower.includes(skill)) score += 2;
    });
  }
  return score;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userProfile } = req.body;
  if (!userProfile) {
    return res.status(400).json({ error: 'Missing userProfile in body' });
  }
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const allUsers = usersSnap.docs.map(doc => doc.data());
    // Filter out self and same role (customize as needed)
    const candidates = allUsers.filter(
      u => u.uid !== userProfile.uid && u.role !== userProfile.role
    );
    // Score and sort
    const scored = candidates
      .map(candidate => ({ user: candidate, score: matchScore(userProfile, candidate) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 matches
    res.status(200).json({ matches: scored });
  } catch (e) {
    console.error('Error in /api/match/buddy:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
} 