"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Scale, Users, Smartphone, Bot, Camera, Mic, Shield, AlertTriangle, CreditCard, Zap, Mail } from "lucide-react";
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
    icon: Scale,
    title: "Acceptance of Terms",
    content: [
      {
        subtitle: "Agreement to Terms",
        details: "By downloading, installing, or using the Bago fitness application, you agree to be bound by these Terms and Conditions and our Privacy Policy."
      },
      {
        subtitle: "Age Requirements",
        details: "You must be at least 13 years old to use Bago. Users between 13-17 must have parental consent. Users under 18 should use the app under parental supervision."
      },
      {
        subtitle: "Capacity to Contract",
        details: "You represent that you have the legal capacity to enter into this agreement and comply with these terms in your jurisdiction."
      },
      {
        subtitle: "Updates to Terms",
        details: "We may modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms."
      }
    ]
  },  {
    icon: Smartphone,
    title: "Service Description",
    content: [
      {
        subtitle: "Comprehensive Fitness & Nutrition Tracking",
        details: "Bago provides complete fitness tracking, nutrition logging, meal planning, workout programs, and progress monitoring to help you achieve your health and wellness goals through data-driven insights."
      },
      {
        subtitle: "AI-Powered Food & Nutrition Features",
        details: "Our app includes advanced AI-powered food recognition through camera and image analysis, voice-to-text food logging, automated nutrition estimation, meal analysis, and personalized dietary recommendations based on your goals and preferences."
      },
      {
        subtitle: "Social Features & Community",
        details: "Connect with friends and fitness enthusiasts, share progress updates and achievements, participate in challenges and group goals, engage in fitness-focused conversations, and build accountability partnerships within the app community."
      },
      {
        subtitle: "Structured Workout Programs",
        details: "Access to comprehensive workout programs including Light, Power, Max, and Xtreme workout plans with detailed PDF guides, video demonstrations, exercise tracking, performance analytics, and progressive overload recommendations."
      },
      {
        subtitle: "AI Chat Assistant & Support",
        details: "Interactive AI-powered chat assistant that provides personalized fitness guidance, answers nutrition questions, offers workout suggestions, analyzes your progress data, and provides motivational support throughout your fitness journey."
      },
      {
        subtitle: "Data Analytics & Progress Insights",
        details: "Advanced analytics dashboard showing detailed progress reports, trend analysis, goal tracking, performance metrics, nutritional breakdowns, and predictive insights to optimize your health and fitness outcomes."
      },
      {
        subtitle: "Multi-Modal Input Methods",
        details: "Multiple ways to log and track data including voice commands, photo capture, manual text entry, barcode scanning, and integration with wearable devices for seamless data collection."
      },
      {
        subtitle: "Service Availability & Updates",
        details: "Services are provided 'as is' and may be modified, enhanced, suspended, or discontinued at any time without prior notice. We continuously update features based on user feedback and technological improvements."
      }
    ]
  },  {
    icon: Users,
    title: "User Responsibilities & Acceptable Use",
    content: [
      {
        subtitle: "Account Security & Authentication",
        details: "You are responsible for maintaining the confidentiality of your account credentials, enabling two-factor authentication when available, and immediately notifying us of any unauthorized access or security breaches affecting your account."
      },
      {
        subtitle: "Accurate Health Information",
        details: "Provide accurate, current, and complete information when creating your account and using health tracking features. Inaccurate health data may affect the quality of AI recommendations and could impact your safety when following workout plans."
      },
      {
        subtitle: "Appropriate Use & Prohibited Activities",
        details: "Use the app only for its intended fitness and nutrition tracking purposes. Do not attempt to hack, reverse engineer, exploit, or circumvent security measures. Do not use the app for illegal activities or to harm others."
      },
      {
        subtitle: "Content Standards & Community Guidelines",
        details: "Any content you share (photos, messages, posts, comments) must be appropriate, non-offensive, truthful, and comply with community guidelines. Do not share explicit content, hate speech, harassment, or misinformation about health and fitness."
      },
      {
        subtitle: "Voice & Image Data Responsibility",
        details: "When using voice logging or photo features, ensure you have permission to record in your location and that images don't contain private information of others. Be mindful of background conversations and sensitive information in recordings."
      },
      {
        subtitle: "AI Interaction Guidelines",
        details: "Use the AI chat assistant responsibly and understand its limitations. Do not rely solely on AI recommendations for medical decisions. Report inappropriate AI responses and do not attempt to manipulate or misuse AI features."
      },
      {
        subtitle: "Social Features & Community Interaction",
        details: "When interacting with other users, maintain respectful communication, protect others' privacy, avoid sharing personal contact information, and report inappropriate behavior. Be supportive and constructive in community interactions."
      },
      {
        subtitle: "Legal Compliance & Age Requirements",
        details: "Use the app in compliance with all applicable laws and regulations in your jurisdiction. Users must be at least 13 years old, with parental supervision required for users under 18. Verify age requirements and data protection laws in your location."
      }
    ]
  },{
    icon: Bot,
    title: "AI Services & Data Processing",
    content: [
      {
        subtitle: "Food Recognition & Image Analysis",
        details: "Our AI analyzes your food photos using advanced computer vision to identify foods and estimate nutritional information. The system processes images locally when possible and via secure cloud services when necessary. Results are estimates and should not replace professional dietary advice."
      },
      {
        subtitle: "Voice Processing & Speech Recognition",
        details: "Voice recordings are processed using AI to extract food logging information and convert speech to text. Voice data is processed securely through encrypted channels and automatically deleted after processing unless you explicitly choose to save recordings."
      },
      {
        subtitle: "AI Chat Assistant & Conversational AI",
        details: "Our AI-powered chat assistant provides personalized fitness and nutrition guidance, answers questions about your health data, and offers workout recommendations. The assistant uses large language models to understand context and provide relevant responses. This is for informational purposes only and not professional medical advice."
      },      {
        subtitle: "Nutrition Estimation & Calorie Calculation",
        details: "Our system combines AI analysis with mathematical formulas to estimate nutrition and calories. Food recognition uses AI models, while calorie burn estimation uses established MET (Metabolic Equivalent of Task) values. Daily nutritional targets are calculated using validated BMR/TDEE formulas. All estimates should be verified with healthcare professionals for medical purposes."
      },
      {
        subtitle: "Workout Plan Generation",
        details: "AI algorithms analyze your fitness level, goals, preferences, and available equipment to generate personalized workout plans. The system considers your progress, recovery patterns, and feedback to adapt recommendations over time."
      },
      {
        subtitle: "Progress Analysis & Predictive Modeling",
        details: "Our AI analyzes your health and fitness data to identify trends, predict outcomes, and provide insights about your progress. This includes weight trajectory analysis, performance improvements, and goal achievement probability."
      },
      {
        subtitle: "Machine Learning & Model Improvement",
        details: "We may use anonymized and aggregated data to improve our AI models for food recognition, nutrition estimation, and fitness recommendations while protecting your privacy. Personal data is never shared without explicit consent."
      },
      {
        subtitle: "AI Processing Limitations",
        details: "AI-generated nutritional information, workout recommendations, and health insights are estimates based on available data and algorithms. Results may vary in accuracy and should be validated by qualified professionals for medical or therapeutic purposes."
      }
    ]
  },  {
    icon: Shield,
    title: "Privacy & Data Protection",
    content: [
      {
        subtitle: "Health Data Collection",
        details: "We collect and process personal health data including weight, measurements, activity levels, nutrition intake, workout performance, and biometric data as described in our Privacy Policy. This data is encrypted and stored securely."
      },
      {
        subtitle: "AI Training Data Usage",
        details: "With your consent, anonymized and aggregated data may be used to improve our AI models for food recognition, nutrition estimation, and fitness recommendations. Personal identifiers are always removed before any AI training processes."
      },
      {
        subtitle: "Third-Party Services & Integrations",
        details: "We use Firebase, Google Cloud AI, speech recognition services, and other trusted third-party providers to deliver app functionality. These services have their own privacy policies and security measures that complement our data protection practices."
      },
      {
        subtitle: "Image & Voice Data Processing",
        details: "Food photos and voice recordings are processed through secure AI pipelines. Images may be temporarily stored for processing but are not permanently retained unless you save them to your profile. Voice data is processed and immediately deleted after transcription."
      },
      {
        subtitle: "Data Security & Encryption",
        details: "We implement industry-standard security measures including end-to-end encryption, secure data transmission, access controls, and regular security audits. However, we cannot guarantee absolute security of data during transmission or storage over the internet."
      },
      {
        subtitle: "Data Retention & Deletion",
        details: "Your health and fitness data is retained as long as your account is active. You can request deletion of specific data or your entire account at any time. Some data may be retained for legal compliance or legitimate business purposes as outlined in our Privacy Policy."
      },
      {
        subtitle: "Your Privacy Rights",
        details: "You have comprehensive rights to access, modify, export, and delete your personal data. You can also control data sharing preferences, opt out of AI training data usage, and manage third-party integrations through your account settings."
      }
    ]
  },
  {
    icon: AlertTriangle,
    title: "Health & Safety Disclaimers",
    content: [
      {
        subtitle: "Not Medical Advice",
        details: "Bago is a fitness tracking tool, not a medical device. Information provided is for general wellness purposes and not medical advice."
      },
      {
        subtitle: "Consult Healthcare Providers",
        details: "Always consult qualified healthcare professionals before starting any fitness program, diet, or making health-related decisions."
      },
      {
        subtitle: "Medical Conditions",
        details: "If you have medical conditions, injuries, or take medications, consult your doctor before using fitness features or workout plans."
      },
      {
        subtitle: "Emergency Situations",
        details: "Do not rely on Bago for emergency medical situations. Contact emergency services immediately if you experience health emergencies."
      },
      {
        subtitle: "User Responsibility",
        details: "You assume full responsibility for your health and safety when using workout plans, nutrition recommendations, or other app features."
      }
    ]
  },
  {
    icon: FileText,
    title: "Intellectual Property",
    content: [
      {
        subtitle: "Our Ownership",
        details: "Bago, its design, features, AI models, workout plans, and all related intellectual property are owned by us or our licensors."
      },
      {
        subtitle: "Your Content",
        details: "You retain ownership of your personal data and content, but grant us a license to use it to provide services as described in our Privacy Policy."
      },
      {
        subtitle: "Workout Plans",
        details: "All workout PDFs and plans are proprietary content protected by copyright. They are for personal use within the app only."
      },
      {
        subtitle: "Restrictions",
        details: "You may not copy, modify, distribute, sell, or create derivative works from our content without explicit written permission."
      },
      {
        subtitle: "Trademark",
        details: "Bago logos, names, and branding are our trademarks. Unauthorized use is prohibited."
      }
    ]
  },
  {
    icon: Zap,
    title: "Service Availability & Performance",
    content: [
      {
        subtitle: "Uptime",
        details: "We strive to provide reliable service but do not guarantee 100% uptime. Service may be interrupted for maintenance, updates, or technical issues."
      },
      {
        subtitle: "Feature Changes",
        details: "We may add, modify, or remove features at any time. We'll notify users of significant changes when possible."
      },
      {
        subtitle: "Device Compatibility",
        details: "The app is designed for modern mobile devices. We do not guarantee compatibility with all devices or operating system versions."
      },
      {
        subtitle: "Internet Connection",
        details: "Many features require an internet connection. Some functionality may be limited when offline."
      }
    ]
  },  {
    icon: CreditCard,
    title: "Subscription & Premium Features",
    content: [
      {
        subtitle: "Free Tier Features",
        details: "Basic fitness tracking, limited nutrition logging, access to light workout plans, and essential AI features are available for free with usage limitations. Free users can log a limited number of meals per day and access basic progress tracking."
      },
      {
        subtitle: "Premium Subscription Benefits",
        details: "Premium users get unlimited AI-powered food logging, advanced nutrition analysis, access to all workout plans (Power, Max, Xtreme), unlimited AI chat interactions, enhanced social features, detailed analytics, export capabilities, and priority customer support."
      },
      {
        subtitle: "Billing & Payment Processing",
        details: "Subscriptions are billed automatically through your app store account (Apple App Store or Google Play Store). Prices, billing periods, and available subscription tiers are clearly displayed before purchase. All payments are processed securely through the respective app stores."
      },
      {
        subtitle: "Subscription Management",
        details: "You can manage, modify, or cancel your subscription at any time through your app store account settings. Changes take effect at the end of the current billing period. Downgrading may result in loss of access to premium features and data."
      },
      {
        subtitle: "Free Trials & Promotional Offers",
        details: "We may offer free trials or promotional pricing for premium features. Trial terms and conditions will be clearly stated. Trials automatically convert to paid subscriptions unless cancelled before the trial period ends."
      },
      {
        subtitle: "Refund Policy",
        details: "Refund policies are governed by your app store's (Apple App Store or Google Play Store) terms and conditions. We do not process refunds directly but may provide account credits or alternative remedies for service issues."
      },
      {
        subtitle: "Price Changes",
        details: "We may modify subscription prices with advance notice. Existing subscribers will be notified of price changes and have the option to cancel before new rates take effect. Price changes do not affect active subscription periods."
      }
    ]
  }
];

