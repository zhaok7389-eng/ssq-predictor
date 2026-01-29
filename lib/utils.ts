import type { LotteryRecord, FrequencyMap } from './types';

// 统计号码出现频率
export function calcFrequency(records: LotteryRecord[], type: 'red' | 'blue'): FrequencyMap {
  const freq: FrequencyMap = {};
  const max = type === 'red' ? 33 : 16;
  for (let i = 1; i <= max; i++) freq[i] = 0;

  for (const record of records) {
    if (type === 'red') {
      for (const n of record.red) {
        freq[n] = (freq[n] || 0) + 1;
      }
    } else {
      freq[record.blue] = (freq[record.blue] || 0) + 1;
    }
  }
  return freq;
}

// 按频率排序号码
export function sortByFrequency(freq: FrequencyMap, desc = true): number[] {
  return Object.entries(freq)
    .sort((a, b) => (desc ? b[1] - a[1] : a[1] - b[1]))
    .map(([key]) => parseInt(key));
}

// 获取热号、温号、冷号
export function classifyNumbers(
  freq: FrequencyMap,
  hotThreshold: number,
  coldThreshold: number
): { hot: number[]; warm: number[]; cold: number[] } {
  const hot: number[] = [];
  const warm: number[] = [];
  const cold: number[] = [];

  for (const [key, count] of Object.entries(freq)) {
    const num = parseInt(key);
    if (count >= hotThreshold) {
      hot.push(num);
    } else if (count <= coldThreshold) {
      cold.push(num);
    } else {
      warm.push(num);
    }
  }

  return { hot, warm, cold };
}

// 从数组中随机选择n个元素
export function randomPick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// 从指定范围的号码中按权重随机选择
export function weightedPick(candidates: number[], weights: number[], count: number): number[] {
  const result: number[] = [];
  const available = candidates.map((c, i) => ({ num: c, weight: weights[i] }));

  while (result.length < count && available.length > 0) {
    const totalWeight = available.reduce((s, a) => s + a.weight, 0);
    let rand = Math.random() * totalWeight;
    let idx = 0;
    for (let i = 0; i < available.length; i++) {
      rand -= available[i].weight;
      if (rand <= 0) {
        idx = i;
        break;
      }
    }
    result.push(available[idx].num);
    available.splice(idx, 1);
  }

  return result.sort((a, b) => a - b);
}

// 计算和值
export function calcSum(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

// 获取尾数
export function getTailNumber(n: number): number {
  return n % 10;
}

// 统计区间分布
export function getZoneDistribution(red: number[]): [number, number, number] {
  let z1 = 0, z2 = 0, z3 = 0;
  for (const n of red) {
    if (n <= 11) z1++;
    else if (n <= 22) z2++;
    else z3++;
  }
  return [z1, z2, z3];
}

// 统计余数分布
export function getMod3Distribution(red: number[]): [number, number, number] {
  let m0 = 0, m1 = 0, m2 = 0;
  for (const n of red) {
    const mod = n % 3;
    if (mod === 0) m0++;
    else if (mod === 1) m1++;
    else m2++;
  }
  return [m0, m1, m2];
}

// 统计奇偶比
export function getOddEvenRatio(numbers: number[]): [number, number] {
  const odd = numbers.filter((n) => n % 2 === 1).length;
  return [odd, numbers.length - odd];
}

// 统计大小比（红球以17为界，蓝球以9为界）
export function getBigSmallRatio(numbers: number[], threshold: number): [number, number] {
  const big = numbers.filter((n) => n >= threshold).length;
  return [numbers.length - big, big];
}

// 格式化日期
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 号码组合是否在历史中出现过
export function hasAppearedInHistory(
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

// 确保红球在有效范围内且不重复
export function validateRedBalls(balls: number[]): number[] {
  const unique = [...new Set(balls)]
    .filter((n) => n >= 1 && n <= 33)
    .sort((a, b) => a - b);
  return unique.slice(0, 6);
}

// 确保蓝球在有效范围内
export function validateBlueBall(ball: number): number {
  return Math.max(1, Math.min(16, Math.round(ball)));
}

// 补充红球到6个
export function fillRedBalls(balls: number[], freq: FrequencyMap): number[] {
  const current = validateRedBalls(balls);
  if (current.length >= 6) return current.slice(0, 6);

  const candidates = Object.keys(freq)
    .map(Number)
    .filter((n) => !current.includes(n))
    .sort((a, b) => (freq[b] || 0) - (freq[a] || 0));

  while (current.length < 6 && candidates.length > 0) {
    // 加入一些随机性，不总是选最高频的
    const pickRange = Math.min(10, candidates.length);
    const idx = Math.floor(Math.random() * pickRange);
    current.push(candidates[idx]);
    candidates.splice(idx, 1);
  }

  return current.sort((a, b) => a - b);
}
