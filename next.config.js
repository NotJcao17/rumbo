const withPWA = require('@ducanh2912/next-pwa').default;
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(withNextIntl({
  // aquí irán otras configuraciones de Next.js más adelante
}));

module.exports = nextConfig;