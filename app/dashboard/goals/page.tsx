"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { doc, getDoc } from 'firebase/firestore';
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
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const loadNames = async () => {
      const toFetch = new Set<string>();
      matches.forEach((m) => {
        (m.participants || []).forEach((uid) => {
          if (!(uid in nameByUserId)) toFetch.add(uid);
        });
        if (m.menteeId && !(m.menteeId in nameByUserId)) toFetch.add(m.menteeId);
      });
      if (toFetch.size === 0) return;
      const entries: [string, string][] = [];
      await Promise.all(
        Array.from(toFetch).map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            const d = snap.data() as any;
            entries.push([uid, d.name || d.displayName || uid]);
          } else {
            entries.push([uid, uid]);
          }
        })
      );
      setNameByUserId((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };
    if (matches.length > 0) {
      loadNames();
    }
  }, [matches]);

  if (!user) return <div className="p-6">Please sign in.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Partnerships</h1>
      <p className="text-sm text-muted-foreground mb-4">Select a partnership to manage shared goals.</p>

      <div className="space-y-3">
        {matches.map((m) => {
          const otherId = (m.participants || []).find((p) => p !== user?.uid) || '';
          const otherName = nameByUserId[otherId] || otherId;
          const menteeName = m.matchType === 'mentor' && m.menteeId ? (nameByUserId[m.menteeId] || m.menteeId) : null;
          return (
            <Link key={m.id} href={`/dashboard/match/${m.id}/goals`} className="block rounded-xl border p-4 hover:bg-gray-50 transition-colors">
              <div className="font-medium">{otherName}</div>
              <div className="text-xs text-muted-foreground">
                Type: {m.matchType ?? 'unknown'}{menteeName ? ` · mentee: ${menteeName}` : ''}
              </div>
            </Link>
          );
        })}
        {matches.length === 0 && (
          <div className="text-gray-500">No active partnerships found.</div>
        )}
      </div>
    </div>
  );
}


