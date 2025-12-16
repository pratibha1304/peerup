import { db, auth } from '@/lib/firebase'
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, deleteDoc } from 'firebase/firestore'
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
    requesterName: requesterData?.name || 'Unknown User',
    receiverId,
    receiverName: receiverData?.name || 'Unknown User',
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
  
  // Verify the current user is the receiver
  if (requestData.receiverId !== auth.currentUser.uid) {
    throw new Error('Only the receiver can respond to match requests')
  }
  
  // Update the request status first (critical operation)
  await updateDoc(ref, { status: accept ? 'accepted' : 'declined' })
  
  // Send email notification asynchronously (non-blocking)
  // Don't await this - let it run in the background
  Promise.all([
    getDoc(doc(db, 'users', requestData.requesterId)),
    getDoc(doc(db, 'users', requestData.receiverId))
  ]).then(([requesterDoc, receiverDoc]) => {
    const requesterData = requesterDoc.exists() ? requesterDoc.data() : null
    const receiverData = receiverDoc.exists() ? receiverDoc.data() : null
    
    // Send email to requester about the response
    if (requesterData?.email) {
      const emailType = accept ? 'match_accepted' : 'match_declined'
      fetch('/api/email/send', {
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
      }).then(response => {
        if (!response.ok) {
          return response.json().catch(() => ({}));
        } else {
          console.log(`✅ Email notification sent for match ${accept ? 'acceptance' : 'decline'}`);
        }
      }).catch(error => {
        console.error('Failed to send match response email:', error)
      });
    }
  }).catch(error => {
    console.error('Failed to fetch user data for email:', error)
  })
}

export async function cancelMatchRequest(requestId: string) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const requesterId = auth.currentUser.uid
  const ref = doc(db, 'matchRequests', requestId)
  const requestDoc = await getDoc(ref)
  const requestData = requestDoc.exists() ? requestDoc.data() as MatchRequest : null
  
  if (!requestData) throw new Error('Request not found')
  if (requestData.requesterId !== requesterId) throw new Error('You can only cancel your own requests')
  if (requestData.status !== 'pending') throw new Error('Can only cancel pending requests')
  
  await deleteDoc(ref)
}

export async function createMatchFor(request: { requesterId: string; receiverId: string; matchType: 'buddy' | 'mentor'; menteeId?: string | null }) {
  if (!auth.currentUser) throw new Error('Not signed in')
  const partnershipId = getPartnershipId(request.requesterId, request.receiverId)
  const ref = doc(db, 'matches', partnershipId)
  // Ensure participants is a proper array with both users for Firestore rule check
  const participants = [request.requesterId, request.receiverId].sort()
  
  // Fetch user names
  const [requesterDoc, receiverDoc] = await Promise.all([
    getDoc(doc(db, 'users', request.requesterId)),
    getDoc(doc(db, 'users', request.receiverId))
  ])
  const requesterName = requesterDoc.exists() ? requesterDoc.data()?.name : 'Unknown User'
  const receiverName = receiverDoc.exists() ? receiverDoc.data()?.name : 'Unknown User'
  const participantNames = [requesterName, receiverName].sort()
  
  await setDoc(ref, {
    participants: participants,
    participantNames: participantNames,
    matchType: request.matchType,
    menteeId: request.matchType === 'mentor' ? (request.menteeId || request.receiverId) : null,
    createdAt: serverTimestamp(),
  }, { merge: true })
}


