"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';

type Match = {
  id: string;
  participants: string[];
  matchType?: 'buddy' | 'mentor';
  menteeId?: string | null;
};

export default function GoalsPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!user) return;
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('participants', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Match[];
      setMatches(list);
    });
    return () => unsub();
  }, [user]);

  if (!user) return <div className="p-6">Please sign in.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Partnerships</h1>
      <p className="text-sm text-muted-foreground mb-4">Select a partnership to manage shared goals.</p>

      <div className="space-y-3">
        {matches.map((m) => (
          <Link key={m.id} href={`/dashboard/match/${m.id}/goals`} className="block rounded-xl border p-4 hover:bg-accent">
            <div className="font-medium">{m.id}</div>
            <div className="text-xs text-muted-foreground">Type: {m.matchType ?? 'unknown'}{m.matchType === 'mentor' && m.menteeId ? ` · mentee: ${m.menteeId}` : ''}</div>
          </Link>
        ))}
        {matches.length === 0 && (
          <div className="text-gray-500">No active partnerships found.</div>
        )}
      </div>
    </div>
  );
}


