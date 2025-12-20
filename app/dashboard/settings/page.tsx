"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { hasCalendarConnection, deleteCalendarTokens } from '@/lib/google-calendar';
import { Calendar, CheckCircle2, X, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (user) {
      checkCalendarConnection();
    }
  }, [user]);

  const checkCalendarConnection = async () => {
    if (!user) return;
    try {
      const connected = await hasCalendarConnection(user.uid);
      setCalendarConnected(connected);
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendar = () => {
    if (!user) return;
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert('Google Calendar integration is not configured. Please contact support.');
      return;
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
    const responseType = 'code';
    const accessType = 'offline'; // Required to get refresh token
    const prompt = 'consent'; // Force consent screen to get refresh token
    
    // Pass userId in state parameter
    const state = user.uid;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=${accessType}&` +
      `prompt=${prompt}&` +
      `state=${encodeURIComponent(state)}`;

    window.location.href = authUrl;
  };

  const handleDisconnectCalendar = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to disconnect Google Calendar? You will need to reconnect to automatically create calendar events.'
    );
    
    if (!confirmed) return;

    setDisconnecting(true);
    try {
      await deleteCalendarTokens(user.uid);
      setCalendarConnected(false);
      alert('Google Calendar disconnected successfully.');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      alert('Failed to disconnect calendar. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  // Check for OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const success = params.get('calendar_connected');
    
    if (error) {
      alert(`Calendar connection error: ${error}`);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
    
    if (success === 'true') {
      setCalendarConnected(true);
      alert('Google Calendar connected successfully!');
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-indigo-500" />
            <div>
              <h2 className="text-xl font-semibold">Google Calendar Integration</h2>
              <p className="text-sm text-gray-600">
                Connect your Google Calendar to automatically create events with Meet links when scheduling calls
              </p>
            </div>
          </div>
        </div>

        {calendarConnected ? (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Calendar Connected</span>
              </div>
              <button
                onClick={handleDisconnectCalendar}
                disabled={disconnecting}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Your calendar is connected. Events will be automatically created when you confirm scheduled calls.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <button
              onClick={handleConnectCalendar}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Connect Google Calendar
            </button>
            <p className="text-sm text-gray-600 mt-2">
              You'll be redirected to Google to authorize calendar access. This allows PeerUp to create calendar events automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
