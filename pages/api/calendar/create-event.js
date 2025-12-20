import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Create Google Calendar Event with Meet Link
 * 
 * This endpoint creates a calendar event when a video call is scheduled.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, title, description, startTime, endTime, attendees } = req.body;

  if (!userId || !title || !startTime || !endTime) {
    return res.status(400).json({ 
      error: 'Missing required fields: userId, title, startTime, endTime' 
    });
  }

  try {
    // Get user's calendar tokens
    const tokensRef = doc(db, 'userCalendarTokens', userId);
    const tokensDoc = await getDoc(tokensRef);

    if (!tokensDoc.exists()) {
      return res.status(401).json({ 
        error: 'Google Calendar not connected. Please connect your calendar first.' 
      });
    }

    const tokens = tokensDoc.data();
    
    // Check if tokens are expired and refresh if needed
    let accessToken = tokens.accessToken;
    if (Date.now() >= tokens.expiryDate) {
      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: tokens.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        return res.status(401).json({ 
          error: 'Failed to refresh calendar access. Please reconnect your Google Calendar.' 
        });
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      // Update stored tokens
      const newExpiryDate = Date.now() + (refreshData.expires_in * 1000);
      await updateDoc(tokensRef, {
        accessToken: refreshData.access_token,
        expiryDate: newExpiryDate,
        updatedAt: new Date().toISOString(),
      });
    }

    // Create calendar event with Google Meet
    const event = {
      summary: title,
      description: description || 'Video call scheduled through PeerUp',
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      conferenceData: {
        createRequest: {
          requestId: `peerup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    // Add attendees if provided
    if (attendees && Array.isArray(attendees) && attendees.length > 0) {
      event.attendees = attendees.map(email => ({ email }));
    }

    // Create the event via Google Calendar API
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json().catch(() => ({}));
      console.error('Calendar API error:', errorData);
      return res.status(calendarResponse.status).json({ 
        error: 'Failed to create calendar event',
        details: errorData 
      });
    }

    const eventData = await calendarResponse.json();

    // Extract Meet link from conference data
    const meetLink = eventData.conferenceData?.entryPoints?.[0]?.uri || null;

    return res.status(200).json({
      success: true,
      eventId: eventData.id,
      meetLink,
      htmlLink: eventData.htmlLink,
      startTime: eventData.start.dateTime,
      endTime: eventData.end.dateTime,
    });
  } catch (error) {
    console.error('Create calendar event error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

