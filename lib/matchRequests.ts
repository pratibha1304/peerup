import { db, auth } from '@/lib/firebase'
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { getPartnershipId } from '@/lib/calling'

export type MatchRequest = {
  id: string
  requesterId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt?: any
}

export function listenOutgoingRequests(userId: string, cb: (reqs: MatchRequest[]) => void) {
  const q = query(collection(db, 'matchRequests'), where('requesterId', '==', userId))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MatchRequest[])
  })
}

export function listenIncomingRequests(userId: string, cb: (reqs: MatchRequest[]) => void) {
  const q = query(collection(db, 'matchRequests'), where('receiverId', '==', userId))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MatchRequest[])
  })
}

export async function sendMatchRequest(receiverId: string) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const requesterId = auth.currentUser.uid
  if (receiverId === requesterId) return
  await addDoc(collection(db, 'matchRequests'), {
    requesterId,
    receiverId,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function respondToRequest(requestId: string, accept: boolean) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const ref = doc(db, 'matchRequests', requestId)
  await updateDoc(ref, { status: accept ? 'accepted' : 'declined' })
}

export async function createMatchFor(request: { requesterId: string; receiverId: string; matchType: 'buddy' | 'mentor'; menteeId?: string | null }) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const partnershipId = getPartnershipId(request.requesterId, request.receiverId)
  const ref = doc(db, 'matches', partnershipId)
  // Ensure participants is a proper array with both users for Firestore rule check
  const participants = [request.requesterId, request.receiverId].sort()
  await setDoc(ref, {
    participants: participants,
    matchType: request.matchType,
    menteeId: request.matchType === 'mentor' ? (request.menteeId || request.receiverId) : null,
    createdAt: serverTimestamp(),
  }, { merge: true })
}


