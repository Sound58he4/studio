// src/app/offer/page.tsx
"use client";

import React from 'react';
import { Gift, Star, Zap, Crown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const OfferPage = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Gift className="h-12 w-12 text-orange-500 mr-3" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Special Offers
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Unlock exclusive deals and premium features
        </p>
      </div>

      {/* Featured Offer */}
      <Card className="mb-8 border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <CardTitle className="text-2xl text-orange-700 dark:text-orange-300">
                  Premium Membership
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-400">
                  Limited time offer - 50% OFF
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 line-through">$29.99/month</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                $14.99/month
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Premium Features:</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Unlimited AI Assistant queries</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Advanced workout analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Custom meal planning</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Priority support</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105">
                Claim Offer Now
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Offer expires in 7 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Offers */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center">
              <Zap className="h-6 w-6 text-blue-500 mr-2" />
              <CardTitle className="text-xl">Free Trial Extension</CardTitle>
            </div>
            <CardDescription>
              Get 14 more days of premium features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Extend your free trial and explore all premium features for an additional 2 weeks.
            </p>
            <Button variant="outline" className="w-full">
              Extend Trial
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center">
              <Star className="h-6 w-6 text-yellow-500 mr-2" />
              <CardTitle className="text-xl">Referral Bonus</CardTitle>
            </div>
            <CardDescription>
              Invite friends and earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Invite friends to join Bago AI and get 1 month free premium for each successful referral.
            </p>
            <Button variant="outline" className="w-full">
              Invite Friends
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Terms */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          * Terms and conditions apply. Offers may be limited and subject to availability. 
          Premium subscriptions automatically renew unless cancelled.
        </p>
      </div>
    </div>
  );
};

export default OfferPage;
