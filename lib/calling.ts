import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  addDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

export type CallRoomStatus = 'idle' | 'ringing' | 'connected' | 'ended';

export type CallRoom = {
  status: CallRoomStatus;
  callerId: string;
  calleeId: string;
  offer?: any;
  answer?: any;
};

const stunServers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function getPartnershipId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export async function initiateCall(callerId: string, calleeId: string) {
  const partnershipId = getPartnershipId(callerId, calleeId);
  const callRoomRef = doc(db, 'callRooms', partnershipId);

  // Clean up old data and set status to ringing
  await setDoc(callRoomRef, {
    status: 'ringing',
    callerId,
    calleeId,
    offer: null,
    answer: null,
  }, { merge: false }); // Force create, not merge

  return partnershipId;
}

export async function acceptCall(partnershipId: string) {
  const callRoomRef = doc(db, 'callRooms', partnershipId);
  await updateDoc(callRoomRef, {
    status: 'connected',
  });
}

export async function declineCall(partnershipId: string) {
  const callRoomRef = doc(db, 'callRooms', partnershipId);
  await updateDoc(callRoomRef, {
    status: 'ended',
  });
}

export async function endCall(partnershipId: string) {
  const callRoomRef = doc(db, 'callRooms', partnershipId);
  
  // Delete the ICE candidates subcollections
  const offerCandidatesRef = collection(db, 'callRooms', partnershipId, 'offerCandidates');
  const answerCandidatesRef = collection(db, 'callRooms', partnershipId, 'answerCandidates');
  
  const offerDocs = await getDocs(offerCandidatesRef);
  const answerDocs = await getDocs(answerCandidatesRef);
  
  offerDocs.docs.forEach(async (d) => await deleteDoc(d.ref));
  answerDocs.docs.forEach(async (d) => await deleteDoc(d.ref));
  
  await updateDoc(callRoomRef, {
    status: 'ended',
  });
}

export function listenForIncomingCalls(
  currentUserId: string,
  onIncomingCall: (callData: CallRoom & { partnershipId: string; callerId: string }) => void
) {
  const q = query(
    collection(db, 'callRooms'),
    where('calleeId', '==', currentUserId),
    where('status', '==', 'ringing')
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const callData = change.doc.data() as CallRoom;
        onIncomingCall({
          ...callData,
          partnershipId: change.doc.id,
          callerId: callData.callerId,
        });
      }
    });
  });
}

export function listenToCallRoom(
  partnershipId: string,
  onUpdate: (callData: CallRoom) => void
) {
  const callRoomRef = doc(db, 'callRooms', partnershipId);
  return onSnapshot(callRoomRef, (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data() as CallRoom);
    }
  });
}

export function createPeerConnection() {
  return new RTCPeerConnection(stunServers);
}

export async function startCallLocalStream(): Promise<MediaStream> {
  return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}

export function addLocalTracksToPeer(
  peerConnection: RTCPeerConnection,
  localStream: MediaStream
) {
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
}

export function stopLocalStream(localStream: MediaStream | null) {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
}

export function listenForIceCandidates(
  partnershipId: string,
  peerConnection: RTCPeerConnection,
  candidatesPath: 'offerCandidates' | 'answerCandidates'
) {
  // Send local ICE candidates
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      const candidatesRef = collection(
        db,
        'callRooms',
        partnershipId,
        candidatesPath
      );
      await addDoc(candidatesRef, event.candidate.toJSON());
    }
  };

  // Listen for remote ICE candidates
  const candidatesRef = collection(
    db,
    'callRooms',
    partnershipId,
    candidatesPath === 'offerCandidates' ? 'answerCandidates' : 'offerCandidates'
  );

  return onSnapshot(candidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = change.doc.data();
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  });
}

export async function createOffer(peerConnection: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(
  peerConnection: RTCPeerConnection,
  offer: any
): Promise<RTCSessionDescriptionInit> {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
}

export async function saveOfferToFirestore(
  partnershipId: string,
  offer: RTCSessionDescriptionInit
) {
  const callRoomRef = doc(db, 'callRooms', partnershipId);
  await updateDoc(callRoomRef, { offer: offer });
}

export async function saveAnswerToFirestore(
  partnershipId: string,
  answer: RTCSessionDescriptionInit
) {
  const callRoomRef = doc(db, 'callRooms', partnershipId);
  await updateDoc(callRoomRef, { answer: answer });
}

export function handleRemoteStream(
  peerConnection: RTCPeerConnection,
  setRemoteStream: (stream: MediaStream | null) => void
) {
  peerConnection.ontrack = (event) => {
    setRemoteStream(event.streams[0]);
  };
}

export function closePeerConnection(peerConnection: RTCPeerConnection | null) {
  if (peerConnection) {
    peerConnection.close();
  }
}

