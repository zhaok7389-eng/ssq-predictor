import type { LotteryRecord, FrequencyMap } from '../../types';
import { calcFrequency, sortByFrequency, classifyNumbers, randomPick } from '../../utils';

// 蓝球分析方法结果
interface BlueAnalysisResult {
  recommended: number[];  // 推荐的蓝球号码（按优先级排序）
  description: string;
}

// 蓝球分类常量
const SMALL_BLUE = [1, 2, 3, 4, 5, 6, 7, 8];
const BIG_BLUE = [9, 10, 11, 12, 13, 14, 15, 16];
const ODD_BLUE = [1, 3, 5, 7, 9, 11, 13, 15];
const EVEN_BLUE = [2, 4, 6, 8, 10, 12, 14, 16];
const SMALL_ODD = [1, 3, 5, 7];
const SMALL_EVEN = [2, 4, 6, 8];
const BIG_ODD = [9, 11, 13, 15];
const BIG_EVEN = [10, 12, 14, 16];

// 方法7：大小奇偶指标法1 - 大小+奇偶频率分析
export function analysisMethod7(records: LotteryRecord[]): BlueAnalysisResult {
  const recent = records.slice(-50);

  // 统计大小出现次数
  let smallCount = 0;
  let bigCount = 0;
  let oddCount = 0;
  let evenCount = 0;

  for (const r of recent) {
    if (r.blue <= 8) smallCount++;
    else bigCount++;
    if (r.blue % 2 === 1) oddCount++;
    else evenCount++;
  }

  // 选择出现频率较高的类别
  const preferSize = smallCount >= bigCount ? SMALL_BLUE : BIG_BLUE;
  const preferParity = oddCount >= evenCount ? ODD_BLUE : EVEN_BLUE;

  // 取交集
  const intersection = preferSize.filter((n) => preferParity.includes(n));
  const freq = calcFrequency(recent, 'blue');

  // 在交集中按频率排序
  const recommended = intersection.length > 0
    ? intersection.sort((a, b) => (freq[b] || 0) - (freq[a] || 0))
    : sortByFrequency(freq).slice(0, 4);

  const sizeLabel = smallCount >= bigCount ? '小号' : '大号';
  const parityLabel = oddCount >= evenCount ? '奇数' : '偶数';

  return {
    recommended,
    description: `大小奇偶法1：近50期${sizeLabel}${smallCount}次/${bigCount}次，${parityLabel}${oddCount}次/${evenCount}次，推荐${sizeLabel}${parityLabel}区`,
  };
}

// 方法8：大小奇偶指标法2 - 奇偶趋势分析
export function analysisMethod8(records: LotteryRecord[]): BlueAnalysisResult {
  const recent = records.slice(-50);

  // 分析奇偶的连续趋势
  let oddStreak = 0;
  let evenStreak = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].blue % 2 === 1) {
      if (evenStreak > 0) break;
      oddStreak++;
    } else {
      if (oddStreak > 0) break;
      evenStreak++;
    }
  }

  // 整体奇偶比
  let oddTotal = 0;
  for (const r of recent) {
    if (r.blue % 2 === 1) oddTotal++;
  }
  const evenTotal = recent.length - oddTotal;

  const freq = calcFrequency(recent, 'blue');

  let recommended: number[];
  let description: string;

  // 连续出现3+次同类型，可能要转向
  if (oddStreak >= 3) {
    // 奇数连续出现，预测转偶数
    recommended = EVEN_BLUE.sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
    description = `奇偶趋势法：奇数已连开${oddStreak}期，预测转向偶数`;
  } else if (evenStreak >= 3) {
    // 偶数连续出现，预测转奇数
    recommended = ODD_BLUE.sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
    description = `奇偶趋势法：偶数已连开${evenStreak}期，预测转向奇数`;
  } else {
    // 按整体比例选择更可能的类型
    if (oddTotal > evenTotal) {
      recommended = ODD_BLUE.sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
      description = `奇偶趋势法：奇数整体偏多(${oddTotal}:${evenTotal})，继续看好奇数`;
    } else {
      recommended = EVEN_BLUE.sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
      description = `奇偶趋势法：偶数整体偏多(${evenTotal}:${oddTotal})，继续看好偶数`;
    }
  }

  return { recommended, description };
}

