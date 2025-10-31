"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { initiateCall, getPartnershipId } from '@/lib/calling'

type MatchDoc = {
  id: string
  participants: string[]
  matchType?: 'buddy' | 'mentor'
  menteeId?: string | null
}

export default function MutualMatchesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<MatchDoc[]>([])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'matches'), where('participants', 'array-contains', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MatchDoc[])
    })
    return () => unsub()
  }, [user])

  if (!user) return <div className="p-6">Please sign in.</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mutual Matches</h1>
      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="rounded-xl border p-4">
            <div className="font-medium mb-1">{m.id}</div>
            <div className="text-xs text-muted-foreground mb-3">Type: {m.matchType ?? 'unknown'}{m.matchType === 'mentor' && m.menteeId ? ` · mentee: ${m.menteeId}` : ''}</div>
            <div className="flex gap-2">
              <Link href={`/dashboard/chats?u=${encodeURIComponent(m.participants.find(p => p !== user.uid) || '')}`} className="px-3 py-2 bg-pear text-black rounded-xl">Chat</Link>
              <Link href={`/dashboard/match/${m.id}/goals`} className="px-3 py-2 border rounded-xl">Goals</Link>
              <button
                className="px-3 py-2 bg-green-600 text-white rounded-xl"
                onClick={async () => {
                  const other = m.participants.find(p => p !== user.uid) || ''
                  try {
                    await initiateCall(user.uid, other)
                    router.push(`/call?partner=${m.id}&other=${other}&caller=true`)
                  } catch (e) {
                    console.error(e)
                    alert('Failed to start call')
                  }
                }}
              >Call</button>
              <button
                className="px-3 py-2 border rounded-xl"
                onClick={() => {
                  const other = m.participants.find(p => p !== user.uid) || ''
                  router.push(`/dashboard/schedule?user=${other}`)
                }}
              >Schedule</button>
            </div>
          </div>
        ))}
        {matches.length === 0 && <div className="text-gray-500">No mutual matches yet.</div>}
      </div>
    </div>
  )
}


