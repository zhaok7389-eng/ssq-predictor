/**
 * 方法5：热冷温码法
 *
 * 核心思路：
 * 1. 统计近50期每个号码（1-33）的出现频率
 * 2. 按频率分类：
 *    - 热码：出现 >= 10次（约前30%高频号）
 *    - 温码：出现 5-9次（约中间40%）
 *    - 冷码：出现 <= 4次（约后30%低频号）
 * 3. 推荐比例：2热 + 2温 + 2冷
 * 4. 根据近期走势动态调整：
 *    - 如果近10期热码命中率高，调整为3热 + 2温 + 1冷
 *    - 如果近10期冷码回补多，调整为2热 + 2温 + 2冷或1热 + 2温 + 3冷
 * 5. 在各类别中按频率加权随机选号
 *
 * 蓝球排除（月份排除法）：当前月份对应的蓝球号码排除
 *   1月排除01，2月排除02，...，12月排除12
 */

import type { LotteryRecord, MethodResult, FrequencyMap } from '../../types';
import {
  calcFrequency,
  classifyNumbers,
  randomPick,
  weightedPick,
  validateRedBalls,
  fillRedBalls,
} from '../../utils';

/**
 * 分析近期走势，判断热码/冷码的活跃程度
 * 返回建议的选号比例 [热, 温, 冷]
 */
function analyzeRecentTrend(
  records: LotteryRecord[],
  hot: number[],
  warm: number[],
  cold: number[]
): [number, number, number] {
  // 取近10期数据分析走势
  const recent10 = records.slice(0, 10);

  let hotHits = 0;   // 近10期中热码命中总次数
  let coldHits = 0;  // 近10期中冷码命中总次数
  let totalBalls = 0;

  for (const r of recent10) {
    for (const n of r.red) {
      totalBalls++;
      if (hot.includes(n)) hotHits++;
      if (cold.includes(n)) coldHits++;
    }
  }

  // 计算命中率
  const hotRate = totalBalls > 0 ? hotHits / totalBalls : 0;
  const coldRate = totalBalls > 0 ? coldHits / totalBalls : 0;

  // 根据走势调整比例
  if (hotRate > 0.45) {
    // 热码活跃期：多选热码
    return [3, 2, 1];
  } else if (coldRate > 0.35) {
    // 冷码回补期：多选冷码
    return [1, 2, 3];
  } else {
    // 均衡期：标准比例
    return [2, 2, 2];
  }
}

export default function method5HotColdWarm(records: LotteryRecord[]): MethodResult {
  // === 第一步：统计近50期红球频率 ===
  const recent50 = records.slice(0, 50);
  const freq: FrequencyMap = calcFrequency(recent50, 'red');

  // === 第二步：按频率分类 ===
  // 热码：>= 10次，冷码：<= 4次，温码：5-9次
  const { hot, warm, cold } = classifyNumbers(freq, 10, 4);

  // 按频率降序排序各类别号码（方便描述和选号）
  const sortedHot = [...hot].sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
  const sortedWarm = [...warm].sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
  const sortedCold = [...cold].sort((a, b) => (freq[b] || 0) - (freq[a] || 0));

  // === 第三步：根据近期走势确定选号比例 ===
  const [hotCount, warmCount, coldCount] = analyzeRecentTrend(
    records,
    hot,
    warm,
    cold
  );

  // === 第四步：在各类别中按频率加权选号 ===
  const selected: number[] = [];

  // 选取热码
  if (hotCount > 0 && sortedHot.length > 0) {
    const hotWeights = sortedHot.map((n) => Math.max(1, freq[n] || 0));
    const pickCount = Math.min(hotCount, sortedHot.length);
    const picked = weightedPick(sortedHot, hotWeights, pickCount);
    selected.push(...picked);
  }

  // 选取温码（排除已选号码）
  if (warmCount > 0 && sortedWarm.length > 0) {
    const availWarm = sortedWarm.filter((n) => !selected.includes(n));
    const warmWeights = availWarm.map((n) => Math.max(1, freq[n] || 0));
    const pickCount = Math.min(warmCount, availWarm.length);
    if (availWarm.length > 0) {
      const picked = weightedPick(availWarm, warmWeights, pickCount);
      selected.push(...picked);
    }
  }

  // 选取冷码（排除已选号码）
  // 冷码选取策略：使用反转权重，让更冷的号码有更高概率（冷码回补思路）
  if (coldCount > 0 && sortedCold.length > 0) {
    const availCold = sortedCold.filter((n) => !selected.includes(n));
    if (availCold.length > 0) {
      // 冷码反转权重：出现次数越少，权重越高
      const maxColdFreq = Math.max(...availCold.map((n) => freq[n] || 0));
      const coldWeights = availCold.map((n) => {
        const f = freq[n] || 0;
        return Math.max(1, maxColdFreq - f + 2);
      });
      const pickCount = Math.min(coldCount, availCold.length);
      const picked = weightedPick(availCold, coldWeights, pickCount);
      selected.push(...picked);
    }
  }

  // === 第五步：验证并补足6个红球 ===
  // 整体频率用于补号
  const recent100 = records.slice(0, 100);
  const overallFreq = calcFrequency(recent100, 'red');

  let result = validateRedBalls(selected);
  if (result.length < 6) {
    result = fillRedBalls(result, overallFreq);
  }

  // === 蓝球排除：月份排除法 ===
  // 当前月份 = 排除的蓝球号码
  // 1月排除01，2月排除02，...，12月排除12
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const excludeBlue = currentMonth; // 直接用月份作为排除的蓝球号

  const blueCandidates: number[] = [];
  for (let i = 1; i <= 16; i++) {
    if (i !== excludeBlue) {
      blueCandidates.push(i);
    }
  }

  // 按蓝球频率排序，选前5个推荐
  const blueFreq = calcFrequency(recent50, 'blue');
  const sortedBlueCandidates = blueCandidates.sort(
    (a, b) => (blueFreq[b] || 0) - (blueFreq[a] || 0)
  );
  const recommendedBlue = sortedBlueCandidates.slice(0, 5);

  // 统计实际选号中各类别的分布
  const resultHot = result.filter((n) => hot.includes(n));
  const resultWarm = result.filter((n) => warm.includes(n));
  const resultCold = result.filter((n) => cold.includes(n));

  // 趋势描述
  const trendDesc =
    hotCount === 3
      ? '热码活跃期，增加热码比重'
      : coldCount === 3
        ? '冷码回补期，增加冷码比重'
        : '均衡期，标准比例选号';

  return {
    name: '热冷温码法',
    redBalls: result,
    blueBalls: recommendedBlue,
    description:
      `近50期号码分类：热码${hot.length}个(出现>=10次)、` +
      `温码${warm.length}个(5-9次)、冷码${cold.length}个(<=4次)。` +
      `走势判断：${trendDesc}，目标比例${hotCount}热+${warmCount}温+${coldCount}冷。` +
      `实际选号：热码${resultHot.length}个(${resultHot.join(',') || '无'})、` +
      `温码${resultWarm.length}个(${resultWarm.join(',') || '无'})、` +
      `冷码${resultCold.length}个(${resultCold.join(',') || '无'})。` +
      `蓝球排除${excludeBlue}号（月份排除法：当前${currentMonth}月）。`,
  };
}
