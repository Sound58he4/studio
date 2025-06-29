"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Flame, Zap, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CalisthenicsSuccessToastProps {
  title: string;
  description?: string;
  onClose: () => void;
  isDark?: boolean;
}

const CalisthenicsSuccessToast: React.FC<CalisthenicsSuccessToastProps> = ({
  title,
  description,
  onClose,
  isDark = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`max-w-md rounded-3xl border-0 shadow-2xl backdrop-blur-sm overflow-hidden relative ${
        isDark 
          ? 'bg-gradient-to-br from-[#2a2a2a] via-green-900/20 to-[#2a2a2a] border-green-500/20' 
          : 'bg-gradient-to-br from-white/95 via-green-50/80 to-emerald-50/60'
      }`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180] 
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [180, 90, 0] 
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-400 rounded-full blur-lg" 
        />
      </div>

      <div className="p-4 relative z-10">
        <div className="flex items-start space-x-3">
          {/* Success Icon with Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg relative"
          >
            <CheckCircle className="w-5 h-5 text-white" />
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/50 to-emerald-400/50" 
            />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.h4 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`font-semibold text-sm ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {title}
            </motion.h4>
            {description && (
              <motion.p 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-xs mt-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {description}
              </motion.p>
            )}
          </div>

          {/* Close Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`h-6 w-6 p-0 rounded-full ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        </div>

        {/* Progress Bar Animation */}
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 4, ease: "linear" }}
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
        />
      </div>

      {/* Floating Particles Effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: 20, 
              x: Math.random() * 100 
            }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: -20, 
              x: Math.random() * 100 + 50 
            }}
            transition={{ 
              duration: 2, 
              delay: i * 0.5,
              repeat: Infinity,
              repeatDelay: 3 
            }}
            className="absolute bottom-4 w-1 h-1 bg-green-400 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default CalisthenicsSuccessToast;
