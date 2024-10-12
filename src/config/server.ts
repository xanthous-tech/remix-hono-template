export const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
export const IS_PROD = process.env.NODE_ENV === 'production';
export const APP_STAGE = APP_URL.includes('localhost')
  ? 'development'
  : 'production';
