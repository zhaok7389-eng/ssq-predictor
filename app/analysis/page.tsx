'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import BallNumber from '@/components/BallNumber';
import { getRecentRecords } from '@/lib/db';
import { getAvailableRecords } from '@/lib/dataFetcher';
import { calcFrequency, sortByFrequency, getOddEvenRatio, getBigSmallRatio } from '@/lib/utils';
import type { LotteryRecord } from '@/lib/types';

type TabType = 'red' | 'blue' | 'trend';

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabType>('red');
  const [records, setRecords] = useState<LotteryRecord[]>([]);
  const [allRecords, setAllRecords] = useState<LotteryRecord[]>([]);
  const [periodCount, setPeriodCount] = useState(50);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const data = await getAvailableRecords();
        setAllRecords(data);
        setDataLoaded(true);
      } catch (_e) {
        const cached = await getRecentRecords(500);
        setAllRecords(cached);
        setDataLoaded(true);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (allRecords.length > 0) {
      setRecords(allRecords.slice(-periodCount));
    }
  }, [periodCount, allRecords]);

  const redFreq = calcFrequency(records, 'red');
  const blueFreq = calcFrequency(records, 'blue');
  const sortedRed = sortByFrequency(redFreq);
  const sortedBlue = sortByFrequency(blueFreq);

  const maxRedFreq = Math.max(...Object.values(redFreq), 1);
  const maxBlueFreq = Math.max(...Object.values(blueFreq), 1);

  let totalOdd = 0;
  let totalEven = 0;
  let totalSmall = 0;
  let totalBig = 0;
  for (const r of records) {
    const [odd, even] = getOddEvenRatio(r.red);
    totalOdd += odd;
    totalEven += even;
    const [small, big] = getBigSmallRatio(r.red, 17);
    totalSmall += small;
    totalBig += big;
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'red', label: '红球篇', icon: '🔴' },
    { key: 'blue', label: '蓝球篇', icon: '🔵' },
    { key: 'trend', label: '走势篇', icon: '📈' },
  ];

  return (
    <div className="min-h-screen pb-24 p-4">
      <header className="text-center py-6">
        <div className="text-4xl mb-2">📖</div>
        <h1 className="text-xl font-bold text-gradient-pink">妖精秘籍</h1>
        <p className="text-ssq-sub text-sm mt-1">
          基于最近 {records.length} 期数据
        </p>
      </header>

      {/* Period selector */}
      <div className="flex justify-center gap-2 mb-4">
        {[30, 50, 100, 200].map((n) => (
          <button
            key={n}
            onClick={() => setPeriodCount(n)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              periodCount === n
                ? 'bg-pink-500 text-white shadow-sm'
                : 'bg-white text-ssq-sub border border-pink-100'
            }`}
          >
            {n}期
          </button>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex bg-pink-50 rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-pink-500 shadow-sm'
                : 'text-ssq-sub'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Red ball analysis */}
      {activeTab === 'red' && (
        <div className="card">
          <h3 className="text-sm font-semibold text-ssq-text mb-4">
            🔴 红球出现频率排行（1-33）
          </h3>
          <div className="space-y-2">
            {sortedRed.map((num, i) => (
              <div key={num} className="flex items-center gap-2">
                <BallNumber number={num} type="red" size="sm" />
                <div className="flex-1">
                  <div className="h-4 bg-pink-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-300 to-pink-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${((redFreq[num] || 0) / maxRedFreq) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs text-ssq-sub w-12 text-right">
                  {redFreq[num] || 0}次
                </span>
                {i < 3 && (
                  <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">🔥热</span>
                )}
                {i >= sortedRed.length - 3 && (
                  <span className="text-xs text-blue-500 font-medium bg-blue-50 px-1.5 py-0.5 rounded">❄冷</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blue ball analysis */}
      {activeTab === 'blue' && (
        <div className="card">
          <h3 className="text-sm font-semibold text-ssq-text mb-4">
            🔵 蓝球出现频率排行（1-16）
          </h3>
          <div className="space-y-2">
            {sortedBlue.map((num, i) => (
              <div key={num} className="flex items-center gap-2">
                <BallNumber number={num} type="blue" size="sm" />
                <div className="flex-1">
                  <div className="h-4 bg-blue-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-300 to-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${((blueFreq[num] || 0) / maxBlueFreq) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs text-ssq-sub w-12 text-right">
                  {blueFreq[num] || 0}次
                </span>
                {i < 3 && (
                  <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">🔥热</span>
                )}
                {i >= sortedBlue.length - 3 && (
                  <span className="text-xs text-blue-500 font-medium bg-blue-50 px-1.5 py-0.5 rounded">❄冷</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend statistics */}
      {activeTab === 'trend' && (
        <div className="space-y-4">
          {/* Odd/Even */}
          <div className="card">
            <h3 className="text-sm font-semibold text-ssq-text mb-3">
              🎲 红球奇偶统计
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-ssq-sub mb-1">
                  <span>奇数 {totalOdd}</span>
                  <span>偶数 {totalEven}</span>
                </div>
                <div className="h-6 bg-gray-50 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-orange-300 to-orange-400"
                    style={{
                      width: `${(totalOdd / (totalOdd + totalEven)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-green-300 to-green-400"
                    style={{
                      width: `${(totalEven / (totalOdd + totalEven)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-ssq-sub mt-1">
                  <span>
                    {((totalOdd / (totalOdd + totalEven)) * 100).toFixed(1)}%
                  </span>
                  <span>
                    {((totalEven / (totalOdd + totalEven)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Big/Small */}
          <div className="card">
            <h3 className="text-sm font-semibold text-ssq-text mb-3">
              📏 红球大小统计（1-16小 / 17-33大）
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-ssq-sub mb-1">
                  <span>小号 {totalSmall}</span>
                  <span>大号 {totalBig}</span>
                </div>
                <div className="h-6 bg-gray-50 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-300 to-cyan-400"
                    style={{
                      width: `${(totalSmall / (totalSmall + totalBig)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-purple-300 to-purple-400"
                    style={{
                      width: `${(totalBig / (totalSmall + totalBig)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-ssq-sub mt-1">
                  <span>
                    {((totalSmall / (totalSmall + totalBig)) * 100).toFixed(1)}%
                  </span>
                  <span>
                    {((totalBig / (totalSmall + totalBig)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent 10 draws */}
          <div className="card">
            <h3 className="text-sm font-semibold text-ssq-text mb-3">
              🎱 最近10期开奖号码
            </h3>
            <div className="space-y-2">
              {records.slice(-10).reverse().map((r) => (
                <div key={r.issue} className="flex items-center gap-1">
                  <span className="text-xs text-ssq-sub w-16 shrink-0">
                    {r.issue.slice(-3)}期
                  </span>
                  <div className="flex gap-0.5 flex-wrap">
                    {r.red.map((n, j) => (
                      <BallNumber key={j} number={n} type="red" size="sm" />
                    ))}
                    <span className="mx-0.5" />
                    <BallNumber number={r.blue} type="blue" size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-4 mt-4">
        <p className="text-xs text-pink-300">
          Made with 💝 by 黑娃
        </p>
      </div>

      <Navigation />
    </div>
  );
}
