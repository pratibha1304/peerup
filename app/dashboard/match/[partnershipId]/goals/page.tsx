"use client"

import { useEffect, useState } from 'react'
import GoalsView from '@/components/GoalsView'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'

export default function PartnershipGoalsPage({ params }: { params: { partnershipId: string } }) {
  const { user } = useAuth()
  const [matchMeta, setMatchMeta] = useState<{ matchType?: 'buddy' | 'mentor'; menteeId?: string | null } | null>(null)

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, 'matches', params.partnershipId)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const d = snap.data() as any
        setMatchMeta({ matchType: d.matchType, menteeId: d.menteeId ?? null })
      } else {
        setMatchMeta({ matchType: undefined, menteeId: null })
      }
    }
    load()
  }, [params.partnershipId])

  if (!user) return <div className="p-6">Please sign in.</div>
  if (!matchMeta) return <div className="p-6">Loading...</div>

  return (
    <GoalsView
      partnershipId={params.partnershipId}
      matchType={matchMeta.matchType}
      menteeId={matchMeta.menteeId}
      currentUserId={user?.uid ?? null}
    />
  )
}


