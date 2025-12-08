"use client";
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getOrCreateChat, listenToMessages, listenToUserChats, sendMessage, markChatAsRead } from '@/lib/chat';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function ChatsContent() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const otherUidFromQuery = params.get('u');

  useEffect(() => {
    if (!user) return;
    const unsub = listenToUserChats(user.uid, setChats);
    return () => unsub();
  }, [user]);

  // Load user names for chat participants
  useEffect(() => {
    const loadNames = async () => {
      const userIds = new Set<string>();
      chats.forEach((chat) => {
        (chat.participants || []).forEach((uid: string) => {
          if (uid !== user?.uid && !userNames[uid]) {
            userIds.add(uid);
          }
        });
      });
      if (userIds.size === 0) return;

      const entries: [string, string][] = [];
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) {
              const d = snap.data() as any;
              entries.push([uid, d.name || d.displayName || uid]);
            } else {
              entries.push([uid, uid]);
            }
          } catch (e) {
            entries.push([uid, uid]);
          }
        })
      );
      setUserNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };
    if (chats.length > 0) {
      loadNames();
    }
  }, [chats, user, userNames]);

  useEffect(() => {
    if (!user) return;
    if (otherUidFromQuery) {
      getOrCreateChat(user.uid, otherUidFromQuery).then((id) => setCurrentChatId(id));
    }
  }, [user, otherUidFromQuery]);

  useEffect(() => {
    if (!currentChatId) return;
    const unsub = listenToMessages(currentChatId, setMessages);
    return () => unsub();
  }, [currentChatId]);

  const handleSend = async () => {
    if (!user || !currentChatId || !input.trim()) return;
    await sendMessage(currentChatId, user.uid, input.trim());
    setInput('');
  };

  const openChat = (chatId: string) => {
    setCurrentChatId(chatId);
    if (user) {
      markChatAsRead(chatId, user.uid).catch((err) => console.error('Failed to mark chat as read', err));
    }
  };

  useEffect(() => {
    if (user && currentChatId) {
      markChatAsRead(currentChatId, user.uid).catch((err) => console.error('Failed to mark chat as read', err));
    }
  }, [user, currentChatId]);

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white rounded-2xl border p-4 h-[70vh] overflow-y-auto">
        <h2 className="font-semibold mb-3">Your Chats</h2>
        <div className="space-y-2">
          {chats.map((c) => {
            const otherId = (c.participants || []).find((p: string) => p !== user?.uid) || '';
            const otherName = userNames[otherId] || otherId;
            const unread = c.unreadCounts?.[user?.uid || ''] || 0;
            return (
              <button
                key={c.id}
                onClick={() => openChat(c.id)}
                className={`w-full text-left px-3 py-2 rounded-xl border transition-colors flex flex-col gap-1 ${
                  currentChatId === c.id ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-gray-800">{otherName}</div>
                  {unread > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 text-xs font-semibold bg-red-500 text-white rounded-full px-1">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">{c.lastMessage || 'No messages yet'}</div>
              </button>
            );
          })}
          {chats.length === 0 && (
            <div className="text-sm text-gray-500">No chats yet. Start one from Matches.</div>
          )}
        </div>
      </div>

      <div className="md:col-span-2 bg-white rounded-2xl border p-4 h-[70vh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${(m.senderId === user?.uid || m.senderUid === user?.uid) ? 'ml-auto bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {m.text}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-gray-500">No messages. Say hello!</div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={currentChatId ? 'Type a message...' : 'Select or start a chat'}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2"
          />
          <button
            onClick={handleSend}
            disabled={!currentChatId || !input.trim()}
            className="px-4 py-2 rounded-xl bg-pear text-black disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ChatsContent />
    </Suspense>
  );
}