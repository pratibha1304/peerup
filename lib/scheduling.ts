import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';

export type ScheduleRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  receiverId: string;
  receiverName: string;
  participants: string[];
  proposedTimes: Timestamp[];
  status: 'pending' | 'confirmed' | 'declined';
  confirmedTime?: Timestamp;
  createdAt: Timestamp;
};

export async function createScheduleRequest(
  requesterId: string,
  requesterName: string,
  receiverId: string,
  receiverName: string,
  proposedTimes: Timestamp[]
) {
  const participants = [requesterId, receiverId];

  await addDoc(collection(db, 'scheduleRequests'), {
    requesterId,
    requesterName,
    receiverId,
    receiverName,
    participants,
    proposedTimes,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // Send email notification to receiver
  try {
    const receiverDoc = await getDoc(doc(db, 'users', receiverId));
    const receiverData = receiverDoc.exists() ? receiverDoc.data() : null;
    
    if (receiverData?.email) {
      const timeStrings = proposedTimes.map((t) => {
        const date = t.toDate();
        return date.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      }).join(', ');
      
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'schedule_request',
          data: {
            to: receiverData.email,
            toName: receiverData.name || receiverName,
            fromName: requesterName,
            scheduleTime: timeStrings,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/schedule`
          }
        })
      });
    }
  } catch (error) {
    console.error('Failed to send schedule request email:', error);
  }
}

export async function confirmScheduleRequest(
  requestId: string,
  confirmedTime: Timestamp
) {
  const requestRef = doc(db, 'scheduleRequests', requestId);
  const requestDoc = await getDoc(requestRef);
  const requestData = requestDoc.exists() ? requestDoc.data() as ScheduleRequest : null;
  
  if (!requestData) throw new Error('Schedule request not found');
  
  await updateDoc(requestRef, {
    status: 'confirmed',
    confirmedTime,
  });

  // Send email notification to requester
  try {
    const requesterDoc = await getDoc(doc(db, 'users', requestData.requesterId));
    const requesterData = requesterDoc.exists() ? requesterDoc.data() : null;
    
    if (requesterData?.email) {
      const timeString = confirmedTime.toDate().toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'schedule_confirmed',
          data: {
            to: requesterData.email,
            toName: requesterData.name || requestData.requesterName,
            fromName: requestData.receiverName,
            scheduleTime: timeString,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/schedule`
          }
        })
      });
    }
  } catch (error) {
    console.error('Failed to send schedule confirmation email:', error);
  }
}

export async function declineScheduleRequest(requestId: string) {
  const requestRef = doc(db, 'scheduleRequests', requestId);
  const requestDoc = await getDoc(requestRef);
  const requestData = requestDoc.exists() ? requestDoc.data() as ScheduleRequest : null;
  
  if (!requestData) throw new Error('Schedule request not found');
  
  await updateDoc(requestRef, {
    status: 'declined',
  });

  // Send email notification to requester
  try {
    const requesterDoc = await getDoc(doc(db, 'users', requestData.requesterId));
    const requesterData = requesterDoc.exists() ? requesterDoc.data() : null;
    
    if (requesterData?.email) {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'schedule_declined',
          data: {
            to: requesterData.email,
            toName: requesterData.name || requestData.requesterName,
            fromName: requestData.receiverName,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/schedule`
          }
        })
      });
    }
  } catch (error) {
    console.error('Failed to send schedule decline email:', error);
  }
}

export function listenToIncomingScheduleRequests(
  currentUserId: string,
  callback: (requests: ScheduleRequest[]) => void
) {
  const q = query(
    collection(db, 'scheduleRequests'),
    where('receiverId', '==', currentUserId)
  );

  return onSnapshot(q, (snapshot) => {
    const requests: ScheduleRequest[] = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ScheduleRequest, 'id'>),
      }))
      .filter((req) => req.status === 'pending');
    callback(requests);
  });
}

export function listenToConfirmedSchedules(
  currentUserId: string,
  callback: (requests: ScheduleRequest[]) => void
) {
  const q = query(
    collection(db, 'scheduleRequests'),
    where('participants', 'array-contains', currentUserId)
  );

  return onSnapshot(q, (snapshot) => {
    const requests: ScheduleRequest[] = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ScheduleRequest, 'id'>),
      }))
      .filter((req) => req.status === 'confirmed');
    
    // Sort by confirmedTime
    requests.sort((a, b) => {
      const timeA = a.confirmedTime?.toMillis() || 0;
      const timeB = b.confirmedTime?.toMillis() || 0;
      return timeA - timeB;
    });
    callback(requests);
  });
}

export function listenToSentRequests(
  currentUserId: string,
  callback: (requests: ScheduleRequest[]) => void
) {
  const q = query(
    collection(db, 'scheduleRequests'),
    where('requesterId', '==', currentUserId)
  );

  return onSnapshot(q, (snapshot) => {
    const requests: ScheduleRequest[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ScheduleRequest, 'id'>),
    }));
    callback(requests);
  });
}

export async function getUserProfile(userId: string) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
}

