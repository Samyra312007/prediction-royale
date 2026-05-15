"use client";

interface ShareButtonProps {
  gameAddress: string;
  rank: number;
  prizeEth: string;
  roundsSurvived: number;
}

export function ShareButton({ gameAddress, rank, prizeEth, roundsSurvived }: ShareButtonProps) {
  const shareText = encodeURIComponent(
    `I ${rank === 1 ? "won" : "placed #" + rank} on @PMBR! ` +
    `Survived ${roundsSurvived} rounds${Number(prizeEth) > 0 ? ` and won ${prizeEth} ETH` : ""}. ` +
    `Predict. Compete. Survive. 🏆`
  );
  const url = encodeURIComponent(`https://pmbr.vercel.app/game/${gameAddress}`);
  const tweetUrl = `https://x.com/intent/tweet?text=${shareText}&url=${url}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg text-sm font-medium hover:bg-[#1a8cd8] transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share on X
    </a>
  );
}
