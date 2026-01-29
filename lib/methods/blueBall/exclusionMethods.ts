import type { LotteryRecord } from '../../types';
import { getTailNumber } from '../../utils';

// 蓝球排除法通用接口
interface ExclusionResult {
  excluded: number[];   // 被排除的号码
  remaining: number[];  // 剩余候选号码
  description: string;  // 方法描述
}

// 获取所有蓝球号码 1-16
function allBlueBalls(): number[] {
  return Array.from({ length: 16 }, (_, i) => i + 1);
}

// 根据尾数排除号码
function excludeByTail(tail: number): number[] {
  return allBlueBalls().filter((n) => getTailNumber(n) === tail);
}

// 方法1：加6法
// 计算：上期蓝球 + 6，取尾数，排除所有以该尾数结尾的蓝球
export function exclusionMethod1(records: LotteryRecord[]): ExclusionResult {
  const lastBlue = records[records.length - 1]?.blue ?? 1;
  const tail = getTailNumber(lastBlue + 6);
  const excluded = excludeByTail(tail);
  const remaining = allBlueBalls().filter((n) => !excluded.includes(n));

  return {
    excluded,
    remaining,
    description: `加6法：上期蓝球${lastBlue}+6=${lastBlue + 6}，尾数${tail}，排除${excluded.join(',')}`,
  };
}

// 方法2：加10法
// 计算：上期蓝球 + 10，取尾数，排除所有以该尾数结尾的蓝球
export function exclusionMethod2(records: LotteryRecord[]): ExclusionResult {
  const lastBlue = records[records.length - 1]?.blue ?? 1;
  const tail = getTailNumber(lastBlue + 10);
  const excluded = excludeByTail(tail);
  const remaining = allBlueBalls().filter((n) => !excluded.includes(n));

  return {
    excluded,
    remaining,
    description: `加10法：上期蓝球${lastBlue}+10=${lastBlue + 10}，尾数${tail}，排除${excluded.join(',')}`,
  };
}

// 方法3：减7取绝对值法
// 计算：|上期蓝球 - 7|，取尾数，排除所有以该尾数结尾的蓝球
export function exclusionMethod3(records: LotteryRecord[]): ExclusionResult {
  const lastBlue = records[records.length - 1]?.blue ?? 1;
  const absVal = Math.abs(lastBlue - 7);
  const tail = getTailNumber(absVal);
  const excluded = excludeByTail(tail);
  const remaining = allBlueBalls().filter((n) => !excluded.includes(n));

  return {
    excluded,
    remaining,
    description: `减7绝对值法：|${lastBlue}-7|=${absVal}，尾数${tail}，排除${excluded.join(',')}`,
  };
}

// 方法4：期数日期法
// 计算：(上期期数后几位 + 开奖日期) % 16
export function exclusionMethod4(records: LotteryRecord[]): ExclusionResult {
  const lastRecord = records[records.length - 1];
  if (!lastRecord) {
    return { excluded: [], remaining: allBlueBalls(), description: '期数日期法：无数据' };
  }

  // 提取期号后三位
  const issueStr = lastRecord.issue;
  const issueNum = parseInt(issueStr.slice(-3)) || 0;
  // 提取日期中的日
  const dateParts = lastRecord.date.split('-');
  const day = parseInt(dateParts[2]) || 0;

  const result = (issueNum + day) % 16;
  const excludeNum = result === 0 ? 16 : result; // 0对应16号
  const excluded = [excludeNum];
  const remaining = allBlueBalls().filter((n) => !excluded.includes(n));

  return {
    excluded,
    remaining,
    description: `期数日期法：期号尾${issueNum}+日期${day}=${issueNum + day}，%16=${result}，排除${excludeNum}`,
  };
}

// 方法5：月份排除法
// 当前月份 = 要排除的蓝球号码
export function exclusionMethod5(): ExclusionResult {
  const month = new Date().getMonth() + 1; // 1-12
  const excluded = [month];
  const remaining = allBlueBalls().filter((n) => !excluded.includes(n));

  return {
    excluded,
    remaining,
    description: `月份排除法：当前${month}月，排除蓝球${String(month).padStart(2, '0')}`,
  };
}

// 方法6：尾数加1法
// 上期蓝球的尾数 + 1，排除所有以该尾数结尾的蓝球
export function exclusionMethod6(records: LotteryRecord[]): ExclusionResult {
  const lastBlue = records[records.length - 1]?.blue ?? 1;
  const tail = getTailNumber(getTailNumber(lastBlue) + 1);
  const excluded = excludeByTail(tail);
  const remaining = allBlueBalls().filter((n) => !excluded.includes(n));

  return {
    excluded,
    remaining,
    description: `尾数加1法：上期蓝球${lastBlue}尾数${getTailNumber(lastBlue)}+1=${tail}，排除${excluded.join(',')}`,
  };
}

// 综合排除法：取所有排除法的交集作为排除集
export function combinedExclusion(records: LotteryRecord[]): {
  excluded: number[];
  remaining: number[];
  methodResults: ExclusionResult[];
} {
  const methods = [
    exclusionMethod1(records),
    exclusionMethod2(records),
    exclusionMethod3(records),
    exclusionMethod4(records),
    exclusionMethod5(),
    exclusionMethod6(records),
  ];

  // 统计每个号码被排除的次数
  const excludeCount: { [key: number]: number } = {};
  for (const method of methods) {
    for (const num of method.excluded) {
      excludeCount[num] = (excludeCount[num] || 0) + 1;
    }
  }

  // 被2种以上方法排除的号码视为强排除
  const strongExcluded = Object.entries(excludeCount)
    .filter(([, count]) => count >= 2)
    .map(([num]) => parseInt(num));

  const remaining = allBlueBalls().filter((n) => !strongExcluded.includes(n));

  return {
    excluded: strongExcluded,
    remaining: remaining.length > 0 ? remaining : allBlueBalls(), // 防止全部排除
    methodResults: methods,
  };
}
