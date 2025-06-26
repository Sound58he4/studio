import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Send, ArrowLeft, MessageCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateChatRoom, sendChatMessage } from '@/services/firestore/chatService';
import { collection, query, orderBy, onSnapshot, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase/exports';
import type { UserFriend, ChatMessage } from '@/app/dashboard/types';
import { motion, AnimatePresence } from 'framer-motion';

interface FriendChatModalProps {
  friend: UserFriend;
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

const FriendChatModal = ({ friend, isOpen, onClose, isDark = false }: FriendChatModalProps) => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat room and set up real-time message listener
  useEffect(() => {
    if (!isOpen || !userId || !friend.id) return;

    const initializeChat = async () => {
      try {
        setIsLoading(true);
        const newChatId = await getOrCreateChatRoom(userId, friend.id);
        setChatId(newChatId);

        // Set up real-time listener for messages
        const messagesRef = collection(db, 'chats', newChatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'), firestoreLimit(100));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedMessages: ChatMessage[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedMessages.push({
              id: doc.id,
              senderId: data.senderId,
              text: data.text,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
              isAI: false
            });
          });
          setMessages(fetchedMessages);
          setIsLoading(false);
        }, (error) => {
          console.error("[FriendChatModal] Error fetching messages:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load messages."
          });
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("[FriendChatModal] Error initializing chat:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not initialize chat."
        });
        setIsLoading(false);
      }
    };

    const cleanup = initializeChat();
    return () => {
      cleanup?.then(unsub => unsub?.());
    };
  }, [isOpen, userId, friend.id, toast]);

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId || !userId || isSending) return;

    const messageText = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      await sendChatMessage(chatId, userId, messageText);
      // The real-time listener will automatically update the messages
    } catch (error) {
      console.error("[FriendChatModal] Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message. Please try again."
      });
      // Restore the message on error
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const friendInitials = friend.displayName?.split(' ').map(n => n[0]).join('') || 'F';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className={`w-full max-w-2xl max-h-[90vh] backdrop-blur-sm flex flex-col border-0 shadow-2xl rounded-3xl overflow-hidden ${
            isDark ? 'bg-[#2a2a2a]/95' : 'bg-white/95'
          }`}>
            {/* Chat Header */}
            <CardHeader className={`flex flex-row items-center justify-between border-b p-4 ${
              isDark ? 'border-[#3a3a3a] bg-[#2a2a2a]' : 'border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-gray-50/80'
            }`}>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={onClose} className={`rounded-full ${
                  isDark ? 'hover:bg-[#3a3a3a]/60' : 'hover:bg-white/60'
                }`}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    isDark ? 'bg-blue-600' : 'bg-blue-400'
                  }`}>
                    {friend.photoURL ? (
                      <img src={friend.photoURL} alt={friend.displayName || 'F'} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      friendInitials
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{friend.displayName || 'Friend'}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Active now</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <Button variant="ghost" size="sm" onClick={onClose} className={`rounded-full ${
                  isDark ? 'hover:bg-[#3a3a3a]/60' : 'hover:bg-white/60'
                }`}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className={`flex-1 p-0 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-gradient-to-br from-gray-50/30 to-blue-50/30'
            }`}>
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                        isDark ? 'border-blue-400' : 'border-blue-600'
                      }`}></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Start your conversation with {friend.displayName}!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <motion.div 
                        key={msg.id} 
                        className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={`max-w-[75%] ${msg.senderId !== userId ? 'flex items-start space-x-2' : ''}`}>
                          {msg.senderId !== userId && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 ${
                              isDark ? 'bg-blue-600' : 'bg-blue-400'
                            }`}>
                              {friend.photoURL ? (
                                <img src={friend.photoURL} alt={friend.displayName || 'F'} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                friendInitials
                              )}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className={`p-3 rounded-2xl shadow-sm backdrop-blur-sm ${
                              msg.senderId !== userId
                                ? isDark ? 'bg-[#2a2a2a]/80 text-gray-100 rounded-tl-md border border-[#3a3a3a]/50' : 'bg-white/80 text-gray-800 rounded-tl-md border border-gray-200/50'
                                : isDark ? 'bg-blue-600 text-white rounded-tr-md ml-auto' : 'bg-blue-400 text-white rounded-tr-md ml-auto'
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'} ${msg.senderId === userId ? 'text-right' : ''}`}>
                              {getTimeAgo(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className={`border-t p-4 backdrop-blur-sm ${
              isDark 
                ? 'border-[#3a3a3a] bg-[#2a2a2a]/80' 
                : 'border-gray-200/50 bg-white/80'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={handleKeyPress}
                    disabled={isSending || isLoading || !chatId}
                    className={`pr-12 border-0 rounded-full backdrop-blur-sm ${
                      isDark 
                        ? 'bg-[#3a3a3a]/80 text-gray-100 placeholder:text-gray-400 focus:bg-[#3a3a3a]/90 focus:ring-2 focus:ring-blue-500/50' 
                        : 'bg-gray-100/80 focus:bg-white/90 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending || isLoading || !chatId}
                    size="icon"
                    className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full disabled:opacity-50 transition-all duration-200 ${
                      isDark 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Send className={`w-4 h-4 text-white ${isSending ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FriendChatModal;
