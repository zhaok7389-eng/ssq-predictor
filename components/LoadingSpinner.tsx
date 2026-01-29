'use client';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = '\u52A0\u8F7D\u4E2D...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Pig loading animation */}
      <div className="text-6xl pig-float mb-4">{'\u{1F437}'}</div>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-pink-300 loading-ball"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-ssq-sub text-sm animate-pulse">{message}</p>
    </div>
  );
}
