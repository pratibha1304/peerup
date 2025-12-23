import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc,
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
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  edited?: boolean;
  deleted?: boolean;
};

function getDeterministicChatId(a: string, b: string) {
  return [a, b].sort().join('_');
}

export async function getOrCreateChat(currentUid: string, otherUid: string) {
  const chatId = getDeterministicChatId(currentUid, otherUid);
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    // Fetch user names
    const [currentUserDoc, otherUserDoc] = await Promise.all([
      getDoc(doc(db, 'users', currentUid)),
      getDoc(doc(db, 'users', otherUid))
    ]);
    const currentUserName = currentUserDoc.exists() ? currentUserDoc.data()?.name : 'Unknown User';
    const otherUserName = otherUserDoc.exists() ? otherUserDoc.data()?.name : 'Unknown User';
    
    await setDoc(chatRef, {
      participants: [currentUid, otherUid],
      participantNames: [currentUserName, otherUserName],
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
  const receiverId = participants.find((uid) => uid !== senderId);
  
  participants.forEach((uid) => {
    unreadUpdates[`unreadCounts.${uid}`] = uid === senderId ? 0 : increment(1);
  });
  await updateDoc(chatRef, {
    lastMessage: text,
    lastMessageTimestamp: serverTimestamp(),
    lastMessageSenderId: senderId,
    ...unreadUpdates,
  });

  // Send email notification to receiver
  if (receiverId) {
    try {
      const [senderDoc, receiverDoc] = await Promise.all([
        getDoc(doc(db, 'users', senderId)),
        getDoc(doc(db, 'users', receiverId))
      ]);
      
      const senderData = senderDoc.exists() ? senderDoc.data() : null;
      const receiverData = receiverDoc.exists() ? receiverDoc.data() : null;
      
      if (receiverData?.email) {
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_message',
            data: {
              to: receiverData.email,
              toName: receiverData.name || 'User',
              fromName: senderData?.name || 'Someone',
              message: text.length > 100 ? text.substring(0, 100) + '...' : text,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/chats?u=${senderId}`
            }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Email API error:', response.status, errorData);
        } else {
          console.log('✅ Email notification sent for new message');
        }
      }
    } catch (error) {
      console.error('❌ Failed to send message email notification:', error);
    }
  }
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

export async function editMessage(chatId: string, messageId: string, newText: string) {
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(messageRef, {
    text: newText,
    edited: true,
  });
  
  // Update chat last message if this was the last message
  const chatRef = doc(db, 'chats', chatId);
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
  const lastMsgSnapshot = await getDocs(messagesQuery);
  
  if (!lastMsgSnapshot.empty && lastMsgSnapshot.docs[0].id === messageId) {
    await updateDoc(chatRef, {
      lastMessage: newText,
    });
  }
}

export async function deleteMessage(chatId: string, messageId: string) {
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(messageRef, {
    text: '[Message deleted]',
    deleted: true,
  });
  
  // Update chat last message if this was the last message
  const chatRef = doc(db, 'chats', chatId);
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
  const lastMsgSnapshot = await getDocs(messagesQuery);
  
  if (!lastMsgSnapshot.empty && lastMsgSnapshot.docs[0].id === messageId) {
    // Find the previous message
    const prevMessagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(2));
    const prevMsgsSnapshot = await getDocs(prevMessagesQuery);
    const prevMsg = prevMsgsSnapshot.docs.find(d => d.id !== messageId);
    
    if (prevMsg) {
      const prevMsgData = prevMsg.data();
      await updateDoc(chatRef, {
        lastMessage: prevMsgData.deleted ? '[Message deleted]' : prevMsgData.text,
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: '',
      });
    }
  }
}

export async function sendMessageWithFile(chatId: string, senderId: string, text: string, fileUrl?: string, fileName?: string, imageUrl?: string) {
  const msgsRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(msgsRef, {
    text,
    senderId,
    timestamp: serverTimestamp(),
    ...(fileUrl && { fileUrl, fileName }),
    ...(imageUrl && { imageUrl }),
  });

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  const chatData = chatSnap.exists() ? (chatSnap.data() as Chat) : null;
  const participants = chatData?.participants || [];
  const unreadUpdates: Record<string, any> = {};
  const receiverId = participants.find((uid) => uid !== senderId);
  
  const displayText = imageUrl ? '[Image]' : (fileUrl ? `[File: ${fileName || 'attachment'}]` : text);
  
  participants.forEach((uid) => {
    unreadUpdates[`unreadCounts.${uid}`] = uid === senderId ? 0 : increment(1);
  });
  await updateDoc(chatRef, {
    lastMessage: displayText,
    lastMessageTimestamp: serverTimestamp(),
    lastMessageSenderId: senderId,
    ...unreadUpdates,
  });

  // Send email notification to receiver
  if (receiverId) {
    try {
      const [senderDoc, receiverDoc] = await Promise.all([
        getDoc(doc(db, 'users', senderId)),
        getDoc(doc(db, 'users', receiverId))
      ]);
      
      const senderData = senderDoc.exists() ? senderDoc.data() : null;
      const receiverData = receiverDoc.exists() ? receiverDoc.data() : null;
      
      if (receiverData?.email) {
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_message',
            data: {
              to: receiverData.email,
              toName: receiverData.name || 'User',
              fromName: senderData?.name || 'Someone',
              message: displayText.length > 100 ? displayText.substring(0, 100) + '...' : displayText,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/chats?u=${senderId}`
            }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Email API error:', response.status, errorData);
        } else {
          console.log('✅ Email notification sent for new message');
        }
      }
    } catch (error) {
      console.error('❌ Failed to send message email notification:', error);
    }
  }
}


