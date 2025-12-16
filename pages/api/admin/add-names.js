const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

async function getUserName(userId) {
  try {
    const userDoc = await db.collection('users').where('uid', '==', userId).limit(1).get();
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      return userData.name || userData.displayName || 'Unknown User';
    }
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
  }
  return 'Unknown User';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = {
      matchRequests: { updated: 0, skipped: 0 },
      callRooms: { updated: 0, skipped: 0 },
      callLogs: { updated: 0, skipped: 0 },
      matches: { updated: 0, skipped: 0 },
      chats: { updated: 0, skipped: 0 },
    };

    // Update matchRequests
    const matchRequestsSnapshot = await db.collection('matchRequests').get();
    for (const docSnap of matchRequestsSnapshot.docs) {
      const data = docSnap.data();
      if (!data.requesterName || !data.receiverName) {
        const requesterName = await getUserName(data.requesterId);
        const receiverName = await getUserName(data.receiverId);
        await docSnap.ref.update({ requesterName, receiverName });
        results.matchRequests.updated++;
      } else {
        results.matchRequests.skipped++;
      }
    }

    // Update callRooms
    const callRoomsSnapshot = await db.collection('callRooms').get();
    for (const docSnap of callRoomsSnapshot.docs) {
      const data = docSnap.data();
      if ((!data.callerName || !data.calleeName) && data.callerId && data.calleeId) {
        const callerName = await getUserName(data.callerId);
        const calleeName = await getUserName(data.calleeId);
        await docSnap.ref.update({ callerName, calleeName });
        results.callRooms.updated++;
      } else {
        results.callRooms.skipped++;
      }
    }

    // Update callLogs
    const callLogsSnapshot = await db.collection('callLogs').get();
    for (const docSnap of callLogsSnapshot.docs) {
      const data = docSnap.data();
      if ((!data.callerName || !data.calleeName) && data.callerId && data.calleeId) {
        const callerName = await getUserName(data.callerId);
        const calleeName = await getUserName(data.calleeId);
        await docSnap.ref.update({ callerName, calleeName });
        results.callLogs.updated++;
      } else {
        results.callLogs.skipped++;
      }
    }

    // Update matches
    const matchesSnapshot = await db.collection('matches').get();
    for (const docSnap of matchesSnapshot.docs) {
      const data = docSnap.data();
      if ((!data.participantNames || data.participantNames.length !== data.participants?.length) && data.participants?.length > 0) {
        const participantNames = await Promise.all(
          data.participants.map(uid => getUserName(uid))
        );
        await docSnap.ref.update({ participantNames });
        results.matches.updated++;
      } else {
        results.matches.skipped++;
      }
    }

    // Update chats
    const chatsSnapshot = await db.collection('chats').get();
    for (const docSnap of chatsSnapshot.docs) {
      const data = docSnap.data();
      if ((!data.participantNames || data.participantNames.length !== data.participants?.length) && data.participants?.length > 0) {
        const participantNames = await Promise.all(
          data.participants.map(uid => getUserName(uid))
        );
        await docSnap.ref.update({ participantNames });
        results.chats.updated++;
      } else {
        results.chats.skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message || 'Migration failed' });
  }
}

