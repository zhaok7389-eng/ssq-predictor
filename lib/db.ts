import { openDB, type IDBPDatabase } from 'idb';
import type { LotteryRecord, PredictionRecord } from './types';

const DB_NAME = 'ssq-predictor';
const DB_VERSION = 1;
const LOTTERY_STORE = 'lottery';
const PREDICTION_STORE = 'predictions';

// 获取数据库实例
async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 开奖记录表
      if (!db.objectStoreNames.contains(LOTTERY_STORE)) {
        const lotteryStore = db.createObjectStore(LOTTERY_STORE, {
          keyPath: 'issue',
        });
        lotteryStore.createIndex('date', 'date');
      }
      // 预测记录表
      if (!db.objectStoreNames.contains(PREDICTION_STORE)) {
        const predictionStore = db.createObjectStore(PREDICTION_STORE, {
          keyPath: 'id',
        });
        predictionStore.createIndex('targetIssue', 'targetIssue');
        predictionStore.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

// ========== 开奖记录操作 ==========

// 批量保存开奖记录
export async function saveLotteryRecords(records: LotteryRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(LOTTERY_STORE, 'readwrite');
  const store = tx.objectStore(LOTTERY_STORE);
  for (const record of records) {
    await store.put(record);
  }
  await tx.done;
}

// 获取所有开奖记录（按期号升序）
export async function getAllLotteryRecords(): Promise<LotteryRecord[]> {
  const db = await getDB();
  const records = await db.getAll(LOTTERY_STORE);
  return records.sort((a, b) => a.issue.localeCompare(b.issue));
}

// 获取最近N期开奖记录
export async function getRecentRecords(count: number): Promise<LotteryRecord[]> {
  const all = await getAllLotteryRecords();
  return all.slice(-count);
}

// 获取最新一期开奖记录
export async function getLatestRecord(): Promise<LotteryRecord | undefined> {
  const all = await getAllLotteryRecords();
  return all.length > 0 ? all[all.length - 1] : undefined;
}

// 获取记录总数
export async function getLotteryCount(): Promise<number> {
  const db = await getDB();
  return db.count(LOTTERY_STORE);
}

// 检查某期是否已存在
export async function hasRecord(issue: string): Promise<boolean> {
  const db = await getDB();
  const record = await db.get(LOTTERY_STORE, issue);
  return !!record;
}

// ========== 预测记录操作 ==========

// 保存预测记录
export async function savePrediction(record: PredictionRecord): Promise<void> {
  const db = await getDB();
  await db.put(PREDICTION_STORE, record);
}

// 获取所有预测记录（按创建时间降序）
export async function getAllPredictions(): Promise<PredictionRecord[]> {
  const db = await getDB();
  const records = await db.getAll(PREDICTION_STORE);
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// 获取某期的预测记录
export async function getPredictionByIssue(
  targetIssue: string
): Promise<PredictionRecord | undefined> {
  const db = await getDB();
  const index = db.transaction(PREDICTION_STORE).objectStore(PREDICTION_STORE).index('targetIssue');
  const records = await index.getAll(targetIssue);
  return records.length > 0 ? records[0] : undefined;
}

// 删除预测记录
export async function deletePrediction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(PREDICTION_STORE, id);
}
