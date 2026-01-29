/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许跨域请求数据源
  async rewrites() {
    return [
      {
        source: '/api/ssq-data',
        destination: 'http://data.17500.cn/ssq_asc.txt',
      },
    ];
  },
};

module.exports = nextConfig;
