"use client";

import { useState, useEffect } from 'react';
import { Crown, Zap, Target, FileText, Mic, Edit3, ArrowLeft, Star, Trophy, Gift, Check, Dumbbell, Flame, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToastAction } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useRazorpay } from '@/hooks/use-razorpay';
import { useAuth } from '@/context/AuthContext';
import { hasProAccess } from '@/services/firestore/subscriptionService';

const ProUpgrade = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user, userId, loading: authLoading } = useAuth();
  const [lightTheme, setLightTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lightTheme') === 'true';
    }
    return false;
  });
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponValidation, setCouponValidation] = useState<{
    valid: boolean;
    message?: string;
    pricing?: {
      original_amount: number;
      discount_amount: number;
      final_amount: number;
      savings: number;
    };
    coupon?: {
      code: string;
      discount: number;
      description: string;
      applicable_plan: 'monthly' | 'yearly';
    };
    is_free?: boolean;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  // Pro access state
  const [userHasProAccess, setUserHasProAccess] = useState(false);
  const [isCheckingProAccess, setIsCheckingProAccess] = useState(true);

  // Initialize Razorpay - only if user is authenticated
  const { initiatePayment, validateCoupon, loading: paymentLoading } = useRazorpay({
    key: "rzp_live_DfdBeaZBeu6Ups",
    phoneVerification: {
      enabled: true,
      required: true
    },
    name: 'Bago Fitness Pro',
    description: 'Pro Subscription - Advanced Fitness Features',
    userId: userId || '', // Pass the authenticated user's ID

    theme: {
      color: '#3b82f6',
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade to Pro.",
        duration: 5000,
      });
      router.push('/authorize'); // or wherever your login page is
      return;
    }
  }, [authLoading, user, router, toast]);

  // Check Pro access when user is available
  useEffect(() => {
    const checkProAccess = async () => {
      if (!userId) {
        setIsCheckingProAccess(false);
        return;
      }
      
      try {
        setIsCheckingProAccess(true);
        const hasAccess = await hasProAccess(userId);
        setUserHasProAccess(hasAccess);
        console.log("[Pro Upgrade Page] Pro access check:", hasAccess);
      } catch (error) {
        console.error("[Pro Upgrade Page] Error checking Pro access:", error);
        setUserHasProAccess(false); // Default to no access on error
      } finally {
        setIsCheckingProAccess(false);
      }
    };

    if (!authLoading && userId) {
      checkProAccess();
    }
  }, [authLoading, userId]);

  useEffect(() => {
    const handleStorageChange = () => {
      setLightTheme(localStorage.getItem('lightTheme') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Show welcome toast for pro upgrade page
    const showWelcomeToast = () => {
      toast({
        title: "🏋️ Upgrade to Pro",
        description: "Unlock advanced features for your fitness journey",
        duration: 8000,
      });
    };
    
    // Delay to ensure proper page load
    const timer = setTimeout(showWelcomeToast, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timer);
    };
  }, [toast]);

  const isDark = !lightTheme;

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Invalid Coupon",
        description: "Please enter a valid coupon code.",
        duration: 4000,
      });
      return;
    }

    setValidatingCoupon(true);
    setCouponValidation(null);

    const originalAmount = plans.find(p => p.id === selectedPlan)?.originalPrice || 0;
    
    try {
      const result = await validateCoupon(couponCode, selectedPlan, originalAmount);
      
      if (result.valid) {
        // Auto-select the correct plan if the coupon is for a different plan
        const couponPlan = result.coupon?.applicable_plan;
        if (couponPlan && couponPlan !== selectedPlan) {
          setSelectedPlan(couponPlan);
          toast({
            title: "🔄 Plan Auto-Selected",
            description: `Switched to ${couponPlan === 'monthly' ? 'Monthly Warrior' : 'Annual Champion'} plan for this coupon.`,
            duration: 4000,
          });
        }
        
        setAppliedCoupon(couponCode);
        setCouponValidation(result);
        toast({
          title: "🎉 Coupon Applied!",
          description: result.message || "Your coupon has been successfully applied.",
          duration: 6000,
        });
      } else {
        // If the coupon is valid but for a different plan, show a helpful message
        if (result.error === 'Coupon not applicable to selected plan' && result.message) {
          const requiredPlan = result.message.includes('Monthly Warrior') ? 'monthly' : 'yearly';            toast({
              title: "🔄 Switch Plan Required",
              description: `This coupon is for the ${requiredPlan === 'monthly' ? 'Monthly Warrior' : 'Annual Champion'} plan. Click below to switch.`,
              duration: 8000,
              action: (
                <ToastAction 
                  altText="Switch Plan"
                  onClick={() => {
                    setSelectedPlan(requiredPlan);
                    // Re-apply the coupon after switching plans
                    setTimeout(() => applyCoupon(), 500);
                  }}
                >
                  Switch Plan
                </ToastAction>
              )
            });
        } else {
          setCouponValidation(result);
          toast({
            title: "❌ Invalid Coupon",
            description: result.message || "The coupon code you entered is not valid.",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast({
        title: "❌ Validation Error",
        description: "Failed to validate coupon. Please try again.",
        duration: 4000,
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon('');
    setCouponCode('');
    setCouponValidation(null);
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order.",
      duration: 3000,
    });
  };

  const getDiscountedPrice = (originalPrice: number, plan: 'monthly' | 'yearly') => {
    if (couponValidation?.valid && couponValidation.pricing) {
      // Only apply discount if coupon is valid for this specific plan
      const couponPlan = couponValidation.coupon?.applicable_plan;
      if (couponPlan === plan) {
        return couponValidation.pricing.final_amount;
      }
    }
    return originalPrice;
  };

  const getSavings = (originalPrice: number, plan: 'monthly' | 'yearly') => {
    if (couponValidation?.valid && couponValidation.pricing) {
      // Only show savings if coupon is valid for this specific plan
      const couponPlan = couponValidation.coupon?.applicable_plan;
      if (couponPlan === plan) {
        return couponValidation.pricing.savings;
      }
    }
    return 0;
  };

  const getDiscountPercent = (plan: 'monthly' | 'yearly') => {
    if (couponValidation?.valid && couponValidation.pricing) {
      // Only show discount percentage if coupon is valid for this specific plan
      const couponPlan = couponValidation.coupon?.applicable_plan;
      if (couponPlan === plan) {
        const { original_amount, discount_amount } = couponValidation.pricing;
        return Math.round((discount_amount / original_amount) * 100);
      }
    }
    return 0;
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

  const handleUpgradeClick = async () => {
    console.log('Starting upgrade process for plan:', selectedPlan);
    
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) {
      toast({
        title: "❌ Error",
        description: "Please select a valid plan.",
        duration: 4000,
      });
      return;
    }

    const finalAmount = getDiscountedPrice(selectedPlanData.originalPrice, selectedPlan as 'monthly' | 'yearly');
    
    // Show initiation toast
    toast({
      title: "🚀 Processing Payment...",
      description: `Initiating ${selectedPlan === 'monthly' ? 'Monthly Warrior' : 'Annual Champion'} plan upgrade.`,
      duration: 4000,
    });
    
    try {
      const result = await initiatePayment({
        amount: selectedPlanData.originalPrice, // Send original amount, server will apply coupon
        plan: selectedPlan as 'monthly' | 'yearly',
        couponCode: appliedCoupon || undefined,
      });

      console.log('Payment result:', result);
      
      if (result && 'success' in result && result.success) {
        // Handle successful payment/upgrade
        setTimeout(() => {
          toast({
            title: "🎉 Welcome to Pro!",
            description: `Your ${selectedPlan === 'monthly' ? 'Monthly Warrior' : 'Annual Champion'} subscription is now active!`,
            duration: 10000,
          });
          
          // Redirect to dashboard or pro features page
          // router.push('/dashboard?upgraded=true');
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      // Error handling is already done in the hook
    }
  };

  const isCouponApplicableToSelectedPlan = () => {
    if (!couponValidation?.valid || !couponValidation.coupon) return false;
    const couponPlan = couponValidation.coupon.applicable_plan;
    return couponPlan === selectedPlan;
  };

  const isSelectedPlanFree = () => {
    return couponValidation?.is_free && isCouponApplicableToSelectedPlan();
  };

  return (
    <>
      {/* Show loading spinner while checking authentication or Pro access */}
      {(authLoading || isCheckingProAccess) && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Show pro upgrade page only if authenticated and access checked */}
      {!authLoading && !isCheckingProAccess && user && (
        <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'} relative overflow-hidden ${isMobile ? 'pb-20' : ''}`}>
      
      <div className={`container mx-auto px-4 py-6 ${isMobile ? 'py-4' : 'py-8'} relative z-10`}>
        {/* Header - Mobile Optimized */}
        <div className={`relative ${isMobile ? 'mb-8' : 'mb-16'}`}>
          {/* Back Button - Hidden on mobile, positioned absolutely on desktop */}
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()} 
              className={`absolute left-0 top-0 rounded-full transition-all duration-300 hover:scale-110 ${isDark ? 'hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]' : 'hover:bg-gray-100 text-gray-600 border border-gray-200'}`}
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          
          {/* Centered Header Content */}
          <div className="text-center">
            <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-2' : 'mb-3'}`}>
              <div className={`${isMobile ? 'p-2' : 'p-4'} rounded-full ${isDark ? 'bg-[#2a2a2a]' : 'bg-white'} shadow-lg`}>
                <Crown className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={isMobile ? 20 : 32} />
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl md:text-6xl'} font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>
                  Upgrade to Pro
                </h1>
              </div>
            </div>
            <p className={`${isMobile ? 'text-base' : 'text-xl'} font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Unlock advanced features for your fitness journey
            </p>
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
                className={`relative overflow-hidden transition-all duration-500 hover:shadow-lg border-2 ${
                  userHasProAccess && plan.id === 'monthly' 
                    ? 'cursor-not-allowed opacity-75' 
                    : 'cursor-pointer'
                } rounded-3xl ${selectedPlan === plan.id ? isDark ? 'bg-[#2a2a2a] border-blue-500 shadow-blue-500/20 shadow-lg scale-105' : 'bg-white border-blue-400 shadow-blue-400/20 shadow-lg scale-105' : isDark ? 'bg-[#2a2a2a] border-[#3a3a3a] hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-400/50'}`} 
                onClick={() => {
                  // Prevent selection if user already has Monthly Warrior and this is the monthly plan
                  if (userHasProAccess && plan.id === 'monthly') {
                    toast({
                      title: "Already Subscribed",
                      description: "You already have an active Monthly Warrior subscription!",
                      duration: 3000,
                    });
                    return;
                  }
                  setSelectedPlan(plan.id as 'monthly' | 'yearly');
                }}
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
                  {/* Pro Status Indicator for Monthly Warrior */}
                  {userHasProAccess && plan.id === 'monthly' && (
                    <div className={`text-center ${isMobile ? 'p-4' : 'p-6'} rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/30`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="text-yellow-500" size={isMobile ? 20 : 24} />
                        <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-yellow-500`}>
                          You are already a Monthly Warrior!
                        </span>
                      </div>
                      <p className={`${isMobile ? 'text-sm' : 'text-base'} text-yellow-600/80`}>
                        Your Pro subscription is active
                      </p>
                    </div>
                  )}
                  
                  {/* Regular pricing section - hidden for active Monthly Warrior */}
                  {!(userHasProAccess && plan.id === 'monthly') && (
                    <>
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
                        
                        {/* Show original price and discount if coupon is applied */}
                        {appliedCoupon && couponValidation?.valid && getSavings(plan.originalPrice, plan.id as 'monthly' | 'yearly') > 0 && (
                          <div className={`flex items-center justify-center gap-2 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                            <span className={`${isMobile ? 'text-base' : 'text-lg'} line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              ₹{plan.originalPrice}
                            </span>
                            <Badge className={`${couponValidation.is_free ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'} text-sm font-bold`}>
                              {getDiscountPercent(plan.id as 'monthly' | 'yearly')}% OFF
                            </Badge>
                          </div>
                        )}

                        {/* Free plan indicator */}
                        {couponValidation?.is_free && couponValidation.coupon && couponValidation.coupon.applicable_plan === plan.id && (
                          <div className={`${isMobile ? 'p-3 mb-3' : 'p-4 mb-4'} rounded-xl ${isDark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                              🎉 COMPLETELY FREE!
                            </p>
                          </div>
                        )}

                        {plan.id === 'yearly' && !couponValidation?.valid && (
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
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>



        {/* Coupon Input Section - Enhanced */}
        <div className={`rounded-3xl ${isMobile ? 'p-6 mb-8' : 'p-10 mb-16'} border ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white border-gray-200'}`}>
          <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
            <div className={`flex items-center justify-center gap-2 ${isMobile ? 'mb-3' : 'mb-4'}`}>
              <Gift className={`${isDark ? 'text-green-400' : 'text-green-600'}`} size={isMobile ? 24 : 36} />
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Have a Coupon Code?
              </span>
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              If a coupon code is provided on the Offers page, make sure to use it — you might get lucky!
            </p>
          </div>

          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-4'} max-w-lg mx-auto`}>
            <Input 
              placeholder="Enter your coupon code" 
              value={couponCode} 
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={validatingCoupon || paymentLoading}
              className={`${isMobile ? 'flex-1 h-12 text-base' : 'flex-1 h-14 text-lg'} ${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a] text-white' : 'bg-white border-gray-300'}`} 
            />
            <Button 
              onClick={applyCoupon}
              disabled={validatingCoupon || paymentLoading || !couponCode.trim()}
              className={`${isMobile ? 'h-12 px-6 text-base w-full' : 'h-14 px-8 text-lg'} font-bold ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {validatingCoupon ? 'VALIDATING...' : 'APPLY'}
            </Button>
          </div>
          
          {/* Coupon Status */}
          {couponValidation && (
            <div className={`text-center ${isMobile ? 'mt-4' : 'mt-6'}`}>
              {couponValidation.valid ? (
                <div className="space-y-3">
                  <Badge className={`${couponValidation.is_free ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} ${isMobile ? 'text-base px-3 py-2' : 'text-lg px-4 py-2'}`}>
                    ✅ Coupon "{appliedCoupon}" activated!
                  </Badge>
                  
                  {/* Plan-specific message */}
                  {!isCouponApplicableToSelectedPlan() && (
                    <div className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl ${isDark ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                        ⚠️ This coupon is only valid for the {couponValidation.coupon?.applicable_plan === 'monthly' ? 'Monthly Warrior' : 'Annual Champion'} plan.
                      </p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDark ? 'text-yellow-300' : 'text-yellow-600'} mt-1`}>
                        Switch to that plan to apply the discount.
                      </p>
                    </div>
                  )}
                  
                  {couponValidation.pricing && isCouponApplicableToSelectedPlan() && (
                    <div className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl ${isDark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                      <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                        {couponValidation.message}
                      </p>
                      {couponValidation.pricing.savings > 0 && (
                        <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${isDark ? 'text-green-300' : 'text-green-800'} mt-2`}>
                          You saved ₹{couponValidation.pricing.savings}!
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    onClick={removeCoupon}
                    variant="outline"
                    size="sm"
                    className={`${isDark ? 'border-red-500 text-red-400 hover:bg-red-500/20' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                  >
                    Remove Coupon
                  </Button>
                </div>
              ) : (
                <div className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl ${isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                  <Badge className={`bg-red-100 text-red-800 ${isMobile ? 'text-base px-3 py-2' : 'text-lg px-4 py-2'}`}>
                    ❌ Invalid Coupon
                  </Badge>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} ${isDark ? 'text-red-400' : 'text-red-700'} mt-2`}>
                    {couponValidation.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Helpful hints */}
          {!appliedCoupon && (
            <div className={`text-center ${isMobile ? 'mt-4' : 'mt-6'}`}>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              </p>
            </div>
          )}
        </div>

        {/* Upgrade CTA - Enhanced */}
        <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
          {userHasProAccess && selectedPlan === 'monthly' ? (
            <div className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/30 max-w-md mx-auto`}>
              <Crown className="mx-auto text-yellow-500 mb-3" size={isMobile ? 32 : 40} />
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-yellow-500 mb-2`}>
                You're Already a Monthly Warrior!
              </h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-yellow-600/80`}>
                Your Pro subscription is active. Consider upgrading to Annual Champion for better value!
              </p>
            </div>
          ) : (
            <Button 
              className={`${isMobile ? 'text-lg py-4 px-8' : 'text-xl py-6 px-12'} font-bold rounded-full ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={handleUpgradeClick}
              disabled={paymentLoading || validatingCoupon}
            >
              {paymentLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {isSelectedPlanFree() ? 'Activate Free Subscription' : 'Upgrade Now'}
                </>
              )}
            </Button>
          )}
          <p className={`${isMobile ? 'text-sm mt-3' : 'text-base mt-4'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isSelectedPlanFree()
              ? 'Your subscription will be activated instantly - no payment required!'
              : 'Join thousands of users already achieving their fitness goals!'
            }
          </p>
          
          {/* Payment Security Info */}
          <div className={`flex items-center justify-center gap-2 ${isMobile ? 'mt-3' : 'mt-4'}`}>
            <div className={`w-4 h-4 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`}></div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Secured by Razorpay - Your payment is safe & secure
            </span>
          </div>
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
      )}
    </>
  );
};

export default ProUpgrade;