// 方法9：大小奇偶指标法3 - 四分类法
export function analysisMethod9(records: LotteryRecord[]): BlueAnalysisResult {
  const recent = records.slice(-50);

  // 统计四个分类出现次数
  let soCount = 0; // 小奇
  let seCount = 0; // 小偶
  let boCount = 0; // 大奇
  let beCount = 0; // 大偶

  for (const r of recent) {
    const b = r.blue;
    if (b <= 8 && b % 2 === 1) soCount++;
    else if (b <= 8 && b % 2 === 0) seCount++;
    else if (b > 8 && b % 2 === 1) boCount++;
    else beCount++;
  }

  // 找出最常出现的分类
  const categories = [
    { name: '小奇', count: soCount, balls: SMALL_ODD },
    { name: '小偶', count: seCount, balls: SMALL_EVEN },
    { name: '大奇', count: boCount, balls: BIG_ODD },
    { name: '大偶', count: beCount, balls: BIG_EVEN },
  ];
  categories.sort((a, b) => b.count - a.count);

  const topCategory = categories[0];
  const freq = calcFrequency(recent, 'blue');

  // 从最常出现的分类中按频率推荐
  const recommended = topCategory.balls.sort(
    (a, b) => (freq[b] || 0) - (freq[a] || 0)
  );

  const desc = categories
    .map((c) => `${c.name}${c.count}次`)
    .join('，');

  return {
    recommended,
    description: `四分类法：${desc}，推荐${topCategory.name}区`,
  };
}

// 方法10：冷热分析法
export function analysisMethod10(records: LotteryRecord[]): BlueAnalysisResult {
  const recent = records.slice(-50);
  const freq = calcFrequency(recent, 'blue');

  // 按频率排序
  const sorted = sortByFrequency(freq);

  // 分类
  const hotNums = sorted.slice(0, 5);   // 前5名热号
  const warmNums = sorted.slice(5, 11); // 中间6名温号
  const coldNums = sorted.slice(11);    // 后5名冷号

  // 分析最近10期趋势
  const veryRecent = records.slice(-10);
  let hotHits = 0;
  let coldHits = 0;
  for (const r of veryRecent) {
    if (hotNums.includes(r.blue)) hotHits++;
    if (coldNums.includes(r.blue)) coldHits++;
  }

  let recommended: number[];
  let description: string;

  if (coldHits >= 4) {
    // 冷号近期大量出现，可能继续或回归温热
    recommended = [...warmNums, ...hotNums.slice(0, 2)];
    description = `冷热分析：冷号近10期出现${coldHits}次，可能回归温热区`;
  } else if (hotHits >= 6) {
    // 热号持续走强
    recommended = [...hotNums, ...warmNums.slice(0, 3)];
    description = `冷热分析：热号近10期出现${hotHits}次，持续走强`;
  } else {
    // 均衡状态，推荐温号为主
    recommended = [...warmNums, ...hotNums.slice(0, 2)];
    description = `冷热分析：热${hotHits}冷${coldHits}，温号为主`;
  }

  // 添加频率信息
  const hotInfo = hotNums.map((n) => `${String(n).padStart(2, '0')}(${freq[n]}次)`).join(' ');
  description += `\n热号: ${hotInfo}`;

  return { recommended, description };
}

// 综合蓝球分析：汇总所有方法的推荐
export function combinedAnalysis(records: LotteryRecord[]): {
  recommended: number[];
  scores: { [key: number]: number };
  methodResults: BlueAnalysisResult[];
} {
  const methods = [
    analysisMethod7(records),
    analysisMethod8(records),
    analysisMethod9(records),
    analysisMethod10(records),
  ];

  // 为每个号码计算综合得分
  const scores: { [key: number]: number } = {};
  for (let i = 1; i <= 16; i++) scores[i] = 0;

  for (const method of methods) {
    for (let i = 0; i < method.recommended.length; i++) {
      const num = method.recommended[i];
      // 排名越靠前，得分越高
      scores[num] += method.recommended.length - i;
    }
  }

  // 按得分排序
  const recommended = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([num]) => parseInt(num));

  return { recommended, scores, methodResults: methods };
}
