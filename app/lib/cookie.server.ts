import { createCookie } from 'react-router';

export const localeCookie = createCookie('locale', {
  secure: false,
});
