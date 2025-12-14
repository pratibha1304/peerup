import { db, auth } from '@/lib/firebase'
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
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
  
  // Get requester and receiver user data for email
  const [requesterDoc, receiverDoc] = await Promise.all([
    getDoc(doc(db, 'users', requesterId)),
    getDoc(doc(db, 'users', receiverId))
  ])
  
  const requesterData = requesterDoc.exists() ? requesterDoc.data() : null
  const receiverData = receiverDoc.exists() ? receiverDoc.data() : null
  
  await addDoc(collection(db, 'matchRequests'), {
    requesterId,
    receiverId,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  
  // Send email notification to receiver
  if (receiverData?.email) {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'match_request',
          data: {
            to: receiverData.email,
            toName: receiverData.name || 'User',
            fromName: requesterData?.name || 'Someone',
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/match/requests`
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Email API error:', response.status, errorData);
      } else {
        console.log('✅ Email notification sent for match request');
      }
    } catch (error) {
      console.error('❌ Failed to send match request email:', error)
    }
  }
}

export async function respondToRequest(requestId: string, accept: boolean) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const ref = doc(db, 'matchRequests', requestId)
  const requestDoc = await getDoc(ref)
  const requestData = requestDoc.exists() ? requestDoc.data() as MatchRequest : null
  
  if (!requestData) throw new Error('Request not found')
  
  await updateDoc(ref, { status: accept ? 'accepted' : 'declined' })
  
  // Get user data for email notifications
  const [requesterDoc, receiverDoc] = await Promise.all([
    getDoc(doc(db, 'users', requestData.requesterId)),
    getDoc(doc(db, 'users', requestData.receiverId))
  ])
  
  const requesterData = requesterDoc.exists() ? requesterDoc.data() : null
  const receiverData = receiverDoc.exists() ? receiverDoc.data() : null
  
  // Send email to requester about the response
  if (requesterData?.email) {
    try {
      const emailType = accept ? 'match_accepted' : 'match_declined'
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          data: {
            to: requesterData.email,
            toName: requesterData.name || 'User',
            fromName: receiverData?.name || 'Someone',
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/match/${accept ? 'mutual' : 'requests'}`
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Email API error:', response.status, errorData);
      } else {
        console.log(`✅ Email notification sent for match ${accept ? 'acceptance' : 'decline'}`);
      }
    } catch (error) {
      console.error('Failed to send match response email:', error)
    }
  }
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


