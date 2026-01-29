import { NextResponse } from 'next/server';
import { parseLine } from '@/lib/parser';

const SOURCE_URL = 'http://data.17500.cn/ssq_asc.txt';

// 全量历史数据接口，缓存1小时
export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, {
      next: { revalidate: 3600 }, // ISR: 1小时重新验证
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
    const data = [];

    for (const line of lines) {
      const record = parseLine(line);
      if (record) data.push(record);
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: '未解析到有效数据' },
        { status: 500 }
      );
    }

    const latest = data[data.length - 1];

    const result = {
      total: data.length,
      lastUpdate: new Date().toISOString(),
      latest,
      data,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('lottery-data 接口错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
