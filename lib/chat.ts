import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Timestamp,
  increment,
} from 'firebase/firestore';

export type Chat = {
  id: string;
  participants: string[]; // user uids
  lastMessage?: string;
  lastMessageAt?: Timestamp; // Legacy field for backward compatibility
  lastMessageTimestamp?: Timestamp;
  lastMessageSenderId?: string;
  unreadCounts?: Record<string, number>;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderUid?: string; // Legacy field for backward compatibility
  text: string;
  timestamp: Timestamp;
  createdAt?: Timestamp; // Legacy field for backward compatibility
};

function getDeterministicChatId(a: string, b: string) {
  return [a, b].sort().join('_');
}

export async function getOrCreateChat(currentUid: string, otherUid: string) {
  const chatId = getDeterministicChatId(currentUid, otherUid);
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    await setDoc(chatRef, {
      participants: [currentUid, otherUid],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadCounts: {
        [currentUid]: 0,
        [otherUid]: 0,
      },
    });
  }
  return chatId;
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const msgsRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(msgsRef, {
    text,
    senderId,
    timestamp: serverTimestamp(),
  });

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  const chatData = chatSnap.exists() ? (chatSnap.data() as Chat) : null;
  const participants = chatData?.participants || [];
  const unreadUpdates: Record<string, any> = {};
  participants.forEach((uid) => {
    unreadUpdates[`unreadCounts.${uid}`] = uid === senderId ? 0 : increment(1);
  });
  await updateDoc(chatRef, {
    lastMessage: text,
    lastMessageTimestamp: serverTimestamp(),
    lastMessageSenderId: senderId,
    ...unreadUpdates,
  });
}

export function listenToMessages(chatId: string, cb: (messages: ChatMessage[]) => void) {
  const msgsRef = collection(db, 'chats', chatId, 'messages');
  const qy = query(msgsRef, orderBy('timestamp', 'asc'));
  return onSnapshot(qy, (snap) => {
    const list: ChatMessage[] = snap.docs.map((d) => ({ id: d.id, chatId, ...(d.data() as any) }));
    cb(list);
  });
}

export function listenToUserChats(currentUid: string, cb: (chats: Chat[]) => void) {
  const chatsRef = collection(db, 'chats');
  // Query without orderBy to avoid index requirement - we'll sort in memory
  const qy = query(chatsRef, where('participants', 'array-contains', currentUid));
  return onSnapshot(qy, (snap) => {
    const list: Chat[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    // Sort by lastMessageTimestamp or lastMessageAt (backwards compatibility)
    list.sort((a, b) => {
      const timeA = (a.lastMessageTimestamp?.toMillis() || a.lastMessageAt?.toMillis() || 0);
      const timeB = (b.lastMessageTimestamp?.toMillis() || b.lastMessageAt?.toMillis() || 0);
      return timeB - timeA; // Descending order (newest first)
    });
    cb(list);
  });
}

export async function markChatAsRead(chatId: string, uid: string) {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`unreadCounts.${uid}`]: 0,
  });
}


