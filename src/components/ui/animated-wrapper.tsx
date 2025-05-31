"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce' | 'stagger';
  duration?: number;
  delay?: number;
  threshold?: number;
  className?: string;
  triggerOnce?: boolean;
  staggerChildren?: number;
}

const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  },
  slideDown: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  },
  slideRight: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: { opacity: 0, scale: 0.3 }
  },
  stagger: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }
};

const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeIn',
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  className = '',
  triggerOnce = true,
  staggerChildren = 0.1
}) => {
  const [ref, inView] = useInView({
    threshold,
    triggerOnce
  });

  const selectedAnimation = animations[animation];
  
  const motionProps = {
    ref,
    initial: selectedAnimation.initial,
    animate: inView ? selectedAnimation.animate : selectedAnimation.initial,
    exit: selectedAnimation.exit,
    transition: {
      duration,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
      ...(animation === 'stagger' && {
        staggerChildren,
        delayChildren: delay
      })
    },
    className
  };

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
};

export default AnimatedWrapper;

// Specialized components for common use cases
export const FadeInWrapper: React.FC<Omit<AnimatedWrapperProps, 'animation'>> = (props) => (
  <AnimatedWrapper {...props} animation="fadeIn" />
);

export const SlideUpWrapper: React.FC<Omit<AnimatedWrapperProps, 'animation'>> = (props) => (
  <AnimatedWrapper {...props} animation="slideUp" />
);

export const ScaleWrapper: React.FC<Omit<AnimatedWrapperProps, 'animation'>> = (props) => (
  <AnimatedWrapper {...props} animation="scale" />
);

export const BounceWrapper: React.FC<Omit<AnimatedWrapperProps, 'animation'>> = (props) => (
  <AnimatedWrapper {...props} animation="bounce" />
);

// Stagger container for animating lists
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.1 }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Page transition wrapper
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <AnimatePresence mode="wait">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
