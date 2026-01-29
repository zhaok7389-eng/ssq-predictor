/**
 * 方法3：分布图法
 *
 * 核心思路：
 * 1. 将号码分为3个区间：第一区01-11，第二区12-22，第三区23-33
 * 2. 统计近100期每期的区间分布（如 2-2-2、2-3-1 等）
 * 3. 常见分布模式：2-2-2、2-3-1、3-2-1、1-3-2 等
 * 4. 找出最常见的区间分布模式
 * 5. 在每个区间内统计各号码的出现频率
 * 6. 识别"热区"和"冷区"
 * 7. 根据分布模式在各区间中按频率选号
 *
 * 蓝球排除（减7取绝对值法）：|上期蓝球 - 7|，取尾数，排除以该尾数结尾的蓝球号码
 */

import type { LotteryRecord, MethodResult, FrequencyMap } from '../../types';
import {
  calcFrequency,
  getZoneDistribution,
  getTailNumber,
  weightedPick,
  randomPick,
  validateRedBalls,
  fillRedBalls,
} from '../../utils';

/**
 * 获取区间内的号码列表
 */
function getZoneNumbers(zone: number): number[] {
  const numbers: number[] = [];
  if (zone === 1) {
    for (let i = 1; i <= 11; i++) numbers.push(i);
  } else if (zone === 2) {
    for (let i = 12; i <= 22; i++) numbers.push(i);
  } else {
    for (let i = 23; i <= 33; i++) numbers.push(i);
  }
  return numbers;
}

/**
 * 计算区间内各号码的频率
 */
function calcZoneFrequency(
  records: LotteryRecord[],
  zone: number
): { numbers: number[]; freq: FrequencyMap } {
  const numbers = getZoneNumbers(zone);
  const freq: FrequencyMap = {};
  for (const n of numbers) freq[n] = 0;

  for (const r of records) {
    for (const n of r.red) {
      if (freq[n] !== undefined) {
        freq[n]++;
      }
    }
  }

  return { numbers, freq };
}

/**
 * 判断区间是"热区"还是"冷区"
 * 通过比较该区间号码的平均出现次数与整体平均出现次数
 */
function classifyZone(
  zoneFreq: FrequencyMap,
  overallAvg: number
): 'hot' | 'warm' | 'cold' {
  const values = Object.values(zoneFreq);
  const zoneAvg = values.reduce((a, b) => a + b, 0) / values.length;

  if (zoneAvg > overallAvg * 1.15) return 'hot';
  if (zoneAvg < overallAvg * 0.85) return 'cold';
  return 'warm';
}

