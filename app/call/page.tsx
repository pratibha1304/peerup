"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const [isCaller, setIsCaller] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callStatus, setCallStatus] = useState<CallRoomStatus>('ringing');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const candidateListenersRef = useRef<any[]>([]);

  const initializeCall = async (partnerId: string, otherId: string, caller: boolean, withVideo: boolean) => {
    try {
      setIsLoading(true);

      // Start local stream (video for scheduled meetings, audio-only for regular calls)
      const stream = await startCallLocalStream(withVideo);
      
      // Ensure audio tracks are enabled
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('Local audio track:', { id: track.id, enabled: track.enabled, muted: track.muted });
      });
      
      setLocalStream(stream);
      setVideoEnabled(withVideo && stream.getVideoTracks()[0]?.enabled !== false);
      setAudioEnabled(stream.getAudioTracks()[0]?.enabled !== false);

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
      const errorMsg = withVideo 
        ? 'Failed to start video call. Make sure camera and microphone permissions are granted.'
        : 'Failed to start call. Make sure microphone permissions are granted.';
      alert(errorMsg);
      router.push('/dashboard/chats');
    }
  };

  useEffect(() => {
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const partnerId = urlParams.get('partner');
    const otherId = urlParams.get('other');
    const caller = urlParams.get('caller') === 'true';
    const video = urlParams.get('video') === 'true'; // Scheduled meetings are video calls

    if (!partnerId || !otherId) {
      router.push('/dashboard/chats');
      return;
    }

    setPartnershipId(partnerId);
    setOtherUserId(otherId);
    setIsCaller(caller);
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
  }, [user, router]);

  // Handle video elements for video calls
  useEffect(() => {
    if (localVideoRef.current && localStream && isVideoCall) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && isVideoCall) {
      remoteVideoRef.current.srcObject = remoteStream;
      // Ensure video element plays audio too
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
      
      // Force play video (which includes audio)
      remoteVideoRef.current.play().catch(err => {
        console.error('Error playing remote video:', err);
      });
    }
  }, [remoteStream, isVideoCall]);

  // Handle remote audio stream (for both video and voice calls)
  useEffect(() => {
    if (!remoteAudioRef.current) return;

    if (remoteStream) {
      // Check if stream has audio tracks
      const audioTracks = remoteStream.getAudioTracks();
      console.log('Remote stream received:', {
        hasAudio: audioTracks.length > 0,
        audioTrackCount: audioTracks.length,
        audioTracks: audioTracks.map(t => ({ id: t.id, enabled: t.enabled, muted: t.muted, kind: t.kind })),
        streamId: remoteStream.id,
      });
      
      if (audioTracks.length > 0) {
        const audioElement = remoteAudioRef.current;
        
        // Ensure all audio tracks are enabled and monitor their state
        audioTracks.forEach(track => {
          track.enabled = true;
          console.log('Enabled remote audio track:', {
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            kind: track.kind,
          });
          
          // Monitor track state changes
          track.onended = () => {
            console.warn('Audio track ended:', track.id);
          };
          
          track.onmute = () => {
            console.warn('Audio track muted:', track.id);
          };
          
          track.onunmute = () => {
            console.log('Audio track unmuted:', track.id);
          };
        });
        
        // Set the stream to the audio element
        // Clear any existing stream first to ensure clean state
        if (audioElement.srcObject) {
          audioElement.srcObject = null;
        }
        
        // Small delay to ensure cleanup, then set new stream
        setTimeout(() => {
          if (audioElement && remoteStream) {
            audioElement.srcObject = remoteStream;
            
            // Ensure audio element is unmuted and volume is set
            audioElement.muted = false;
            audioElement.volume = 1.0;
            
            console.log('Audio element configured:', {
              muted: audioElement.muted,
              volume: audioElement.volume,
              srcObject: !!audioElement.srcObject,
              paused: audioElement.paused,
              readyState: audioElement.readyState,
            });
            
            // Try to play immediately
            audioElement.play().catch(err => {
              console.error('Immediate play failed:', err);
            });
          }
        }, 50);
        
        // Force play the audio
        const playAudio = async () => {
          if (!audioElement) return;
          
          try {
            // Check if already playing
            if (!audioElement.paused) {
              console.log('Audio already playing');
              return;
            }
            
            await audioElement.play();
            console.log('✅ Audio playback started successfully');
          } catch (error: any) {
            console.error('❌ Error playing remote audio:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              code: error.code,
            });
            
            // Try again after a short delay (autoplay policy might block it)
            setTimeout(async () => {
              if (audioElement && audioElement.srcObject) {
                try {
                  await audioElement.play();
                  console.log('✅ Audio playback started on retry');
                } catch (err: any) {
                  console.error('❌ Retry play failed:', err);
                }
              }
            }, 500);
          }
        };
        
        // Try to play immediately
        playAudio();
        
        // Also try when audio element is ready
        const handleCanPlay = () => {
          console.log('Audio element can play, attempting playback');
          playAudio();
        };
        
        audioElement.addEventListener('canplay', handleCanPlay, { once: true });
        audioElement.addEventListener('loadeddata', handleCanPlay, { once: true });
        audioElement.addEventListener('loadedmetadata', handleCanPlay, { once: true });
        
        // Cleanup function
        return () => {
          audioElement.removeEventListener('canplay', handleCanPlay);
          audioElement.removeEventListener('loadeddata', handleCanPlay);
          audioElement.removeEventListener('loadedmetadata', handleCanPlay);
        };
      } else {
        console.warn('Remote stream has no audio tracks');
      }
    } else {
      // Clear audio when stream is removed
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!partnershipId) return;

    const unsubscribe = listenToCallRoom(partnershipId, (data) => {
      setCallStatus(data.status);

      if (data.status === 'ended') {
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
      }
    });

    return () => unsubscribe();
  }, [partnershipId, localStream, remoteStream, router]);

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
    candidateListenersRef.current = [];

    // End call in Firestore
    if (partnershipId) {
      try {
        await endCall(partnershipId);
      } catch (e) {
        console.error('Error ending call:', e);
      }
    }

    // Navigate immediately
    router.push('/dashboard/chats');
  };

  const toggleVideo = () => {
    if (localStream && isVideoCall) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      {/* Audio element for remote audio (works for both video and voice calls) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        muted={false}
        volume={1.0}
        style={{ display: 'none' }}
        onLoadedData={() => {
          if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
            remoteAudioRef.current.play().catch(err => {
              console.error('Autoplay blocked, will retry:', err);
            });
          }
        }}
      />
      
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
                muted={false}
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
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </button>
      </div>

      {/* Status badge */}
      <div className="absolute top-4 left-4">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
          {callStatus === 'ringing' && (isCaller ? (isVideoCall ? 'Calling...' : 'Calling...') : 'Incoming call')}
          {callStatus === 'connected' && (isVideoCall ? 'Video call' : 'Voice call')}
        </div>
      </div>
    </div>
  );
}

