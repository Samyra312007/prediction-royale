"use client";

import { motion } from "framer-motion";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-surface-800/50 shimmer ${className || ""}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-surface-800 bg-surface-900 p-5"
    >
      <ShimmerBlock className="mb-3 h-4 w-3/4" />
      <ShimmerBlock className="mb-2 h-3 w-1/2" />
      <ShimmerBlock className="mb-4 h-3 w-2/3" />
      <ShimmerBlock className="h-9 w-20" />
    </motion.div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border border-surface-800 bg-surface-900 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <ShimmerBlock className="h-4 w-1/4" />
              <div className="flex gap-4">
                <ShimmerBlock className="h-3 w-20" />
                <ShimmerBlock className="h-3 w-20" />
                <ShimmerBlock className="h-3 w-20" />
              </div>
            </div>
            <ShimmerBlock className="ml-4 h-8 w-16" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonLeaderboard({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center justify-between rounded-lg bg-surface-900 p-3"
        >
          <div className="flex items-center gap-2">
            <ShimmerBlock className="h-4 w-6" />
            <ShimmerBlock className="h-4 w-24" />
          </div>
          <ShimmerBlock className="h-4 w-12" />
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonGameRound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="space-y-3 text-center">
        <ShimmerBlock className="mx-auto h-4 w-24" />
        <ShimmerBlock className="mx-auto h-8 w-96" />
        <ShimmerBlock className="mx-auto h-4 w-48" />
      </div>
      <div className="flex justify-center gap-4">
        <ShimmerBlock className="h-16 w-32 rounded-xl" />
        <ShimmerBlock className="h-16 w-32 rounded-xl" />
      </div>
      <ShimmerBlock className="h-48 rounded-xl" />
    </motion.div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-surface-800 bg-surface-900 p-6"
      >
        <ShimmerBlock className="mb-4 h-6 w-24" />
        <ShimmerBlock className="mb-4 h-4 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <ShimmerBlock className="mx-auto mb-1 h-8 w-16" />
              <ShimmerBlock className="mx-auto h-3 w-12" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
