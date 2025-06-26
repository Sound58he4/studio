import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, MessageCircle, Heart, Send, ArrowLeft, MoreVertical, Phone, Video, Plus, UserPlus, Eye } from 'lucide-react';
import MobileNavigation from '@/components/MobileNavigation';

interface Friend {
  id: string;
  name: string;
  status: string;
  avatar: string;
  isOnline: boolean;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  hasHeart?: boolean;
}

const Friends = () => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Use a default theme for now - can be enhanced later with proper theme context
  const isDark = false;

  // View Profile handler
  const handleViewProfile = (friend: Friend, e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log('Viewing profile of', friend.name);
    router.push(`/friends/${friend.id}/summary`);
  };

  const friends: Friend[] = [{
    id: '1',
    name: 'Balasurya',
    status: 'Active now',
    avatar: 'B',
    isOnline: true,
    lastMessage: 'hi there im selva from selva corop tech company',
    timestamp: '7 days ago',
    unreadCount: 0
  }, {
    id: '2',
    name: 'Sarah Chen',
    status: 'Last seen 2h ago',
    avatar: 'S',
    isOnline: false,
    lastMessage: 'Great workout today!',
    timestamp: '2 hours ago',
    unreadCount: 2
  }, {
    id: '3',
    name: 'Mike Johnson',
    status: 'Active now',
    avatar: 'M',
    isOnline: true,
    lastMessage: 'Let\'s hit the gym tomorrow',
    timestamp: '1 day ago',
    unreadCount: 0
  }];

  const messages: Message[] = [{
    id: '1',
    text: 'hi there im selva from selva corop tech company',
    timestamp: '7 days ago',
    isOwn: false,
    hasHeart: true
  }, {
    id: '2',
    text: 'Hi',
    timestamp: '7 days ago',
    isOwn: true
  }, {
    id: '3',
    text: 'Hello',
    timestamp: '7 days ago',
    isOwn: true
  }, {
    id: '4',
    text: 'Hi',
    timestamp: '7 days ago',
    isOwn: true
  }, {
    id: '5',
    text: 'Dari',
    timestamp: '7 days ago',
    isOwn: true
  }, {
    id: '6',
    text: 'Dari',
    timestamp: '3 days ago',
    isOwn: true
  }];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    console.log('Sending message:', message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredFriends = friends.filter(friend => friend.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (selectedFriend) {
    return (
      <div className={`min-h-screen animate-fade-in transition-all duration-500 ${
        isDark 
          ? 'bg-[#0f0f0f]' 
          : 'bg-gradient-to-br from-clay-100 via-clayBlue to-clay-200'
      }`}>
        
        <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-80px)]">
          {/* Chat Header */}
          <div className={`backdrop-blur-sm border-0 p-4 m-3 mt-0 rounded-t-3xl shadow-lg animate-slide-down ${
            isDark 
              ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
              : 'bg-clayGlass shadow-clay'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  className={`backdrop-blur-sm border-0 transition-all duration-200 hover:scale-110 h-10 w-10 rounded-2xl ${
                    isDark 
                      ? 'bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a] hover:border-[#4a4a4a]' 
                      : 'bg-white/60 shadow-clayInset text-gray-600 hover:text-gray-800 hover:bg-white/80'
                  }`}
                  onClick={() => setSelectedFriend(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-clay text-white font-semibold">
                      {selectedFriend.avatar}
                    </div>
                    {selectedFriend.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-clayInset"></div>
                    )}
                  </div>
                  <div>
                    <h2 className={`font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>{selectedFriend.name}</h2>
                    <p className={`text-sm font-medium ${
                      selectedFriend.isOnline 
                        ? 'text-green-400' 
                        : isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {selectedFriend.status}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button className={`backdrop-blur-sm border-0 transition-all duration-200 hover:scale-110 h-10 w-10 rounded-2xl ${
                  isDark 
                    ? 'bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a] hover:border-[#4a4a4a]' 
                    : 'bg-white/60 shadow-clayInset text-gray-600 hover:text-gray-800 hover:bg-white/80'
                }`}>
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 backdrop-blur-sm mx-3 shadow-lg overflow-y-auto ${
            isDark 
              ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
              : 'bg-clayGlass shadow-clay'
          }`}>
            <div className="p-4 space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[80%] ${msg.isOwn ? '' : 'flex items-start space-x-2'}`}>
                    {!msg.isOwn && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-clay text-white text-sm font-semibold">
                        {selectedFriend.avatar}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className={`relative p-3 rounded-2xl shadow-lg ${
                        msg.isOwn 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-md ml-auto shadow-clay' 
                          : isDark 
                            ? 'bg-[#2a2a2a] text-gray-100 rounded-tl-md border border-[#3a3a3a]' 
                            : 'bg-white/60 text-gray-800 rounded-tl-md shadow-clayInset'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        {msg.hasHeart && (
                          <Heart className="absolute -bottom-1 -right-1 w-4 h-4 text-red-500 fill-current" />
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${
                        msg.isOwn 
                          ? isDark ? 'text-gray-400 text-right' : 'text-gray-500 text-right'
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className={`backdrop-blur-sm p-4 mx-3 mb-3 rounded-b-3xl shadow-lg border-t-0 animate-slide-up ${
            isDark 
              ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
              : 'bg-clayGlass shadow-clay'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Input 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Type a message..." 
                  onKeyDown={handleKeyPress} 
                  className={`pr-12 backdrop-blur-sm border-0 rounded-full h-12 text-sm transition-all duration-200 ${
                    isDark 
                      ? 'bg-[#2a2a2a] border border-[#3a3a3a] text-gray-100 focus:bg-[#3a3a3a] focus:border-[#4a4a4a]' 
                      : 'bg-white/60 shadow-clayInset focus:bg-white/80 focus:shadow-clay'
                  }`}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!message.trim()} 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-10 w-10 rounded-full shadow-clay transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
      isDark 
        ? 'bg-[#0f0f0f]' 
        : 'bg-gradient-to-br from-clay-100 via-clayBlue to-clay-200'
    }`}>
      
      <div className="max-w-md mx-auto px-3 py-4 space-y-4">
        {/* Header */}
        <div className={`backdrop-blur-sm rounded-3xl shadow-lg border-0 p-4 mb-6 animate-slide-down ${
          isDark 
            ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
            : 'bg-clayGlass shadow-clay'
        }`}>
          <div className="flex items-center space-x-3 justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-clay animate-scale-in">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>Friends</h1>
                <p className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Connect and chat with your fitness buddies</p>
              </div>
            </div>
            {/* Manage Button */}
            <Button 
              onClick={() => router.push('/friends/manage')} 
              className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-clay transition-all duration-300 hover:shadow-clayStrong hover:scale-105"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Manage
            </Button>
          </div>
        </div>

        {/* Friends List */}
        <div className={`backdrop-blur-sm rounded-3xl shadow-lg border-0 animate-scale-in ${
          isDark 
            ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
            : 'bg-clayGlass shadow-clay'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-[#2a2a2a]' : 'border-white/20'
          }`}>
            <div className="flex items-center space-x-2 text-base">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>Recent Chats</span>
            </div>
          </div>
          
          <div className="p-3 space-y-3">
            {filteredFriends.map((friend, index) => (
              <div
                key={friend.id}
                className={`backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-fade-in ${
                  isDark 
                    ? 'bg-[#252525] border border-[#3a3a3a] shadow-lg hover:bg-[#2a2a2a] hover:border-[#4a4a4a]' 
                    : 'bg-white/50 shadow-clayInset hover:shadow-clay hover:bg-white/60'
                }`}
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-clay text-white font-semibold text-lg">
                        {friend.avatar}
                      </div>
                      {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-clayInset"></div>
                      )}
                      {(friend.unreadCount && friend.unreadCount > 0) && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-clay">
                          {friend.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>{friend.name}</h4>
                        <span className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>{friend.timestamp}</span>
                      </div>
                      <p className={`text-sm font-medium mb-1 ${
                        friend.isOnline 
                          ? 'text-green-400' 
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {friend.status}
                      </p>
                      {friend.lastMessage && (
                        <p className={`text-sm truncate ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>{friend.lastMessage}</p>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 items-center ml-2">
                      {/* Chat Button */}
                      <Button 
                        className={`w-8 h-8 p-0 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                          isDark 
                            ? 'bg-[#3a3a3a] hover:bg-blue-600/80 border border-[#4a4a4a]' 
                            : 'bg-white/70 hover:bg-blue-100/80 shadow-clayInset'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFriend(friend);
                        }} 
                        aria-label="Chat"
                      >
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                      </Button>
                      {/* View Button */}
                      <Button 
                        className={`w-8 h-8 p-0 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                          isDark 
                            ? 'bg-[#3a3a3a] hover:bg-blue-600/80 border border-[#4a4a4a]' 
                            : 'bg-white/70 hover:bg-blue-100/80 shadow-clayInset'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(friend, e);
                        }} 
                        aria-label={`View ${friend.name} Profile`}
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <MobileNavigation />
    </div>
  );
};

export default Friends;
