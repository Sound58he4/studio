"use client";

import { useState, useEffect } from 'react';
import { Crown, Zap, Target, FileText, Mic, Edit3, ArrowLeft, Star, Trophy, Gift, Check, Dumbbell, Flame, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

const ProUpgrade = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [lightTheme, setLightTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lightTheme') === 'true';
    }
    return false;
  });
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  useEffect(() => {
    const handleStorageChange = () => {
      setLightTheme(localStorage.getItem('lightTheme') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isDark = !lightTheme;

  const applyCoupon = () => {
    const validCoupons = ['Bagom30', 'Bagoy50'];
    if (validCoupons.includes(couponCode)) {
      setAppliedCoupon(couponCode);
    }
  };

  const getDiscountedPrice = (originalPrice: number, plan: 'monthly' | 'yearly') => {
    if (appliedCoupon === 'Bagom30' && plan === 'monthly') {
      return Math.round(originalPrice * 0.25);
    }
    if (appliedCoupon === 'Bagoy50' && plan === 'yearly') {
      return Math.round(originalPrice * 0.25);
    }
    return originalPrice;
  };

  const proFeatures = [{
    icon: Mic,
    title: "Voice Commands",
    description: "Record workouts with voice commands - hands-free training logs",
    gradient: "from-blue-500 to-cyan-500"
  }, {
    icon: Edit3,
    title: "Lightning Quick Log",
    description: "Instant exercise logging - capture your gains in seconds",
    gradient: "from-green-500 to-emerald-500"
  }, {
    icon: Target,
    title: "Elite Goal Targeting",
    description: "Advanced goal setting for serious calisthenics athletes",
    gradient: "from-purple-500 to-pink-500"
  }, {
    icon: FileText,
    title: "Pro Workout Plans",
    description: "Power, Light, Max & Xtreme - professional training blueprints",
    gradient: "from-orange-500 to-red-500"
  }];

  const plans = [{
    id: 'monthly',
    name: 'Monthly Warrior',
    originalPrice: 200,
    description: 'Perfect for testing your limits',
    period: 'month',
    badge: 'POPULAR',
    color: 'from-orange-500 to-red-500',
    popular: true
  }, {
    id: 'yearly',
    name: 'Annual Champion',
    originalPrice: 2000,
    description: 'Maximum gains - Save ₹400 yearly!',
    period: 'year',
    badge: 'BEST VALUE',
    color: 'from-green-500 to-emerald-500',
    popular: false
  }];

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'} relative overflow-hidden ${isMobile ? 'pb-20' : ''}`}>
      
      <div className={`container mx-auto px-4 py-6 ${isMobile ? 'py-4' : 'py-8'} relative z-10`}>
        {/* Header - Mobile Optimized */}
        <div className={`flex items-center gap-3 ${isMobile ? 'mb-8' : 'mb-16'}`}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className={`rounded-full transition-all duration-300 hover:scale-110 ${isMobile ? 'h-10 w-10' : ''} ${isDark ? 'hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]' : 'hover:bg-gray-100 text-gray-600 border border-gray-200'}`}
          >
            <ArrowLeft size={isMobile ? 18 : 20} />
          </Button>
          <div className="flex-1">
            <div className={`flex items-center gap-3 ${isMobile ? 'mb-2' : 'mb-3'}`}>
              <div className={`${isMobile ? 'p-2' : 'p-4'} rounded-full ${isDark ? 'bg-[#2a2a2a]' : 'bg-white'} shadow-lg`}>
                <Crown className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={isMobile ? 20 : 32} />
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl md:text-6xl'} font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>
                  Upgrade to Pro
                </h1>
                <p className={`${isMobile ? 'text-base' : 'text-xl'} font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Unlock advanced features for your fitness journey
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section - Toned Down */}
        <div className={`text-center ${isMobile ? 'mb-8' : 'mb-16'} relative`}>
          <div className={`relative inline-block ${isMobile ? 'p-6' : 'p-12'} rounded-3xl ${isDark ? 'bg-[#2a2a2a] border border-[#3a3a3a]' : 'bg-clay-100/70 shadow-clayStrong'} backdrop-blur-sm`}>
            <div className="relative z-10">
              <h2 className={`${isMobile ? 'text-xl mb-3' : 'text-3xl mb-6'} font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Ready to Upgrade Your Fitness Experience?
              </h2>
              <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
                Join our premium members and unlock advanced features designed to accelerate your fitness journey.
              </p>
            </div>
          </div>
        </div>

        {/* Pro Features - Simplified */}
        <div className={isMobile ? 'mb-8' : 'mb-16'}>
          <h2 className={`${isMobile ? 'text-2xl mb-6' : 'text-4xl mb-12'} font-bold text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Premium Features
          </h2>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-8'}`}>
            {proFeatures.map((feature, index) => (
              <Card key={index} className={`group transition-all duration-500 hover:shadow-lg border ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a] hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-400/50'} rounded-3xl`}>
                <CardHeader className={`${isMobile ? 'pb-4' : 'pb-6'}`}>
                  <div className={`flex items-center gap-3 ${isMobile ? 'gap-3' : 'gap-4'}`}>
                    <div className={`${isMobile ? 'p-3' : 'p-4'} rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'} group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={isMobile ? 20 : 28} />
                    </div>
                    <div>
                      <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {feature.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Plans - Simplified */}
        <div className={isMobile ? 'mb-8' : 'mb-16'}>
          <h2 className={`${isMobile ? 'text-2xl mb-2' : 'text-4xl mb-4'} font-bold text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Choose Your Plan
          </h2>
          <p className={`text-center ${isMobile ? 'text-sm mb-6' : 'text-lg mb-12'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Select the plan that best fits your fitness goals.
          </p>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-8'} max-w-5xl mx-auto`}>
            {plans.map(plan => (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-500 hover:shadow-lg border-2 cursor-pointer rounded-3xl ${selectedPlan === plan.id ? isDark ? 'bg-[#2a2a2a] border-blue-500 shadow-blue-500/20 shadow-lg scale-105' : 'bg-white border-blue-400 shadow-blue-400/20 shadow-lg scale-105' : isDark ? 'bg-[#2a2a2a] border-[#3a3a3a] hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-400/50'}`} 
                onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
              >
                
                {/* Badge */}
                <div className={`absolute ${isMobile ? 'top-4 right-4' : 'top-6 right-6'} z-10`}>
                  <Badge className={`${isDark ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'} font-bold ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'}`}>
                    {plan.badge}
                  </Badge>
                </div>
                
                <CardHeader className={`${isMobile ? 'pb-4' : 'pb-6'}`}>
                  <div className={`flex items-center gap-3 ${isMobile ? 'mb-2' : 'mb-4'}`}>
                    <div className={`${isMobile ? 'p-3' : 'p-4'} rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                      <Crown className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={isMobile ? 20 : 28} />
                    </div>
                    <div>
                      <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {plan.name}
                      </CardTitle>
                    </div>
                  </div>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className={`space-y-6 ${isMobile ? 'space-y-4' : 'space-y-8'}`}>
                  {/* Pricing */}
                  <div className="text-center">
                    <div className={`flex items-baseline justify-center gap-2 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                      <span className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        ₹{getDiscountedPrice(plan.originalPrice, plan.id as 'monthly' | 'yearly')}
                      </span>
                      <span className={`${isMobile ? 'text-base' : 'text-lg'} font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        /{plan.period}
                      </span>
                    </div>
                    {appliedCoupon && (plan.id === 'monthly' && appliedCoupon === 'Bagom75' || plan.id === 'yearly' && appliedCoupon === 'Bagoy75') && (
                      <div className={`flex items-center justify-center gap-2 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                        <span className={`${isMobile ? 'text-base' : 'text-lg'} line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          ₹{plan.originalPrice}
                        </span>
                        <Badge className="bg-green-100 text-green-800 text-sm font-bold">75% OFF</Badge>
                      </div>
                    )}
                    {plan.id === 'yearly' && (
                      <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        Save ₹33.33 vs monthly!
                      </p>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {selectedPlan === plan.id && (
                    <div className={`flex items-center justify-center gap-2 ${isMobile ? 'p-3' : 'p-4'} rounded-xl ${isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                      <Check size={isMobile ? 16 : 20} className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                        SELECTED PLAN
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coupon Input Section - Simplified */}
        <div className={`rounded-3xl ${isMobile ? 'p-6 mb-8' : 'p-10 mb-16'} border ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white border-gray-200'}`}>
          <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
            <div className={`flex items-center justify-center gap-2 ${isMobile ? 'mb-3' : 'mb-4'}`}>
              <Gift className={`${isDark ? 'text-green-400' : 'text-green-600'}`} size={isMobile ? 24 : 36} />
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Have a Coupon Code?
              </span>
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Apply your discount code below!
            </p>
          </div>

          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-4'} max-w-lg mx-auto`}>
            <Input 
              placeholder="Enter your coupon code" 
              value={couponCode} 
              onChange={(e) => setCouponCode(e.target.value)} 
              className={`${isMobile ? 'flex-1 h-12 text-base' : 'flex-1 h-14 text-lg'} ${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a] text-white' : 'bg-white border-gray-300'}`} 
            />
            <Button 
              onClick={applyCoupon} 
              className={`${isMobile ? 'h-12 px-6 text-base w-full' : 'h-14 px-8 text-lg'} font-bold ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white hover:scale-105 transition-all duration-300`}
            >
              APPLY
            </Button>
          </div>
          
          {appliedCoupon && (
            <div className={`text-center ${isMobile ? 'mt-4' : 'mt-6'}`}>
              <Badge className={`bg-green-100 text-green-800 ${isMobile ? 'text-base px-3 py-2' : 'text-lg px-4 py-2'}`}>
                Coupon "{appliedCoupon}" activated!
              </Badge>
            </div>
          )}
        </div>

        {/* Upgrade CTA - Simplified */}
        <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
          <Button 
            className={`${isMobile ? 'text-lg py-4 px-8' : 'text-xl py-6 px-12'} font-bold rounded-full ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-lg hover:scale-105 transition-all duration-300`}
            onClick={() => {
              console.log('Starting upgrade process for plan:', selectedPlan);
              // Add your upgrade logic here
            }}
          >
            Upgrade Now
          </Button>
          <p className={`${isMobile ? 'text-sm mt-3' : 'text-base mt-4'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Join thousands of users already achieving their fitness goals!
          </p>
        </div>

        {/* Guarantee Section - Simplified */}
        <div className={`text-center ${isMobile ? 'p-6' : 'p-8'} rounded-3xl border ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-center justify-center gap-2 ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <Trophy className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={isMobile ? 28 : 36} />
            <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              30-Day Money Back Guarantee
            </span>
          </div>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Not satisfied with your experience? Get a full refund within 30 days. 
            We believe in your success and stand behind our commitment to help you achieve your fitness goals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProUpgrade;
