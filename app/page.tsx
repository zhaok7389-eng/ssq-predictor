'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BallNumber from '@/components/BallNumber';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import { initData, getNextIssueInfo } from '@/lib/dataFetcher';
import { getLatestRecord, getLotteryCount } from '@/lib/db';
import type { LotteryRecord } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('正在初始化...');
  const [latestRecord, setLatestRecord] = useState<LotteryRecord | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [nextIssue, setNextIssue] = useState({ issue: '', date: '', dayOfWeek: '' });
  const [isPredicting, setIsPredicting] = useState(false);

  // 初始化数据
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      const result = await initData((msg) => setLoadingMsg(msg));
      setTotalCount(result.total);

      const latest = await getLatestRecord();
      setLatestRecord(latest || null);

      setNextIssue(getNextIssueInfo());
    } catch (err) {
      console.error('初始化失败:', err);
      setLoadingMsg('数据加载失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 点击预测按钮
  const handlePredict = () => {
    setIsPredicting(true);
    router.push('/predict');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner message={loadingMsg} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4">
      {/* 头部标题 */}
      <header className="text-center py-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          {'\u{1F3B1}'} 双色球智能预测
        </h1>
        <p className="text-white/70 text-sm">
          AI驱动 · 多维分析 · 智能推荐
        </p>
      </header>

      {/* 下一期信息 */}
      <div className="card mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">下一期预测</p>
          <p className="text-lg font-bold text-ssq-text">
            {nextIssue.date ? `${nextIssue.date}（${nextIssue.dayOfWeek}）` : '计算中...'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            开奖时间 21:15
          </p>
        </div>
      </div>

      {/* 上期开奖结果 */}
      {latestRecord && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ssq-text">
              上期开奖结果
            </h2>
            <span className="text-xs text-gray-400">
              第{latestRecord.issue}期
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {latestRecord.red.map((n, i) => (
              <BallNumber key={i} number={n} type="red" size="lg" />
            ))}
            <span className="mx-1 text-gray-300 text-lg">|</span>
            <BallNumber number={latestRecord.blue} type="blue" size="lg" />
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            {latestRecord.date}
          </p>
        </div>
      )}

      {/* 预测按钮 */}
      <div className="my-8 px-4">
        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className="btn-predict w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/30 disabled:opacity-60"
        >
          {isPredicting ? '正在生成...' : '\u{1F3AF} 一键生成预测号码'}
        </button>
      </div>

      {/* 数据统计 */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-purple-600">{totalCount}</p>
            <p className="text-xs text-gray-400">历史数据</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">6</p>
            <p className="text-xs text-gray-400">红球方法</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">10</p>
            <p className="text-xs text-gray-400">蓝球方法</p>
          </div>
        </div>
      </div>

      {/* 方法说明 */}
      <div className="card mt-4">
        <h3 className="text-sm font-semibold text-ssq-text mb-3">预测方法</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <p>{'\u{1F4CA}'} 特征决策树法 · 和值除数取尾法</p>
          <p>{'\u{1F4C8}'} 分布图法 · 除3余数杀号法</p>
          <p>{'\u{1F525}'} 热冷温码法 · 大小奇偶法</p>
          <p>{'\u{1F916}'} DeepSeek AI 综合分析引擎</p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
