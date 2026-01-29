import type { LotteryRecord, PredictionResult } from './types';

// 验证单组预测号码是否有效
export function validatePrediction(pred: PredictionResult): boolean {
  // 红球验证
  if (!pred.red || pred.red.length !== 6) return false;
  const uniqueRed = new Set(pred.red);
  if (uniqueRed.size !== 6) return false;
  if (pred.red.some((n) => n < 1 || n > 33 || !Number.isInteger(n))) return false;

  // 蓝球验证
  if (pred.blue < 1 || pred.blue > 16 || !Number.isInteger(pred.blue)) return false;

  return true;
}

// 检查号码组合是否在历史中出现过
export function checkHistoryDuplicate(
  red: number[],
  blue: number,
  records: LotteryRecord[]
): boolean {
  const sortedRed = [...red].sort((a, b) => a - b);
  return records.some(
    (r) =>
      r.blue === blue &&
      r.red.length === sortedRed.length &&
      r.red.every((v, i) => v === sortedRed[i])
  );
}

// 检查两组号码是否完全相同
export function areSamePrediction(a: PredictionResult, b: PredictionResult): boolean {
  if (a.blue !== b.blue) return false;
  const aSorted = [...a.red].sort((x, y) => x - y);
  const bSorted = [...b.red].sort((x, y) => x - y);
  return aSorted.every((v, i) => v === bSorted[i]);
}

// 去重验证：确保10组号码互不重复，且不在历史中出现
export function deduplicatePredictions(
  predictions: PredictionResult[],
  records: LotteryRecord[]
): PredictionResult[] {
  const unique: PredictionResult[] = [];

  for (const pred of predictions) {
    if (!validatePrediction(pred)) continue;

    // 检查是否与已选的重复
    const isDuplicate = unique.some((u) => areSamePrediction(u, pred));
    if (isDuplicate) continue;

    // 检查是否在历史中出现过
    const inHistory = checkHistoryDuplicate(pred.red, pred.blue, records);
    if (inHistory) continue;

    unique.push({
      ...pred,
      red: [...pred.red].sort((a, b) => a - b),
    });
  }

  return unique;
}
