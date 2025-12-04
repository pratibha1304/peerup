"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
<<<<<<< HEAD
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
=======
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
import {
  getPartnershipId,
  listenToCallRoom,
  createPeerConnection,
  startCallLocalStream,
  addLocalTracksToPeer,
  stopLocalStream,
  closePeerConnection,
  listenForIceCandidates,
  createOffer,
  saveOfferToFirestore,
  createAnswer,
  saveAnswerToFirestore,
  handleRemoteStream,
  endCall,
  acceptCall,
  type CallRoomStatus,
} from '@/lib/calling';

export default function CallPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [partnershipId, setPartnershipId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
<<<<<<< HEAD
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const [isCaller, setIsCaller] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callStatus, setCallStatus] = useState<CallRoomStatus>('ringing');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
=======
  const [isCaller, setIsCaller] = useState(false);
  const [callStatus, setCallStatus] = useState<CallRoomStatus>('ringing');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
  const [isLoading, setIsLoading] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const candidateListenersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const partnerId = urlParams.get('partner');
    const otherId = urlParams.get('other');
    const caller = urlParams.get('caller') === 'true';
<<<<<<< HEAD
    const video = urlParams.get('video') === 'true'; // Scheduled meetings are video calls
=======
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e

    if (!partnerId || !otherId) {
      router.push('/dashboard/chats');
      return;
    }

    setPartnershipId(partnerId);
    setOtherUserId(otherId);
    setIsCaller(caller);
<<<<<<< HEAD
    setIsVideoCall(video);
    setCallStatus(caller ? 'ringing' : 'connected');

    // Fetch other user's name
    getDoc(doc(db, 'users', otherId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setOtherUserName(data.name || data.displayName || otherId);
      } else {
        setOtherUserName(otherId);
      }
    }).catch(() => {
      setOtherUserName(otherId);
    });

    initializeCall(partnerId, otherId, caller, video);
  }, [user]);

  // Handle video elements for video calls
  useEffect(() => {
    if (localVideoRef.current && localStream && isVideoCall) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && isVideoCall) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideoCall]);
=======
    setCallStatus(caller ? 'ringing' : 'connected');

    initializeCall(partnerId, otherId, caller);
  }, [user]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e

  useEffect(() => {
    if (!partnershipId) return;

    const unsubscribe = listenToCallRoom(partnershipId, (data) => {
      setCallStatus(data.status);

      if (data.status === 'ended') {
<<<<<<< HEAD
        // Stop streams and cleanup immediately
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
          setLocalStream(null);
        }
        if (remoteStream) {
          setRemoteStream(null);
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
        candidateListenersRef.current.forEach((unsub) => {
          try { unsub(); } catch (e) {}
        });
        candidateListenersRef.current = [];
        router.push('/dashboard/chats');
=======
        handleEndCall();
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
      }
    });

    return () => unsubscribe();
<<<<<<< HEAD
  }, [partnershipId, localStream, remoteStream, router]);

  const initializeCall = async (partnerId: string, otherId: string, caller: boolean, withVideo: boolean) => {
    try {
      setIsLoading(true);

      // Start local stream (video for scheduled meetings, audio-only for regular calls)
      const stream = await startCallLocalStream(withVideo);
      setLocalStream(stream);
      setVideoEnabled(withVideo && stream.getVideoTracks()[0]?.enabled !== false);
=======
  }, [partnershipId]);

  const initializeCall = async (partnerId: string, otherId: string, caller: boolean) => {
    try {
      setIsLoading(true);

      // Start local stream
      const stream = await startCallLocalStream();
      setLocalStream(stream);
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e

      // Create peer connection
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Add local tracks
      addLocalTracksToPeer(peerConnection, stream);

      // Handle remote stream
      handleRemoteStream(peerConnection, setRemoteStream);

      // Listen for ICE candidates
      const candidateListener = listenForIceCandidates(
        partnerId,
        peerConnection,
        caller ? 'offerCandidates' : 'answerCandidates'
      );
      candidateListenersRef.current.push(candidateListener);

      if (caller) {
        // Caller: create offer
        const offer = await createOffer(peerConnection);
        await saveOfferToFirestore(partnerId, offer);

        // Listen for answer
        const unsubscribe = listenToCallRoom(partnerId, async (data) => {
          if (data.answer && !peerConnection.currentRemoteDescription) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });
        candidateListenersRef.current.push(unsubscribe);
      } else {
        // Callee: listen for offer and create answer
        const unsubscribe = listenToCallRoom(partnerId, async (data) => {
          if (data.offer && !peerConnection.currentRemoteDescription) {
            const answer = await createAnswer(peerConnection, data.offer);
            await saveAnswerToFirestore(partnerId, answer);
          }
        });
        candidateListenersRef.current.push(unsubscribe);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing call:', error);
<<<<<<< HEAD
      const errorMsg = isVideoCall 
        ? 'Failed to start video call. Make sure camera and microphone permissions are granted.'
        : 'Failed to start call. Make sure microphone permissions are granted.';
      alert(errorMsg);
=======
      alert('Failed to start call. Make sure camera/microphone permissions are granted.');
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
      router.push('/dashboard/chats');
    }
  };

<<<<<<< HEAD
  const handleEndCall = async () => {
    // Stop local stream immediately
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clean up listeners
    candidateListenersRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // Ignore cleanup errors
      }
    });
