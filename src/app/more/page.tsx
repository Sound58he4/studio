"use client";

import { useRouter } from 'next/navigation';
import { X, FileText, User, Dumbbell, Star, Users, BarChart3, History, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const More = () => {
  const router = useRouter();
  const menuItems = [
    {
      title: 'Log Food',
      icon: FileText,
      route: '/log',
      color: 'from-purple-400 to-purple-600'
    },
    {
      title: 'Profile', 
      icon: User,
      route: '/profile',
      color: 'from-blue-400 to-blue-600'
    },
    {
      title: 'Workout Plans',
      icon: Dumbbell,
      route: '/workout-plans',
      color: 'from-green-400 to-green-600'
    },
    {
      title: 'Your Points',
      icon: Star,
      route: '/points',
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      title: 'Friends',
      icon: Users,
      route: '/friends',
      color: 'from-pink-400 to-pink-600'
    },
    {
      title: 'Report',
      icon: BarChart3,
      route: '/report',
      color: 'from-indigo-400 to-indigo-600'
    },
    {
      title: 'History',
      icon: History,
      route: '/history',
      color: 'from-teal-400 to-teal-600'
    },    {
      title: 'Settings',
      icon: Settings,
      route: '/settings',
      color: 'from-red-400 to-red-600'
    }
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const handleClose = () => {
    router.back();
  };

  const handleLogout = () => {
    console.log('Logging out...');
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-clay-100 via-clayBlue to-clay-200 animate-fade-in">
      {/* Header */}
      <div className="p-6 animate-slide-down">
        <div className="bg-clayGlass backdrop-blur-sm rounded-3xl shadow-clay border-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-clayInset animate-scale-in">
                <div className="w-5 h-5 bg-white rounded-lg"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Menu</h1>
            </div>
            <Button
              className="bg-white/60 backdrop-blur-sm border-0 shadow-clayInset text-gray-600 hover:text-gray-800 hover:bg-white/80 transition-all duration-200 hover:scale-110 h-10 w-10 rounded-2xl"
              onClick={handleClose}
            >
              <X size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 space-y-4 animate-slide-up">        {menuItems.map((item, index) => (
          <div 
            key={item.title}
            className="bg-clayGlass backdrop-blur-sm rounded-3xl shadow-clay border-0 transition-all duration-300 hover:shadow-clayStrong hover:scale-[1.02] animate-fade-in"
          >
            <button
              className="w-full flex items-center space-x-4 p-6 text-left transition-all duration-300 hover:bg-white/20 rounded-3xl"
              onClick={() => handleNavigation(item.route)}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-clayInset`}>
                <item.icon size={24} className="text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-800">{item.title}</span>
            </button>
          </div>
        ))}

        {/* Logout Button */}
        <div className="bg-clayGlass backdrop-blur-sm rounded-3xl shadow-clay border-0 transition-all duration-300 hover:shadow-clayStrong hover:scale-[1.02] animate-fade-in">
          <button
            className="w-full flex items-center space-x-4 p-6 text-left transition-all duration-300 hover:bg-red-50/20 rounded-3xl"
            onClick={handleLogout}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-clayInset">
              <LogOut size={24} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-red-600">Logout</span>
          </button>
        </div>
      </div>

      {/* Decorative accent */}
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-400 to-purple-600 rounded-l-3xl"></div>
    </div>
  );
};

export default More;
