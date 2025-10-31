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
}

export async function confirmScheduleRequest(
  requestId: string,
  confirmedTime: Timestamp
) {
  const requestRef = doc(db, 'scheduleRequests', requestId);
  await updateDoc(requestRef, {
    status: 'confirmed',
    confirmedTime,
  });
}

export async function declineScheduleRequest(requestId: string) {
  const requestRef = doc(db, 'scheduleRequests', requestId);
  await updateDoc(requestRef, {
    status: 'declined',
  });
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

