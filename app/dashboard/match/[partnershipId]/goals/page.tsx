"use client"

import { useEffect, useState, use } from 'react'
import GoalsView from '@/components/GoalsView'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'

type MatchMeta = {
  participants: string[]
}

export default function PartnershipGoalsPage({ params }: { params: Promise<{ partnershipId: string }> }) {
  const { user } = useAuth()
  const resolvedParams = use(params)
  const [matchMeta, setMatchMeta] = useState<MatchMeta | null>(null)

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, 'matches', resolvedParams.partnershipId)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const d = snap.data() as any
        setMatchMeta({
          participants: Array.isArray(d.participants) ? d.participants : [],
        })
      } else {
        setMatchMeta({ participants: [] })
      }
    }
    load()
  }, [resolvedParams.partnershipId])

  if (!user) return <div className="p-6">Please sign in.</div>
  if (!matchMeta) return <div className="p-6">Loading...</div>

  return (
    <GoalsView
      partnershipId={resolvedParams.partnershipId}
      currentUserId={user?.uid ?? null}
      participants={matchMeta.participants}
    />
  )
}


