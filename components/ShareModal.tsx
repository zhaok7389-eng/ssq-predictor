'use client';

import { useState } from 'react';
import type { PredictionResult } from '@/lib/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictions: PredictionResult[];
  targetIssue: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  predictions,
  targetIssue,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = generateShareText(predictions, targetIssue);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '双色球预测 - 第' + targetIssue + '期',
          text: shareText,
        });
      } catch (_e) {
        // 用户取消分享
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ssq-text">分享预测结果</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-60 overflow-y-auto">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
            {shareText}
          </pre>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
          >
            {copied ? '已复制 ✓' : '复制文本'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors"
          >
            分享
          </button>
        </div>
      </div>
    </div>
  );
}

function generateShareText(predictions: PredictionResult[], targetIssue: string): string {
  const lines = [
    '双色球智能预测 - 第' + targetIssue + '期',
    '',
    ...predictions.map((p, i) => {
      const redStr = p.red.map((n) => String(n).padStart(2, '0')).join(' ');
      const blueStr = String(p.blue).padStart(2, '0');
      return (i + 1) + '. 红:' + redStr + ' 蓝:' + blueStr + ' (' + p.confidence + '%)';
    }),
    '',
    '—— 来自 SSQ Predictor',
  ];
  return lines.join('\n');
}
