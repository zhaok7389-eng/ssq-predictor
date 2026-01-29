'use client';

import BallNumber from './BallNumber';
import type { PredictionResult } from '@/lib/types';

interface PredictCardProps {
  prediction: PredictionResult;
  index: number;
}

export default function PredictCard({ prediction, index }: PredictCardProps) {
  const { red, blue, confidence, strategy } = prediction;

  // 根据置信度选择标签样式
  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'text-green-600 bg-green-50';
    if (conf >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  // 根据排名选择图标
  const getRankIcon = (idx: number) => {
    if (idx === 0) return '\u{1F3C6}';
    if (idx <= 2) return '\u2B50';
    if (idx <= 5) return '\u{1F4CC}';
    return '\u{1F50D}';
  };

  return (
    <div
      className="card animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getRankIcon(index)}</span>
          <span className="font-semibold text-ssq-text">
            {index === 0 ? '\u63A8\u8350' : `\u7B2C${index + 1}\u7EC4`}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(confidence)}`}
        >
          {confidence}%
        </span>
      </div>

      {/* 号码球 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {red.map((n, i) => (
          <BallNumber key={`red-${i}`} number={n} type="red" />
        ))}
        <span className="mx-1 text-gray-300">|</span>
        <BallNumber number={blue} type="blue" />
      </div>

      {/* 策略说明 */}
      <div className="mt-2 text-xs text-gray-500">
        {strategy}
      </div>
    </div>
  );
}
