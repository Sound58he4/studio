"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, Database, Users, MessageSquare, Camera, Mic, Bot, Mail, Phone, Scale, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const sectionData = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        details: "Email address, name, profile photo, and authentication credentials to create and manage your Bago account."
      },
      {
        subtitle: "Health & Fitness Data",
        details: "Weight tracking, workout progress, fitness goals, exercise logs, and personal intake preferences you voluntarily provide."
      },
      {
        subtitle: "Food Logging Data",
        details: "Meal descriptions, food photos, voice recordings, nutritional information, and eating patterns you choose to log."
      },
      {
        subtitle: "Usage Analytics",
        details: "App usage patterns, feature interactions, and performance metrics to improve our services (anonymized)."
      },
      {
        subtitle: "Device Information",
        details: "Device type, operating system, app version, and technical identifiers for app functionality and support."
      }
    ]
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Core Functionality",
        details: "Provide personalized fitness tracking, nutrition logging, workout recommendations, and progress monitoring."
      },
      {
        subtitle: "AI-Powered Features",
        details: "Process food images, voice recordings, and text inputs to identify foods and estimate nutritional information."
      },
      {
        subtitle: "Social Features",
        details: "Enable friend connections, chat functionality, and shared fitness experiences within the app."
      },
      {
        subtitle: "Service Improvement",
        details: "Analyze usage patterns to enhance app performance, develop new features, and fix technical issues."
      },
      {
        subtitle: "Communication",
        details: "Send important updates, notifications about your progress, and respond to your support requests."
      }
    ]
  },
  {
    icon: Users,
    title: "Information Sharing",
    content: [
      {
        subtitle: "With Friends",
        details: "Only information you explicitly choose to share through friend connections and chat features."
      },
      {
        subtitle: "Service Providers",
        details: "Trusted third-party services (Firebase, Google Cloud) that help us operate the app under strict data protection agreements."
      },
      {
        subtitle: "AI Processing",
        details: "Anonymous data may be used to improve our AI models for food recognition and nutrition estimation."
      },
      {
        subtitle: "Legal Requirements",
        details: "When required by law, court order, or to protect our rights and users' safety."
      },
      {
        subtitle: "Never Sold",
        details: "We never sell your personal information to advertisers or third parties for marketing purposes."
      }
    ]
  },
  {
    icon: Lock,
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        details: "All data is encrypted in transit using HTTPS and at rest using industry-standard encryption protocols."
      },
      {
        subtitle: "Firebase Security",
        details: "We use Google Firebase with advanced security rules, authentication, and access controls."
      },
      {
        subtitle: "Limited Access",
        details: "Only authorized personnel have access to user data, and only when necessary for service operation."
      },
      {
        subtitle: "Regular Audits",
        details: "We conduct regular security assessments and updates to protect against vulnerabilities."
      },
      {
        subtitle: "Data Minimization",
        details: "We collect and retain only the minimum data necessary to provide our services effectively."
      }
    ]
  },
  {
    icon: Shield,
    title: "Your Rights & Controls",
    content: [
      {
        subtitle: "Access Your Data",
        details: "Request a copy of all personal information we have about you at any time."
      },
      {
        subtitle: "Update Information",
        details: "Modify or correct your profile, preferences, and health data through your account settings."
      },
      {
        subtitle: "Delete Your Data",
        details: "Request complete deletion of your account and all associated data (some backup data may be retained for 30 days)."
      },
      {
        subtitle: "Data Portability",
        details: "Export your fitness and nutrition data in a commonly used format upon request."
      },
      {
        subtitle: "Opt-Out Options",
        details: "Control notifications, friend requests, and optional data collection features in your settings."
      }
    ]
  },
  {
    icon: Activity,
    title: "Data Retention",
    content: [
      {
        subtitle: "Active Accounts",
        details: "We retain your data as long as your account is active or as needed to provide services."
      },
      {
        subtitle: "Inactive Accounts",
        details: "Accounts inactive for 2 years may be archived; you'll receive notice before any data deletion."
      },
      {
        subtitle: "Deleted Accounts",
        details: "Most data is deleted immediately upon account deletion; some backup data may persist for 30 days."
      },
      {
        subtitle: "Legal Obligations",
        details: "Some data may be retained longer when required by law or for legitimate business purposes."
      }
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.03, scale: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.02, scale: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-12 max-w-5xl">
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
              <Shield className="h-8 w-8 text-primary-foreground"/>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Privacy Policy
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Your privacy is fundamental to us. This policy explains how Bago collects, uses, and protects your personal information when you use our fitness and nutrition tracking application.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Last Updated: June 3, 2025
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Effective: June 3, 2025
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Introduction Card */}
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                About This Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Bago is a comprehensive fitness and nutrition tracking application that uses artificial intelligence to help you achieve your health goals. We understand that your health data is highly personal and sensitive.
                </p>
                <p>
                  This privacy policy applies to all features of Bago, including food logging with AI recognition, workout tracking, social features, voice recording, image processing, and our AI chat assistant.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Camera className="h-3 w-3" /> Image Processing
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Mic className="h-3 w-3" /> Voice Recording
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <MessageSquare className="h-3 w-3" /> Chat Features
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Scale className="h-3 w-3" /> Health Tracking
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {sectionData.map((section, index) => (
            <motion.div key={section.title} variants={itemVariants}>
              <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-primary/5 via-card to-card border-b border-border/50">
                  <CardTitle className="text-xl font-semibold flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          {item.subtitle}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed ml-4">
                          {item.details}
                        </p>
                        {itemIndex < section.content.length - 1 && (
                          <Separator className="mt-4 opacity-30" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Important Information */}
        <motion.div variants={itemVariants} className="mt-8 space-y-6">
          {/* Children's Privacy */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-orange-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
                Children's Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed">
                Bago is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          {/* International Users */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Database className="h-5 w-5 text-blue-500" />
                </div>
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed">
                Bago uses Google Firebase and Google Cloud services, which may store and process your data in various countries. We ensure that all international data transfers comply with applicable privacy laws and are protected by appropriate safeguards.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update this privacy policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons.
                </p>
                <p>
                  When we make significant changes, we will notify you through the app or by email. We encourage you to review this policy periodically to stay informed about how we protect your information.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div variants={itemVariants} className="mt-8">
          <Card className="shadow-xl border-0 bg-gradient-to-r from-primary/10 via-card to-accent/10 backdrop-blur-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                Questions or Concerns?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  If you have any questions about this privacy policy, want to exercise your privacy rights, or have concerns about how we handle your data, please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="mailto:selvarasann09@gmail.com">
                      <Mail className="h-4 w-4 mr-2" />
                      selvarasann09@gmail.com
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/settings">
                      <Shield className="h-4 w-4 mr-2" />
                      Authorize Page
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  We typically respond to privacy inquiries within 48 hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            This privacy policy is part of Bago's Terms of Service. By using Bago, you agree to both this privacy policy and our terms of service.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/terms">Terms of Service</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
