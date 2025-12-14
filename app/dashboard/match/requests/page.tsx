"use client"

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { listenIncomingRequests, listenOutgoingRequests, respondToRequest, createMatchFor, MatchRequest } from '@/lib/matchRequests'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function MatchRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [incoming, setIncoming] = useState<MatchRequest[]>([])
  const [outgoing, setOutgoing] = useState<MatchRequest[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) return
    const unsubIn = listenIncomingRequests(user.uid, setIncoming)
    const unsubOut = listenOutgoingRequests(user.uid, setOutgoing)
    return () => { unsubIn(); unsubOut() }
  }, [user])

  // Load user names for incoming and outgoing requests
  useEffect(() => {
    const loadUserNames = async () => {
      const userIds = new Set<string>()
      
      // Collect all user IDs from incoming requests
      incoming.forEach((req) => {
        if (req.requesterId !== user?.uid) userIds.add(req.requesterId)
      })
      
      // Collect all user IDs from outgoing requests
      outgoing.forEach((req) => {
        if (req.receiverId !== user?.uid) userIds.add(req.receiverId)
      })
      
      if (userIds.size === 0) return
      
      const entries: [string, string][] = []
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          if (userNames[uid]) return // Already loaded
          try {
            const snap = await getDoc(doc(db, 'users', uid))
            if (snap.exists()) {
              const d = snap.data() as any
              entries.push([uid, d.name || d.displayName || 'Unknown User'])
            } else {
              entries.push([uid, 'Unknown User'])
            }
          } catch (e) {
            entries.push([uid, 'Unknown User'])
          }
        })
      )
      setUserNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    }
    
    if (incoming.length > 0 || outgoing.length > 0) {
      loadUserNames()
    }
  }, [incoming, outgoing, user, userNames])

  const pendingIncoming = useMemo(() => incoming.filter(r => r.status === 'pending'), [incoming])
  const pendingOutgoing = useMemo(() => outgoing.filter(r => r.status === 'pending'), [outgoing])

  if (!user) return <div className="p-6">Please sign in.</div>

  const handleRespond = async (req: MatchRequest, accept: boolean) => {
    try {
      setBusyId(req.id)
      await respondToRequest(req.id, accept)
      if (accept) {
        // Create match on accept. Infer matchType from current user's role: mentee/mentor -> mentor match, otherwise buddy.
        const currentRole = (user as any).role
        const matchType: 'buddy' | 'mentor' = currentRole === 'mentor' || currentRole === 'mentee' ? 'mentor' : 'buddy'
        const menteeId = matchType === 'mentor' ? (currentRole === 'mentee' ? user.uid : req.requesterId) : null
        await createMatchFor({ requesterId: req.requesterId, receiverId: req.receiverId, matchType, menteeId })
        // Navigate to mutual matches page after successful acceptance
        router.push('/dashboard/match/mutual')
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      alert('Failed to accept request: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Match Requests</h1>
        <button className="px-3 py-2 border rounded-xl" onClick={() => router.push('/dashboard/match')}>Back to Matches</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Incoming (Pending)</h2>
          <div className="space-y-3">
            {pendingIncoming.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">From: {userNames[r.requesterId] || 'Loading...'}</div>
                  <div className="text-xs text-muted-foreground">Request ID: {r.id.substring(0, 8)}...</div>
                </div>
                <div className="flex gap-2">
                  <button disabled={busyId===r.id} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50" onClick={() => handleRespond(r, true)}>Accept</button>
                  <button disabled={busyId===r.id} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" onClick={() => handleRespond(r, false)}>Decline</button>
                </div>
              </div>
            ))}
            {pendingIncoming.length === 0 && <div className="text-sm text-muted-foreground">No incoming requests.</div>}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Outgoing (Pending)</h2>
          <div className="space-y-3">
            {pendingOutgoing.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">To: {userNames[r.receiverId] || 'Loading...'}</div>
                  <div className="text-xs text-muted-foreground capitalize">Status: {r.status}</div>
                </div>
              </div>
            ))}
            {pendingOutgoing.length === 0 && <div className="text-sm text-muted-foreground">No outgoing requests.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}


