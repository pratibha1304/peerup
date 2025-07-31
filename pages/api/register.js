import bcrypt from 'bcrypt';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password, interests, skills, goals, availability } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if username already exists
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return res.status(409).json({ message: 'Username already exists.' });
  }

  // Add new user to Firestore
  const docRef = await addDoc(usersRef, {
    username,
    password: hashedPassword,
    interests: interests || [],
    skills: skills || [],
    goals: goals || '',
    availability: availability || ''
  });

  return res.status(201).json({ message: 'User created', userId: docRef.id });
}
