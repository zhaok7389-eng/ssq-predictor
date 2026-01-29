/**
 * 方法6：大小奇偶法
 *
 * 核心思路：
 * 1. 将号码按大小和奇偶分为四类：
 *    - 小奇：1,3,5,7,9,11,13,15（8个）
 *    - 小偶：2,4,6,8,10,12,14,16（8个）
 *    - 大奇：17,19,21,23,25,27,29,31,33（9个）
 *    - 大偶：18,20,22,24,26,28,30,32（8个）
 * 2. 分析近100期大小比分布，找出最常见的大小比
 * 3. 分析近100期奇偶比分布，找出最常见的奇偶比
 * 4. 综合大小比和奇偶比，确定四类号码的选取数量
 * 5. 在各类别中按频率加权选号
 * 6. 确保最终6个号码符合目标大小比和奇偶比
 *
 * 蓝球排除（尾数加1法）：上期蓝球的尾数 + 1，排除以该尾数结尾的蓝球号码
 */

import type { LotteryRecord, MethodResult, FrequencyMap } from '../../types';
import {
  calcFrequency,
  getOddEvenRatio,
  getBigSmallRatio,
  getTailNumber,
  weightedPick,
  validateRedBalls,
  fillRedBalls,
} from '../../utils';

// === 四类号码定义 ===
// 小号：1-16，大号：17-33
// 奇数：1,3,5,...，偶数：2,4,6,...
const SMALL_ODD = [1, 3, 5, 7, 9, 11, 13, 15];       // 小奇
const SMALL_EVEN = [2, 4, 6, 8, 10, 12, 14, 16];      // 小偶
const BIG_ODD = [17, 19, 21, 23, 25, 27, 29, 31, 33]; // 大奇
const BIG_EVEN = [18, 20, 22, 24, 26, 28, 30, 32];    // 大偶

/**
 * 统计某类别号码在历史记录中的频率
 */
function calcCategoryFrequency(
  records: LotteryRecord[],
  numbers: number[]
): FrequencyMap {
  const freq: FrequencyMap = {};
  for (const n of numbers) freq[n] = 0;

  for (const r of records) {
    for (const n of r.red) {
      if (freq[n] !== undefined) {
        freq[n]++;
      }
    }
  }

  return freq;
}

/**
 * 根据目标大小比和奇偶比，计算四类号码的选取数量
 * 大小比 = small:big，奇偶比 = odd:even
 * 返回 [小奇, 小偶, 大奇, 大偶] 的选取数量
 */
function calcCategoryDistribution(
  targetSmall: number,
  targetBig: number,
  targetOdd: number,
  targetEven: number
): [number, number, number, number] {
  // 总共6个球
  // small = smallOdd + smallEven = targetSmall
  // big   = bigOdd   + bigEven   = targetBig
  // odd   = smallOdd + bigOdd    = targetOdd
  // even  = smallEven + bigEven  = targetEven
  //
  // 联立方程：
  // smallOdd = targetSmall + targetOdd - 6（不一定合理，需要约束）
  // 实际用线性方程组解：
  //   smallOdd + smallEven = targetSmall
  //   bigOdd + bigEven = targetBig
  //   smallOdd + bigOdd = targetOdd
  //   smallEven + bigEven = targetEven
  //
  // 解：smallOdd = (targetSmall + targetOdd - 6 + targetBig + targetEven) ... 简化：
  // smallOdd = targetSmall - smallEven
  // bigOdd = targetOdd - smallOdd
  // 但 smallOdd + bigOdd = targetOdd => smallOdd = targetOdd - bigOdd
  // 且 smallOdd + smallEven = targetSmall
  //
  // 从 smallOdd + smallEven = targetSmall 和 smallOdd + bigOdd = targetOdd:
  // smallEven = targetSmall - smallOdd
  // bigOdd = targetOdd - smallOdd
  // bigEven = targetBig - bigOdd = targetBig - (targetOdd - smallOdd) = targetBig - targetOdd + smallOdd
  //
  // 需要所有值 >= 0：
  // smallOdd >= 0
  // smallEven = targetSmall - smallOdd >= 0 => smallOdd <= targetSmall
  // bigOdd = targetOdd - smallOdd >= 0 => smallOdd <= targetOdd
  // bigEven = targetBig - targetOdd + smallOdd >= 0 => smallOdd >= targetOdd - targetBig

  const minSmallOdd = Math.max(0, targetOdd - targetBig);
  const maxSmallOdd = Math.min(targetSmall, targetOdd);

  // 选择中间值（最均衡）
  const smallOdd = Math.round((minSmallOdd + maxSmallOdd) / 2);
  const smallEven = targetSmall - smallOdd;
  const bigOdd = targetOdd - smallOdd;
  const bigEven = targetBig - bigOdd;

  return [
    Math.max(0, smallOdd),
    Math.max(0, smallEven),
    Math.max(0, bigOdd),
    Math.max(0, bigEven),
  ];
}

