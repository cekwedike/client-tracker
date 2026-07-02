"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export function MotionFadeUp({
  className,
  delay = 0,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={fadeUp}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionStagger({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={staggerContainer}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  className,
  children,
  index = 0,
  ...props
}: HTMLMotionProps<"div"> & { index?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : { opacity: 0, y: 20, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
              transition: { duration: 0.2 },
            }
      }
      style={{ transformPerspective: 800 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
