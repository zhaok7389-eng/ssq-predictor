import type { PredictionResult, MethodResult } from './types';

interface DeepSeekResponse {
  predictions: PredictionResult[];
}

// 调用 DeepSeek API 进行综合预测
export async function callDeepSeek(params: {
  targetIssue: string;
  drawDate: string;
  month: number;
  lastIssue: string;
  lastRed: number[];
  lastBlue: number;
  methodResults: MethodResult[];
  hotRed: number[];
  coldRed: number[];
  hotBlue: number[];
  sumRange: string;
}): Promise<PredictionResult[]> {
  const methodResultsText = params.methodResults
    .map((m) => `【${m.name}】\n红球推荐: ${m.redBalls.join(', ')}\n蓝球推荐: ${m.blueBalls.join(', ')}\n${m.description}`)
    .join('\n\n');

  const prompt = `你是双色球数据分析专家。请根据以下信息生成10组预测号码。

## 当前信息
- 预测期号：${params.targetIssue}
- 开奖日期：${params.drawDate}
- 当前月份：${params.month}月

## 上期开奖
- 期号：${params.lastIssue}
- 红球：${params.lastRed.join(', ')}
- 蓝球：${params.lastBlue}

## 各方法预测结果
${methodResultsText}

## 统计信息
- 红球热号(最近50期出现≥10次)：${params.hotRed.join(', ')}
- 红球冷号(最近50期出现≤4次)：${params.coldRed.join(', ')}
- 蓝球热号：${params.hotBlue.join(', ')}
- 常见和值范围：${params.sumRange}

## 任务
1. 综合分析各方法的预测结果
2. 生成10组预测号码
3. 每组包含：6个红球(1-33) + 1个蓝球(1-16)
4. 红球必须升序排列，不能重复
5. 10组号码不能完全相同

## 分配策略
- 第1-3组：高置信推荐（多方法交集，共识度高），置信度85-95
- 第4-6组：平衡策略（热码+温码+冷码搭配），置信度75-85
- 第7-8组：趋势追踪（基于近期走势），置信度65-75
- 第9-10组：探索预测（冷号反弹、特殊模式），置信度55-65

## 输出格式
请直接输出JSON格式，不要包含其他文字：
{"predictions":[{"red":[1,5,12,18,25,33],"blue":7,"confidence":92,"strategy":"综合热码+分布规律"},{"red":[3,8,15,22,28,31],"blue":12,"confidence":87,"strategy":"冷热平衡"}]}`;

  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();

    if (data.predictions && Array.isArray(data.predictions)) {
      return data.predictions.map((p: PredictionResult) => ({
        red: p.red.sort((a: number, b: number) => a - b),
        blue: p.blue,
        confidence: p.confidence || 80,
        strategy: p.strategy || '综合分析',
      }));
    }

    throw new Error('API返回格式错误');
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error);
    throw error;
  }
}
