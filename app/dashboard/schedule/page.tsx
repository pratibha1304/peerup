"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  createScheduleRequest,
  confirmScheduleRequest,
  declineScheduleRequest,
  listenToIncomingScheduleRequests,
  listenToConfirmedSchedules,
  listenToSentRequests,
  type ScheduleRequest,
} from '@/lib/scheduling';
import { Timestamp } from 'firebase/firestore';
import { Calendar, Clock, X, User, CheckCircle2, Video, ExternalLink } from 'lucide-react';

// ----------------------------------------------------------------------
// 1. The Main Logic Component (Renamed from SchedulePage to ScheduleContent)
// ----------------------------------------------------------------------

function ScheduleContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'incoming' | 'confirmed' | 'sent'>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<ScheduleRequest[]>([]);
  const [confirmedSchedules, setConfirmedSchedules] = useState<ScheduleRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ScheduleRequest[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [proposedTimes, setProposedTimes] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = searchParams.get('user');
    const userName = searchParams.get('name');

    if (userId && userName) {
      setSelectedUser({ id: userId, name: userName });
      setShowScheduleModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    const unsubIncoming = listenToIncomingScheduleRequests(user.uid, (requests) => {
      setIncomingRequests(requests);
    });

    const unsubConfirmed = listenToConfirmedSchedules(user.uid, (schedules) => {
      setConfirmedSchedules(schedules);
    });

    const unsubSent = listenToSentRequests(user.uid, (requests) => {
      setSentRequests(requests);
    });

    return () => {
      unsubIncoming();
      unsubConfirmed();
      unsubSent();
    };
  }, [user]);

  const handleProposeSchedule = async () => {
    if (!user || !selectedUser) return;

    const timestamps = proposedTimes
      .filter((time) => time !== '')
      .map((time) => Timestamp.fromDate(new Date(time)));

    if (timestamps.length === 0) {
      alert('Please select at least one time slot');
      return;
    }

    setLoading(true);
    try {
      await createScheduleRequest(
        user.uid,
        user.name,
        selectedUser.id,
        selectedUser.name,
        timestamps
      );
      setShowScheduleModal(false);
      setProposedTimes(['', '', '']);
      alert('Schedule request sent!');
    } catch (error) {
      console.error('Error creating schedule request:', error);
      alert('Failed to send schedule request');
    } finally {
      setLoading(false);
    }
  };

  const [showMeetingLinkModal, setShowMeetingLinkModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<Timestamp | null>(null);
  const [meetingLink, setMeetingLink] = useState("");

  const handleConfirm = async (requestId: string, time: Timestamp) => {
    setSelectedRequestId(requestId);
    setSelectedTime(time);
    setMeetingLink("");
    setShowMeetingLinkModal(true);
  };

  const handleConfirmWithLink = async () => {
    if (!selectedRequestId || !selectedTime) return;
    
    setLoading(true);
    try {
      // Generate Google Meet link if not provided
      let finalMeetingLink = meetingLink.trim();
      
      if (!finalMeetingLink) {
        // Create a simple Google Meet link (user will need to create the meeting)
        // Alternative: Use Google Calendar API to create event with Meet link
        finalMeetingLink = `https://meet.google.com/new?hs=122&authuser=0`;
      } else if (!finalMeetingLink.startsWith("http")) {
        // If it's just a meeting code, format it as a full URL
        if (finalMeetingLink.includes("meet.google.com")) {
          finalMeetingLink = `https://${finalMeetingLink}`;
        } else {
          finalMeetingLink = `https://meet.google.com/${finalMeetingLink}`;
        }
      }
      
      await confirmScheduleRequest(selectedRequestId, selectedTime, finalMeetingLink);
      setShowMeetingLinkModal(false);
      setSelectedRequestId(null);
      setSelectedTime(null);
      setMeetingLink("");
    } catch (error) {
      console.error('Error confirming schedule:', error);
      alert('Failed to confirm schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (requestId: string) => {
    setLoading(true);
    try {
      await declineScheduleRequest(requestId);
    } catch (error) {
      console.error('Error declining schedule:', error);
      alert('Failed to decline schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getOtherParticipantName = (request: ScheduleRequest) => {
    if (request.requesterId === user?.uid) {
      return request.receiverName;
    }
    return request.requesterName;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="w-8 h-8 text-indigo-500" />
        My Sessions
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'incoming'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Incoming Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'confirmed'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Confirmed {confirmedSchedules.length > 0 && `(${confirmedSchedules.length})`}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'sent'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sent Requests {sentRequests.length > 0 && `(${sentRequests.length})`}
        </button>
      </div>

      {/* Incoming Requests */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border">
              <p className="text-gray-500">No incoming schedule requests</p>
            </div>
          ) : (
            incomingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-2xl border p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold">
                      {request.requesterName} wants to schedule a call
                    </h3>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">Select one of the proposed times:</p>

                <div className="space-y-2">
                  {request.proposedTimes.map((time, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {formatTimestamp(time)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleConfirm(request.id, time)}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleDecline(request.id)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Decline All
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmed Schedules */}
      {activeTab === 'confirmed' && (
        <div className="space-y-4">
          {confirmedSchedules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border">
              <p className="text-gray-500">No confirmed schedules</p>
            </div>
          ) : (
            confirmedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-2xl border p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold">
                        Scheduled with {getOtherParticipantName(schedule)}
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      {schedule.confirmedTime && formatTimestamp(schedule.confirmedTime)}
                    </p>
                    {schedule.meetingLink && (
                      <a
                        href={schedule.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Video className="w-4 h-4" />
                        Join Meeting
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent Requests */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border">
              <p className="text-gray-500">No sent schedule requests</p>
            </div>
          ) : (
            sentRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-2xl border p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-lg font-semibold">
                        To: {request.receiverName}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`font-medium ${
                        request.status === 'confirmed' ? 'text-green-600' :
                        request.status === 'declined' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {request.status}
                      </span>
                    </p>
                    {request.confirmedTime && (
                      <p className="text-sm text-gray-600 mt-1">
                        Confirmed for: {formatTimestamp(request.confirmedTime)}
                      </p>
                    )}
                    {request.meetingLink && (
                      <a
                        href={request.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Video className="w-4 h-4" />
                        Join Meeting
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Meeting Link Modal */}
      {showMeetingLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Confirm Schedule</h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Add a meeting link (Google Meet, Zoom, etc.) or leave blank to generate a Google Meet link.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link (optional)
              </label>
              <input
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx or leave blank"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-2"
              />
              <p className="text-xs text-gray-500">
                Tip: Leave blank to get a Google Meet link, or paste your Zoom/Teams link
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMeetingLinkModal(false);
                  setSelectedRequestId(null);
                  setSelectedTime(null);
                  setMeetingLink("");
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithLink}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">
              Schedule a call with {selectedUser.name}
            </h3>

            <p className="text-gray-600 mb-6">
              Propose up to 3 time slots. {selectedUser.name} will pick one.
            </p>

            <div className="space-y-4 mb-6">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time slot {index + 1}
                  </label>
                  <input
                    type="datetime-local"
                    value={proposedTimes[index]}
                    onChange={(e) => {
                      const newTimes = [...proposedTimes];
                      newTimes[index] = e.target.value;
                      setProposedTimes(newTimes);
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProposeSchedule}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. The New Default Export wrapped in Suspense
// ----------------------------------------------------------------------
export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center h-96">
        <div className="text-gray-500 text-lg">Loading schedule...</div>
      </div>
    }>
      <ScheduleContent />
    </Suspense>
  );
}