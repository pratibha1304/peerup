# User Guide: Connecting Google Calendar

This guide explains how end users can connect their Google Calendar to automatically create events when scheduling calls.

## How It Works

When you connect your Google Calendar:
- ✅ Calendar events are automatically created when you confirm scheduled calls
- ✅ Google Meet links are automatically generated and added to events
- ✅ Your partner receives the meeting link automatically
- ✅ Events appear in your Google Calendar

## Step-by-Step: Connecting Your Calendar

### Step 1: Go to Settings

1. Log in to your PeerUp account
2. Click on **Settings** in the dashboard (or navigate to `/dashboard/settings`)
3. You'll see the **Google Calendar Integration** section

### Step 2: Connect Your Calendar

1. Click the **"Connect Google Calendar"** button
2. You'll be redirected to Google's authorization page
3. **Sign in** with the Google account that has the calendar you want to connect
4. Review the permissions:
   - **See, edit, share, and permanently delete all the calendars you can access using Google Calendar**
   - **Make changes to events**
5. Click **"Allow"** to grant permissions

### Step 3: Authorization Complete

1. After clicking "Allow", you'll be redirected back to PeerUp
2. You'll see a success message: **"Google Calendar connected successfully!"**
3. The settings page will show:
   - ✅ **"Calendar Connected"** status (green)
   - A **"Disconnect"** button if you want to remove the connection later

## What Happens Next?

### Automatic Event Creation

When you **confirm a scheduled call**:

1. Go to **Schedule** → **Incoming Requests**
2. Click **"Confirm"** on a schedule request
3. In the confirmation modal:
   - If your calendar is connected, you can **leave the meeting link blank**
   - The app will automatically:
     - Create a Google Calendar event
     - Generate a Google Meet link
     - Add both participants as attendees
     - Set the event time to the confirmed schedule time

### Manual Meeting Link (Optional)

If you prefer to use a different meeting platform:
- You can still enter a custom meeting link (Zoom, Teams, etc.)
- The calendar event will still be created with your custom link

## Disconnecting Your Calendar

If you want to disconnect your Google Calendar:

1. Go to **Settings** → **Google Calendar Integration**
2. Click the **"Disconnect"** button
3. Confirm the disconnection
4. Your calendar tokens will be removed
5. You'll need to reconnect if you want automatic event creation again

## Troubleshooting

### "Google Calendar integration is not configured"

**Problem:** The app shows this error when trying to connect.

**Solution:** This means the app administrator hasn't set up the Google OAuth credentials yet. Contact support.

### "Redirect URI mismatch"

**Problem:** Google shows an error about redirect URI.

**Solution:** The app administrator needs to add your app's URL to the authorized redirect URIs in Google Cloud Console. Contact support.

### Calendar events not being created

**Possible causes:**
1. **Calendar not connected**: Check Settings to verify connection status
2. **Tokens expired**: Try disconnecting and reconnecting your calendar
3. **Permissions revoked**: You may have revoked access in your Google account settings

**Solution:**
1. Go to Settings and check if calendar is connected
2. If not connected, reconnect your calendar
3. If still not working, try disconnecting and reconnecting

### "Access blocked: This app's request is invalid"

**Problem:** Google blocks the authorization request.

**Possible causes:**
- The app is in testing mode and your email isn't added as a test user
- The OAuth consent screen isn't properly configured

**Solution:** Contact support. The app administrator needs to:
- Add your email as a test user (if in testing mode)
- Or publish the app for public use

## Privacy & Security

### What Permissions Are Requested?

The app requests these Google Calendar permissions:
- **View your calendars**: To create events in your calendar
- **Edit your events**: To add events with meeting links

### What Data Is Stored?

- **Access Token**: Used to create calendar events (expires in 1 hour)
- **Refresh Token**: Used to get new access tokens when they expire
- **Token Expiry Date**: To know when to refresh tokens

**All tokens are stored securely in Firestore** and are only accessible by you.

### Can I Revoke Access?

Yes! You can revoke access in two ways:

1. **In PeerUp**: Go to Settings → Disconnect Calendar
2. **In Google**: 
   - Go to [Google Account Settings](https://myaccount.google.com/permissions)
   - Find "PeerUp" in the list
   - Click "Remove access"

## Frequently Asked Questions

### Q: Do I need a Google account?

**A:** Yes, you need a Google account with a Google Calendar to use this feature.

### Q: Can I use a different calendar (Outlook, Apple Calendar)?

**A:** Currently, only Google Calendar is supported. We may add support for other calendars in the future.

### Q: Will events be created automatically for all scheduled calls?

**A:** Events are only created when:
- Your calendar is connected
- You confirm a schedule request
- You leave the meeting link blank (to auto-generate) or provide a custom link

### Q: Can I edit the calendar events after they're created?

**A:** Yes! The events are created in your Google Calendar, so you can edit them like any other calendar event.

### Q: What if I disconnect my calendar?

**A:** 
- Existing calendar events remain in your Google Calendar
- New events won't be automatically created
- You can still manually add meeting links when confirming schedules
- You can reconnect anytime

### Q: Is my Google account password shared with PeerUp?

**A:** No! We use OAuth 2.0, which means:
- You sign in directly with Google
- We never see your password
- We only get permission to create calendar events
- You can revoke access anytime

## Need Help?

If you're having trouble connecting your calendar:
1. Check this guide for common issues
2. Try disconnecting and reconnecting
3. Contact support if the problem persists

---

**Note for Administrators:** Make sure you've completed the setup in `GOOGLE_CALENDAR_SETUP.md` and `ENV_VARIABLES_SETUP.md` before users can connect their calendars.

