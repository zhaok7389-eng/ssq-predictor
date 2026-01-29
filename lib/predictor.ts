import type { LotteryRecord, PredictionResult, MethodResult } from './types';
import {
  calcFrequency,
  sortByFrequency,
  classifyNumbers,
  randomPick,
  weightedPick,
  calcSum,
  fillRedBalls,
  validateRedBalls,
  validateBlueBall,
} from './utils';
import { combinedExclusion } from './methods/blueBall/exclusionMethods';
import { combinedAnalysis } from './methods/blueBall/analysisMethods';
import { deduplicatePredictions } from './validator';
import { callDeepSeek } from './deepseek';

// 动态导入红球方法
import method1 from './methods/redBall/method1-decisionTree';
import method2 from './methods/redBall/method2-sumTail';
import method3 from './methods/redBall/method3-distribution';
import method4 from './methods/redBall/method4-mod3';
import method5 from './methods/redBall/method5-hotColdWarm';
import method6 from './methods/redBall/method6-bigSmallOddEven';

// 运行所有红球预测方法
function runRedBallMethods(records: LotteryRecord[]): MethodResult[] {
  const methods = [method1, method2, method3, method4, method5, method6];
  const results: MethodResult[] = [];

  for (const method of methods) {
    try {
      results.push(method(records));
    } catch (err) {
      console.error('红球方法执行失败:', err);
    }
  }

  return results;
}

// 蓝球综合推荐
function getBlueRecommendation(records: LotteryRecord[]): {
  recommended: number[];
  description: string;
} {
  // 排除法
  const exclusion = combinedExclusion(records);
  // 分析法
  const analysis = combinedAnalysis(records);

  // 综合排除法和分析法
  // 优先推荐：在分析法推荐中且未被排除的号码
  const topPicks = analysis.recommended.filter(
    (n) => !exclusion.excluded.includes(n)
  );

  // 如果过滤后太少，补充分析法推荐
  const recommended =
    topPicks.length >= 5
      ? topPicks
      : [...topPicks, ...analysis.recommended.filter((n) => !topPicks.includes(n))];

  const desc = [
    `排除法排除: ${exclusion.excluded.join(',')}`,
    ...exclusion.methodResults.map((m) => m.description),
    ...analysis.methodResults.map((m) => m.description),
  ].join('\n');

  return { recommended: recommended.slice(0, 10), description: desc };
}

// 本地生成一组预测号码
function generateLocalPrediction(
  records: LotteryRecord[],
  methodResults: MethodResult[],
  blueRecommended: number[],
  strategy: 'consensus' | 'balanced' | 'trend' | 'explore'
): PredictionResult {
  const freq = calcFrequency(records.slice(-50), 'red');
  const { hot, warm, cold } = classifyNumbers(freq, 10, 4);

  let red: number[];
  let confidence: number;
  let strategyName: string;

  switch (strategy) {
    case 'consensus': {
      // 高置信：取各方法推荐的交集/高频号码
      const allRecommended: { [key: number]: number } = {};
      for (const result of methodResults) {
        for (const n of result.redBalls) {
          allRecommended[n] = (allRecommended[n] || 0) + 1;
        }
      }
      // 按被推荐次数排序
      const sorted = Object.entries(allRecommended)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => parseInt(key));
      red = fillRedBalls(sorted.slice(0, 8), freq);
      confidence = 85 + Math.floor(Math.random() * 10);
      strategyName = '多方法共识推荐';
      break;
    }
    case 'balanced': {
      // 平衡：2热+2温+2冷
      const hotPick = randomPick(hot, 2);
      const warmPick = randomPick(warm, 2);
      const coldPick = randomPick(cold, 2);
      red = validateRedBalls([...hotPick, ...warmPick, ...coldPick]);
      red = fillRedBalls(red, freq);
      confidence = 75 + Math.floor(Math.random() * 10);
      strategyName = '冷热平衡策略';
      break;
    }
    case 'trend': {
      // 趋势追踪：基于近10期走势
      const recentFreq = calcFrequency(records.slice(-10), 'red');
      const trending = sortByFrequency(recentFreq).slice(0, 10);
      red = fillRedBalls(randomPick(trending, 6), freq);
      confidence = 65 + Math.floor(Math.random() * 10);
      strategyName = '近期趋势追踪';
      break;
    }
    case 'explore': {
      // 探索：冷号反弹
      const coldPick = randomPick(cold, 3);
      const warmPick = randomPick(warm, 2);
      const hotPick = randomPick(hot, 1);
      red = validateRedBalls([...coldPick, ...warmPick, ...hotPick]);
      red = fillRedBalls(red, freq);
      confidence = 55 + Math.floor(Math.random() * 10);
      strategyName = '冷号反弹探索';
      break;
    }
  }

  // 选择蓝球
  const blue = blueRecommended[Math.floor(Math.random() * Math.min(5, blueRecommended.length))];

  return {
    red: red.sort((a, b) => a - b),
    blue: validateBlueBall(blue),
    confidence,
    strategy: strategyName,
  };
}