export default function method6BigSmallOddEven(records: LotteryRecord[]): MethodResult {
  const recent100 = records.slice(0, 100);

  // === 第一步：分析近100期大小比分布 ===
  // 大小分界线：小号1-16，大号17-33（threshold=17）
  const bigSmallCounts: { [key: string]: number } = {};
  for (const r of recent100) {
    const [small, big] = getBigSmallRatio(r.red, 17);
    const key = `${small}:${big}`;
    bigSmallCounts[key] = (bigSmallCounts[key] || 0) + 1;
  }

  // 找出最常见的大小比
  const sortedBSRatios = Object.entries(bigSmallCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const bestBSRatio = sortedBSRatios[0][0]; // 如 "3:3"
  const bestBSCount = sortedBSRatios[0][1];
  const [targetSmall, targetBig] = bestBSRatio.split(':').map(Number);

  // 前3大小比
  const topBSPatterns = sortedBSRatios
    .slice(0, 3)
    .map(([p, c]) => `${p}(${c}次)`);

  // === 第二步：分析近100期奇偶比分布 ===
  const oddEvenCounts: { [key: string]: number } = {};
  for (const r of recent100) {
    const [odd, even] = getOddEvenRatio(r.red);
    const key = `${odd}:${even}`;
    oddEvenCounts[key] = (oddEvenCounts[key] || 0) + 1;
  }

  // 找出最常见的奇偶比
  const sortedOERatios = Object.entries(oddEvenCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const bestOERatio = sortedOERatios[0][0]; // 如 "3:3"
  const bestOECount = sortedOERatios[0][1];
  const [targetOdd, targetEven] = bestOERatio.split(':').map(Number);

  // 前3奇偶比
  const topOEPatterns = sortedOERatios
    .slice(0, 3)
    .map(([p, c]) => `${p}(${c}次)`);

  // === 第三步：计算四类号码的选取数量 ===
  const [soCount, seCount, boCount, beCount] = calcCategoryDistribution(
    targetSmall,
    targetBig,
    targetOdd,
    targetEven
  );

  // === 第四步：统计四类号码的出现频率 ===
  const soFreq = calcCategoryFrequency(recent100, SMALL_ODD);
  const seFreq = calcCategoryFrequency(recent100, SMALL_EVEN);
  const boFreq = calcCategoryFrequency(recent100, BIG_ODD);
  const beFreq = calcCategoryFrequency(recent100, BIG_EVEN);

  // === 第五步：在各类别中按频率加权选号 ===
  const selected: number[] = [];

  const categories = [
    { count: soCount, numbers: SMALL_ODD, freq: soFreq, label: '小奇' },
    { count: seCount, numbers: SMALL_EVEN, freq: seFreq, label: '小偶' },
    { count: boCount, numbers: BIG_ODD, freq: boFreq, label: '大奇' },
    { count: beCount, numbers: BIG_EVEN, freq: beFreq, label: '大偶' },
  ];

  for (const cat of categories) {
    if (cat.count <= 0) continue;

    const available = cat.numbers.filter((n) => !selected.includes(n));
    const weights = available.map((n) => Math.max(1, (cat.freq[n] || 0) + 1));

    if (available.length >= cat.count) {
      const picked = weightedPick(available, weights, cat.count);
      selected.push(...picked);
    } else {
      // 可用号码不足时全选
      selected.push(...available);
    }
  }

  // === 第六步：验证并补足6个红球，确保符合目标比例 ===
  const overallFreq = calcFrequency(recent100, 'red');
  let result = validateRedBalls(selected);
  if (result.length < 6) {
    result = fillRedBalls(result, overallFreq);
  }

  // === 蓝球排除：尾数加1法 ===
  // 上期蓝球的尾数 + 1，排除以该尾数结尾的蓝球号码
  // 例如上期蓝球09，尾数9，9+1=10，尾数0，排除尾数为0的蓝球（10）
  const lastBlue = records[0]?.blue || 1;
  const lastBlueTail = getTailNumber(lastBlue);
  const excludeTail = getTailNumber(lastBlueTail + 1); // 尾数+1，再取尾数

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

  // 统计实际选号中各类别的分布
  const resultSO = result.filter((n) => SMALL_ODD.includes(n));
  const resultSE = result.filter((n) => SMALL_EVEN.includes(n));
  const resultBO = result.filter((n) => BIG_ODD.includes(n));
  const resultBE = result.filter((n) => BIG_EVEN.includes(n));

  return {
    name: '大小奇偶法',
    redBalls: result,
    blueBalls: recommendedBlue,
    description:
      `近100期大小比统计，前三常见：${topBSPatterns.join('、')}，本次目标${bestBSRatio}。` +
      `奇偶比统计，前三常见：${topOEPatterns.join('、')}，本次目标${bestOERatio}。` +
      `四分类选号：小奇${resultSO.length}个(${resultSO.join(',') || '无'})、` +
      `小偶${resultSE.length}个(${resultSE.join(',') || '无'})、` +
      `大奇${resultBO.length}个(${resultBO.join(',') || '无'})、` +
      `大偶${resultBE.length}个(${resultBE.join(',') || '无'})。` +
      `蓝球排除尾数${excludeTail}（尾数加1法：上期蓝球${lastBlue}尾数${lastBlueTail}，` +
      `${lastBlueTail}+1=${lastBlueTail + 1}，尾数${excludeTail}）。`,
  };
}
