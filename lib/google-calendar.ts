import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface GoogleCalendarTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

/**
 * Store Google Calendar OAuth tokens for a user
 */
export async function storeCalendarTokens(
  userId: string,
  tokens: GoogleCalendarTokens
): Promise<void> {
  const tokensRef = doc(db, 'userCalendarTokens', userId);
  await setDoc(tokensRef, {
    ...tokens,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Get Google Calendar OAuth tokens for a user
 */
export async function getCalendarTokens(
  userId: string
): Promise<GoogleCalendarTokens | null> {
  const tokensRef = doc(db, 'userCalendarTokens', userId);
  const tokensDoc = await getDoc(tokensRef);
  
  if (!tokensDoc.exists()) {
    return null;
  }
  
  return tokensDoc.data() as GoogleCalendarTokens;
}

/**
 * Check if tokens are expired and need refresh
 */
export function areTokensExpired(tokens: GoogleCalendarTokens): boolean {
  return Date.now() >= tokens.expiryDate;
}

/**
 * Delete calendar tokens (disconnect)
 */
export async function deleteCalendarTokens(userId: string): Promise<void> {
  const tokensRef = doc(db, 'userCalendarTokens', userId);
  await updateDoc(tokensRef, {
    accessToken: '',
    refreshToken: '',
    expiryDate: 0,
  });
}

/**
 * Check if user has connected Google Calendar
 */
export async function hasCalendarConnection(userId: string): Promise<boolean> {
  const tokens = await getCalendarTokens(userId);
  return tokens !== null && tokens.accessToken !== '' && tokens.refreshToken !== '';
}

