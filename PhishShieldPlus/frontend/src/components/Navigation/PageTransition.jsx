import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, x: 10, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: -10, filter: 'blur(4px)' }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className="flex-1 flex overflow-hidden w-full h-full"
    >
      {children}
    </motion.div>
  );
}
