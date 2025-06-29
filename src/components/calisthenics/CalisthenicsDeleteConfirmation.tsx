"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, X, Flame } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CalisthenicsDeleteConfirmationProps {
  trigger: React.ReactNode;
  itemName: string;
  itemType?: string;
  onConfirm: () => void;
  isDark?: boolean;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

const CalisthenicsDeleteConfirmation: React.FC<CalisthenicsDeleteConfirmationProps> = ({
  trigger,
  itemName,
  itemType = "item",
  onConfirm,
  isDark = false,
  isLoading = false,
  title,
  description
}) => {
  const defaultTitle = `Delete ${itemType}?`;
  const defaultDescription = `Are you sure you want to remove "${itemName}" permanently? This action cannot be undone and will clear this ${itemType} from your training data.`;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      
      <AlertDialogContent className={`max-w-md rounded-3xl border-0 shadow-2xl backdrop-blur-sm overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-[#2a2a2a] via-[#1f1f1f] to-[#2a2a2a] border-[#8b5cf6]/20' 
          : 'bg-gradient-to-br from-white/95 via-red-50/80 to-orange-50/60'
      }`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360] 
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-2xl" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0] 
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full blur-xl" 
          />
        </div>
        
        <AlertDialogHeader className="space-y-4 pt-2 relative z-10">
          {/* Calisthenics-themed Warning Icon */}
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center shadow-lg relative"
          >
            <AlertTriangle className="w-8 h-8 text-white" />
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400/50 to-orange-400/50" 
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-2"
          >
            <AlertDialogTitle className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {title || defaultTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className={`text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {description || (
                <>
                  Are you sure you want to remove <span className="font-semibold text-orange-500">"{itemName}"</span> permanently?
                  <br />
                  <span className="text-sm opacity-80 mt-2 block flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3" />
                    This action cannot be undone
                    <Flame className="w-3 h-3" />
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </motion.div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="pt-6 gap-3 relative z-10">
          <AlertDialogCancel asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline"
                disabled={isLoading}
                className={`flex-1 rounded-2xl font-semibold py-3 border-2 transition-all duration-300 ${
                  isDark 
                    ? 'border-gray-600 bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a] hover:border-gray-500' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <X className="w-4 h-4 mr-2" />
                Keep {itemType}
              </Button>
            </motion.div>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <motion.div
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-2xl shadow-lg transition-all duration-300 group relative overflow-hidden disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Trash2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:animate-bounce'}`} />
                  {isLoading ? 'Deleting...' : 'Delete Forever'}
                </span>
                {!isLoading && (
                  <motion.div 
                    animate={{ x: [-100, 100] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-400/50 to-red-600/0 transform"
                  />
                )}
              </Button>
            </motion.div>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CalisthenicsDeleteConfirmation;
