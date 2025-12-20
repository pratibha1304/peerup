"use client";
import { useEffect, useMemo, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getOrCreateChat, listenToMessages, listenToUserChats, sendMessage, markChatAsRead } from '@/lib/chat';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';

function ChatsContent() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!currentChatId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    const unsub = listenToMessages(currentChatId, (msgs) => {
      setMessages(msgs);
      setMessagesLoading(false);
      // Scroll to bottom when messages load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => {
      unsub();
      setMessagesLoading(false);
    };
  }, [currentChatId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!user || !currentChatId || !input.trim()) return;
    await sendMessage(currentChatId, user.uid, input.trim());
    setInput('');
    // Scroll to bottom after sending
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-2xl border h-full flex flex-col overflow-hidden">
        {!currentChatId ? (
          // Chat List View
          <div className="flex flex-col h-full">
            <div className="px-4 py-4 border-b">
              <h2 className="text-xl font-semibold">Your Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1 p-2">
                {chats.map((c) => {
                  const otherId = (c.participants || []).find((p: string) => p !== user?.uid) || '';
                  const otherName = userNames[otherId] || otherId;
                  const unread = c.unreadCounts?.[user?.uid || ''] || 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() => openChat(c.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        currentChatId === c.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold">
                          {otherName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium text-gray-900 truncate">{otherName}</div>
                          {unread > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 text-xs font-semibold bg-red-500 text-white rounded-full px-1.5 flex-shrink-0">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {c.lastMessage || 'No messages yet'}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {chats.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-sm text-gray-500">No chats yet. Start one from Matches.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Messages View
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <button
                onClick={() => setCurrentChatId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to chats"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              {(() => {
                const otherId = chats.find(c => c.id === currentChatId)?.participants?.find((p: string) => p !== user?.uid) || '';
                const otherName = userNames[otherId] || otherId;
                return (
                  <>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-semibold">
                        {otherName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{otherName}</div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50">
              {messagesLoading && messages.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading messages...</div>
              ) : (
                <>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${(m.senderId === user?.uid || m.senderUid === user?.uid) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                          (m.senderId === user?.uid || m.senderUid === user?.uid)
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {!messagesLoading && messages.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-8">No messages. Say hello!</div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t bg-white">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-6 py-2 rounded-full bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
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