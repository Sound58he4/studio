import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Send, ArrowLeft, MessageCircle, X } from 'lucide-react';
import type { UserFriend } from '@/app/dashboard/types';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'friend';
  timestamp: Date;
}

interface FriendChatModalProps {
  friend: UserFriend;
  isOpen: boolean;
  onClose: () => void;
}

const FriendChatModal = ({ friend, isOpen, onClose }: FriendChatModalProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey! Ready for today's workout?`,
      sender: 'friend',
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateFriendResponse = (userMessage: string) => {
    const responses = [
      "That sounds awesome! Keep it up! 💪",
      "Great job on staying consistent!",
      "Let's crush our goals together!",
      "You're doing amazing! 🔥",
      "Thanks for the motivation!",
      "Let's workout together sometime!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'me',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const friendResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateFriendResponse(message),
        sender: 'friend',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, friendResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
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
          <Card className="w-full max-w-2xl max-h-[90vh] bg-white/95 backdrop-blur-sm flex flex-col border-0 shadow-2xl rounded-3xl overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200/50 p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full hover:bg-white/60">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {friend.photoURL ? (
                      <img src={friend.photoURL} alt={friend.displayName || 'F'} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      friendInitials
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{friend.displayName || 'Friend'}</h3>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full hover:bg-white/60">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 bg-gradient-to-br from-gray-50/30 to-blue-50/30">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-4">
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={`max-w-[75%] ${msg.sender === 'friend' ? 'flex items-start space-x-2' : ''}`}>
                        {msg.sender === 'friend' && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                            {friend.photoURL ? (
                              <img src={friend.photoURL} alt={friend.displayName || 'F'} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              friendInitials
                            )}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className={`p-3 rounded-2xl shadow-sm backdrop-blur-sm ${
                            msg.sender === 'friend'
                              ? 'bg-white/80 text-gray-800 rounded-tl-md border border-gray-200/50'
                              : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-tr-md ml-auto'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                          <p className={`text-xs mt-1 text-gray-500 ${msg.sender === 'me' ? 'text-right' : ''}`}>
                            {getTimeAgo(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div 
                      className="flex justify-start"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                          {friend.photoURL ? (
                            <img src={friend.photoURL} alt={friend.displayName || 'F'} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            friendInitials
                          )}
                        </div>                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl rounded-tl-md shadow-sm border border-gray-200/50">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="border-t border-gray-200/50 p-4 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={handleKeyPress}
                    className="pr-12 border-0 rounded-full bg-gray-100/80 focus:bg-white/90 focus:ring-2 focus:ring-purple-200 backdrop-blur-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isTyping}
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 disabled:opacity-50 transition-all duration-200"
                  >
                    <Send className="w-4 h-4 text-white" />
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
