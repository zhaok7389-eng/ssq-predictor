'use client';

interface BallNumberProps {
  number: number;
  type: 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}

export default function BallNumber({ number, type, size = 'md' }: BallNumberProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const colorClasses = {
    red: 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-300/50',
    blue: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-300/50',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full font-bold text-white shadow-lg
        transform hover:scale-110 transition-transform
        ${sizeClasses[size]}
        ${colorClasses[type]}
      `}
    >
      {String(number).padStart(2, '0')}
    </span>
  );
}
