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

const pigSayings = [
  '哼哼！今天运气不错哦~',
  '让本猪研究一下...',
  '小财迷你好呀！',
  '来试试手气吧！',
  '发财的秘诀就在这里~',
  '运气加载中...',
];

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
  const [pigSaying, setPigSaying] = useState('');

  useEffect(() => {
    setPigSaying(pigSayings[Math.floor(Math.random() * pigSayings.length)]);
  }, []);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const status = await forceRefresh((msg) => setLoadingMsg(msg));
      setDataStatus(status);
    } catch (_e) {
      // handled
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePredict = () => {
    setIsPredicting(true);
    router.push('/predict');
  };

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
    <div className="min-h-screen pb-24 p-4 relative overflow-hidden">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-8 text-2xl float-decor" style={{ animationDelay: '0s' }}>🪙</div>
        <div className="absolute top-40 right-10 text-xl float-decor" style={{ animationDelay: '1s' }}>💛</div>
        <div className="absolute top-60 left-16 text-lg float-decor" style={{ animationDelay: '2s' }}>✨</div>
        <div className="absolute bottom-40 right-6 text-2xl float-decor" style={{ animationDelay: '1.5s' }}>🪙</div>
        <div className="absolute bottom-60 left-6 text-xl float-decor" style={{ animationDelay: '0.5s' }}>💕</div>
      </div>

      <div className="relative z-10">
        {/* Header with pig mascot */}
        <div className="text-center py-8">
          <div className="text-6xl animate-bounce">🐷💰</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent mt-3">
            软肋の发财研究所
          </h1>
          <p className="text-gray-600 mt-2">黑娃的黑科技，专治小财迷</p>
        </div>

        {/* Pig speech bubble */}
        <div className="flex justify-center mb-6">
          <div className="relative bg-white rounded-2xl px-5 py-3 shadow-md border border-pink-100 bubble-pop">
            <p className="text-sm text-gray-700">🐷 {pigSaying}</p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-pink-100 transform rotate-45" />
          </div>
        </div>

        {/* Next draw info */}
        <div className="card mb-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">📅 下一期预测</p>
            <p className="text-lg font-bold text-gray-800">
              {nextIssue.date ? `${nextIssue.date}（${nextIssue.dayOfWeek}）` : '计算中...'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              开奖时间 21:15
            </p>
          </div>
        </div>

        {/* Latest draw result */}
        {latest && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">
                <span className="animate-sparkle inline-block">✨</span> 上期开奖结果
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

        {/* Main predict button */}
        <div className="my-6">
          <button
            onClick={handlePredict}
            disabled={isPredicting || !dataStatus}
            className="w-full py-6 px-8 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 hover:from-pink-600 hover:via-red-600 hover:to-orange-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse disabled:opacity-60 disabled:animate-none"
          >
            <span className="text-3xl">🎰</span>
            <span className="ml-2">{isPredicting ? '正在摇...' : '懒猪快来摇！'}</span>
            <div className="text-sm font-normal mt-1 opacity-80">戳我发财~</div>
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-red-500">{dataStatus?.total || 0}</div>
            <div className="text-xs text-gray-500">历史数据</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-pink-500">6</div>
            <div className="text-xs text-gray-500">红球算法</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-blue-500">10</div>
            <div className="text-xs text-gray-500">蓝球算法</div>
          </div>
        </div>

        {/* Data status card */}
        {dataStatus && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">📊 数据状态</h3>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  isRefreshing
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-pink-50 text-pink-500 hover:bg-pink-100'
                }`}
              >
                {isRefreshing ? '刷新中...' : '刷新数据'}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">历史数据</span>
                <span className="font-medium text-gray-800">{dataStatus.total} 期</span>
              </div>
              {latest && (
                <div className="flex justify-between">
                  <span className="text-gray-500">最新一期</span>
                  <span className="font-medium text-gray-800">
                    第{latest.issue}期 ({latest.date})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">数据更新</span>
                <span className="font-medium text-gray-800">
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

            {fullLoadProgress && (
              <div className="mt-3 pt-3 border-t border-pink-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" />
                  <span className="text-xs text-gray-500">{fullLoadProgress}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Methods description */}
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">🔮 预测方法</h3>
          <div className="space-y-2 text-xs text-gray-500">
            <p>🎲 特征决策树法 · 和值除数取尾法</p>
            <p>📊 分布图法 · 除3余数杀号法</p>
            <p>🔥 热冷温码法 · 大小奇偶法</p>
            <p>🤖 DeepSeek AI 综合分析引擎</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-pink-400">
            Made with 💝 by 黑娃
          </p>
          <p className="text-xs text-pink-300 mt-1">
            给我的小软肋，发财快乐每一天
          </p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
