"use client";

import { db, auth } from './firebase';
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

const stunServers: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function getPartnershipId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export async function initiateCall(callerId: string, calleeId: string) {
  const partnershipId = getPartnershipId(callerId, calleeId);
  const callRoomRef = doc(db, 'callRooms', partnershipId);

  // Get user data for names and email
  const [callerDoc, calleeDoc] = await Promise.all([
    getDoc(doc(db, 'users', callerId)),
    getDoc(doc(db, 'users', calleeId))
  ]);
  
  const callerData = callerDoc.exists() ? callerDoc.data() : null;
  const calleeData = calleeDoc.exists() ? calleeDoc.data() : null;

  // Clean up old data and set status to ringing
  await setDoc(callRoomRef, {
    status: 'ringing',
    callerId,
    callerName: callerData?.name || 'Unknown User',
    calleeId,
    calleeName: calleeData?.name || 'Unknown User',
    offer: null,
    answer: null,
    createdAt: serverTimestamp(),
  }, { merge: false }); // Force create, not merge

  // Send email notification to callee
  try {
    
    if (calleeData?.email) {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'incoming_call',
          data: {
            to: calleeData.email,
            toName: calleeData.name || 'User',
            callerName: callerData?.name || 'Someone',
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/call?partner=${partnershipId}&other=${callerId}&caller=false`
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Email API error:', response.status, errorData);
      } else {
        console.log('✅ Email notification sent for incoming call');
      }
    }
  } catch (error) {
    console.error('❌ Failed to send call email notification:', error);
  }

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
  const snap = await getDoc(callRoomRef);
  const callData = snap.exists() ? (snap.data() as CallRoom & { outcomeLoggedAt?: any }) : null;
  const alreadyLogged = !!callData?.outcomeLoggedAt;
  const endedBy = auth.currentUser?.uid || null;

  const updates: Record<string, any> = { status: 'ended' };
  if (!alreadyLogged) {
    updates.outcomeLoggedAt = serverTimestamp();
    updates.endedBy = endedBy;
  }

  await updateDoc(callRoomRef, updates);

  if (callData && !alreadyLogged) {
    await logCallOutcome(partnershipId, callData, 'missed', endedBy);
  }
}

export async function endCall(partnershipId: string) {
  const callRoomRef = doc(db, 'callRooms', partnershipId);
  const snap = await getDoc(callRoomRef);
  const callData = snap.exists() ? (snap.data() as CallRoom & { outcomeLoggedAt?: any }) : null;
  const alreadyLogged = !!callData?.outcomeLoggedAt;
  const endedBy = auth.currentUser?.uid || null;
  const outcome: CallOutcome = callData?.status === 'connected' ? 'completed' : 'missed';
  
  // Delete the ICE candidates subcollections
  const offerCandidatesRef = collection(db, 'callRooms', partnershipId, 'offerCandidates');
  const answerCandidatesRef = collection(db, 'callRooms', partnershipId, 'answerCandidates');
  
  const offerDocs = await getDocs(offerCandidatesRef);
  const answerDocs = await getDocs(answerCandidatesRef);
  
  await Promise.all(offerDocs.docs.map((d) => deleteDoc(d.ref)));
  await Promise.all(answerDocs.docs.map((d) => deleteDoc(d.ref)));
  
  const updates: Record<string, any> = { status: 'ended' };
  if (!alreadyLogged) {
    updates.outcomeLoggedAt = serverTimestamp();
    updates.endedBy = endedBy;
  }

  await updateDoc(callRoomRef, updates);

  if (callData && !alreadyLogged) {
    await logCallOutcome(partnershipId, callData, outcome, endedBy);
  }
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

export async function startCallLocalStream(withVideo: boolean = false): Promise<MediaStream> {
  // For scheduled meetings: video + audio, for regular calls: audio only
  return await navigator.mediaDevices.getUserMedia({ 
    video: withVideo, 
    audio: true 
  });
}

export function addLocalTracksToPeer(
  peerConnection: RTCPeerConnection,
  localStream: MediaStream
) {
  const tracks = localStream.getTracks();
  console.log('Adding local tracks to peer connection:', {
    totalTracks: tracks.length,
    audioTracks: tracks.filter(t => t.kind === 'audio').length,
    videoTracks: tracks.filter(t => t.kind === 'video').length,
  });
  
  tracks.forEach((track) => {
    // Ensure track is enabled before adding
    track.enabled = true;
    
    console.log(`Adding ${track.kind} track:`, {
      id: track.id,
      kind: track.kind,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
    });
    
    const sender = peerConnection.addTrack(track, localStream);
    
    // CRITICAL: Configure transceiver to ensure audio is sent
    const transceivers = peerConnection.getTransceivers();
    const transceiver = transceivers.find(t => t.sender === sender);
    if (transceiver) {
      // Set direction to sendrecv for audio to ensure bidirectional communication
      if (track.kind === 'audio') {
        transceiver.direction = 'sendrecv';
        console.log('✅ Audio transceiver configured for sendrecv');
      }
    }
    
    // Monitor track state
    track.onended = () => {
      console.warn(`Local ${track.kind} track ended:`, track.id);
    };
    
    track.onmute = () => {
      console.warn(`Local ${track.kind} track muted:`, track.id);
    };
    
    track.onunmute = () => {
      console.log(`Local ${track.kind} track unmuted:`, track.id);
    };
    
    // For audio tracks, monitor if they're actually sending data
    if (track.kind === 'audio') {
      // Monitor sender statistics to verify audio is being sent
      setInterval(async () => {
        try {
          const stats = await sender.getStats();
          stats.forEach((report) => {
            if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
              console.log('Audio transmission stats:', {
                bytesSent: report.bytesSent,
                packetsSent: report.packetsSent,
                packetsLost: report.packetsLost,
                roundTripTime: report.roundTripTime,
              });
            }
          });
        } catch (error) {
          console.error('Error getting sender stats:', error);
        }
      }, 3000);
    }
  });
  
  // Ensure all transceivers are properly configured
  peerConnection.getTransceivers().forEach((transceiver) => {
    if (transceiver.sender.track?.kind === 'audio') {
      if (transceiver.direction !== 'sendrecv' && transceiver.direction !== 'sendonly') {
        transceiver.direction = 'sendrecv';
        console.log('✅ Fixed audio transceiver direction to sendrecv');
      }
    }
  });
  
  console.log('Peer connection senders after adding tracks:', {
    senders: peerConnection.getSenders().length,
    transceivers: peerConnection.getTransceivers().length,
    transceiverDirections: peerConnection.getTransceivers().map(t => ({
      kind: t.sender.track?.kind,
      direction: t.direction,
    })),
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
    const stream = event.streams[0];
    console.log('Received remote track:', {
      kind: event.track.kind,
      id: event.track.id,
      enabled: event.track.enabled,
      streamId: stream?.id,
      audioTracks: stream?.getAudioTracks().length,
      videoTracks: stream?.getVideoTracks().length,
    });
    
    // Ensure audio tracks are enabled
    stream?.getAudioTracks().forEach(track => {
      track.enabled = true;
    });
    
    setRemoteStream(stream);
  };
}

type CallOutcome = 'missed' | 'completed';

async function logCallOutcome(
  partnershipId: string,
  callData: CallRoom & { callerId: string; calleeId: string },
  outcome: CallOutcome,
  endedBy: string | null
) {
  const logsRef = collection(db, 'callLogs');
  const participantsSet = new Set<string>();
  if (callData.callerId) participantsSet.add(callData.callerId);
  if (callData.calleeId) participantsSet.add(callData.calleeId);
  if (endedBy) participantsSet.add(endedBy);
  const participants = Array.from(participantsSet);

  // Fetch user names for the log
  const userIds = [callData.callerId, callData.calleeId].filter(Boolean);
  const userDocs = await Promise.all(
    userIds.map(uid => getDoc(doc(db, 'users', uid)))
  );
  
  const callerName = userDocs[0]?.exists() ? userDocs[0].data()?.name : 'Unknown User';
  const calleeName = userDocs[1]?.exists() ? userDocs[1].data()?.name : 'Unknown User';

  await addDoc(logsRef, {
    partnershipId,
    callerId: callData.callerId,
    callerName: callerName || 'Unknown User',
    calleeId: callData.calleeId,
    calleeName: calleeName || 'Unknown User',
    participants: participants.sort(),
    status: outcome,
    endedBy: endedBy || null,
    createdAt: serverTimestamp(),
  });
}

export function closePeerConnection(peerConnection: RTCPeerConnection | null) {
  if (peerConnection) {
    peerConnection.close();
  }
}

