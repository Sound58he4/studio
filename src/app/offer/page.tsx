// src/app/offer/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Gift, Calendar, Clock, Star, CheckCircle, Crown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const OfferPage = () => {
  const [lightTheme, setLightTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lightTheme') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setLightTheme(localStorage.getItem('lightTheme') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isDark = !lightTheme;

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // Simple success feedback without DOM manipulation
    console.log(`Copied: ${code}`);
  };

  return (
    <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
      isDark 
        ? 'bg-[#1a1a1a]' 
        : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
    }`}>
      <div className="p-3 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          
          {/* Header */}
          <motion.div 
            className="mb-6 md:mb-8 animate-slide-down"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Gift className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Special Offers
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                Exclusive discount codes for premium membership plans
              </p>
            </div>
          </motion.div>

          {/* Monthly Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className={`backdrop-blur-sm border-0 rounded-3xl transition-all duration-500 ${
              isDark 
                ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                : 'bg-clay-100/70 shadow-clayStrong'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <CardTitle className="text-xl font-semibold">
                        Monthly Plan
                      </CardTitle>
                      <CardDescription>
                        Pay only ₹50 instead of ₹200 per month
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground line-through">₹200/month</div>
                    <div className="text-2xl font-bold text-primary">
                      ₹50/month
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Coupon Code Section */}
                  <div className={`p-4 rounded-xl border ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#3a3a3a]' 
                      : 'bg-muted/50 border-border'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Coupon Code:
                      </span>
                      <Button 
                        onClick={() => copyToClipboard('Bagom30')}
                        variant="outline" 
                        size="sm"
                        className="h-8 px-3"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="text-xl font-mono font-bold text-center py-2 text-foreground">
                      BAGOM30
                    </div>
                  </div>
                  
                  {/* Features Grid */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${
                      isDark ? 'bg-[#1a1a1a]' : 'bg-muted/30'
                    }`}>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm text-foreground">
                          Expiry: One month
                        </span>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      isDark ? 'bg-[#1a1a1a]' : 'bg-muted/30'
                    }`}>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-primary mr-2" />
                        <span className="text-sm text-foreground">
                          Free Trial Included
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Free Trial Highlight */}
                  <div className={`p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'bg-primary/5 border-primary/20'
                  }`}>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm font-medium text-foreground">
                        Free trial available only for Monthly plan
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Yearly Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className={`backdrop-blur-sm border-0 rounded-3xl transition-all duration-500 ${
              isDark 
                ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                : 'bg-clay-100/70 shadow-clayStrong'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Crown className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <CardTitle className="text-xl font-semibold">
                        Yearly Plan
                      </CardTitle>
                      <CardDescription>
                        Pay only ₹500 instead of ₹2000 per year
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground line-through">₹2000/year</div>
                    <div className="text-2xl font-bold text-primary">
                      ₹500/year
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Coupon Code Section */}
                  <div className={`p-4 rounded-xl border ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#3a3a3a]' 
                      : 'bg-muted/50 border-border'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Coupon Code:
                      </span>
                      <Button 
                        onClick={() => copyToClipboard('Bagoy50')}
                        variant="outline" 
                        size="sm"
                        className="h-8 px-3"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="text-xl font-mono font-bold text-center py-2 text-foreground">
                      BAGOY50
                    </div>
                  </div>
                  
                  {/* Value Proposition */}
                  <div className={`p-4 rounded-lg border ${
                    isDark 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'bg-primary/5 border-primary/20'
                  }`}>
                    <div className="flex items-center justify-center">
                      <Star className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm font-medium text-foreground">
                        Best value - Save 75% on yearly subscription
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className={`p-4 rounded-xl ${
              isDark ? 'bg-[#2a2a2a]/50' : 'bg-muted/30'
            }`}>
              <p className="text-xs text-center text-muted-foreground">
                Terms and conditions apply. Coupon codes are valid for new subscriptions only. 
                Free trial is available exclusively for monthly plans.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OfferPage;
