'use client';

import BallNumber from './BallNumber';
import type { PredictionResult } from '@/lib/types';

interface PredictCardProps {
  prediction: PredictionResult;
  index: number;
}

// Pig comments based on confidence
function getPigComment(confidence: number): string {
  if (confidence >= 90) return '\u{1F437}\u{1F4AF} \u672C\u732A\u62CD\u80F8\u810A\u4FDD\u8BC1\uFF01';
  if (confidence >= 80) return '\u{1F437}\u2728 \u8FD9\u7EC4\u672C\u732A\u5F88\u770B\u597D\u54E6\uFF01';
  if (confidence >= 70) return '\u{1F437}\u{1F44D} \u611F\u89C9\u8FD8\u884C\uFF0C\u53EF\u4EE5\u4E00\u8BD5~';
  if (confidence >= 60) return '\u{1F437}\u{1F914} \u8981\u4E0D\u8BD5\u8BD5\uFF1F';
  return '\u{1F437}\u{1F331} \u6765\u8BD5\u8BD5\u8FD0\u6C14\u5427~';
}

// Rank badge
function getRankBadge(idx: number): string {
  if (idx === 0) return '\u{1F451}';
  if (idx === 1) return '\u{1F948}';
  if (idx === 2) return '\u{1F949}';
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
            {index === 0 ? '\u{1F437} \u672C\u732A\u9996\u63A8' : `\u7B2C${index + 1}\u7EC4`}
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
