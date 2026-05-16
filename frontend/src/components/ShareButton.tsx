"use client";

import { motion } from "framer-motion";

interface ShareButtonProps {
  gameAddress: string;
  rank: number;
  prizeEth: string;
  roundsSurvived: number;
}

export function ShareButton({
  gameAddress,
  rank,
  prizeEth,
  roundsSurvived,
}: ShareButtonProps) {
  const rankText =
    rank === 1
      ? "won"
      : rank === 2
        ? "placed 2nd"
        : rank === 3
          ? "placed 3rd"
          : `placed #${rank}`;

  const shareText = encodeURIComponent(
    `I ${rankText} on @PMBR! Survived ${roundsSurvived} rounds${Number(prizeEth) > 0 ? ` and won ${prizeEth} ETH` : ""}. Predict. Compete. Survive.`
  );
  const url = encodeURIComponent(`https://pmbr.vercel.app/game/${gameAddress}`);
  const tweetUrl = `https://x.com/intent/tweet?text=${shareText}&url=${url}`;

  return (
    <motion.a
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl bg-[#1DA1F2] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1DA1F2]/20 transition-colors hover:bg-[#1a8cd8]"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share on X
    </motion.a>
  );
}
