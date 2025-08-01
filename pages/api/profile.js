import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { username, interests, skills, goals, availability } = req.body;

    // Find user by username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);

    // Update user profile
    await updateDoc(userRef, {
      interests,
      skills,
      goals,
      availability
    });

    // Return updated user
    const updatedUser = { ...userDoc.data(), interests, skills, goals, availability };
    res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
