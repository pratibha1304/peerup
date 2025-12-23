"use client";
import { useEffect, useMemo, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getOrCreateChat, listenToMessages, listenToUserChats, sendMessage, markChatAsRead, editMessage, deleteMessage, sendMessageWithFile } from '@/lib/chat';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Edit2, Trash2, Image as ImageIcon, Paperclip, X } from 'lucide-react';

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const otherUidFromQuery = params?.get('u') || null;

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
    if (!user || !currentChatId) {
      alert('Please select a chat first');
      return;
    }
    
    if (selectedImage) {
      setUploadingFile(true);
      try {
        console.log('Uploading image:', selectedImage.name, selectedImage.size);
        const imageRef = ref(storage, `chat-images/${user.uid}/${Date.now()}-${selectedImage.name}`);
        console.log('Uploading to:', imageRef.fullPath);
        await uploadBytes(imageRef, selectedImage);
        console.log('Upload complete, getting download URL...');
        const imageUrl = await getDownloadURL(imageRef);
        console.log('Image URL:', imageUrl);
        await sendMessageWithFile(currentChatId, user.uid, input.trim() || '[Image]', undefined, undefined, imageUrl);
        setInput('');
        setSelectedImage(null);
        // Reset file inputs
        if (imageInputRef.current) imageInputRef.current.value = '';
      } catch (error: any) {
        console.error('Error uploading image:', error);
        const errorMsg = error.message || 'Failed to upload image. Please check your connection and try again.';
        alert(errorMsg);
      } finally {
        setUploadingFile(false);
      }
    } else if (selectedFile) {
      setUploadingFile(true);
      try {
        console.log('Uploading file:', selectedFile.name, selectedFile.size);
        const fileRef = ref(storage, `chat-files/${user.uid}/${Date.now()}-${selectedFile.name}`);
        console.log('Uploading to:', fileRef.fullPath);
        await uploadBytes(fileRef, selectedFile);
        console.log('Upload complete, getting download URL...');
        const fileUrl = await getDownloadURL(fileRef);
        console.log('File URL:', fileUrl);
        await sendMessageWithFile(currentChatId, user.uid, input.trim() || `[File: ${selectedFile.name}]`, fileUrl, selectedFile.name);
        setInput('');
        setSelectedFile(null);
        // Reset file inputs
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error: any) {
        console.error('Error uploading file:', error);
        const errorMsg = error.message || 'Failed to upload file. Please check your connection and try again.';
        alert(errorMsg);
      } finally {
        setUploadingFile(false);
      }
    } else if (input.trim()) {
      await sendMessage(currentChatId, user.uid, input.trim());
      setInput('');
    }
    
    // Scroll to bottom after sending
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEdit = (message: any) => {
    setEditingMessageId(message.id);
    setEditText(message.text);
  };

  const handleSaveEdit = async () => {
    if (!currentChatId || !editingMessageId || !editText.trim()) return;
    try {
      await editMessage(currentChatId, editingMessageId, editText.trim());
      setEditingMessageId(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message. Please try again.');
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!currentChatId) return;
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(currentChatId, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB for images, 50MB for files)
      const maxImageSize = 10 * 1024 * 1024; // 10MB
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      
      if (file.type.startsWith('image/')) {
        if (file.size > maxImageSize) {
          alert('Image size must be less than 10MB');
          e.target.value = ''; // Reset input
          return;
        }
        setSelectedImage(file);
        setSelectedFile(null);
      } else {
        if (file.size > maxFileSize) {
          alert('File size must be less than 50MB');
          e.target.value = ''; // Reset input
          return;
        }
        setSelectedFile(file);
        setSelectedImage(null);
      }
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
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
                  {messages.map((m) => {
                    const isOwnMessage = m.senderId === user?.uid || m.senderUid === user?.uid;
                    const isEditing = editingMessageId === m.id;
                    
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`max-w-[75%] ${isOwnMessage ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl text-sm relative ${
                              isOwnMessage
                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                            } ${m.deleted ? 'opacity-60 italic' : ''}`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="bg-white text-gray-800 px-2 py-1 rounded border"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEdit();
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingMessageId(null);
                                      setEditText('');
                                    }
                                  }}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(null);
                                      setEditText('');
                                    }}
                                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="text-xs px-2 py-1 bg-indigo-600 text-white rounded"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {m.imageUrl && (
                                  <img src={m.imageUrl} alt="Shared image" className="max-w-full h-auto rounded-lg mb-2" />
                                )}
                                {m.fileUrl && (
                                  <a
                                    href={m.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mb-2 text-blue-400 hover:underline flex items-center gap-2"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                    {m.fileName || 'Download file'}
                                  </a>
                                )}
                                <div>{m.deleted ? '[Message deleted]' : m.text}</div>
                                {m.edited && !m.deleted && (
                                  <div className="text-xs opacity-70 mt-1">(edited)</div>
                                )}
                              </>
                            )}
                          </div>
                          {isOwnMessage && !isEditing && !m.deleted && (
                            <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(m)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                                title="Edit message"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="p-1 rounded hover:bg-gray-200 text-red-600"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!messagesLoading && messages.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-8">No messages. Say hello!</div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t bg-white">
              {(selectedFile || selectedImage) && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                  <span className="text-sm text-gray-600">
                    {selectedImage ? `Image: ${selectedImage.name}` : `File: ${selectedFile?.name}`}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setSelectedImage(null);
                    }}
                    className="ml-auto p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                    title="Upload image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                    title="Upload file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedFile && !selectedImage) || uploadingFile}
                  className="px-6 py-2 rounded-full bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                >
                  {uploadingFile ? 'Uploading...' : 'Send'}
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