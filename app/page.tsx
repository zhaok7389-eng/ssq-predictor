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
  '\u54FC\u54FC\uFF01\u4ECA\u5929\u8FD0\u6C14\u4E0D\u9519\u54E6~',
  '\u8BA9\u672C\u732A\u7814\u7A76\u4E00\u4E0B...',
  '\u5C0F\u8D22\u8FF7\u4F60\u597D\u5440\uFF01',
  '\u6765\u8BD5\u8BD5\u624B\u6C14\u5427\uFF01',
  '\u53D1\u8D22\u7684\u79D8\u8BC0\u5C31\u5728\u8FD9\u91CC~',
  '\u8FD0\u6C14\u52A0\u8F7D\u4E2D...',
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('\u6B63\u5728\u521D\u59CB\u5316...');
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
      console.error('\u521D\u59CB\u5316\u5931\u8D25:', err);
      setLoadingMsg('\u6570\u636E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u8BD5');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && dataStatus && !dataStatus.isFullLoaded && !fullLoadStarted.current) {
      fullLoadStarted.current = true;
      loadFullData((msg, loaded, total) => {
        if (total > 0) {
          setFullLoadProgress(`\u6B63\u5728\u52A0\u8F7D\u5386\u53F2\u6570\u636E... ${loaded}/${total}`);
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
    if (!isoStr || isoStr === '\u79BB\u7EBF\u7F13\u5B58' || isoStr === '\u90E8\u5206\u7F13\u5B58') return isoStr;
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return '\u521A\u521A';
      if (diffMin < 60) return `${diffMin}\u5206\u949F\u524D`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}\u5C0F\u65F6\u524D`;
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
    <div className="min-h-screen pb-24 p-4">
      {/* Header with pig mascot */}
      <header className="text-center py-6">
        <div className="text-6xl pig-float mb-2">{'\u{1F437}'}</div>
        <h1 className="text-2xl font-bold text-gradient-pink mb-1">
          {'\u8F6F\u808B\u306E\u53D1\u8D22\u7814\u7A76\u6240'}
        </h1>
        <p className="text-ssq-sub text-sm">
          {'\u9ED1\u5A03\u7684\u9ED1\u79D1\u6280\uFF0C\u4E13\u6CBB\u5C0F\u8D22\u8FF7'}
        </p>
      </header>

      {/* Pig speech bubble */}
      <div className="flex justify-center mb-4">
        <div className="relative bg-white rounded-2xl px-4 py-2 shadow-sm border border-pink-100 bubble-pop">
          <p className="text-sm text-ssq-text">{pigSaying}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-pink-100 transform rotate-45" />
        </div>
      </div>

      {/* Next draw info */}
      <div className="card mb-4">
        <div className="text-center">
          <p className="text-xs text-ssq-sub mb-1">{'\u{1F4C5}'} \u4E0B\u4E00\u671F\u9884\u6D4B</p>
          <p className="text-lg font-bold text-ssq-text">
            {nextIssue.date ? `${nextIssue.date}\uFF08${nextIssue.dayOfWeek}\uFF09` : '\u8BA1\u7B97\u4E2D...'}
          </p>
          <p className="text-xs text-ssq-sub mt-1">
            \u5F00\u5956\u65F6\u95F4 21:15
          </p>
        </div>
      </div>

      {/* Latest draw result */}
      {latest && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ssq-text">
              {'\u{1F3B1}'} \u4E0A\u671F\u5F00\u5956\u7ED3\u679C
            </h2>
            <span className="text-xs text-ssq-sub">
              \u7B2C{latest.issue}\u671F
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {latest.red.map((n, i) => (
              <BallNumber key={i} number={n} type="red" size="lg" />
            ))}
            <span className="mx-1 text-gray-300 text-lg">|</span>
            <BallNumber number={latest.blue} type="blue" size="lg" />
          </div>
          <p className="text-center text-xs text-ssq-sub mt-2">
            {latest.date}
          </p>
        </div>
      )}

      {/* Main predict button */}
      <div className="my-6 px-4">
        <button
          onClick={handlePredict}
          disabled={isPredicting || !dataStatus}
          className="btn-main w-full py-4 text-white rounded-2xl font-bold text-lg disabled:opacity-60"
        >
          {isPredicting ? '\u{1F437} \u6B63\u5728\u751F\u6210...' : '\u{1F437} \u4E00\u952E\u62BD\u7B7E\u9884\u6D4B'}
        </button>
      </div>

      {/* Data status card */}
      {dataStatus && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ssq-text">{'\u{1F4CA}'} \u6570\u636E\u72B6\u6001</h3>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                isRefreshing
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-pink-50 text-pink-500 hover:bg-pink-100'
              }`}
            >
              {isRefreshing ? '\u5237\u65B0\u4E2D...' : '\u5237\u65B0\u6570\u636E'}
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ssq-sub">\u5386\u53F2\u6570\u636E</span>
              <span className="font-medium text-ssq-text">{dataStatus.total} \u671F</span>
            </div>
            {latest && (
              <div className="flex justify-between">
                <span className="text-ssq-sub">\u6700\u65B0\u4E00\u671F</span>
                <span className="font-medium text-ssq-text">
                  \u7B2C{latest.issue}\u671F ({latest.date})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ssq-sub">\u6570\u636E\u66F4\u65B0</span>
              <span className="font-medium text-ssq-text">
                {formatUpdateTime(dataStatus.lastUpdate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ssq-sub">\u72B6\u6001</span>
              <span className={`font-medium ${
                dataStatus.source === 'server' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {dataStatus.source === 'server'
                  ? (dataStatus.isFullLoaded ? '\u5DF2\u540C\u6B65\u5168\u90E8\u6570\u636E' : '\u5DF2\u540C\u6B65\u6700\u65B0\u6570\u636E')
                  : '\u4F7F\u7528\u79BB\u7EBF\u7F13\u5B58'}
              </span>
            </div>
          </div>

          {fullLoadProgress && (
            <div className="mt-3 pt-3 border-t border-pink-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" />
                <span className="text-xs text-ssq-sub">{fullLoadProgress}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="card mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gradient-pink">{dataStatus?.total || 0}</p>
            <p className="text-xs text-ssq-sub">\u5386\u53F2\u6570\u636E</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ssq-red">6</p>
            <p className="text-xs text-ssq-sub">\u7EA2\u7403\u65B9\u6CD5</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ssq-blue">10</p>
            <p className="text-xs text-ssq-sub">\u84DD\u7403\u65B9\u6CD5</p>
          </div>
        </div>
      </div>

      {/* Methods description */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold text-ssq-text mb-3">{'\u{1F52E}'} \u9884\u6D4B\u65B9\u6CD5</h3>
        <div className="space-y-2 text-xs text-ssq-sub">
          <p>{'\u{1F3B2}'} \u7279\u5F81\u51B3\u7B56\u6811\u6CD5 \u00B7 \u548C\u503C\u9664\u6570\u53D6\u5C3E\u6CD5</p>
          <p>{'\u{1F4CA}'} \u5206\u5E03\u56FE\u6CD5 \u00B7 \u96643\u4F59\u6570\u6740\u53F7\u6CD5</p>
          <p>{'\u{1F525}'} \u70ED\u51B7\u6E29\u7801\u6CD5 \u00B7 \u5927\u5C0F\u5947\u5076\u6CD5</p>
          <p>{'\u{1F916}'} DeepSeek AI \u7EFC\u5408\u5206\u6790\u5F15\u64CE</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-pink-300">
          Made with {'\u{1F49D}'} by \u9ED1\u5A03
        </p>
        <p className="text-xs text-pink-200 mt-1">
          \u7ED9\u6211\u7684\u5C0F\u8F6F\u808B\uFF0C\u53D1\u8D22\u5FEB\u4E50\u6BCF\u4E00\u5929
        </p>
      </div>

      <Navigation />
    </div>
  );
}
