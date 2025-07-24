import clientPromise from '../../lib/firebase';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { username, interests, skills, goals, availability } = req.body;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const user = await db.collection('users').findOneAndUpdate(
      { username },
      { $set: { interests, skills, goals, availability } },
      { returnDocument: 'after' }
    );

    res.status(200).json({ message: 'Profile updated', user: user.value });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
