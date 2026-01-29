'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BallNumber from '@/components/BallNumber';
import Navigation from '@/components/Navigation';
import { getAllPredictions, deletePrediction } from '@/lib/db';
import type { PredictionRecord } from '@/lib/types';

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const data = await getAllPredictions();
    setRecords(data);
  };

  const handleDelete = async (id: string) => {
    await deletePrediction(id);
    await loadRecords();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen pb-24 p-4">
      <header className="text-center py-6">
        <div className="text-4xl mb-2">💰</div>
        <h1 className="text-xl font-bold text-gradient-gold">小金库</h1>
        <p className="text-ssq-sub text-sm mt-1">
          共 {records.length} 次抽签记录
        </p>
      </header>

      {records.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🐷</div>
          <p className="text-ssq-sub text-sm mb-4">还没有抽过签哦~</p>
          <button
            onClick={() => router.push('/predict')}
            className="btn-main px-6 py-2 text-white rounded-xl text-sm"
          >
            🎰 去抽签
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="card">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(record.id)}
              >
                <div>
                  <p className="font-semibold text-ssq-text text-sm">
                    📄 第{record.targetIssue}期抽签
                  </p>
                  <p className="text-xs text-ssq-sub mt-0.5">
                    {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-pink-50 text-pink-500 rounded-full">
                    {record.predictions.length}组
                  </span>
                  <span className="text-pink-300">
                    {expandedId === record.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expandedId === record.id && (
                <div className="mt-4 space-y-3 border-t border-pink-50 pt-3">
                  {record.predictions.map((pred, i) => (
                    <div key={i} className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-ssq-sub w-6">
                        {i + 1}.
                      </span>
                      {pred.red.map((n, j) => (
                        <BallNumber key={j} number={n} type="red" size="sm" />
                      ))}
                      <span className="mx-0.5 text-gray-200">|</span>
                      <BallNumber number={pred.blue} type="blue" size="sm" />
                      <span className="text-xs text-ssq-sub ml-1">
                        {pred.confidence}%
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(record.id);
                    }}
                    className="text-xs text-red-400 mt-2 hover:text-red-500"
                  >
                    🗑 删除记录
                  </button>
                </div>
              )}
            </div>
          ))}
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
