"use client";
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase.js';

// Skill normalization for better matching
const skillAliases = {
  'javascript': ['js', 'nodejs', 'node.js', 'react', 'vue', 'angular'],
  'python': ['py', 'django', 'flask', 'fastapi'],
  'java': ['spring', 'springboot'],
  'react': ['reactjs', 'react.js', 'frontend'],
  'nodejs': ['node.js', 'node', 'backend'],
  'machine learning': ['ml', 'ai', 'artificial intelligence', 'deep learning'],
  'data science': ['data analysis', 'analytics', 'statistics'],
  'web development': ['web dev', 'frontend', 'backend', 'fullstack'],
  'mobile development': ['mobile dev', 'ios', 'android', 'react native'],
  'ui/ux': ['design', 'user interface', 'user experience', 'figma'],
  'devops': ['deployment', 'aws', 'docker', 'kubernetes'],
  'cybersecurity': ['security', 'penetration testing', 'ethical hacking'],
};

// Interest normalization
const interestAliases = {
  'web development': ['web dev', 'frontend', 'backend', 'fullstack'],
  'mobile development': ['mobile dev', 'ios', 'android'],
  'data science': ['data analysis', 'analytics', 'big data'],
  'machine learning': ['ml', 'ai', 'artificial intelligence'],
  'startups': ['entrepreneurship', 'business', 'innovation'],
  'open source': ['github', 'contributing', 'community'],
  'design': ['ui/ux', 'graphic design', 'visual design'],
  'gaming': ['game development', 'game design', 'esports'],
  'blockchain': ['crypto', 'cryptocurrency', 'web3'],
  'cloud computing': ['aws', 'azure', 'google cloud', 'devops'],
};

function normalizeSkill(skill) {
  const lowerSkill = skill.toLowerCase().trim();
  
  // Direct match
  if (skillAliases[lowerSkill]) {
    return lowerSkill;
  }
  
  // Check aliases
  for (const [mainSkill, aliases] of Object.entries(skillAliases)) {
    if (aliases.includes(lowerSkill)) {
      return mainSkill;
    }
  }
  
  return lowerSkill;
}

function normalizeInterest(interest) {
  const lowerInterest = interest.toLowerCase().trim();
  
  // Direct match
  if (interestAliases[lowerInterest]) {
    return lowerInterest;
  }
  
  // Check aliases
  for (const [mainInterest, aliases] of Object.entries(interestAliases)) {
    if (aliases.includes(lowerInterest)) {
      return mainInterest;
    }
  }
  
  return lowerInterest;
}

function calculateSkillCompatibility(userSkills, candidateSkills) {
  if (!userSkills.length || !candidateSkills.length) return 0;
  
  const normalizedUserSkills = userSkills.map(normalizeSkill);
  const normalizedCandidateSkills = candidateSkills.map(normalizeSkill);
  
  const commonSkills = normalizedUserSkills.filter(skill => 
    normalizedCandidateSkills.includes(skill)
  );
  
  // Calculate Jaccard similarity
  const union = new Set([...normalizedUserSkills, ...normalizedCandidateSkills]);
  return (commonSkills.length / union.size) * 100;
}

function calculateInterestCompatibility(userInterests, candidateInterests) {
  if (!userInterests.length || !candidateInterests.length) return 0;
  
  const normalizedUserInterests = userInterests.map(normalizeInterest);
  const normalizedCandidateInterests = candidateInterests.map(normalizeInterest);
  
  const commonInterests = normalizedUserInterests.filter(interest => 
    normalizedCandidateInterests.includes(interest)
  );
  
  const union = new Set([...normalizedUserInterests, ...normalizedCandidateInterests]);
  return (commonInterests.length / union.size) * 100;
}

function calculateGoalCompatibility(userGoals, candidateGoals) {
  if (!userGoals || !candidateGoals) return 0;
  
  const userWords = userGoals.toLowerCase().split(/\s+/);
  const candidateWords = candidateGoals.toLowerCase().split(/\s+/);
  
  const commonWords = userWords.filter(word => 
    word.length > 3 && candidateWords.includes(word)
  );
  
  const totalWords = new Set([...userWords, ...candidateWords]).size;
  return (commonWords.length / totalWords) * 100;
}

