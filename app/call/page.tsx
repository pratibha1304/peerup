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
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeCall = async (partnerId: string, otherId: string, caller: boolean, withVideo: boolean) => {
    try {
      setIsLoading(true);

      // Start local stream (video for scheduled meetings, audio-only for regular calls)
      const stream = await startCallLocalStream(withVideo);
      
      // Ensure audio tracks are enabled and monitor them
      const audioTracks = stream.getAudioTracks();
      console.log('Local stream audio tracks:', audioTracks.length);
      
      audioTracks.forEach(track => {
        track.enabled = true;
        console.log('Local audio track configured:', { 
          id: track.id, 
          enabled: track.enabled, 
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings ? track.getSettings() : 'N/A',
        });
        
        // Monitor track state changes
        track.onended = () => {
          console.error('❌ Local audio track ended unexpectedly!');
        };
        
        track.onmute = () => {
          console.warn('⚠️ Local audio track was muted!');
        };
        
        track.onunmute = () => {
          console.log('✅ Local audio track unmuted');
        };
      });
      
      setLocalStream(stream);
      setVideoEnabled(withVideo && stream.getVideoTracks()[0]?.enabled !== false);
      setAudioEnabled(stream.getAudioTracks()[0]?.enabled !== false);

      // Create peer connection
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      // Monitor peer connection state
      peerConnection.onconnectionstatechange = () => {
        console.log('Peer connection state:', peerConnection.connectionState);
      };
      
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
      };

      // Add local tracks
      addLocalTracksToPeer(peerConnection, stream);
      
      // Verify tracks were added
      setTimeout(() => {
        const senders = peerConnection.getSenders();
        console.log('Peer connection senders:', senders.map(s => ({
          track: s.track?.kind,
          trackId: s.track?.id,
          trackEnabled: s.track?.enabled,
        })));
      }, 1000);

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
        console.log('Caller: Creating offer...');
        const offer = await createOffer(peerConnection);
        await saveOfferToFirestore(partnerId, offer);
        console.log('Caller: Offer created and saved');

        // Listen for answer
        const unsubscribe = listenToCallRoom(partnerId, async (data) => {
          if (data.answer && !peerConnection.currentRemoteDescription) {
            console.log('Caller: Received answer, setting remote description...');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('Caller: Remote description set');
          }
        });
        candidateListenersRef.current.push(unsubscribe);
      } else {
        // Callee: listen for offer and create answer
        const unsubscribe = listenToCallRoom(partnerId, async (data) => {
          if (data.offer && !peerConnection.currentRemoteDescription) {
            console.log('Callee: Received offer, creating answer...');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            console.log('Callee: Remote description set, creating answer...');
            const answer = await createAnswer(peerConnection, data.offer);
            await saveAnswerToFirestore(partnerId, answer);
            console.log('Callee: Answer created and saved');
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
    // Set initial status - callee should wait for connection, caller is ringing
    setCallStatus(caller ? 'ringing' : 'ringing');

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

  // Update call status when remote stream is received
  useEffect(() => {
    if (remoteStream) {
      const audioTracks = remoteStream.getAudioTracks();
      const videoTracks = remoteStream.getVideoTracks();
      
      console.log('✅ Remote stream received:', {
        audioTracks: audioTracks.length,
        videoTracks: videoTracks.length,
        audioEnabled: audioTracks.every(t => t.enabled),
        videoEnabled: videoTracks.every(t => t.enabled),
      });
      
      // Ensure all audio tracks are enabled
      audioTracks.forEach(track => {
        if (!track.enabled) {
          track.enabled = true;
          console.log('✅ Enabled remote audio track:', track.id);
        }
      });
      
      // Only update to connected if we have a remote stream
      if (callStatus === 'ringing') {
        setCallStatus('connected');
        console.log('✅ Call status updated to connected');
      }
      
      // Stop ringtone when connected
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
        ringtoneIntervalRef.current = null;
      }
    }
  }, [remoteStream, callStatus]);

  // Play pleasant ringtone for incoming/outgoing calls
  useEffect(() => {
    if (callStatus === 'ringing' && !isLoading) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      let oscillators: OscillatorNode[] = [];
      let gainNode: GainNode | null = null;
      
      const playTone = () => {
        try {
          // Create a pleasant, soft ringtone using multiple harmonics
          // Using musical notes: C5 (523.25 Hz) and E5 (659.25 Hz) - pleasant major third
          const frequencies = [523.25, 659.25]; // C5 and E5 notes
          gainNode = audioContext.createGain();
          
          // Soft, pleasant volume
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.25, audioContext.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.3);
          
          frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine'; // Sine wave for smooth, pleasant sound
            oscillator.frequency.value = freq;
            
            // Add slight delay for harmony effect
            const delay = audioContext.createDelay();
            delay.delayTime.value = index * 0.05;
            
            oscillator.connect(delay);
            delay.connect(gainNode!);
            oscillator.start();
            
            oscillators.push(oscillator);
          });
          
          gainNode.connect(audioContext.destination);
          
          // Stop after 0.5 seconds (pleasant duration)
          setTimeout(() => {
            oscillators.forEach(osc => {
              try { osc.stop(); } catch (e) {}
            });
            oscillators = [];
          }, 500);
        } catch (error) {
          console.error('Error playing ringtone:', error);
        }
      };
      
      // Play immediately
      playTone();
      
      // Play every 1.5 seconds (less frequent, more pleasant)
      ringtoneIntervalRef.current = setInterval(() => {
        if (callStatus === 'ringing' && !isLoading) {
          playTone();
        }
      }, 1500);
      
      return () => {
        if (ringtoneIntervalRef.current) {
          clearInterval(ringtoneIntervalRef.current);
          ringtoneIntervalRef.current = null;
        }
        oscillators.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(() => {});
        }
      };
    } else {
      // Stop ringtone when not ringing
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
        ringtoneIntervalRef.current = null;
      }
    }
  }, [callStatus, isLoading]);

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
              currentTime: audioElement.currentTime,
              duration: audioElement.duration,
            });
            
            // Create AudioContext to analyze the stream
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            
            // Create an analyser to check if audio is actually flowing
            const analyser = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(remoteStream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            // Check audio levels periodically
            const checkAudioLevels = () => {
              analyser.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
              const max = Math.max(...Array.from(dataArray));
              console.log('Audio levels:', { average: average.toFixed(2), max, hasData: max > 0 });
              
              if (max > 0) {
                console.log('✅ Audio data detected in stream!');
              } else {
                console.warn('⚠️ No audio data detected in stream - remote user may not be speaking or mic may be muted');
              }
            };
            
            // Check audio levels every second
            const audioCheckInterval = setInterval(checkAudioLevels, 1000);
            
            // Cleanup interval when component unmounts or stream changes
            setTimeout(() => {
              clearInterval(audioCheckInterval);
            }, 30000); // Check for 30 seconds
            
            // Try to play immediately
            audioElement.play().then(() => {
              console.log('Audio play() resolved');
              // Verify it's actually playing
              setTimeout(() => {
                console.log('Audio element state after play:', {
                  paused: audioElement.paused,
                  currentTime: audioElement.currentTime,
                  muted: audioElement.muted,
                  volume: audioElement.volume,
                });
              }, 1000);
            }).catch(err => {
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
              console.log('Audio already playing - verifying state:', {
                paused: audioElement.paused,
                muted: audioElement.muted,
                volume: audioElement.volume,
                currentTime: audioElement.currentTime,
                srcObject: !!audioElement.srcObject,
              });
              
              // Even if playing, verify it's not muted and volume is correct
              if (audioElement.muted) {
                console.warn('⚠️ Audio element is muted! Unmuting...');
                audioElement.muted = false;
              }
              if (audioElement.volume === 0) {
                console.warn('⚠️ Audio element volume is 0! Setting to 1...');
                audioElement.volume = 1.0;
              }
              
              // Force play again to ensure it's actually playing
              await audioElement.play();
              console.log('✅ Re-confirmed audio playback');
              return;
            }
            
            await audioElement.play();
            console.log('✅ Audio playback started successfully');
            
            // Verify playback state after a moment
            setTimeout(() => {
              if (audioElement) {
                console.log('Post-play verification:', {
                  paused: audioElement.paused,
                  muted: audioElement.muted,
                  volume: audioElement.volume,
                  currentTime: audioElement.currentTime,
                });
              }
            }, 500);
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
      // Update status based on Firestore, but 'connected' only when we have remote stream
      if (data.status === 'connected') {
        // Only show connected if we have remote stream, otherwise keep ringing
        if (remoteStream) {
          setCallStatus('connected');
        } else {
          // Status says connected but no stream yet - still connecting
          setCallStatus('ringing');
        }
      } else {
        setCallStatus(data.status);
      }

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
        style={{ display: 'none' }}
        onLoadedData={() => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.muted = false;
            if (remoteAudioRef.current.srcObject) {
              remoteAudioRef.current.play().catch(err => {
                console.error('Autoplay blocked, will retry:', err);
              });
            }
          }
        }}
        onPlay={() => {
          console.log('✅ Remote audio is playing');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.muted = false;
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

