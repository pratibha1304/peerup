import { findBuddyMatches, findMentorMatches, findMenteeMatches } from '../../../lib/matching-engine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userProfile, matchType } = req.body;

  if (!userProfile) {
    return res.status(400).json({ error: 'Missing userProfile in request body' });
  }

  try {
    let matches;
    
    switch (matchType) {
      case 'buddy':
        matches = await findBuddyMatches(userProfile);
        break;
      case 'mentor':
        matches = await findMentorMatches(userProfile);
        break;
      case 'mentee':
        matches = await findMenteeMatches(userProfile);
        break;
      default:
        // Auto-detect based on user role
        if (userProfile.role === 'buddy') {
          matches = await findBuddyMatches(userProfile);
        } else if (userProfile.role === 'mentor') {
          matches = await findMenteeMatches(userProfile);
        } else if (userProfile.role === 'mentee') {
          matches = await findMentorMatches(userProfile);
        } else {
          return res.status(400).json({ error: 'Invalid user role or match type' });
        }
    }

    res.status(200).json({ 
      matches,
      totalMatches: matches.length,
      matchType: matchType || 'auto'
    });

  } catch (error) {
    console.error('Error in matching API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