function calculateAvailabilityCompatibility(userAvailability, candidateAvailability) {
  if (!userAvailability.length || !candidateAvailability.length) return 0;
  
  const userDays = userAvailability.map(day => day.toLowerCase());
  const candidateDays = candidateAvailability.map(day => day.toLowerCase());
  
  const commonDays = userDays.filter(day => candidateDays.includes(day));
  return (commonDays.length / Math.max(userDays.length, candidateDays.length)) * 100;
}

function calculateLocationCompatibility(userLocation, candidateLocation) {
  if (!userLocation || !candidateLocation) return 50; // Neutral score if no location
  
  const userCity = userLocation.toLowerCase().split(',')[0].trim();
  const candidateCity = candidateLocation.toLowerCase().split(',')[0].trim();
  
  if (userCity === candidateCity) return 100;
  
  // Same country bonus
  const userCountry = userLocation.toLowerCase().split(',').pop()?.trim();
  const candidateCountry = candidateLocation.toLowerCase().split(',').pop()?.trim();
  
  if (userCountry === candidateCountry) return 75;
  
  return 25; // Different countries
}

function generateMatchReasons(user, candidate, compatibility) {
  const reasons = [];
  
  if (compatibility.skills > 60) {
    const commonSkills = user.skills?.filter(skill => 
      candidate.skills?.includes(skill)
    ) || [];
    if (commonSkills.length > 0) {
      reasons.push(`Shared skills: ${commonSkills.join(', ')}`);
    }
  }
  
  if (compatibility.interests > 60) {
    const commonInterests = user.interests?.filter(interest => 
      candidate.interests?.includes(interest)
    ) || [];
    if (commonInterests.length > 0) {
      reasons.push(`Common interests: ${commonInterests.join(', ')}`);
    }
  }
  
  if (compatibility.availability > 70) {
    const commonDays = user.availability?.filter(day => 
      candidate.availability?.includes(day)
    ) || [];
    if (commonDays.length > 0) {
      reasons.push(`Available on: ${commonDays.join(', ')}`);
    }
  }
  
  if (compatibility.location > 75) {
    reasons.push(`Same location: ${candidate.location}`);
  }
  
  if (compatibility.goals > 50) {
    reasons.push('Similar goals and aspirations');
  }
  
  // Role-specific reasons
  if (user.role === 'buddy' && candidate.role === 'buddy') {
    reasons.push('Perfect study buddy match!');
  } else if (user.role === 'mentee' && candidate.role === 'mentor') {
    reasons.push('Experienced mentor in your field');
  } else if (user.role === 'mentor' && candidate.role === 'mentee') {
    reasons.push('Eager mentee ready to learn');
  }
  
  return reasons;
}

export async function findBuddyMatches(user) {
  try {
    // Get all active buddy users
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'buddy'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Get existing matches to filter out already matched buddies
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('participants', 'array-contains', user.uid));
    const matchesSnapshot = await getDocs(matchesQuery);
    const existingMatchIds = new Set();
    matchesSnapshot.docs.forEach(doc => {
      const matchData = doc.data();
      if (matchData.matchType === 'buddy' && matchData.participants) {
        matchData.participants.forEach(uid => {
          if (uid !== user.uid) {
            existingMatchIds.add(uid);
          }
        });
      }
    });
    
    // Get pending/accepted match requests
    const matchRequestsRef = collection(db, 'matchRequests');
    const outgoingRequestsQuery = query(matchRequestsRef, where('requesterId', '==', user.uid));
    const incomingRequestsQuery = query(matchRequestsRef, where('receiverId', '==', user.uid));
    const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
      getDocs(outgoingRequestsQuery),
      getDocs(incomingRequestsQuery)
    ]);
    
    const pendingUserIds = new Set();
    [...outgoingSnapshot.docs, ...incomingSnapshot.docs].forEach(doc => {
      const requestData = doc.data();
      if (requestData.status === 'pending' || requestData.status === 'accepted') {
        if (requestData.requesterId === user.uid) {
          pendingUserIds.add(requestData.receiverId);
        } else {
          pendingUserIds.add(requestData.requesterId);
        }
      }
    });
    
    const candidates = querySnapshot.docs
      .map(doc => doc.data())
      .filter(c => {
        // Filter out self, already matched buddies, and pending requests
        return c?.uid !== user.uid && 
               !existingMatchIds.has(c.uid) && 
               !pendingUserIds.has(c.uid);
      });
    
    if (candidates.length === 0) {
      return [];
    }
    
    const matches = [];
    
    for (const candidate of candidates) {
      const compatibility = {
        skills: calculateSkillCompatibility(user.skills || [], candidate.skills || []),
        interests: calculateInterestCompatibility(user.interests || [], candidate.interests || []),
        goals: calculateGoalCompatibility(user.goals || '', candidate.goals || ''),
        availability: calculateAvailabilityCompatibility(user.availability || [], candidate.availability || []),
        location: calculateLocationCompatibility(user.location || '', candidate.location || ''),
      };
      
      // Calculate weighted score for buddy matching
      const score = (
        compatibility.skills * 0.3 +
        compatibility.interests * 0.25 +
        compatibility.goals * 0.2 +
        compatibility.availability * 0.15 +
        compatibility.location * 0.1
      );
      
      if (score >= 30) { // Minimum threshold
        const reasons = generateMatchReasons(user, candidate, compatibility);
        matches.push({
          user: candidate,
          score: Math.round(score),
          reasons,
          compatibility
        });
      }
    }
    
    // Sort by score and return top 20 matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
      
  } catch (error) {
    console.error('Error finding buddy matches:', error);
    throw new Error('Failed to find buddy matches');
  }
}

