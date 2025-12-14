import { sendEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data || !data.to || !data.toName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await sendEmail(type, data);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email API error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}

