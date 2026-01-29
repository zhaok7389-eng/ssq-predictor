// 双色球开奖记录
export interface LotteryRecord {
  issue: string;      // 期号，如 "2024001"
  date: string;       // 开奖日期，如 "2024-01-02"
  red: number[];      // 红球，如 [3, 11, 18, 22, 26, 33]
  blue: number;       // 蓝球，如 7
  sum?: number;       // 红球和值
  oddCount?: number;  // 奇数个数
  bigCount?: number;  // 大号个数(17-33)
}

// 预测结果
export interface PredictionResult {
  red: number[];
  blue: number;
  confidence: number;
  strategy: string;
}

// 方法预测结果
export interface MethodResult {
  name: string;
  redBalls: number[];
  blueBalls: number[];
  description: string;
}

// 预测记录（保存到本地）
export interface PredictionRecord {
  id: string;
  targetIssue: string;
  targetDate: string;
  predictions: PredictionResult[];
  createdAt: string;
  actualResult?: {
    red: number[];
    blue: number;
  };
}

// 号码频率统计
export interface FrequencyMap {
  [key: number]: number;
}
