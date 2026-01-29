import { NextResponse } from 'next/server';
import { parseLine } from '@/lib/parser';

const SOURCE_URL = 'http://data.17500.cn/ssq_asc.txt';

// 最新100期数据接口，缓存30分钟
export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, {
      next: { revalidate: 1800 }, // ISR: 30分钟重新验证
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SSQPredictor/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '数据源请求失败', status: response.status },
        { status: 502 }
      );
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    const allData = [];

    for (const line of lines) {
      const record = parseLine(line);
      if (record) allData.push(record);
    }

    if (allData.length === 0) {
      return NextResponse.json(
        { error: '未解析到有效数据' },
        { status: 500 }
      );
    }

    // 只返回最新100期
    const recentData = allData.slice(-100);
    const latest = allData[allData.length - 1];

    const result = {
      total: allData.length,
      returnedCount: recentData.length,
      lastUpdate: new Date().toISOString(),
      latest,
      data: recentData,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('lottery-latest 接口错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
