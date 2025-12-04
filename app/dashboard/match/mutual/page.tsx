"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore'
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
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'matches'), where('participants', 'array-contains', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MatchDoc[])
    })
    return () => unsub()
  }, [user])

  // Load user names
  useEffect(() => {
    const loadNames = async () => {
      const userIds = new Set<string>()
      matches.forEach((m) => {
        (m.participants || []).forEach((uid) => {
          if (uid !== user?.uid && !userNames[uid]) userIds.add(uid)
        })
        if (m.menteeId && m.menteeId !== user?.uid && !userNames[m.menteeId]) userIds.add(m.menteeId)
      })
      if (userIds.size === 0) return

      const entries: [string, string][] = []
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, 'users', uid))
            if (snap.exists()) {
              const d = snap.data() as any
              entries.push([uid, d.name || d.displayName || uid])
            } else {
              entries.push([uid, uid])
            }
          } catch (e) {
            entries.push([uid, uid])
          }
        })
      )
      setUserNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    }
    if (matches.length > 0) {
      loadNames()
    }
  }, [matches, user, userNames])

  if (!user) return <div className="p-6">Please sign in.</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mutual Matches</h1>
      <div className="space-y-3">
        {matches.map((m) => {
          const otherId = m.participants.find((p) => p !== user.uid) || ''
          const otherName = userNames[otherId] || otherId
          const menteeName = m.matchType === 'mentor' && m.menteeId ? (userNames[m.menteeId] || m.menteeId) : null
          return (
            <div key={m.id} className="rounded-xl border p-4 hover:bg-gray-50 transition-colors">
              <div className="font-medium mb-1">{otherName}</div>
              <div className="text-xs text-muted-foreground mb-3">
                Type: {m.matchType ?? 'unknown'}{menteeName ? ` · mentee: ${menteeName}` : ''}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/dashboard/chats?u=${encodeURIComponent(otherId)}`} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">Chat</Link>
                <Link href={`/dashboard/match/${m.id}/goals`} className="px-3 py-2 border hover:bg-gray-100 rounded-xl transition-colors">Goals</Link>
                <button
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                  onClick={async () => {
                    try {
                      await initiateCall(user.uid, otherId)
                      const partnerId = getPartnershipId(user.uid, otherId)
                      const caller = user.uid < otherId
                      router.push(`/call?partner=${partnerId}&other=${otherId}&caller=${caller}`)
                    } catch (e) {
                      console.error(e)
                      alert('Failed to start call')
                    }
                  }}
                >Call</button>
                <button
                  className="px-3 py-2 border hover:bg-gray-100 rounded-xl transition-colors"
                  onClick={() => {
                    router.push(`/dashboard/schedule?user=${otherId}&name=${encodeURIComponent(otherName)}`)
                  }}
                >Schedule</button>
              </div>
            </div>
          )
        })}
        {matches.length === 0 && <div className="text-gray-500">No mutual matches yet.</div>}
      </div>
    </div>
  )
}