=======
  const handleEndCall = () => {
    // Close peer connection
    closePeerConnection(peerConnectionRef.current);

    // Stop local stream
    stopLocalStream(localStream);

    // Clean up
    candidateListenersRef.current.forEach((unsub) => unsub());
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
    candidateListenersRef.current = [];

    // End call in Firestore
    if (partnershipId) {
<<<<<<< HEAD
      try {
        await endCall(partnershipId);
      } catch (e) {
        console.error('Error ending call:', e);
      }
    }

    // Navigate immediately
    router.push('/dashboard/chats');
  };

=======
      endCall(partnershipId);
    }

    router.push('/dashboard/chats');
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };

>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    }
  };

<<<<<<< HEAD
  const toggleVideo = () => {
    if (localStream && isVideoCall) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      {isVideoCall ? (
        /* Video call UI */
        <>
          {/* Local video (smaller, in corner) */}
          {localStream && (
            <div className="absolute top-4 right-4 w-48 h-32 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Remote video (main) */}
          <div className="flex items-center justify-center w-full h-full">
            {isLoading ? (
              <div className="text-white text-xl">Connecting...</div>
            ) : remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <div className="text-white text-xl">Waiting for {otherUserName || otherUserId} to join...</div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Voice-only call UI */
        <div className="flex items-center justify-center w-full h-full">
          {isLoading ? (
            <div className="text-white text-xl">Connecting...</div>
          ) : remoteStream ? (
            <div className="text-center">
              <div className="text-3xl text-white font-semibold mb-2">On voice call</div>
              <div className="text-gray-300">With {otherUserName || otherUserId}</div>
            </div>
          ) : (
            <div className="text-white text-xl">Waiting for {otherUserName || otherUserId} to join...</div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
        {isVideoCall && (
          <button
            onClick={toggleVideo}
            className="w-14 h-14 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            {videoEnabled ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
=======
  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      {/* Local video (smaller, in corner) */}
      {localStream && (
        <div className="absolute top-4 right-4 w-48 h-32 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Remote video (main) */}
      <div className="flex items-center justify-center w-full h-full">
        {isLoading ? (
          <div className="text-white text-xl">Connecting...</div>
        ) : remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white text-xl">
            Waiting for {otherUserId} to join...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          onClick={toggleVideo}
          className="w-14 h-14 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          {videoEnabled ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
        <button
          onClick={toggleAudio}
          className="w-14 h-14 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          {audioEnabled ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        </button>
      </div>

      {/* Status badge */}
      <div className="absolute top-4 left-4">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
<<<<<<< HEAD
          {callStatus === 'ringing' && (isCaller ? (isVideoCall ? 'Calling...' : 'Calling...') : 'Incoming call')}
          {callStatus === 'connected' && (isVideoCall ? 'Video call' : 'Voice call')}
=======
          {callStatus === 'ringing' && (isCaller ? 'Calling...' : 'Incoming call')}
          {callStatus === 'connected' && 'Connected'}
>>>>>>> a0ca62188e3511beda6ae985328d2ea36a93fd8e
        </div>
      </div>
    </div>
  );
}

