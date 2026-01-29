'use client';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = '加载中...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* 弹跳球动画 */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full loading-ball ${
              i <= 3
                ? 'bg-gradient-to-br from-red-400 to-red-600'
                : i <= 5
                ? 'bg-gradient-to-br from-red-400 to-red-600'
                : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }`}
          />
        ))}
      </div>

      {/* 加载消息 */}
      <p className="text-white/80 text-sm animate-pulse">{message}</p>
    </div>
  );
}
