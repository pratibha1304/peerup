import clientPromise from '../../lib/mongodb';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password, interests, skills, goals, availability } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  // Ensure username is unique
  const existingUser = await db.collection('users').findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: 'Username already exists.' });
  }

  const result = await db.collection('users').insertOne({
    username,
    password: hashedPassword,
    interests: interests || [],
    skills: skills || [],
    goals: goals || '',
    availability: availability || ''
  });

  return res.status(201).json({ message: 'User created', userId: result.insertedId });
}
