'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BallNumber from '@/components/BallNumber';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import {
  initData,
  loadFullData,
  forceRefresh,
  getNextIssueInfo,
  type DataStatus,
} from '@/lib/dataFetcher';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('正在初始化...');
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [nextIssue, setNextIssue] = useState({ issue: '', date: '', dayOfWeek: '' });
  const [isPredicting, setIsPredicting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fullLoadProgress, setFullLoadProgress] = useState('');
  const fullLoadStarted = useRef(false);

  // 初始化数据
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      const status = await initData(
        (msg) => setLoadingMsg(msg),
        (s) => setDataStatus(s)
      );
      setDataStatus(status);
      setNextIssue(getNextIssueInfo());
    } catch (err) {
      console.error('初始化失败:', err);
      setLoadingMsg('数据加载失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 后台加载全量数据
  useEffect(() => {
    if (!loading && dataStatus && !dataStatus.isFullLoaded && !fullLoadStarted.current) {
      fullLoadStarted.current = true;
      loadFullData((msg, loaded, total) => {
        if (total > 0) {
          setFullLoadProgress(`正在加载历史数据... ${loaded}/${total}`);
        } else {
          setFullLoadProgress(msg);
        }
      }).then((fullStatus) => {
        setDataStatus(fullStatus);
        setFullLoadProgress('');
      });
    }
  }, [loading, dataStatus]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 手动刷新
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const status = await forceRefresh((msg) => setLoadingMsg(msg));
      setDataStatus(status);
    } catch (_e) {
      // 已在 forceRefresh 中处理
    } finally {
      setIsRefreshing(false);
    }
  };

  // 点击预测按钮
  const handlePredict = () => {
    setIsPredicting(true);
    router.push('/predict');
  };

  // 格式化更新时间
  const formatUpdateTime = (isoStr: string): string => {
    if (!isoStr || isoStr === '离线缓存' || isoStr === '部分缓存') return isoStr;
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return '刚刚';
      if (diffMin < 60) return `${diffMin}分钟前`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}小时前`;
      return date.toLocaleDateString('zh-CN');
    } catch (_e) {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner message={loadingMsg} />
      </div>
    );
  }

  const latest = dataStatus?.latest;

  return (
    <div className="min-h-screen pb-20 p-4">
      {/* 头部标题 */}
      <header className="text-center py-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          双色球智能预测
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
      {latest && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ssq-text">
              上期开奖结果
            </h2>
            <span className="text-xs text-gray-400">
              第{latest.issue}期
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {latest.red.map((n, i) => (
              <BallNumber key={i} number={n} type="red" size="lg" />
            ))}
            <span className="mx-1 text-gray-300 text-lg">|</span>
            <BallNumber number={latest.blue} type="blue" size="lg" />
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            {latest.date}
          </p>
        </div>
      )}

      {/* 预测按钮 */}
      <div className="my-8 px-4">
        <button
          onClick={handlePredict}
          disabled={isPredicting || !dataStatus}
          className="btn-predict w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/30 disabled:opacity-60"
        >
          {isPredicting ? '正在生成...' : '一键生成预测号码'}
        </button>
      </div>

      {/* 数据状态卡片 */}
      {dataStatus && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ssq-text">数据状态</h3>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                isRefreshing
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            >
              {isRefreshing ? '刷新中...' : '刷新数据'}
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">历史数据</span>
              <span className="font-medium text-ssq-text">{dataStatus.total} 期</span>
            </div>
            {latest && (
              <div className="flex justify-between">
                <span className="text-gray-500">最新一期</span>
                <span className="font-medium text-ssq-text">
                  第{latest.issue}期 ({latest.date})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">数据更新</span>
              <span className="font-medium text-ssq-text">
                {formatUpdateTime(dataStatus.lastUpdate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">状态</span>
              <span className={`font-medium ${
                dataStatus.source === 'server' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {dataStatus.source === 'server'
                  ? (dataStatus.isFullLoaded ? '已同步全部数据' : '已同步最新数据')
                  : '使用离线缓存'}
              </span>
            </div>
          </div>

          {/* 后台加载进度 */}
          {fullLoadProgress && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs text-gray-500">{fullLoadProgress}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 数据统计 */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-purple-600">{dataStatus?.total || 0}</p>
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
          <p>特征决策树法 · 和值除数取尾法</p>
          <p>分布图法 · 除3余数杀号法</p>
          <p>热冷温码法 · 大小奇偶法</p>
          <p>DeepSeek AI 综合分析引擎</p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