export default function TermsAndConditionsPage() {
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
              <FileText className="h-8 w-8 text-primary-foreground"/>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Terms & Conditions
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              These terms and conditions govern your use of the Bago fitness application. Please read them carefully before using our services.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Last Updated: June 3, 2025
              </span>
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
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
                <Smartphone className="h-6 w-6 text-primary" />
                About Bago
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">              <div className="space-y-4 text-muted-foreground">
                <p>
                  Bago is a comprehensive fitness and nutrition tracking application that combines traditional health monitoring with cutting-edge artificial intelligence technology to provide personalized wellness guidance and support your fitness journey.
                </p>
                <p>
                  Our platform integrates advanced AI-powered food recognition through camera analysis, voice-to-text logging capabilities, personalized workout plan generation, intelligent chat assistance, social fitness features, comprehensive progress analytics, and predictive health insights to deliver a complete wellness ecosystem.
                </p>
                <p>
                  The app processes various types of data including food images, voice recordings, health metrics, exercise performance, and social interactions to provide intelligent recommendations while maintaining the highest standards of privacy and data security.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Camera className="h-3 w-3" /> AI Food Recognition
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Mic className="h-3 w-3" /> Voice Logging
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Users className="h-3 w-3" /> Social Features
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Bot className="h-3 w-3" /> AI Chat Assistant
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Zap className="h-3 w-3" /> Workout Plans
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Shield className="h-3 w-3" /> Progress Analytics
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
        </div>        {/* Additional Legal Sections */}
        <motion.div variants={itemVariants} className="mt-8 space-y-6">
          {/* Workout Safety & Exercise Disclaimer */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-amber-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                Workout Safety & Exercise Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>Exercise Risks:</strong> Physical exercise carries inherent risks including but not limited to muscle strains, joint injuries, cardiovascular stress, and other potential health complications. Our workout plans are general recommendations and may not be suitable for all fitness levels or health conditions.
                </p>
                <p>
                  <strong>Personal Responsibility:</strong> You assume full responsibility for your safety when following any workout plans, exercise recommendations, or fitness guidance provided by Bago. Always warm up properly, use correct form, and stop immediately if you experience pain or discomfort.
                </p>
                <p>
                  <strong>Equipment & Environment:</strong> Ensure you have adequate space, proper equipment, and a safe environment before beginning any workout. We are not responsible for injuries caused by unsafe exercise conditions or equipment malfunction.
                </p>
                <p>
                  <strong>Professional Guidance:</strong> If you are new to exercise, have health conditions, injuries, or take medications, consult with qualified fitness professionals and healthcare providers before starting any workout program.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Limitations & Technology Disclaimer */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Bot className="h-5 w-5 text-purple-500" />
                </div>
                AI Limitations & Technology Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>AI Accuracy:</strong> Our AI systems for food recognition, nutrition estimation, and fitness recommendations are based on machine learning models that may not be 100% accurate. Results should be verified and not relied upon for medical purposes.
                </p>
                <p>
                  <strong>Technology Limitations:</strong> AI performance may vary based on image quality, lighting conditions, food types, voice clarity, and other environmental factors. The system may misidentify foods or provide incorrect nutritional information.
                </p>
                <p>
                  <strong>Continuous Improvement:</strong> Our AI models are continuously updated and improved, but this may result in changes to recommendations over time. Past results may not reflect current AI capabilities.
                </p>
                <p>
                  <strong>Human Oversight:</strong> AI recommendations should be combined with human judgment and professional advice. Do not make significant health or fitness decisions based solely on AI-generated information.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Processing & International Transfers */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-green-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                Data Processing & International Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>Global Processing:</strong> Your data may be processed and stored in servers located in different countries to provide optimal service performance. We ensure appropriate safeguards are in place for international data transfers.
                </p>
                <p>
                  <strong>Cloud Services:</strong> We use reputable cloud service providers including Google Cloud Platform and Firebase, which may process your data in various geographic locations in accordance with their data processing agreements.
                </p>
                <p>
                  <strong>Compliance Standards:</strong> We adhere to applicable data protection regulations including GDPR, CCPA, and other regional privacy laws where we operate or serve users.
                </p>
                <p>
                  <strong>Data Localization:</strong> Where legally required, we implement data localization measures to keep certain types of data within specific geographic boundaries.
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Limitation of Liability */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-orange-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  To the fullest extent permitted by law, Bago and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, resulting from your use of the app.
                </p>
                <p>
                  Our total liability for any claims shall not exceed the amount you paid for the app in the 12 months preceding the claim, or $100, whichever is less.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-red-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Zap className="h-5 w-5 text-red-500" />
                </div>
                Account Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You may terminate your account at any time by deleting the app and contacting us to delete your data. We may suspend or terminate your account if you violate these terms.
                </p>
                <p>
                  Upon termination, your right to use the app ceases immediately. We may retain some data as required by law or for legitimate business purposes as outlined in our Privacy Policy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 via-card to-card border-b border-border/50">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Scale className="h-5 w-5 text-blue-500" />
                </div>
                Governing Law & Disputes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  These terms are governed by the laws of your jurisdiction. Any disputes will be resolved through binding arbitration or in courts of competent jurisdiction.
                </p>
                <p>
                  If any provision of these terms is found unenforceable, the remaining provisions will continue in full force and effect.
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
                Questions About These Terms?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  If you have questions about these terms and conditions, need clarification on any provisions, or want to report violations, please contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="mailto:selvarasann09@gmail.com">
                      <Mail className="h-4 w-4 mr-2" />
                      selvarasann09@gmail.com
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/privacy">
                      <Shield className="h-4 w-4 mr-2" />
                      Privacy Policy
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  We respond to legal inquiries within 5 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>        {/* Footer */}
        <motion.div variants={itemVariants} className="mt-12 text-center">
          <div className="bg-muted/30 rounded-lg p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Important Legal Notice:</strong> By downloading, installing, or using Bago, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, our Privacy Policy, and any additional terms that may apply to specific features or services.
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              These terms constitute the entire agreement between you and Bago regarding your use of the service and supersede any prior agreements. If you do not agree to these terms, please do not use the application.
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Health Disclaimer:</strong> Bago is a fitness tracking tool and is not intended to diagnose, treat, cure, or prevent any disease. Always consult with qualified healthcare professionals before making health-related decisions.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/privacy">Privacy Policy</Link>
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
