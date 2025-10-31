"use client"

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { listenIncomingRequests, listenOutgoingRequests, respondToRequest, createMatchFor, MatchRequest } from '@/lib/matchRequests'
import { useRouter } from 'next/navigation'

export default function MatchRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [incoming, setIncoming] = useState<MatchRequest[]>([])
  const [outgoing, setOutgoing] = useState<MatchRequest[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const unsubIn = listenIncomingRequests(user.uid, setIncoming)
    const unsubOut = listenOutgoingRequests(user.uid, setOutgoing)
    return () => { unsubIn(); unsubOut() }
  }, [user])

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
                  <div className="text-sm">From: <span className="font-mono">{r.requesterId}</span></div>
                  <div className="text-xs text-muted-foreground">Request ID: {r.id}</div>
                </div>
                <div className="flex gap-2">
                  <button disabled={busyId===r.id} className="px-3 py-1.5 bg-green-600 text-white rounded-lg" onClick={() => handleRespond(r, true)}>Accept</button>
                  <button disabled={busyId===r.id} className="px-3 py-1.5 bg-red-600 text-white rounded-lg" onClick={() => handleRespond(r, false)}>Decline</button>
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
                  <div className="text-sm">To: <span className="font-mono">{r.receiverId}</span></div>
                  <div className="text-xs text-muted-foreground">Status: {r.status}</div>
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


