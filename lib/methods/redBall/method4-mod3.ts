/**
 * 方法4：除3余数杀号法
 *
 * 核心思路：
 * 1. 将1-33按除以3的余数分为三路：
 *    - 0路（余数0）：3,6,9,12,15,18,21,24,27,30,33（11个）
 *    - 1路（余数1）：1,4,7,10,13,16,19,22,25,28,31（11个）
 *    - 2路（余数2）：2,5,8,11,14,17,20,23,26,29,32（11个）
 * 2. 统计近100期每期的余数分布（如 2-2-2、3-2-1 等）
 * 3. 找出最常见的余数分布模式
 * 4. 分析每个余数类别中各号码的出现频率
 * 5. 根据目标余数分布在各类别中选号
 * 6. 优先选择各类别中的热号
 *
 * 蓝球排除（期数日期法）：(期号末几位 + 开奖日期) % 16，排除该蓝球号码
 */

import type { LotteryRecord, MethodResult, FrequencyMap } from '../../types';
import {
  calcFrequency,
  getMod3Distribution,
  weightedPick,
  validateRedBalls,
  fillRedBalls,
} from '../../utils';

// === 三路号码定义 ===
// 0路：除以3余数为0的号码
const MOD0_NUMBERS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33];
// 1路：除以3余数为1的号码
const MOD1_NUMBERS = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31];
// 2路：除以3余数为2的号码
const MOD2_NUMBERS = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32];

/**
 * 获取指定余数类别的号码列表
 */
function getModNumbers(mod: number): number[] {
  if (mod === 0) return MOD0_NUMBERS;
  if (mod === 1) return MOD1_NUMBERS;
  return MOD2_NUMBERS;
}

/**
 * 统计某余数类别内各号码在历史记录中的频率
 */
function calcModClassFrequency(
  records: LotteryRecord[],
  mod: number
): { numbers: number[]; freq: FrequencyMap } {
  const numbers = getModNumbers(mod);
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
 * 解析期号中的数字部分（取末尾数字）
 * 例如 "2024153" -> 153
 */
function parseIssueNumber(issue: string): number {
  // 取期号末3位作为序号
  const digits = issue.replace(/\D/g, '');
  if (digits.length >= 3) {
    return parseInt(digits.slice(-3), 10);
  }
  return parseInt(digits, 10) || 0;
}

/**
 * 解析日期中的日（day）
 * 例如 "2024-12-15" -> 15
 */
function parseDateDay(dateStr: string): number {
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    return parseInt(parts[2], 10) || 0;
  }
  return 0;
}

export default function method4Mod3(records: LotteryRecord[]): MethodResult {
  const recent100 = records.slice(0, 100);

  // === 第一步：统计近100期每期的余数分布 ===
  const mod3Counts: { [key: string]: number } = {};
  for (const r of recent100) {
    const [m0, m1, m2] = getMod3Distribution(r.red);
    const key = `${m0}-${m1}-${m2}`;
    mod3Counts[key] = (mod3Counts[key] || 0) + 1;
  }

  // === 第二步：找出最常见的余数分布模式 ===
  const sortedPatterns = Object.entries(mod3Counts).sort(
    (a, b) => b[1] - a[1]
  );
  const bestPattern = sortedPatterns[0][0]; // 如 "2-2-2"
  const bestPatternCount = sortedPatterns[0][1];
  const [target0, target1, target2] = bestPattern.split('-').map(Number);

  // 记录前3常见模式用于描述
  const topPatterns = sortedPatterns
    .slice(0, 3)
    .map(([p, c]) => `${p}(${c}次)`);

  // === 第三步：分析每个余数类别中各号码的出现频率 ===
  const mod0Data = calcModClassFrequency(recent100, 0);
  const mod1Data = calcModClassFrequency(recent100, 1);
  const mod2Data = calcModClassFrequency(recent100, 2);

  // 整体红球频率（用于补号）
  const overallFreq = calcFrequency(recent100, 'red');

  // === 第四步：根据目标余数分布在各类别中选号 ===
  // 优先选择热号：以频率作为权重进行加权随机选取
  const selected: number[] = [];

  const modGroups = [
    { count: target0, data: mod0Data, label: '0路' },
    { count: target1, data: mod1Data, label: '1路' },
    { count: target2, data: mod2Data, label: '2路' },
  ];

  for (const group of modGroups) {
    if (group.count <= 0) continue;

    const { numbers, freq } = group.data;

    // 排除已选号码
    const available = numbers.filter((n) => !selected.includes(n));
    // 权重 = 频率 + 基础值（保证冷号也有被选概率）
    const weights = available.map((n) => Math.max(1, (freq[n] || 0) + 1));

    if (available.length >= group.count) {
      const picked = weightedPick(available, weights, group.count);
      selected.push(...picked);
    } else {
      // 可用号码不足时全选
      selected.push(...available);
    }
  }

  // === 第五步：验证并补足6个红球 ===
  let result = validateRedBalls(selected);
  if (result.length < 6) {
    result = fillRedBalls(result, overallFreq);
  }

  // === 蓝球排除：期数日期法 ===
  // (期号末几位数字 + 开奖日期中的"日") % 16
  // 结果为0时当作16，排除该蓝球号码
  const lastRecord = records[0];
  const issueNum = parseIssueNumber(lastRecord?.issue || '0');
  const dateDay = parseDateDay(lastRecord?.date || '2024-01-01');
  const rawExclude = (issueNum + dateDay) % 16;
  const excludeBlue = rawExclude === 0 ? 16 : rawExclude;

  const blueCandidates: number[] = [];
  for (let i = 1; i <= 16; i++) {
    if (i !== excludeBlue) {
      blueCandidates.push(i);
    }
  }

  // 按蓝球频率排序，选前5个作为推荐
  const blueFreq = calcFrequency(recent100, 'blue');
  const sortedBlueCandidates = blueCandidates.sort(
    (a, b) => (blueFreq[b] || 0) - (blueFreq[a] || 0)
  );
  const recommendedBlue = sortedBlueCandidates.slice(0, 5);

  // 各路选出的号码统计
  const resultMod0 = result.filter((n) => n % 3 === 0);
  const resultMod1 = result.filter((n) => n % 3 === 1);
  const resultMod2 = result.filter((n) => n % 3 === 2);

  return {
    name: '除3余数杀号法',
    redBalls: result,
    blueBalls: recommendedBlue,
    description:
      `近100期除3余数分布统计，前三常见模式：${topPatterns.join('、')}。` +
      `本次采用${bestPattern}分布（出现${bestPatternCount}次）。` +
      `实际选号：0路${resultMod0.length}个(${resultMod0.join(',') || '无'})、` +
      `1路${resultMod1.length}个(${resultMod1.join(',') || '无'})、` +
      `2路${resultMod2.length}个(${resultMod2.join(',') || '无'})。` +
      `蓝球排除${excludeBlue}号（期数日期法：期号${issueNum}+日期${dateDay}=${issueNum + dateDay}，mod16=${rawExclude}）。`,
  };
}