// 主预测函数
export async function runPrediction(
  records: LotteryRecord[],
  onProgress?: (msg: string) => void
): Promise<PredictionResult[]> {
  if (records.length < 50) {
    throw new Error('历史数据不足50期，无法进行预测');
  }

  onProgress?.('正在分析红球数据...');

  // 1. 运行所有红球方法
  const methodResults = runRedBallMethods(records);

  onProgress?.('正在分析蓝球数据...');

  // 2. 蓝球综合推荐
  const blueRec = getBlueRecommendation(records);

  onProgress?.('正在调用AI分析引擎...');

  // 3. 准备统计信息
  const freq50 = calcFrequency(records.slice(-50), 'red');
  const { hot: hotRed, cold: coldRed } = classifyNumbers(freq50, 10, 4);
  const blueFreq = calcFrequency(records.slice(-50), 'blue');
  const hotBlue = sortByFrequency(blueFreq).slice(0, 5);

  // 计算和值范围
  const recentSums = records.slice(-100).map((r) => calcSum(r.red));
  const avgSum = Math.round(recentSums.reduce((a, b) => a + b, 0) / recentSums.length);
  const sumRange = `${avgSum - 20}~${avgSum + 20}(均值${avgSum})`;

  const lastRecord = records[records.length - 1];
  const now = new Date();

  let predictions: PredictionResult[] = [];

  // 4. 尝试调用 DeepSeek API
  try {
    const apiPredictions = await callDeepSeek({
      targetIssue: '下一期',
      drawDate: '待定',
      month: now.getMonth() + 1,
      lastIssue: lastRecord.issue,
      lastRed: lastRecord.red,
      lastBlue: lastRecord.blue,
      methodResults,
      hotRed,
      coldRed,
      hotBlue,
      sumRange,
    });

    if (apiPredictions.length > 0) {
      predictions = apiPredictions;
      onProgress?.('AI分析完成');
    }
  } catch (err) {
    console.warn('DeepSeek API 调用失败，使用本地预测:', err);
    onProgress?.('AI引擎暂不可用，使用本地算法...');
  }

  // 5. 如果API结果不足10组，使用本地方法补充
  if (predictions.length < 10) {
    onProgress?.('正在生成本地预测...');

    // 按策略分配
    const strategies: ('consensus' | 'balanced' | 'trend' | 'explore')[] = [
      'consensus', 'consensus', 'consensus',
      'balanced', 'balanced', 'balanced',
      'trend', 'trend',
      'explore', 'explore',
    ];

    // 从API结果数量之后开始补充
    for (let i = predictions.length; i < 10; i++) {
      const pred = generateLocalPrediction(
        records,
        methodResults,
        blueRec.recommended,
        strategies[i]
      );
      predictions.push(pred);
    }
  }

  // 6. 去重验证
  onProgress?.('正在验证去重...');
  predictions = deduplicatePredictions(predictions, records);

  // 如果去重后不足10组，继续生成
  let attempts = 0;
  while (predictions.length < 10 && attempts < 50) {
    const strategies: ('consensus' | 'balanced' | 'trend' | 'explore')[] = [
      'consensus', 'balanced', 'trend', 'explore',
    ];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const pred = generateLocalPrediction(records, methodResults, blueRec.recommended, strategy);
    const newPreds = deduplicatePredictions([...predictions, pred], records);
    if (newPreds.length > predictions.length) {
      predictions = newPreds;
    }
    attempts++;
  }

  // 按置信度排序
  predictions.sort((a, b) => b.confidence - a.confidence);

  onProgress?.('预测完成！');
  return predictions.slice(0, 10);
}
