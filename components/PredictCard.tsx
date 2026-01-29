'use client';

import BallNumber from './BallNumber';
import type { PredictionResult } from '@/lib/types';

interface PredictCardProps {
  prediction: PredictionResult;
  index: number;
}

// Pig comments based on confidence
function getPigComment(confidence: number): string {
  if (confidence >= 90) return '🐷💯 本猪拍胸脊保证！';
  if (confidence >= 80) return '🐷✨ 这组本猪很看好哦！';
  if (confidence >= 70) return '🐷👍 感觉还行，可以一试~';
  if (confidence >= 60) return '🐷🤔 要不试试？';
  return '🐷🌱 来试试运气吧~';
}

// Rank badge
function getRankBadge(idx: number): string {
  if (idx === 0) return '👑';
  if (idx === 1) return '🥈';
  if (idx === 2) return '🥉';
  return `${idx + 1}`;
}

export default function PredictCard({ prediction, index }: PredictCardProps) {
  const { red, blue, confidence, strategy } = prediction;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (conf >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  return (
    <div
      className="card animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getRankBadge(index)}</span>
          <span className="font-semibold text-ssq-text">
            {index === 0 ? '🐷 本猪首推' : `第${index + 1}组`}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium border ${getConfidenceColor(confidence)}`}
        >
          {confidence}%
        </span>
      </div>

      {/* Number balls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {red.map((n, i) => (
          <BallNumber key={`red-${i}`} number={n} type="red" />
        ))}
        <span className="mx-1 text-gray-300">|</span>
        <BallNumber number={blue} type="blue" />
      </div>

      {/* Pig comment */}
      <div className="mt-3 flex items-start gap-2">
        <div className="bg-pink-50 rounded-xl px-3 py-1.5 flex-1">
          <p className="text-xs text-pink-600">{getPigComment(confidence)}</p>
        </div>
      </div>

      {/* Strategy */}
      <div className="mt-2 text-xs text-ssq-sub">
        {strategy}
      </div>
    </div>
  );
}
