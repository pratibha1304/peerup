"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { PhoneMissed, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CallLog {
  id: string;
  callerId: string;
  calleeId: string;
  participants: string[];
  status: 'missed' | 'completed';
  createdAt: any;
  endedBy?: string;
}

export default function CallsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch missed calls from callLogs
    const callLogsRef = collection(db, 'callLogs');
    const q = query(
      callLogsRef,
      where('participants', 'array-contains', user.uid),
      where('status', '==', 'missed'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<CallLog, 'id'>),
        }));
        setCallLogs(logs);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching call logs:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Load user names
  useEffect(() => {
    const loadUserNames = async () => {
      const userIds = new Set<string>();
      callLogs.forEach((log) => {
        log.participants.forEach((uid) => {
          if (uid !== user?.uid) userIds.add(uid);
        });
      });

      if (userIds.size === 0) return;

      const entries: [string, string][] = [];
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          if (userNames[uid]) return;
          try {
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) {
              const d = snap.data() as any;
              entries.push([uid, d.name || d.displayName || 'Unknown User']);
            } else {
              entries.push([uid, 'Unknown User']);
            }
          } catch (e) {
            entries.push([uid, 'Unknown User']);
          }
        })
      );
      setUserNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };

    if (callLogs.length > 0) {
      loadUserNames();
    }
  }, [callLogs, user, userNames]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown time';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">Please sign in to view call logs.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <PhoneMissed className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl md:text-3xl font-bold">Missed Calls</h1>
        </div>
        <p className="text-gray-600 mt-2">View your missed call history</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading call logs...</div>
        </div>
      ) : callLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center">
          <PhoneMissed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Missed Calls</h3>
          <p className="text-gray-600">You're all caught up! No missed calls.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="divide-y">
            {callLogs.map((log) => {
              const otherUserId = log.participants.find((uid) => uid !== user.uid);
              const otherUserName = otherUserId ? (userNames[otherUserId] || 'Loading...') : 'Unknown';
              const isCaller = log.callerId === user.uid;
              
              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <PhoneMissed className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-gray-900">
                          {isCaller ? `You called ${otherUserName}` : `${otherUserName} called you`}
                        </div>
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {formatTime(log.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Missed call
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/chats?u=${otherUserId}`)}
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

