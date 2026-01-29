import type { LotteryRecord } from './types';

// 解析一行数据为 LotteryRecord
export function parseLine(line: string): LotteryRecord | null {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 9) return null;

  const issue = parts[0];
  const date = parts[1];
  const red = [
    parseInt(parts[2]),
    parseInt(parts[3]),
    parseInt(parts[4]),
    parseInt(parts[5]),
    parseInt(parts[6]),
    parseInt(parts[7]),
  ];
  const blue = parseInt(parts[8]);

  // 验证数据有效性
  if (red.some(isNaN) || isNaN(blue)) return null;
  if (red.some((n) => n < 1 || n > 33)) return null;
  if (blue < 1 || blue > 16) return null;

  const sum = red.reduce((a, b) => a + b, 0);
  const oddCount = red.filter((n) => n % 2 === 1).length;
  const bigCount = red.filter((n) => n >= 17).length;

  return {
    issue,
    date,
    red: red.sort((a, b) => a - b),
    blue,
    sum,
    oddCount,
    bigCount,
  };
}

// 解析全部文本数据
export function parseAllData(text: string): LotteryRecord[] {
  const lines = text.trim().split('\n');
  const records: LotteryRecord[] = [];
  for (const line of lines) {
    const record = parseLine(line);
    if (record) records.push(record);
  }
  return records;
}
