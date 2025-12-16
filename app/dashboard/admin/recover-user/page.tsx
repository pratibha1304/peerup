"use client";

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RecoveredData {
  uid: string;
  email: string;
  name: string;
  role: 'mentor' | 'buddy' | 'mentee';
  foundInMatches: boolean;
  foundInChats: boolean;
  foundInCallLogs: boolean;
  foundInMatchRequests: boolean;
  foundInScheduleRequests: boolean;
  matchCount: number;
  chatCount: number;
  callLogCount: number;
  matchRequestCount: number;
  scheduleRequestCount: number;
}

export default function RecoverUserPage() {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveredData, setRecoveredData] = useState<RecoveredData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchUser = async () => {
    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setRecoveredData(null);

    try {
      const recovered: Partial<RecoveredData> = {
        uid: userId,
        email: userEmail || 'unknown@example.com',
        name: 'Recovered User',
        role: 'buddy',
        foundInMatches: false,
        foundInChats: false,
        foundInCallLogs: false,
        foundInMatchRequests: false,
        foundInScheduleRequests: false,
        matchCount: 0,
        chatCount: 0,
        callLogCount: 0,
        matchRequestCount: 0,
        scheduleRequestCount: 0,
      };

      // Check matches
      const matchesRef = collection(db, 'matches');
      const matchesQuery = query(matchesRef, where('participants', 'array-contains', userId));
      const matchesSnapshot = await getDocs(matchesQuery);
      if (!matchesSnapshot.empty) {
        recovered.foundInMatches = true;
        recovered.matchCount = matchesSnapshot.size;
      }

      // Check chats
      const chatsRef = collection(db, 'chats');
      const chatsQuery = query(chatsRef, where('participants', 'array-contains', userId));
      const chatsSnapshot = await getDocs(chatsQuery);
      if (!chatsSnapshot.empty) {
        recovered.foundInChats = true;
        recovered.chatCount = chatsSnapshot.size;
      }

      // Check callLogs
      const callLogsRef = collection(db, 'callLogs');
      const callLogsQuery = query(callLogsRef, where('participants', 'array-contains', userId));
      const callLogsSnapshot = await getDocs(callLogsQuery);
      if (!callLogsSnapshot.empty) {
        recovered.foundInCallLogs = true;
        recovered.callLogCount = callLogsSnapshot.size;
      }

      // Check matchRequests (requester)
      const matchRequestsRef = collection(db, 'matchRequests');
      const requesterQuery = query(matchRequestsRef, where('requesterId', '==', userId));
      const requesterSnapshot = await getDocs(requesterQuery);
      const receiverQuery = query(matchRequestsRef, where('receiverId', '==', userId));
      const receiverSnapshot = await getDocs(receiverQuery);
      const totalMatchRequests = requesterSnapshot.size + receiverSnapshot.size;
      if (totalMatchRequests > 0) {
        recovered.foundInMatchRequests = true;
        recovered.matchRequestCount = totalMatchRequests;
      }

      // Check scheduleRequests
      const scheduleRequestsRef = collection(db, 'scheduleRequests');
      const scheduleRequesterQuery = query(scheduleRequestsRef, where('requesterId', '==', userId));
      const scheduleRequesterSnapshot = await getDocs(scheduleRequesterQuery);
      const scheduleReceiverQuery = query(scheduleRequestsRef, where('receiverId', '==', userId));
      const scheduleReceiverSnapshot = await getDocs(scheduleReceiverQuery);
      const totalScheduleRequests = scheduleRequesterSnapshot.size + scheduleReceiverSnapshot.size;
      if (totalScheduleRequests > 0) {
        recovered.foundInScheduleRequests = true;
        recovered.scheduleRequestCount = totalScheduleRequests;
      }

      setRecoveredData(recovered as RecoveredData);
    } catch (err: any) {
      setError(err.message || 'Failed to search for user');
    } finally {
      setLoading(false);
    }
  };

  const recreateUserDocument = async () => {
    if (!recoveredData) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userDocument = {
        uid: recoveredData.uid,
        email: recoveredData.email,
        name: recoveredData.name,
        role: recoveredData.role,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        // Note: Other fields (skills, interests, etc.) will need to be added manually
      };

      await setDoc(doc(db, 'users', recoveredData.uid), userDocument);
      setSuccess(`✅ User document recreated successfully! The user will need to update their profile (skills, interests, etc.) manually.`);
    } catch (err: any) {
      setError(err.message || 'Failed to recreate user document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Recover Deleted User</CardTitle>
          <CardDescription>
            This tool helps recover a deleted user document by finding references in other collections.
            Note: Only basic information can be recovered. The user will need to update their profile manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User ID (UID)</label>
            <Input
              placeholder="Enter the user's Firebase UID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">User Email (Optional)</label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>

          <Button onClick={searchUser} disabled={loading}>
            {loading ? 'Searching...' : 'Search for User References'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {recoveredData && (
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recovery Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">User ID:</span> {recoveredData.uid}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {recoveredData.email}
                    </div>
                    <div>
                      <span className="font-medium">Name:</span> {recoveredData.name}
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> {recoveredData.role}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Found in Collections:</h4>
                    <ul className="space-y-1 text-sm">
                      {recoveredData.foundInMatches && (
                        <li>✓ Matches: {recoveredData.matchCount} match(es)</li>
                      )}
                      {recoveredData.foundInChats && (
                        <li>✓ Chats: {recoveredData.chatCount} chat(s)</li>
                      )}
                      {recoveredData.foundInCallLogs && (
                        <li>✓ Call Logs: {recoveredData.callLogCount} call(s)</li>
                      )}
                      {recoveredData.foundInMatchRequests && (
                        <li>✓ Match Requests: {recoveredData.matchRequestCount} request(s)</li>
                      )}
                      {recoveredData.foundInScheduleRequests && (
                        <li>✓ Schedule Requests: {recoveredData.scheduleRequestCount} request(s)</li>
                      )}
                      {!recoveredData.foundInMatches && 
                       !recoveredData.foundInChats && 
                       !recoveredData.foundInCallLogs && 
                       !recoveredData.foundInMatchRequests && 
                       !recoveredData.foundInScheduleRequests && (
                        <li className="text-yellow-600">⚠ No references found in any collection</li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <Button onClick={recreateUserDocument} disabled={loading}>
                      {loading ? 'Recreating...' : 'Recreate User Document'}
                    </Button>
                  </div>

                  <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-yellow-800">
                      <strong>Note:</strong> Only basic information (UID, email, name, role) can be automatically recovered.
                      The user will need to manually update their profile with skills, interests, goals, and other details.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

