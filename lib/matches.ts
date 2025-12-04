import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

export type UserMatch = {
  id: string
  participants: string[]
  matchType?: 'buddy' | 'mentor'
  menteeId?: string | null
  createdAt?: any
}

export function listenToUserMatches(userId: string, cb: (matches: UserMatch[]) => void) {
  const matchesRef = collection(db, 'matches')
  const q = query(matchesRef, where('participants', 'array-contains', userId))

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })) as UserMatch[]
    cb(list)
  })
}

