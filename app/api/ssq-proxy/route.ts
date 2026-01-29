import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 代理请求双色球历史数据，解决跨域问题
export async function GET() {
  const url = 'http://data.17500.cn/ssq_asc.txt';

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SSQPredictor/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '获取数据失败' },
        { status: response.status }
      );
    }

    const text = await response.text();

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
      },
    });
  } catch (error) {
    console.error('数据获取错误:', error);
    return NextResponse.json(
      { error: '数据源连接失败，请稍后重试' },
      { status: 502 }
    );
  }
}
