/**
 * 方法1：高级特征决策树法
 *
 * 核心思路：
 * 1. 统计近100期每个号码（1-33）的出现频率
 * 2. 计算近50期红球和值的平均值，确定和值合理范围（均值 ± 15）
 * 3. 分析近30期奇偶比分布，找出最常见的奇偶比
 * 4. 根据100期频率将号码分类：热号（>8次）、温号（4-8次）、冷号（<4次）
 * 5. 按照常见奇偶比从各频率层中选号
 * 6. 确保6个号码的和值落在历史常见范围内
 *
 * 蓝球排除（加6法）：上期蓝球 + 6，取尾数，排除以该尾数结尾的蓝球号码
 */

import type { LotteryRecord, MethodResult, FrequencyMap } from '../../types';
import {
  calcFrequency,
  classifyNumbers,
  calcSum,
  getOddEvenRatio,
  randomPick,
  validateRedBalls,
  fillRedBalls,
  getTailNumber,
} from '../../utils';

export default function method1DecisionTree(records: LotteryRecord[]): MethodResult {
  // === 第一步：统计近100期红球频率 ===
  const recent100 = records.slice(0, 100);
  const freq: FrequencyMap = calcFrequency(recent100, 'red');

  // === 第二步：计算近50期和值的平均值，确定合理范围 ===
  const recent50 = records.slice(0, 50);
  const sums = recent50.map((r) => calcSum(r.red));
  const avgSum = sums.reduce((a, b) => a + b, 0) / sums.length;
  const sumMin = avgSum - 15; // 和值下限
  const sumMax = avgSum + 15; // 和值上限

  // === 第三步：分析近30期奇偶比分布 ===
  const recent30 = records.slice(0, 30);
  // 统计每种奇偶比出现的次数，找到最常见的比例
  const oddEvenCounts: { [key: string]: number } = {};
  for (const r of recent30) {
    const [odd, even] = getOddEvenRatio(r.red);
    const key = `${odd}:${even}`;
    oddEvenCounts[key] = (oddEvenCounts[key] || 0) + 1;
  }
  // 按出现次数排序，取最常见的奇偶比
  const sortedRatios = Object.entries(oddEvenCounts).sort((a, b) => b[1] - a[1]);
  const bestRatio = sortedRatios[0][0]; // 例如 "3:3" 或 "4:2"
  const [targetOdd, targetEven] = bestRatio.split(':').map(Number);

  // === 第四步：按频率分类号码 ===
  // 热号：出现 > 8次，温号：4-8次，冷号：< 4次
  const { hot, warm, cold } = classifyNumbers(freq, 8, 4);

  // 将每个分类中的号码分为奇数和偶数
  const hotOdd = hot.filter((n) => n % 2 === 1);
  const hotEven = hot.filter((n) => n % 2 === 0);
  const warmOdd = warm.filter((n) => n % 2 === 1);
  const warmEven = warm.filter((n) => n % 2 === 0);
  const coldOdd = cold.filter((n) => n % 2 === 1);
  const coldEven = cold.filter((n) => n % 2 === 0);

  // === 第五步：根据奇偶比从各层选号 ===
  // 策略：热号选3-4个，温号选1-2个，冷号选0-1个
  // 同时满足目标奇偶比
  const MAX_ATTEMPTS = 200; // 最大尝试次数
  let bestResult: number[] = [];
  let bestDiff = Infinity;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const selected: number[] = [];

    // 确定从各频率层选取的数量
    // 热号优先，但保留一定随机性
    const hotCount = Math.random() < 0.6 ? 3 : (Math.random() < 0.5 ? 4 : 2);
    const warmCount = Math.min(6 - hotCount, Math.random() < 0.5 ? 2 : 1);
    const coldCount = 6 - hotCount - warmCount;

    // 根据目标奇偶比分配各层的奇偶数量
    // 先计算总共需要的奇数和偶数
    let oddNeeded = targetOdd;
    let evenNeeded = targetEven;

    // 从热号中选取
    const hotOddPick = Math.min(
      Math.round(hotCount * (targetOdd / 6)),
      hotOdd.length,
      oddNeeded
    );
    const hotEvenPick = Math.min(hotCount - hotOddPick, hotEven.length, evenNeeded);

    selected.push(...randomPick(hotOdd, hotOddPick));
    selected.push(...randomPick(hotEven, hotEvenPick));
    oddNeeded -= hotOddPick;
    evenNeeded -= hotEvenPick;

    // 从温号中选取（排除已选号码）
    const availWarmOdd = warmOdd.filter((n) => !selected.includes(n));
    const availWarmEven = warmEven.filter((n) => !selected.includes(n));
    const warmOddPick = Math.min(
      Math.round(warmCount * (oddNeeded / Math.max(1, oddNeeded + evenNeeded))),
      availWarmOdd.length,
      oddNeeded
    );
    const warmEvenPick = Math.min(warmCount - warmOddPick, availWarmEven.length, evenNeeded);

    selected.push(...randomPick(availWarmOdd, warmOddPick));
    selected.push(...randomPick(availWarmEven, warmEvenPick));
    oddNeeded -= warmOddPick;
    evenNeeded -= warmEvenPick;

    // 从冷号中选取剩余需要的号码
    if (coldCount > 0) {
      const availColdOdd = coldOdd.filter((n) => !selected.includes(n));
      const availColdEven = coldEven.filter((n) => !selected.includes(n));
      const coldOddPick = Math.min(oddNeeded, availColdOdd.length);
      const coldEvenPick = Math.min(evenNeeded, availColdEven.length);
      selected.push(...randomPick(availColdOdd, coldOddPick));
      selected.push(...randomPick(availColdEven, coldEvenPick));
    }

    // 补足到6个（如果选取不足）
    const validated = validateRedBalls(selected);
    const filled = fillRedBalls(validated, freq);

    // === 第六步：验证和值范围 ===
    const total = calcSum(filled);
    const diff = Math.abs(total - avgSum);

    if (total >= sumMin && total <= sumMax) {
      // 和值在合理范围内，直接使用
      bestResult = filled;
      break;
    }

    // 记录最接近目标的结果
    if (diff < bestDiff) {
      bestDiff = diff;
      bestResult = filled;
    }
  }

  // 确保结果有效
  if (bestResult.length < 6) {
    bestResult = fillRedBalls(bestResult, freq);
  }
  bestResult = validateRedBalls(bestResult);
  if (bestResult.length < 6) {
    bestResult = fillRedBalls(bestResult, freq);
  }

  // === 蓝球排除：加6法 ===
  // 上期蓝球 + 6，取尾数，排除以该尾数结尾的蓝球号码
  const lastBlue = records[0]?.blue || 1;
  const excludeTail = getTailNumber(lastBlue + 6);
  const blueCandidates: number[] = [];
  for (let i = 1; i <= 16; i++) {
    if (getTailNumber(i) !== excludeTail) {
      blueCandidates.push(i);
    }
  }
  // 统计蓝球频率，从候选中按频率选蓝球
  const blueFreq = calcFrequency(recent100, 'blue');
  const sortedBlueCandidates = blueCandidates.sort(
    (a, b) => (blueFreq[b] || 0) - (blueFreq[a] || 0)
  );
  // 取频率最高的前5个蓝球作为推荐
  const recommendedBlue = sortedBlueCandidates.slice(0, 5);

  return {
    name: '高级特征决策树法',
    redBalls: bestResult,
    blueBalls: recommendedBlue,
    description:
      `基于近100期数据，统计号码频率并分为热号(${hot.length}个)、` +
      `温号(${warm.length}个)、冷号(${cold.length}个)。` +
      `近50期和值均值${avgSum.toFixed(1)}，目标范围[${sumMin.toFixed(0)}-${sumMax.toFixed(0)}]。` +
      `近30期最常见奇偶比${bestRatio}。` +
      `蓝球排除尾数${excludeTail}（加6法：${lastBlue}+6=${lastBlue + 6}，尾数${excludeTail}）。`,
  };
}
