"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getOrCreateChat, listenToMessages, listenToUserChats, sendMessage } from '@/lib/chat';

export default function ChatsPage() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const otherUidFromQuery = params.get('u');

  useEffect(() => {
    if (!user) return;
    const unsub = listenToUserChats(user.uid, setChats);
    return () => unsub();
  }, [user]);

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

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white rounded-2xl border p-4 h-[70vh] overflow-y-auto">
        <h2 className="font-semibold mb-3">Your Chats</h2>
        <div className="space-y-2">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCurrentChatId(c.id)}
              className={`w-full text-left px-3 py-2 rounded-xl border ${currentChatId === c.id ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <div className="text-sm text-gray-800">{c.id.replaceAll('_', ' · ')}</div>
              <div className="text-xs text-gray-500 truncate">{c.lastMessage || 'No messages yet'}</div>
            </button>
          ))}
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