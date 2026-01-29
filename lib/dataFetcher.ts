import type { LotteryRecord } from './types';
import { saveLotteryRecords, getLatestRecord, getLotteryCount } from './db';

const DATA_URL = '/api/ssq-proxy';

// 解析一行数据为 LotteryRecord
function parseLine(line: string): LotteryRecord | null {
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

// 从远程获取数据并解析
async function fetchRemoteData(): Promise<LotteryRecord[]> {
  const response = await fetch(DATA_URL, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`获取数据失败: ${response.status}`);
  }

  const text = await response.text();
  const lines = text.trim().split('\n');
  const records: LotteryRecord[] = [];

  for (const line of lines) {
    const record = parseLine(line);
    if (record) {
      records.push(record);
    }
  }

  return records;
}

// 初始化或更新数据
export async function initData(
  onProgress?: (msg: string) => void
): Promise<{ total: number; newCount: number }> {
  onProgress?.('正在检查数据...');

  const existingCount = await getLotteryCount();
  const latest = await getLatestRecord();

  onProgress?.(
    existingCount > 0
      ? `已有 ${existingCount} 期数据，正在检查更新...`
      : '首次加载，正在下载历史数据...'
  );

  try {
    const remoteRecords = await fetchRemoteData();

    if (remoteRecords.length === 0) {
      throw new Error('未获取到有效数据');
    }

    // 过滤出新数据
    let newRecords: LotteryRecord[];
    if (latest) {
      newRecords = remoteRecords.filter(
        (r) => r.issue > latest.issue
      );
    } else {
      newRecords = remoteRecords;
    }

    if (newRecords.length > 0) {
      onProgress?.(`发现 ${newRecords.length} 期新数据，正在保存...`);
      await saveLotteryRecords(newRecords);
    } else {
      onProgress?.('数据已是最新');
    }

    const totalCount = await getLotteryCount();
    return { total: totalCount, newCount: newRecords.length };
  } catch (error) {
    // 如果已有数据，静默失败
    if (existingCount > 0) {
      onProgress?.('更新失败，使用本地缓存数据');
      return { total: existingCount, newCount: 0 };
    }
    throw error;
  }
}

// 计算下一期信息
export function getNextIssueInfo(): { issue: string; date: string; dayOfWeek: string } {
  const now = new Date();
  // 双色球开奖日：周二(2)、周四(4)、周日(0)
  const drawDays = [0, 2, 4];

  let nextDraw = new Date(now);
  // 如果今天是开奖日且在21:15之前，今天就是下一期
  const todayDay = now.getDay();
  const isDrawDay = drawDays.includes(todayDay);
  const beforeDraw = now.getHours() < 21 || (now.getHours() === 21 && now.getMinutes() < 15);

  if (isDrawDay && beforeDraw) {
    // 今天就是下一期开奖日
  } else {
    // 找下一个开奖日
    let daysToAdd = 1;
    while (daysToAdd <= 7) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + daysToAdd);
      if (drawDays.includes(checkDate.getDay())) {
        nextDraw = checkDate;
        break;
      }
      daysToAdd++;
    }
  }

  const year = nextDraw.getFullYear();
  const month = String(nextDraw.getMonth() + 1).padStart(2, '0');
  const day = String(nextDraw.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayOfWeek = dayNames[nextDraw.getDay()];

  // 计算期号：年份 + 3位序号（需要根据实际逻辑计算）
  // 简化处理：使用日期生成
  const issue = `${year}${month}${day}`;

  return { issue, date: dateStr, dayOfWeek };
}
