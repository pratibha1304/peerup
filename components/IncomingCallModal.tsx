"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  listenForIncomingCalls,
  acceptCall,
  declineCall,
  getPartnershipId,
  type CallRoom,
} from '@/lib/calling';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface IncomingCallData {
  partnershipId: string;
  callerId: string;
}

interface CallerProfile {
  name: string;
  profilePicUrl?: string;
}

export function IncomingCallModal() {
  const { user } = useAuth();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callerProfile, setCallerProfile] = useState<CallerProfile | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const incomingCallRef = useRef<IncomingCallData | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    if (!user) return;

    // Check for old 'ringing' calls on login and mark them as missed
    const checkOldCalls = async () => {
      try {
        const callRoomsRef = collection(db, 'callRooms');
        const q = query(
          callRoomsRef,
          where('calleeId', '==', user.uid),
          where('status', '==', 'ringing')
        );
        const snapshot = await getDocs(q);
        
        // Mark old calls as missed (calls older than 30 seconds are considered missed)
        const now = Date.now();
        snapshot.docs.forEach(async (docSnap) => {
          const callData = docSnap.data();
          // If call was created more than 30 seconds ago, mark as missed
          const createdAt = callData.createdAt?.toMillis?.() || 0;
          if (createdAt > 0 && (now - createdAt) > 30000) {
            await declineCall(docSnap.id);
          }
        });
      } catch (error) {
        console.error('Error checking old calls:', error);
      }
    };

    // Check for old calls when user logs in
    checkOldCalls();
    
    // Listen for new incoming calls
    const unsubscribe = listenForIncomingCalls(user.uid, async (callData) => {
      // Check call room status first
      const callRoomRef = doc(db, 'callRooms', callData.partnershipId);
      const callRoomSnap = await getDoc(callRoomRef);
      
      if (!callRoomSnap.exists()) {
        return; // Call room doesn't exist
      }
      
      const roomData = callRoomSnap.data();
      
      // Don't show if call is already ended or connected
      if (roomData.status === 'ended' || roomData.status === 'connected') {
        return;
      }
      
      // Check if call is old (more than 30 seconds)
      const createdAt = roomData.createdAt?.toMillis?.() || 0;
      const now = Date.now();
      
      if (createdAt > 0 && (now - createdAt) > 30000) {
        // Mark as missed instead of showing
        await declineCall(callData.partnershipId);
        return;
      }

      // Only show if status is still 'ringing'
      if (roomData.status === 'ringing') {
        setIncomingCall({
          partnershipId: callData.partnershipId,
          callerId: callData.callerId,
        });

        // Fetch caller's profile
        try {
          const callerDoc = await getDoc(doc(db, 'users', callData.callerId));
          if (callerDoc.exists()) {
            setCallerProfile(callerDoc.data() as CallerProfile);
          }
        } catch (error) {
          console.error('Error fetching caller profile:', error);
        }
      }
    });
    
    // Listen to all call rooms for this user to detect when caller ends the call
    const callRoomsRef = collection(db, 'callRooms');
    const callRoomsQuery = query(
      callRoomsRef,
      where('calleeId', '==', user.uid)
    );
    
    const callRoomsUnsub = onSnapshot(callRoomsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        // If call status changed to 'ended' and we're showing it, hide the modal
        if (data.status === 'ended' && incomingCallRef.current && change.doc.id === incomingCallRef.current.partnershipId) {
          setIncomingCall(null);
          setCallerProfile(null);
        }
      });
    });
    
    return () => {
      unsubscribe();
      callRoomsUnsub();
    };
  }, [user]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    setIsResponding(true);

    try {
      await acceptCall(incomingCall.partnershipId);
      
      // Navigate to call screen (callee mode)
      router.push(`/call?partner=${incomingCall.partnershipId}&other=${incomingCall.callerId}&caller=false`);
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    setIsResponding(true);

    try {
      await declineCall(incomingCall.partnershipId);
      setIncomingCall(null);
      setCallerProfile(null);
    } catch (error) {
      console.error('Error declining call:', error);
    } finally {
      setIsResponding(false);
    }
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="mb-6">
          {callerProfile?.profilePicUrl ? (
            <img
              src={callerProfile.profilePicUrl}
              alt={callerProfile.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-500 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Incoming Call
          </h3>
          <p className="text-gray-600">
            {callerProfile?.name || 'Unknown'} is calling you
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleDecline}
            disabled={isResponding}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={isResponding}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

