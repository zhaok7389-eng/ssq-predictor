'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import BallNumber from '@/components/BallNumber';
import { getRecentRecords } from '@/lib/db';
import { calcFrequency, sortByFrequency, getOddEvenRatio, getBigSmallRatio } from '@/lib/utils';
import type { LotteryRecord } from '@/lib/types';

type TabType = 'red' | 'blue' | 'trend';

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabType>('red');
  const [records, setRecords] = useState<LotteryRecord[]>([]);
  const [periodCount, setPeriodCount] = useState(50);

  useEffect(() => {
    loadData();
  }, [periodCount]);

  const loadData = async () => {
    const data = await getRecentRecords(periodCount);
    setRecords(data);
  };

  const redFreq = calcFrequency(records, 'red');
  const blueFreq = calcFrequency(records, 'blue');
  const sortedRed = sortByFrequency(redFreq);
  const sortedBlue = sortByFrequency(blueFreq);

  // 最高频率（用于计算进度条百分比）
  const maxRedFreq = Math.max(...Object.values(redFreq), 1);
  const maxBlueFreq = Math.max(...Object.values(blueFreq), 1);

  // 统计奇偶和大小
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

  const tabs: { key: TabType; label: string }[] = [
    { key: 'red', label: '红球分析' },
    { key: 'blue', label: '蓝球分析' },
    { key: 'trend', label: '走势统计' },
  ];

  return (
    <div className="min-h-screen pb-20 p-4">
      <header className="text-center py-6">
        <h1 className="text-xl font-bold text-white">{'\u{1F4CA}'} 数据分析</h1>
        <p className="text-white/60 text-sm mt-1">
          基于最近 {records.length} 期数据
        </p>
      </header>

      {/* 期数选择 */}
      <div className="flex justify-center gap-2 mb-4">
        {[30, 50, 100, 200].map((n) => (
          <button
            key={n}
            onClick={() => setPeriodCount(n)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              periodCount === n
                ? 'bg-white text-purple-600'
                : 'bg-white/20 text-white/70'
            }`}
          >
            {n}期
          </button>
        ))}
      </div>

      {/* Tab 切换 */}
      <div className="flex bg-white/10 rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-purple-600 shadow'
                : 'text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 红球分析 */}
      {activeTab === 'red' && (
        <div className="card">
          <h3 className="text-sm font-semibold text-ssq-text mb-4">
            红球出现频率排行（1-33）
          </h3>
          <div className="space-y-2">
            {sortedRed.map((num, i) => (
              <div key={num} className="flex items-center gap-2">
                <BallNumber number={num} type="red" size="sm" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${((redFreq[num] || 0) / maxRedFreq) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {redFreq[num] || 0}次
                </span>
                {i < 3 && (
                  <span className="text-xs text-red-500 font-medium">热</span>
                )}
                {i >= sortedRed.length - 3 && (
                  <span className="text-xs text-blue-500 font-medium">冷</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 蓝球分析 */}
      {activeTab === 'blue' && (
        <div className="card">
          <h3 className="text-sm font-semibold text-ssq-text mb-4">
            蓝球出现频率排行（1-16）
          </h3>
          <div className="space-y-2">
            {sortedBlue.map((num, i) => (
              <div key={num} className="flex items-center gap-2">
                <BallNumber number={num} type="blue" size="sm" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${((blueFreq[num] || 0) / maxBlueFreq) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {blueFreq[num] || 0}次
                </span>
                {i < 3 && (
                  <span className="text-xs text-red-500 font-medium">热</span>
                )}
                {i >= sortedBlue.length - 3 && (
                  <span className="text-xs text-blue-500 font-medium">冷</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 走势统计 */}
      {activeTab === 'trend' && (
        <div className="space-y-4">
          {/* 奇偶统计 */}
          <div className="card">
            <h3 className="text-sm font-semibold text-ssq-text mb-3">
              红球奇偶统计
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>奇数 {totalOdd}</span>
                  <span>偶数 {totalEven}</span>
                </div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                    style={{
                      width: `${(totalOdd / (totalOdd + totalEven)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-500"
                    style={{
                      width: `${(totalEven / (totalOdd + totalEven)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
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

          {/* 大小统计 */}
          <div className="card">
            <h3 className="text-sm font-semibold text-ssq-text mb-3">
              红球大小统计（1-16小 / 17-33大）
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>小号 {totalSmall}</span>
                  <span>大号 {totalBig}</span>
                </div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                    style={{
                      width: `${(totalSmall / (totalSmall + totalBig)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-500"
                    style={{
                      width: `${(totalBig / (totalSmall + totalBig)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
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

          {/* 最近10期开奖 */}
          <div className="card">
            <h3 className="text-sm font-semibold text-ssq-text mb-3">
              最近10期开奖号码
            </h3>
            <div className="space-y-2">
              {records.slice(-10).reverse().map((r) => (
                <div key={r.issue} className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 w-16 shrink-0">
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

      <Navigation />
    </div>
  );
}
