export function SkeletonCard() {
  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-[#1E1E2E] rounded w-3/4 mb-3" />
      <div className="h-3 bg-[#1E1E2E] rounded w-1/2 mb-2" />
      <div className="h-3 bg-[#1E1E2E] rounded w-2/3 mb-4" />
      <div className="h-8 bg-[#1E1E2E] rounded w-20" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#1E1E2E] rounded w-1/4" />
              <div className="flex gap-4">
                <div className="h-3 bg-[#1E1E2E] rounded w-24" />
                <div className="h-3 bg-[#1E1E2E] rounded w-24" />
                <div className="h-3 bg-[#1E1E2E] rounded w-24" />
              </div>
            </div>
            <div className="h-8 bg-[#1E1E2E] rounded w-16 ml-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonLeaderboard({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-[#12121A] rounded-lg animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-4 w-6 bg-[#1E1E2E] rounded" />
            <div className="h-4 w-24 bg-[#1E1E2E] rounded" />
          </div>
          <div className="h-4 w-12 bg-[#1E1E2E] rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGameRound() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="text-center space-y-3">
        <div className="h-4 w-24 bg-[#1E1E2E] rounded mx-auto" />
        <div className="h-8 w-96 bg-[#1E1E2E] rounded mx-auto" />
        <div className="h-4 w-48 bg-[#1E1E2E] rounded mx-auto" />
      </div>
      <div className="flex gap-4 justify-center">
        <div className="h-16 w-32 bg-[#1E1E2E] rounded-xl" />
        <div className="h-16 w-32 bg-[#1E1E2E] rounded-xl" />
      </div>
      <div className="h-48 bg-[#1E1E2E] rounded-xl" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="bg-[#12121A] p-6 rounded-xl border border-[#1E1E2E]">
        <div className="h-6 w-24 bg-[#1E1E2E] rounded mb-4" />
        <div className="h-4 w-64 bg-[#1E1E2E] rounded mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 w-16 bg-[#1E1E2E] rounded mx-auto mb-1" />
              <div className="h-3 w-12 bg-[#1E1E2E] rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
