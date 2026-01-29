'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PredictCard from '@/components/PredictCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ShareModal from '@/components/ShareModal';
import Navigation from '@/components/Navigation';
import { savePrediction } from '@/lib/db';
import { runPrediction } from '@/lib/predictor';
import { getNextIssueInfo, getAvailableRecords } from '@/lib/dataFetcher';
import { generateId } from '@/lib/utils';
import type { PredictionResult } from '@/lib/types';

export default function PredictPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('正在获取历史数据...');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [targetIssue, setTargetIssue] = useState('');
  const [error, setError] = useState('');
  const [usedDataCount, setUsedDataCount] = useState(0);

  const generatePredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setLoadingMsg('正在获取历史数据...');

      // 获取可用的历史数据（优先服务器，回退本地缓存）
      const records = await getAvailableRecords();

      if (records.length < 50) {
        setError('历史数据不足50期，请返回首页等待数据加载完成');
        setLoading(false);
        return;
      }

      setUsedDataCount(records.length);
      console.log(`预测分析使用了 ${records.length} 期历史数据`);

      const nextInfo = getNextIssueInfo();
      setTargetIssue(nextInfo.issue);

      setLoadingMsg(`正在基于 ${records.length} 期数据进行分析...`);

      // 运行预测
      const results = await runPrediction(records, (msg) =>
        setLoadingMsg(msg)
      );
      setPredictions(results);

      // 保存预测记录
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generatePredictions();
  }, [generatePredictions]);

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
          <p className="text-red-500 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm"
            >
              返回首页
            </button>
            <button
              onClick={generatePredictions}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl text-sm"
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
    <div className="min-h-screen pb-20 p-4">
      {/* 头部 */}
      <header className="flex items-center justify-between py-4">
        <button
          onClick={() => router.push('/')}
          className="text-white/80 text-sm flex items-center gap-1"
        >
          ← 返回
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg"
          >
            分享
          </button>
          <button
            onClick={generatePredictions}
            className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg"
          >
            重新生成
          </button>
        </div>
      </header>

      {/* 标题 */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-white">预测号码</h1>
        <p className="text-white/60 text-sm mt-1">
          第{targetIssue}期 · 共{predictions.length}组
        </p>
        <p className="text-white/40 text-xs mt-1">
          基于 {usedDataCount} 期历史数据分析
        </p>
      </div>

      {/* 预测结果列表 */}
      <div className="space-y-3">
        {predictions.map((pred, index) => (
          <PredictCard key={index} prediction={pred} index={index} />
        ))}
      </div>

      {/* 免责声明 */}
      <div className="mt-6 text-center">
        <p className="text-white/40 text-xs leading-relaxed">
          以上预测结果仅供参考娱乐，不构成投注建议。
          <br />
          彩票有风险，投注需理性。
        </p>
      </div>

      {/* 分享弹窗 */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        predictions={predictions}
        targetIssue={targetIssue}
      />

      <Navigation />
    </div>
  );
}
