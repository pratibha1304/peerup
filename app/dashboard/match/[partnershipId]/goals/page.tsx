"use client"

<<<<<<< HEAD
import { useEffect, useState, use } from 'react'
=======
import { useEffect, useState } from 'react'
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
import GoalsView from '@/components/GoalsView'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'

<<<<<<< HEAD
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
=======
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
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e

  if (!user) return <div className="p-6">Please sign in.</div>
  if (!matchMeta) return <div className="p-6">Loading...</div>

  return (
    <GoalsView
<<<<<<< HEAD
      partnershipId={resolvedParams.partnershipId}
      currentUserId={user?.uid ?? null}
      participants={matchMeta.participants}
=======
      partnershipId={params.partnershipId}
      matchType={matchMeta.matchType}
      menteeId={matchMeta.menteeId}
      currentUserId={user?.uid ?? null}
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
    />
  )
}


