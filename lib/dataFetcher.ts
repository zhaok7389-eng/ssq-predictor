import type { LotteryRecord } from './types';
import { saveLotteryRecords, getAllLotteryRecords, getLotteryCount } from './db';

// API 响应类型
interface LotteryApiResponse {
  total: number;
  returnedCount?: number;
  lastUpdate: string;
  latest: LotteryRecord;
  data: LotteryRecord[];
}

// 数据状态
export interface DataStatus {
  total: number;
  loadedCount: number;
  latest: LotteryRecord | null;
  lastUpdate: string;
  source: 'server' | 'cache' | 'loading';
  isFullLoaded: boolean;
}

// 带超时的 fetch
async function fetchWithTimeout(url: string, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// 从服务器获取最新100期（快速加载）
async function fetchLatestData(): Promise<LotteryApiResponse> {
  const response = await fetchWithTimeout('/api/lottery-latest', 15000);
  if (!response.ok) {
    throw new Error(`获取最新数据失败: ${response.status}`);
  }
  return response.json();
}

// 从服务器获取全量数据
async function fetchFullData(): Promise<LotteryApiResponse> {
  const response = await fetchWithTimeout('/api/lottery-data', 30000);
  if (!response.ok) {
    throw new Error(`获取全量数据失败: ${response.status}`);
  }
  return response.json();
}

// 初始化数据：先快速加载100期，再后台加载全量
export async function initData(
  onProgress?: (msg: string) => void,
  onStatusUpdate?: (status: DataStatus) => void
): Promise<DataStatus> {
  // 第一阶段：尝试从服务器获取最新100期（秒开）
  onProgress?.('正在加载最新数据...');

  let status: DataStatus = {
    total: 0,
    loadedCount: 0,
    latest: null,
    lastUpdate: '',
    source: 'loading',
    isFullLoaded: false,
  };

  try {
    const latestResult = await fetchLatestData();

    status = {
      total: latestResult.total,
      loadedCount: latestResult.data.length,
      latest: latestResult.latest,
      lastUpdate: latestResult.lastUpdate,
      source: 'server',
      isFullLoaded: false,
    };

    onProgress?.(`已加载最新 ${latestResult.data.length} 期数据（共 ${latestResult.total} 期）`);
    onStatusUpdate?.(status);

    // 保存到 IndexedDB 作为离线缓存
    await saveLotteryRecords(latestResult.data);

    return status;
  } catch (error) {
    console.warn('服务器数据获取失败，尝试使用本地缓存:', error);
    onProgress?.('服务器连接失败，正在使用本地缓存...');

    // 回退到 IndexedDB 缓存
    try {
      const cachedRecords = await getAllLotteryRecords();
      if (cachedRecords.length > 0) {
        status = {
          total: cachedRecords.length,
          loadedCount: cachedRecords.length,
          latest: cachedRecords[cachedRecords.length - 1],
          lastUpdate: '离线缓存',
          source: 'cache',
          isFullLoaded: true,
        };
        onProgress?.(`使用本地缓存：${cachedRecords.length} 期数据`);
        onStatusUpdate?.(status);
        return status;
      }
    } catch (_dbError) {
      // IndexedDB 也不可用
    }

    throw new Error('无法获取数据：服务器不可用且无本地缓存');
  }
}

// 后台加载全量数据
export async function loadFullData(
  onProgress?: (msg: string, loaded: number, total: number) => void
): Promise<DataStatus> {
  try {
    onProgress?.('正在加载完整历史数据...', 0, 0);

    const fullResult = await fetchFullData();

    onProgress?.(
      `正在保存 ${fullResult.total} 期数据...`,
      fullResult.data.length,
      fullResult.total
    );

    // 全量保存到 IndexedDB
    await saveLotteryRecords(fullResult.data);

    const status: DataStatus = {
      total: fullResult.total,
      loadedCount: fullResult.data.length,
      latest: fullResult.latest,
      lastUpdate: fullResult.lastUpdate,
      source: 'server',
      isFullLoaded: true,
    };

    onProgress?.(
      `全部 ${fullResult.total} 期历史数据加载完成`,
      fullResult.data.length,
      fullResult.total
    );

    return status;
  } catch (error) {
    console.warn('全量数据加载失败:', error);

    // 回退到 IndexedDB 中已有的数据
    const cachedCount = await getLotteryCount();
    return {
      total: cachedCount,
      loadedCount: cachedCount,
      latest: null,
      lastUpdate: '部分缓存',
      source: 'cache',
      isFullLoaded: cachedCount > 100,
    };
  }
}

// 强制刷新数据（用户手动触发）
export async function forceRefresh(
  onProgress?: (msg: string) => void
): Promise<DataStatus> {
  onProgress?.('正在强制刷新数据...');

  try {
    // 强制绕过缓存获取最新数据
    const response = await fetchWithTimeout('/api/lottery-latest', 15000);
    if (!response.ok) throw new Error(`刷新失败: ${response.status}`);

    const result: LotteryApiResponse = await response.json();
    await saveLotteryRecords(result.data);

    onProgress?.('数据刷新完成');

    return {
      total: result.total,
      loadedCount: result.data.length,
      latest: result.latest,
      lastUpdate: result.lastUpdate,
      source: 'server',
      isFullLoaded: false,
    };
  } catch (error) {
    onProgress?.('刷新失败，请检查网络');
    throw error;
  }
}

// 获取当前可用的全部记录（优先服务器数据，回退本地缓存）
export async function getAvailableRecords(): Promise<LotteryRecord[]> {
  try {
    const response = await fetchWithTimeout('/api/lottery-data', 30000);
    if (response.ok) {
      const result: LotteryApiResponse = await response.json();
      // 同步更新本地缓存
      await saveLotteryRecords(result.data);
      return result.data;
    }
  } catch (_e) {
    // 服务器不可用，回退本地
  }

  return getAllLotteryRecords();
}

// 计算下一期信息
export function getNextIssueInfo(): { issue: string; date: string; dayOfWeek: string } {
  const now = new Date();
  // 双色球开奖日：周二(2)、周四(4)、周日(0)
  const drawDays = [0, 2, 4];

  let nextDraw = new Date(now);
  const todayDay = now.getDay();
  const isDrawDay = drawDays.includes(todayDay);
  const beforeDraw = now.getHours() < 21 || (now.getHours() === 21 && now.getMinutes() < 15);

  if (isDrawDay && beforeDraw) {
    // 今天就是下一期开奖日
  } else {
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

  const issue = `${year}${month}${day}`;

  return { issue, date: dateStr, dayOfWeek };
}
