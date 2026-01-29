/**
 * 方法2：和值除数取尾定胆法
 *
 * 核心思路：
 * 1. 计算近100期红球和值分布
 * 2. 统计每个和值尾数（0-9）的出现频率
 * 3. 找出出现频率最高的前3个和值尾数
 * 4. 反推可能的号码组合，使其和值尾数匹配目标尾数
 * 5. 使用除数特征（除以3、5、7取尾数）进一步筛选候选号码
 * 6. 生成6个符合和值尾数特征的红球
 *
 * 蓝球排除（加10法）：上期蓝球 + 10，取尾数，排除以该尾数结尾的蓝球号码
 */

import type { LotteryRecord, MethodResult, FrequencyMap } from '../../types';
import {
  calcFrequency,
  calcSum,
  getTailNumber,
  randomPick,
  weightedPick,
  validateRedBalls,
  fillRedBalls,
} from '../../utils';

/**
 * 分析号码的除数特征
 * 对号码分别除以3、5、7，取余数作为特征
 */
function getDivisorFeatures(n: number): [number, number, number] {
  return [n % 3, n % 5, n % 7];
}

/**
 * 根据历史记录分析除数特征的频率分布
 * 返回各除数余数的权重
 */
function analyzeDivisorPatterns(records: LotteryRecord[]): {
  mod3Weights: number[];
  mod5Weights: number[];
  mod7Weights: number[];
} {
  // 统计余数分布
  const mod3Counts = [0, 0, 0]; // 余数 0, 1, 2
  const mod5Counts = [0, 0, 0, 0, 0]; // 余数 0, 1, 2, 3, 4
  const mod7Counts = [0, 0, 0, 0, 0, 0, 0]; // 余数 0-6

  for (const r of records) {
    for (const n of r.red) {
      mod3Counts[n % 3]++;
      mod5Counts[n % 5]++;
      mod7Counts[n % 7]++;
    }
  }

  // 转化为权重（频率越高权重越大）
  const total3 = mod3Counts.reduce((a, b) => a + b, 0) || 1;
  const total5 = mod5Counts.reduce((a, b) => a + b, 0) || 1;
  const total7 = mod7Counts.reduce((a, b) => a + b, 0) || 1;

  return {
    mod3Weights: mod3Counts.map((c) => c / total3),
    mod5Weights: mod5Counts.map((c) => c / total5),
    mod7Weights: mod7Counts.map((c) => c / total7),
  };
}

/**
 * 计算候选号码的除数综合权重得分
 */
function calcDivisorScore(
  n: number,
  patterns: { mod3Weights: number[]; mod5Weights: number[]; mod7Weights: number[] }
): number {
  const [m3, m5, m7] = getDivisorFeatures(n);
  return (
    patterns.mod3Weights[m3] + patterns.mod5Weights[m5] + patterns.mod7Weights[m7]
  );
}

export default function method2SumTail(records: LotteryRecord[]): MethodResult {
  const recent100 = records.slice(0, 100);

  // === 第一步：计算近100期的和值分布 ===
  const sumList = recent100.map((r) => calcSum(r.red));

  // === 第二步：统计每个和值尾数（0-9）的出现频率 ===
  const tailFreq: number[] = new Array(10).fill(0);
  for (const s of sumList) {
    const tail = getTailNumber(s);
    tailFreq[tail]++;
  }

  // === 第三步：找出频率最高的前3个尾数 ===
  const tailRanking = tailFreq
    .map((count, tail) => ({ tail, count }))
    .sort((a, b) => b.count - a.count);
  const topTails = tailRanking.slice(0, 3).map((t) => t.tail);

  // === 第四步 & 第五步：分析除数特征，为候选号码计算权重 ===
  const divisorPatterns = analyzeDivisorPatterns(recent100);
  const redFreq: FrequencyMap = calcFrequency(recent100, 'red');

  // 为1-33每个号码计算综合得分（频率 + 除数特征）
  const candidates: number[] = [];
  const weights: number[] = [];
  for (let i = 1; i <= 33; i++) {
    candidates.push(i);
    // 综合权重：出现频率占60%，除数特征占40%
    const freqScore = (redFreq[i] || 0) / recent100.length;
    const divisorScore = calcDivisorScore(i, divisorPatterns);
    weights.push(freqScore * 0.6 + divisorScore * 0.4);
  }

  // === 第六步：生成6个红球，使和值尾数匹配目标 ===
  const MAX_ATTEMPTS = 300;
  let bestResult: number[] = [];
  let bestMatch = false;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // 按权重随机选择6个号码
    const picked = weightedPick([...candidates], [...weights], 6);
    const total = calcSum(picked);
    const tail = getTailNumber(total);

    // 检查和值尾数是否在目标尾数中
    if (topTails.includes(tail)) {
      bestResult = picked;
      bestMatch = true;
      break;
    }

    // 如果还没有结果，先保存一个
    if (bestResult.length === 0) {
      bestResult = picked;
    }
  }

  // 如果没有找到完美匹配，尝试微调
  if (!bestMatch && bestResult.length === 6) {
    // 通过替换一个号码来调整和值尾数
    for (let replaceIdx = 0; replaceIdx < 6; replaceIdx++) {
      const remaining = bestResult.filter((_, i) => i !== replaceIdx);
      const partialSum = calcSum(remaining);

      // 尝试找一个号码使和值尾数匹配
      for (const targetTail of topTails) {
        // 需要的和值尾数：(targetTail - partialSum % 10 + 10) % 10
        const neededTail = (targetTail - (partialSum % 10) + 10) % 10;

        // 查找尾数匹配且不在已选号码中的候选
        for (let n = 1; n <= 33; n++) {
          if (!remaining.includes(n) && getTailNumber(n) === neededTail) {
            const adjusted = [...remaining, n].sort((a, b) => a - b);
            bestResult = adjusted;
            bestMatch = true;
            break;
          }
        }
        if (bestMatch) break;
      }
      if (bestMatch) break;
    }
  }

  // 确保结果有效
  bestResult = validateRedBalls(bestResult);
  if (bestResult.length < 6) {
    bestResult = fillRedBalls(bestResult, redFreq);
  }

  // === 蓝球排除：加10法 ===
  // 上期蓝球 + 10，取尾数，排除以该尾数结尾的蓝球号码
  const lastBlue = records[0]?.blue || 1;
  const excludeTail = getTailNumber(lastBlue + 10);
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

  // 结果和值信息
  const resultSum = calcSum(bestResult);
  const resultTail = getTailNumber(resultSum);

  return {
    name: '和值除数取尾定胆法',
    redBalls: bestResult,
    blueBalls: recommendedBlue,
    description:
      `近100期和值尾数统计：最常见尾数为${topTails.join('、')}。` +
      `本次预测红球和值${resultSum}，尾数${resultTail}${topTails.includes(resultTail) ? '（命中目标尾数）' : ''}。` +
      `结合除以3/5/7的余数特征进行号码权重优化。` +
      `蓝球排除尾数${excludeTail}（加10法：${lastBlue}+10=${lastBlue + 10}，尾数${excludeTail}）。`,
  };
}
