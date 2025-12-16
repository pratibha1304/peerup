"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AddNamesPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runMigration = async () => {
    setLoading(true);
    setResults([]);
    setError(null);
    
    try {
      addLog('Starting migration...');
      
      const response = await fetch('/api/admin/add-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Migration failed');
      }
      
      const data = await response.json();
      addLog(`✅ Migration completed successfully!`);
      addLog(`Match Requests: ${data.matchRequests?.updated || 0} updated`);
      addLog(`Call Rooms: ${data.callRooms?.updated || 0} updated`);
      addLog(`Call Logs: ${data.callLogs?.updated || 0} updated`);
      addLog(`Matches: ${data.matches?.updated || 0} updated`);
      addLog(`Chats: ${data.chats?.updated || 0} updated`);
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