export async function findMentorMatches(user) {
  try {
    // Get all active mentor users
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'mentor'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const candidates = querySnapshot.docs
      .map(doc => doc.data())
      .filter(c => c?.uid !== user.uid);
    
    if (candidates.length === 0) {
      return [];
    }
    
    const matches = [];
    
    for (const candidate of candidates) {
      const compatibility = {
        skills: calculateSkillCompatibility(user.skills || [], candidate.skills || []),
        interests: calculateInterestCompatibility(user.interests || [], candidate.interests || []),
        goals: calculateGoalCompatibility(user.goals || '', candidate.goals || ''),
        availability: calculateAvailabilityCompatibility(user.availability || [], candidate.availability || []),
        location: calculateLocationCompatibility(user.location || '', candidate.location || ''),
      };
      
      // Calculate weighted score for mentor matching (skills weighted higher)
      const score = (
        compatibility.skills * 0.4 +
        compatibility.interests * 0.2 +
        compatibility.goals * 0.25 +
        compatibility.availability * 0.1 +
        compatibility.location * 0.05
      );
      
      if (score >= 25) { // Lower threshold for mentors
        const reasons = generateMatchReasons(user, candidate, compatibility);
        matches.push({
          user: candidate,
          score: Math.round(score),
          reasons,
          compatibility
        });
      }
    }
    
    // Sort by score and return top 15 matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
      
  } catch (error) {
    console.error('Error finding mentor matches:', error);
    throw new Error('Failed to find mentor matches');
  }
}

export async function findMenteeMatches(user) {
  try {
    // Get all active mentee users
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'mentee'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const candidates = querySnapshot.docs
      .map(doc => doc.data())
      .filter(c => c?.uid !== user.uid);
    
    if (candidates.length === 0) {
      return [];
    }
    
    const matches = [];
    
    for (const candidate of candidates) {
      const compatibility = {
        skills: calculateSkillCompatibility(user.skills || [], candidate.skills || []),
        interests: calculateInterestCompatibility(user.interests || [], candidate.interests || []),
        goals: calculateGoalCompatibility(user.goals || '', candidate.goals || ''),
        availability: calculateAvailabilityCompatibility(user.availability || [], candidate.availability || []),
        location: calculateLocationCompatibility(user.location || '', candidate.location || ''),
      };
      
      // Calculate weighted score for mentee matching
      const score = (
        compatibility.skills * 0.35 +
        compatibility.interests * 0.2 +
        compatibility.goals * 0.3 +
        compatibility.availability * 0.1 +
        compatibility.location * 0.05
      );
      
      if (score >= 25) {
        const reasons = generateMatchReasons(user, candidate, compatibility);
        matches.push({
          user: candidate,
          score: Math.round(score),
          reasons,
          compatibility
        });
      }
    }
    
    // Sort by score and return top 15 matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
      
  } catch (error) {
    console.error('Error finding mentee matches:', error);
    throw new Error('Failed to find mentee matches');
  }
}

