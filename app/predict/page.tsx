'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toBlob } from 'html-to-image';
import SlotMachine from '@/components/SlotMachine';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import { savePrediction } from '@/lib/db';
import { runPrediction } from '@/lib/predictor';
import { getNextIssueInfo, getAvailableRecords } from '@/lib/dataFetcher';
import { generateId } from '@/lib/utils';
import type { PredictionResult } from '@/lib/types';

// Toast notification
function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg toast-in">
        {message}
      </div>
    </div>
  );
}

// Pig comments based on confidence
function getPigComment(confidence: number): string {
  if (confidence >= 90) {
    const c = ['这签稳得很哦~', '黑娃说这组有戏！', '小财迷快下注！', '哼哼，发财啦~'];
    return c[Math.floor(Math.random() * c.length)];
  } else if (confidence >= 70) {
    const c = ['冷热搭配，妙~', '感觉还不错哦', '可以试试看~', '有点意思~'];
    return c[Math.floor(Math.random() * c.length)];
  } else {
    const c = ['赌一把？', '妖精鬼觉得会反弹', '玄学一下~', '搏一搏，单车变摩托'];
    return c[Math.floor(Math.random() * c.length)];
  }
}

export default function PredictPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'loading' | 'spinning' | 'complete'>('loading');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [targetIssue, setTargetIssue] = useState('');
  const [error, setError] = useState('');
  const [usedDataCount, setUsedDataCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const resultsRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2000);
  };

  const loadPredictions = useCallback(async () => {
    try {
      setStage('loading');
      setError('');
      setShowResults(false);

      const records = await getAvailableRecords();

      if (records.length < 50) {
        setError('历史数据不足50期，请返回首页等待数据加载完成');
        return;
      }

      setUsedDataCount(records.length);
      const nextInfo = getNextIssueInfo();
      setTargetIssue(nextInfo.issue);

      const results = await runPrediction(records, () => {});
      setPredictions(results);
      setStage('spinning');

      await savePrediction({
        id: generateId(),
        targetIssue: nextInfo.issue,
        targetDate: nextInfo.date,
        predictions: results,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('预测失败:', err);
      setError('预测过程出错，请重试');
    }
  }, []);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const handleSlotComplete = useCallback(() => {
    // Show coin rain
    const container = document.getElementById('coin-container');
    if (container) {
      for (let i = 0; i < 30; i++) {
        const coin = document.createElement('div');
        coin.innerHTML = '🪙';
        coin.className = 'fixed text-3xl coin-fall pointer-events-none';
        coin.style.left = `${Math.random() * 100}vw`;
        coin.style.animationDelay = `${Math.random() * 0.5}s`;
        coin.style.zIndex = '100';
        container.appendChild(coin);
        setTimeout(() => coin.remove(), 2500);
      }
    }

    setTimeout(() => {
      setShowResults(true);
      setStage('complete');
    }, 1000);
  }, []);

  // Save as image
  const handleSaveImage = async () => {
    if (!resultsRef.current) return;
    try {
      showToast('正在生成图片...');
      const blob = await toBlob(resultsRef.current, {
        backgroundColor: '#fff5f5',
        pixelRatio: 2,
      });
      if (!blob) {
        showToast('图片生成失败');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `发财研究所_第${targetIssue}期.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('🐷 图片已保存！');
    } catch (_e) {
      showToast('保存失败，请重试');
    }
  };

  // Copy homework
  const handleCopy = async () => {
    const text = predictions
      .map((p, i) => {
        const red = p.red.map((n) => String(n).padStart(2, '0')).join(' ');
        const blue = String(p.blue).padStart(2, '0');
        return `${i + 1}. 红:${red} 蓝:${blue} (${p.confidence}%)`;
      })
      .join('\n');

    const fullText = `🐷 软肋の发财研究所\n第${targetIssue}期预测\n\n${text}\n\n仅供娱乐参考 Made with 💝 by 黑娃`;

    try {
      await navigator.clipboard.writeText(fullText);
      showToast('🐷 作业已拷贝！');
    } catch (_e) {
      const textarea = document.createElement('textarea');
      textarea.value = fullText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('🐷 作业已拷贝！');
    }
  };

  // Share
  const handleShare = async () => {
    const text = predictions
      .slice(0, 3)
      .map((p, i) => {
        const red = p.red.map((n) => String(n).padStart(2, '0')).join(' ');
        const blue = String(p.blue).padStart(2, '0');
        return `${i + 1}. ${red} | ${blue}`;
      })
      .join('\n');

    const shareText = `🐷 软肋の发财研究所\n第${targetIssue}期前3组推荐：\n${text}\n\nMade with 💝 by 黑娃`;

    if (navigator.share) {
      try {
        await navigator.share({ title: '发财研究所预测', text: shareText });
      } catch (_e) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('已复制到剪贴板');
      } catch (_e) {
        showToast('分享失败');
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center">
          <div className="text-4xl mb-4">🐷</div>
          <p className="text-red-500 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm"
            >
              返回首页
            </button>
            <button
              onClick={loadPredictions}
              className="px-6 py-2 bg-pink-500 text-white rounded-xl text-sm"
            >
              重试
            </button>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-yellow-50 to-pink-50 pb-24">
      {/* Coin container */}
      <div id="coin-container" className="fixed inset-0 pointer-events-none z-50" />

      {/* Top bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 p-4 border-b">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => router.push('/')} className="text-2xl">←</button>
          <h1 className="text-lg font-bold">
            {stage === 'spinning' ? '🎰 妖精鬼显灵中...' : stage === 'complete' ? '✨ 发财签出炉啦！' : '🐷 让本猪研究一下...'}
          </h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Loading state */}
        {stage === 'loading' && (
          <div className="text-center py-12">
            <LoadingSpinner message="让本猪研究一下..." />
          </div>
        )}

        {/* Slot machine - show first prediction */}
        {stage !== 'loading' && predictions.length > 0 && (
          <SlotMachine
            finalNumbers={{
              red: predictions[0].red,
              blue: predictions[0].blue,
            }}
            onComplete={handleSlotComplete}
          />
        )}

        {/* 10 prediction results */}
        {showResults && (
          <div ref={resultsRef} className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">
                ✨ 第{targetIssue}期 发财签
              </h2>
              <p className="text-sm text-gray-500">
                基于 {usedDataCount} 期数据 · AI深度分析
              </p>
            </div>

            {predictions.map((pred, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 shadow-lg animate-card-pop"
                style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold">
                    {index === 0 ? '🏆' : '⭐'} 第{index + 1}签
                  </span>
                  <span className="text-sm bg-gradient-to-r from-pink-500 to-red-500 text-white px-3 py-1 rounded-full">
                    财运指数 {pred.confidence}%
                  </span>
                </div>

                {/* Number balls */}
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {pred.red.map((num, i) => (
                    <div
                      key={i}
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold shadow-lg transform hover:scale-110 transition-transform"
                    >
                      {String(num).padStart(2, '0')}
                    </div>
                  ))}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg transform hover:scale-110 transition-transform ml-2">
                    {String(pred.blue).padStart(2, '0')}
                  </div>
                </div>

                {/* Pig comment */}
                <div className="text-center text-sm text-gray-600 bg-pink-50 rounded-lg py-2">
                  🐷 猪儿虫说：{getPigComment(pred.confidence)}
                </div>

                {/* Strategy */}
                <div className="mt-2 text-xs text-gray-400 text-center">
                  {pred.strategy}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {showResults && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleSaveImage}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-bold shadow-md"
              >
                📸 存到相册
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold shadow-md"
              >
                📋 抄作业
              </button>
            </div>
            <button
              onClick={handleShare}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-md"
            >
              💕 分享给其他小财迷
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {showResults && (
        <div className="text-center p-4 max-w-lg mx-auto">
          <p className="text-gray-400 text-xs leading-relaxed">
            以上预测结果仅供参考娱乐，不构成投注建议。
            <br />
            彩票有风险，投注需理性。
          </p>
          <p className="text-xs text-pink-300 mt-2">
            Made with 💝 by 黑娃
          </p>
        </div>
      )}

      <Toast message={toast.message} visible={toast.visible} />
      <Navigation />
    </div>
  );
}
