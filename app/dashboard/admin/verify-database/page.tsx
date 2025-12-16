"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CollectionInfo {
  name: string;
  exists: boolean;
  documentCount: number;
  description: string;
}

const REQUIRED_COLLECTIONS = [
  {
    name: 'users',
    description: 'User profiles - Created when users sign up',
  },
  {
    name: 'chats',
    description: 'Chat conversations - Created when users send messages',
  },
  {
    name: 'callRooms',
    description: 'Active call rooms - Created when users initiate calls',
  },
  {
    name: 'scheduleRequests',
    description: 'Schedule requests - Created when users propose meeting times',
  },
  {
    name: 'matches',
    description: 'Matches between users - Created when match requests are accepted',
  },
  {
    name: 'callLogs',
    description: 'Call history - Created when calls end',
  },
  {
    name: 'matchRequests',
    description: 'Match requests - Created when users send match requests',
  },
  {
    name: 'feedback',
    description: 'User feedback - Created when users submit feedback',
  },
];

export default function VerifyDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CollectionInfo[]>([]);
  const [error, setError] = useState('');

  const verifyDatabase = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const collectionResults: CollectionInfo[] = [];

      for (const collectionInfo of REQUIRED_COLLECTIONS) {
        try {
          const collectionRef = collection(db, collectionInfo.name);
          const snapshot = await getDocs(query(collectionRef, limit(1)));
          
          collectionResults.push({
            name: collectionInfo.name,
            exists: true,
            documentCount: snapshot.size,
            description: collectionInfo.description,
          });
        } catch (err: any) {
          // Collection might not exist yet (that's okay - they're created on first use)
          collectionResults.push({
            name: collectionInfo.name,
            exists: false,
            documentCount: 0,
            description: collectionInfo.description,
          });
        }
      }

      setResults(collectionResults);
    } catch (err: any) {
      setError(err.message || 'Failed to verify database structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyDatabase();
  }, []);

  const allExist = results.length > 0 && results.every(r => r.exists);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Verify Database Structure</CardTitle>
          <CardDescription>
            Check if all required Firestore collections are properly set up.
            Collections are created automatically when first used, so empty collections are normal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={verifyDatabase} disabled={loading}>
            {loading ? 'Verifying...' : 'Refresh Status'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {results.map((result) => (
                  <Card key={result.name} className={result.exists ? 'border-green-200' : 'border-yellow-200'}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {result.exists ? '✅' : '⚠️'}
                            </span>
                            <h3 className="font-semibold text-lg">{result.name}</h3>
                            {result.exists && (
                              <span className="text-sm text-muted-foreground">
                                ({result.documentCount} document{result.documentCount !== 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{result.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {allExist ? (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    ✅ All collections are accessible! Your database structure is set up correctly.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800">
                    ⚠️ Some collections don't exist yet. This is normal - collections are created automatically when first used.
                    Try creating a test user or sending a message to create them.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Deploy Firestore rules: <code className="bg-muted px-1 rounded">firebase deploy --only firestore:rules</code></li>
                    <li>Deploy Firestore indexes: <code className="bg-muted px-1 rounded">firebase deploy --only firestore:indexes</code></li>
                    <li>Create a test user account</li>
                    <li>Verify collections appear in Firebase Console</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

