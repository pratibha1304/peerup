const express = require('express');
const Fuse = require('fuse.js');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const cors = require('cors');
const serviceAccount = require('./peerup-64fbf-firebase-adminsdk-fbsvc-688bc91130.json');

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'peerup-64fbf',
});
const db = getFirestore();

const app = express();
app.use(express.json());
app.use(cors());

// Curated master skill list
const masterSkills = [
  'graphic design', 'web development', 'ui/ux', 'content writing',
  'marketing', 'python', 'java', 'javascript', 'freelancing',
  // ...extend with other popular skills
];

// Fuzzy matcher instance
const fuse = new Fuse(masterSkills, { threshold: 0.3 });

// Normalize a skill to your master list (handles typos, variants)
function normalizeSkill(input) {
  if (!input) return "";
  input = input.trim().toLowerCase();
  const result = fuse.search(input);
  return result.length ? result[0].item : input;
}

// Match-scoring algorithm
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
  
  // Goal alignment (basic: goal is substring of any candidate skill)
  if (user.goals) {
    const goalsLower = user.goals.toLowerCase();
    candidateSkills.forEach(skill => {
      if (goalsLower.includes(skill)) score += 2;
    });
  }
  
  // Bonus for having any skills/interests in common
  if (userSkills.length > 0 && candidateSkills.length > 0) {
    const commonSkills = userSkills.filter(skill => candidateSkills.includes(skill));
    if (commonSkills.length > 0) score += 1;
  }
  
  if (userInterests.length > 0 && candidateInterests.length > 0) {
    const commonInterests = userInterests.filter(interest => candidateInterests.includes(interest));
    if (commonInterests.length > 0) score += 1;
  }
  
  // Minimum score for any valid candidate
  if (score === 0) score = 1;
  
  return score;
}

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'PeerUp backend is running!', timestamp: new Date().toISOString() });
});

// Matching endpoint
app.post('/match', async (req, res) => {
  const { userProfile } = req.body;
  console.log('Received match request for user:', userProfile?.uid);
  console.log('User role:', userProfile?.role);
  
  if (!userProfile) {
    console.log('Error: Missing userProfile in body');
    return res.status(400).json({ error: 'Missing userProfile in body' });
  }
  
  try {
    const usersSnapshot = await db.collection('users').get();
    console.log('Total users in database:', usersSnapshot.size);
    
    if (usersSnapshot.empty) {
      console.log('No users found in database');
      return res.status(404).json({ error: 'No users found' });
    }
    
    const allUsers = usersSnapshot.docs.map(doc => doc.data());
    console.log('All users:', allUsers.map(u => ({ uid: u.uid, role: u.role, name: u.name, status: u.status })));
    
    // Filter out the current user and inactive users
    const availableUsers = allUsers.filter(u => 
      u.uid !== userProfile.uid && 
      u.status !== 'pending_review' && 
      u.role && 
      u.skills && 
      u.skills.length > 0
    );
    
    console.log('Available users (excluding current user and pending reviews):', availableUsers.length);
    
    // Matching logic: buddies to buddies, mentor to mentee and vice versa
    let candidates;
    if (userProfile.role === 'buddy') {
      candidates = availableUsers.filter(u => u.role === 'buddy');
      console.log('Looking for buddies. Found:', candidates.length);
    } else if (userProfile.role === 'mentor') {
      candidates = availableUsers.filter(u => u.role === 'mentee');
      console.log('Mentor looking for mentees. Found:', candidates.length);
    } else if (userProfile.role === 'mentee') {
      candidates = availableUsers.filter(u => u.role === 'mentor');
      console.log('Mentee looking for mentors. Found:', candidates.length);
    } else {
      // If role is not specified, show all available users
      candidates = availableUsers;
      console.log('No specific role, showing all available users. Found:', candidates.length);
    }
    
    // Fallback: if no role-specific matches, show all available users
    if (candidates.length === 0) {
      console.log('No role-specific matches found, showing all available users');
      candidates = availableUsers;
    }
    
    console.log('Candidates found:', candidates.length);
    console.log('User role:', userProfile.role);
    console.log('Candidates roles:', candidates.map(c => c.role));
    
    // Score and sort
    const scored = candidates
      .map(candidate => ({ user: candidate, score: matchScore(userProfile, candidate) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 matches instead of 5

    console.log('Final matches:', scored.length);
    console.log('Match scores:', scored.map(s => ({ name: s.user.name, score: s.score })));
    
    res.json({ matches: scored });
  } catch (e) {
    console.error('Error in /match:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('PeerUp matchmaker running on port 3000');
});