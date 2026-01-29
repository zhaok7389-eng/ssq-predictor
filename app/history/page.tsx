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
    <div className="min-h-screen pb-20 p-4">
      <header className="text-center py-6">
        <h1 className="text-xl font-bold text-white">{'\u{1F4CB}'} 历史预测</h1>
        <p className="text-white/60 text-sm mt-1">
          共 {records.length} 条记录
        </p>
      </header>

      {records.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm mb-4">暂无预测记录</p>
          <button
            onClick={() => router.push('/predict')}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl text-sm"
          >
            去预测
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="card">
              {/* 标题行 */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(record.id)}
              >
                <div>
                  <p className="font-semibold text-ssq-text text-sm">
                    第{record.targetIssue}期预测
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {record.predictions.length}组
                  </span>
                  <span className="text-gray-300">
                    {expandedId === record.id ? '\u25B2' : '\u25BC'}
                  </span>
                </div>
              </div>

              {/* 展开详情 */}
              {expandedId === record.id && (
                <div className="mt-4 space-y-3 border-t pt-3">
                  {record.predictions.map((pred, i) => (
                    <div key={i} className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-gray-400 w-6">
                        {i + 1}.
                      </span>
                      {pred.red.map((n, j) => (
                        <BallNumber key={j} number={n} type="red" size="sm" />
                      ))}
                      <span className="mx-0.5 text-gray-200">|</span>
                      <BallNumber number={pred.blue} type="blue" size="sm" />
                      <span className="text-xs text-gray-400 ml-1">
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
                    删除此记录
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Navigation />
    </div>
  );
}