export default function method3Distribution(records: LotteryRecord[]): MethodResult {
  const recent100 = records.slice(0, 100);

  // === 第一步 & 第二步：统计近100期区间分布 ===
  const distributionCounts: { [key: string]: number } = {};
  for (const r of recent100) {
    const [z1, z2, z3] = getZoneDistribution(r.red);
    const key = `${z1}-${z2}-${z3}`;
    distributionCounts[key] = (distributionCounts[key] || 0) + 1;
  }

  // === 第三步 & 第四步：找出最常见的分布模式 ===
  // 按出现频次排序
  const sortedPatterns = Object.entries(distributionCounts)
    .sort((a, b) => b[1] - a[1]);

  // 取最常见的分布模式
  const bestPattern = sortedPatterns[0][0]; // 如 "2-2-2"
  const bestPatternCount = sortedPatterns[0][1];
  const [zone1Count, zone2Count, zone3Count] = bestPattern.split('-').map(Number);

  // 同时记录前3常见模式供描述使用
  const topPatterns = sortedPatterns.slice(0, 3).map(([p, c]) => `${p}(${c}次)`);

  // === 第五步：在每个区间内统计各号码的频率 ===
  const zone1Data = calcZoneFrequency(recent100, 1);
  const zone2Data = calcZoneFrequency(recent100, 2);
  const zone3Data = calcZoneFrequency(recent100, 3);

  // === 第六步：识别热区和冷区 ===
  // 计算整体平均频率
  const overallFreq = calcFrequency(recent100, 'red');
  const overallValues = Object.values(overallFreq);
  const overallAvg = overallValues.reduce((a, b) => a + b, 0) / overallValues.length;

  const zone1Type = classifyZone(zone1Data.freq, overallAvg);
  const zone2Type = classifyZone(zone2Data.freq, overallAvg);
  const zone3Type = classifyZone(zone3Data.freq, overallAvg);

  // === 第七步：根据分布模式在各区间中选号 ===
  const selected: number[] = [];

  // 对每个区间，按频率权重选号
  const zones = [
    { count: zone1Count, data: zone1Data, type: zone1Type },
    { count: zone2Count, data: zone2Data, type: zone2Type },
    { count: zone3Count, data: zone3Data, type: zone3Type },
  ];

  for (const zone of zones) {
    if (zone.count <= 0) continue;

    const { numbers, freq } = zone.data;

    // 根据区间冷热状态调整选号策略
    // 热区：倾向选高频号码
    // 冷区：适当选一些低频号码（冷号回补思路）
    // 温区：均衡选择
    let adjustedWeights: number[];

    if (zone.type === 'hot') {
      // 热区：频率直接作为权重，高频号码更有优势
      adjustedWeights = numbers.map((n) => Math.max(1, (freq[n] || 0) * 1.5));
    } else if (zone.type === 'cold') {
      // 冷区：反转权重，让低频号码有更多机会（冷号回补）
      const maxFreq = Math.max(...numbers.map((n) => freq[n] || 0));
      adjustedWeights = numbers.map((n) => {
        const f = freq[n] || 0;
        // 冷号补偿：频率越低权重越高，但保持基础权重
        return Math.max(1, maxFreq - f + 2);
      });
    } else {
      // 温区：频率加基础权重，均衡选择
      adjustedWeights = numbers.map((n) => Math.max(1, (freq[n] || 0) + 2));
    }

    // 从当前区间按权重选取指定数量的号码（排除已选号码）
    const availableNumbers = numbers.filter((n) => !selected.includes(n));
    const availableWeights = availableNumbers.map((n) => {
      const idx = numbers.indexOf(n);
      return adjustedWeights[idx];
    });

    if (availableNumbers.length >= zone.count) {
      const picked = weightedPick(availableNumbers, availableWeights, zone.count);
      selected.push(...picked);
    } else {
      // 可用号码不足时全选
      selected.push(...availableNumbers);
    }
  }

  // 确保结果有效并补足6个
  let result = validateRedBalls(selected);
  if (result.length < 6) {
    result = fillRedBalls(result, overallFreq);
  }

  // === 蓝球排除：减7取绝对值法 ===
  // |上期蓝球 - 7|，取尾数，排除以该尾数结尾的蓝球号码
  const lastBlue = records[0]?.blue || 1;
  const absValue = Math.abs(lastBlue - 7);
  const excludeTail = getTailNumber(absValue);

  const blueCandidates: number[] = [];
  for (let i = 1; i <= 16; i++) {
    if (getTailNumber(i) !== excludeTail) {
      blueCandidates.push(i);
    }
  }
  // 按蓝球频率排序，选前5个推荐
  const blueFreq = calcFrequency(recent100, 'blue');
  const sortedBlueCandidates = blueCandidates.sort(
    (a, b) => (blueFreq[b] || 0) - (blueFreq[a] || 0)
  );
  const recommendedBlue = sortedBlueCandidates.slice(0, 5);

  return {
    name: '分布图法',
    redBalls: result,
    blueBalls: recommendedBlue,
    description:
      `近100期区间分布统计，前三常见模式：${topPatterns.join('、')}。` +
      `本次采用${bestPattern}分布（出现${bestPatternCount}次）。` +
      `区间冷热：一区(01-11)${zone1Type === 'hot' ? '热区' : zone1Type === 'cold' ? '冷区' : '温区'}、` +
      `二区(12-22)${zone2Type === 'hot' ? '热区' : zone2Type === 'cold' ? '冷区' : '温区'}、` +
      `三区(23-33)${zone3Type === 'hot' ? '热区' : zone3Type === 'cold' ? '冷区' : '温区'}。` +
      `蓝球排除尾数${excludeTail}（减7取绝对值法：|${lastBlue}-7|=${absValue}，尾数${excludeTail}）。`,
  };
}
