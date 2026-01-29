'use client';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = '加载中...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl animate-bounce mb-4">🐷</div>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-pink-300 loading-ball"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-gray-500 text-sm animate-pulse">{message}</p>
    </div>
  );
}
