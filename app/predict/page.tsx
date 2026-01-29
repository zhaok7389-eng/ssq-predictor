'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toBlob } from 'html-to-image';
import PredictCard from '@/components/PredictCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import { savePrediction } from '@/lib/db';
import { runPrediction } from '@/lib/predictor';
import { getNextIssueInfo, getAvailableRecords } from '@/lib/dataFetcher';
import { generateId } from '@/lib/utils';
import type { PredictionResult } from '@/lib/types';

// Coin rain effect
function CoinRain() {
  const [coins, setCoins] = useState<{ id: number; left: number; delay: number }[]>([]);

  useEffect(() => {
    const newCoins = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setCoins(newCoins);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="coin-particle"
          style={{
            left: `${coin.left}%`,
            animationDelay: `${coin.delay}s`,
          }}
        >
          {'\u{1FA99}'}
        </div>
      ))}
    </div>
  );
}

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

export default function PredictPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('\u6B63\u5728\u83B7\u53D6\u5386\u53F2\u6570\u636E...');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [targetIssue, setTargetIssue] = useState('');
  const [error, setError] = useState('');
  const [usedDataCount, setUsedDataCount] = useState(0);
  const [showCoinRain, setShowCoinRain] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const resultsRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2000);
  };

  const generatePredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setLoadingMsg('\u6B63\u5728\u83B7\u53D6\u5386\u53F2\u6570\u636E...');

      const records = await getAvailableRecords();

      if (records.length < 50) {
        setError('\u5386\u53F2\u6570\u636E\u4E0D\u8DB350\u671F\uFF0C\u8BF7\u8FD4\u56DE\u9996\u9875\u7B49\u5F85\u6570\u636E\u52A0\u8F7D\u5B8C\u6210');
        setLoading(false);
        return;
      }

      setUsedDataCount(records.length);
      const nextInfo = getNextIssueInfo();
      setTargetIssue(nextInfo.issue);

      setLoadingMsg(`\u6B63\u5728\u57FA\u4E8E ${records.length} \u671F\u6570\u636E\u8FDB\u884C\u5206\u6790...`);

      const results = await runPrediction(records, (msg) =>
        setLoadingMsg(msg)
      );
      setPredictions(results);

      // Show coin rain on success
      setShowCoinRain(true);
      setTimeout(() => setShowCoinRain(false), 3000);

      await savePrediction({
        id: generateId(),
        targetIssue: nextInfo.issue,
        targetDate: nextInfo.date,
        predictions: results,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('\u9884\u6D4B\u5931\u8D25:', err);
      setError('\u9884\u6D4B\u8FC7\u7A0B\u51FA\u9519\uFF0C\u8BF7\u91CD\u8BD5');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generatePredictions();
  }, [generatePredictions]);

  // Save as image
  const handleSaveImage = async () => {
    if (!resultsRef.current) return;
    try {
      showToast('\u6B63\u5728\u751F\u6210\u56FE\u7247...');
      const blob = await toBlob(resultsRef.current, {
        backgroundColor: '#FFF0F3',
        pixelRatio: 2,
      });
      if (!blob) {
        showToast('\u56FE\u7247\u751F\u6210\u5931\u8D25');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `\u53D1\u8D22\u7814\u7A76\u6240_\u7B2C${targetIssue}\u671F.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('\u{1F437} \u56FE\u7247\u5DF2\u4FDD\u5B58\uFF01');
    } catch (_e) {
      showToast('\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
    }
  };

  // Copy homework
  const handleCopy = async () => {
    const text = predictions
      .map((p, i) => {
        const red = p.red.map((n) => String(n).padStart(2, '0')).join(' ');
        const blue = String(p.blue).padStart(2, '0');
        return `${i + 1}. \u7EA2:${red} \u84DD:${blue} (${p.confidence}%)`;
      })
      .join('\n');

    const fullText = `\u{1F437} \u8F6F\u808B\u306E\u53D1\u8D22\u7814\u7A76\u6240\n\u7B2C${targetIssue}\u671F\u9884\u6D4B\n\n${text}\n\n\u4EC5\u4F9B\u5A31\u4E50\u53C2\u8003 Made with \u{1F49D} by \u9ED1\u5A03`;

    try {
      await navigator.clipboard.writeText(fullText);
      showToast('\u{1F437} \u4F5C\u4E1A\u5DF2\u62F7\u8D1D\uFF01');
    } catch (_e) {
      const textarea = document.createElement('textarea');
      textarea.value = fullText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('\u{1F437} \u4F5C\u4E1A\u5DF2\u62F7\u8D1D\uFF01');
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

    const shareText = `\u{1F437} \u8F6F\u808B\u306E\u53D1\u8D22\u7814\u7A76\u6240\n\u7B2C${targetIssue}\u671F\u524D3\u7EC4\u63A8\u8350\uFF1A\n${text}\n\nMade with \u{1F49D} by \u9ED1\u5A03`;

    if (navigator.share) {
      try {
        await navigator.share({ title: '\u53D1\u8D22\u7814\u7A76\u6240\u9884\u6D4B', text: shareText });
      } catch (_e) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F');
      } catch (_e) {
        showToast('\u5206\u4EAB\u5931\u8D25');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner message={loadingMsg} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center">
          <div className="text-4xl mb-4">{'\u{1F437}'}</div>
          <p className="text-ssq-red mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-100 text-ssq-text rounded-xl text-sm"
            >
              \u8FD4\u56DE\u9996\u9875
            </button>
            <button
              onClick={generatePredictions}
              className="px-6 py-2 bg-pink-500 text-white rounded-xl text-sm"
            >
              \u91CD\u8BD5
            </button>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 p-4">
      {showCoinRain && <CoinRain />}

      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <button
          onClick={() => router.push('/')}
          className="text-ssq-sub text-sm flex items-center gap-1"
        >
          {'\u2190'} \u8FD4\u56DE
        </button>
        <button
          onClick={generatePredictions}
          className="px-3 py-1.5 bg-pink-50 text-pink-500 text-xs rounded-lg border border-pink-200"
        >
          {'\u{1F504}'} \u91CD\u65B0\u62BD\u7B7E
        </button>
      </header>

      {/* Title section */}
      <div className="text-center mb-6">
        <div className="text-4xl pig-float mb-2">{'\u{1F437}'}</div>
        <h1 className="text-xl font-bold text-gradient-pink">{'\u{1F3B0}'} \u62BD\u7B7E\u7ED3\u679C</h1>
        <p className="text-ssq-sub text-sm mt-1">
          \u7B2C{targetIssue}\u671F \u00B7 \u5171{predictions.length}\u7EC4
        </p>
        <p className="text-ssq-sub text-xs mt-1">
          \u57FA\u4E8E {usedDataCount} \u671F\u5386\u53F2\u6570\u636E\u5206\u6790
        </p>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="space-y-3">
        {predictions.map((pred, index) => (
          <PredictCard key={index} prediction={pred} index={index} />
        ))}
      </div>

      {/* Bottom actions */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          onClick={handleSaveImage}
          className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl shadow-sm border border-pink-100"
        >
          <span className="text-lg">{'\u{1F4F7}'}</span>
          <span className="text-xs text-ssq-text">\u4FDD\u5B58\u56FE\u7247</span>
        </button>
        <button
          onClick={handleCopy}
          className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl shadow-sm border border-pink-100"
        >
          <span className="text-lg">{'\u{1F4DD}'}</span>
          <span className="text-xs text-ssq-text">\u62F7\u4F5C\u4E1A</span>
        </button>
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl shadow-sm border border-pink-100"
        >
          <span className="text-lg">{'\u{1F4E4}'}</span>
          <span className="text-xs text-ssq-text">\u5206\u4EAB</span>
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 text-center">
        <p className="text-ssq-sub text-xs leading-relaxed">
          \u4EE5\u4E0A\u9884\u6D4B\u7ED3\u679C\u4EC5\u4F9B\u53C2\u8003\u5A31\u4E50\uFF0C\u4E0D\u6784\u6210\u6295\u6CE8\u5EFA\u8BAE\u3002
          <br />
          \u5F69\u7968\u6709\u98CE\u9669\uFF0C\u6295\u6CE8\u9700\u7406\u6027\u3002
        </p>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-pink-300">
          Made with {'\u{1F49D}'} by \u9ED1\u5A03
        </p>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
      <Navigation />
    </div>
  );
}
