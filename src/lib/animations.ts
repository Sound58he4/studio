// Performance-optimized animation variants for framer-motion
export const fadeInVariants = {
  hidden: { 
    opacity: 0,
    transform: 'translateY(20px)'
  },
  visible: { 
    opacity: 1,
    transform: 'translateY(0px)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] // Custom cubic-bezier for smoother animation
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const slideUpVariants = {
  hidden: { 
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

export const scaleInVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.8
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25
    }
  }
};

// Reduced motion variants for accessibility
export const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  }
};

export const cardHoverVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

// Performance optimization: Use transform properties only
export const optimizedSlideVariants = {
  hidden: { 
    opacity: 0,
    transform: 'translate3d(0, 20px, 0)'
  },
  visible: { 
    opacity: 1,
    transform: 'translate3d(0, 0, 0)',
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};
