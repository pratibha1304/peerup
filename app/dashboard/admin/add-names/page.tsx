"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

export default function AddNamesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const getUserName = async (userId: string): Promise<string> => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return userData.name || userData.displayName || 'Unknown User';
      }
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
    }
    return 'Unknown User';
  };

  const runMigration = async () => {
    if (!user) {
      setError('Please sign in to run migration');
      return;
    }

    setLoading(true);
    setResults([]);
    setError(null);
    
    try {
      addLog('Starting migration...');
      const migrationResults = {
        matchRequests: { updated: 0, skipped: 0 },
        callRooms: { updated: 0, skipped: 0 },
        callLogs: { updated: 0, skipped: 0 },
        matches: { updated: 0, skipped: 0 },
        chats: { updated: 0, skipped: 0 },
      };

      // Update matchRequests
      addLog('Processing matchRequests...');
      const matchRequestsSnapshot = await getDocs(collection(db, 'matchRequests'));
      for (const docSnap of matchRequestsSnapshot.docs) {
        const data = docSnap.data();
        if (!data.requesterName || !data.receiverName) {
          const requesterName = await getUserName(data.requesterId);
          const receiverName = await getUserName(data.receiverId);
          await updateDoc(doc(db, 'matchRequests', docSnap.id), { requesterName, receiverName });
          migrationResults.matchRequests.updated++;
        } else {
          migrationResults.matchRequests.skipped++;
        }
      }
      addLog(`✅ Match Requests: ${migrationResults.matchRequests.updated} updated, ${migrationResults.matchRequests.skipped} skipped`);

      // Update callRooms
      addLog('Processing callRooms...');
      const callRoomsSnapshot = await getDocs(collection(db, 'callRooms'));
      for (const docSnap of callRoomsSnapshot.docs) {
        const data = docSnap.data();
        if ((!data.callerName || !data.calleeName) && data.callerId && data.calleeId) {
          const callerName = await getUserName(data.callerId);
          const calleeName = await getUserName(data.calleeId);
          await updateDoc(doc(db, 'callRooms', docSnap.id), { callerName, calleeName });
          migrationResults.callRooms.updated++;
        } else {
          migrationResults.callRooms.skipped++;
        }
      }
      addLog(`✅ Call Rooms: ${migrationResults.callRooms.updated} updated, ${migrationResults.callRooms.skipped} skipped`);

      // Update callLogs
      addLog('Processing callLogs...');
      const callLogsSnapshot = await getDocs(collection(db, 'callLogs'));
      for (const docSnap of callLogsSnapshot.docs) {
        const data = docSnap.data();
        if ((!data.callerName || !data.calleeName) && data.callerId && data.calleeId) {
          const callerName = await getUserName(data.callerId);
          const calleeName = await getUserName(data.calleeId);
          await updateDoc(doc(db, 'callLogs', docSnap.id), { callerName, calleeName });
          migrationResults.callLogs.updated++;
        } else {
          migrationResults.callLogs.skipped++;
        }
      }
      addLog(`✅ Call Logs: ${migrationResults.callLogs.updated} updated, ${migrationResults.callLogs.skipped} skipped`);

      // Update matches
      addLog('Processing matches...');
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      for (const docSnap of matchesSnapshot.docs) {
        const data = docSnap.data();
        if ((!data.participantNames || data.participantNames.length !== data.participants?.length) && data.participants?.length > 0) {
          const participantNames = await Promise.all(
            data.participants.map((uid: string) => getUserName(uid))
          );
          await updateDoc(doc(db, 'matches', docSnap.id), { participantNames });
          migrationResults.matches.updated++;
        } else {
          migrationResults.matches.skipped++;
        }
      }
      addLog(`✅ Matches: ${migrationResults.matches.updated} updated, ${migrationResults.matches.skipped} skipped`);

      // Update chats
      addLog('Processing chats...');
      const chatsSnapshot = await getDocs(collection(db, 'chats'));
      for (const docSnap of chatsSnapshot.docs) {
        const data = docSnap.data();
        if ((!data.participantNames || data.participantNames.length !== data.participants?.length) && data.participants?.length > 0) {
          const participantNames = await Promise.all(
            data.participants.map((uid: string) => getUserName(uid))
          );
          await updateDoc(doc(db, 'chats', docSnap.id), { participantNames });
          migrationResults.chats.updated++;
        } else {
          migrationResults.chats.skipped++;
        }
      }
      addLog(`✅ Chats: ${migrationResults.chats.updated} updated, ${migrationResults.chats.skipped} skipped`);

      addLog('✅ Migration completed successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to run migration');
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add User Names to Documents</CardTitle>
          <CardDescription>
            This tool will update existing documents in your Firestore database to include user names alongside user IDs.
            This makes it easier to track users in the Firebase Console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Warning:</strong> This will update all documents in the following collections:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-yellow-700">
              <li>matchRequests (adds requesterName, receiverName)</li>
              <li>callRooms (adds callerName, calleeName)</li>
              <li>callLogs (adds callerName, calleeName)</li>
              <li>matches (adds participantNames array)</li>
              <li>chats (adds participantNames array)</li>
            </ul>
          </div>

          <Button 
            onClick={runMigration} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Running Migration...' : 'Run Migration'}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Migration Log:</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {results.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

