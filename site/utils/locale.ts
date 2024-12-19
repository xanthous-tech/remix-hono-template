import Cookies from 'js-cookie';

export const localeNames = ['English', '中文'];
export const locales = ['en', 'zh'];
export const defaultLocale = 'en';
export const localeRegex = new RegExp(`/(${locales.join('|')})`);

export function getLocaleFromCookie() {
  const localeCookieJsonStringBase64 =
    Cookies.get('locale') ?? btoa(`"${defaultLocale}"`);
  const localeCookieJsonString = atob(localeCookieJsonStringBase64);
  const locale = JSON.parse(localeCookieJsonString);
  return locale;
}

export function setLocaleCookie(locale: string) {
  const localeCookieJsonString = JSON.stringify(locale);
  const localeCookieJsonStringBase64 = btoa(localeCookieJsonString);
  Cookies.set('locale', localeCookieJsonStringBase64, {
    sameSite: 'lax',
  });
}

export function isPathnameContainsLocale(pathname: string, locale: string) {
  return pathname.startsWith(`/${locale}`);
}

export function isPathnameInDefaultLocale(pathname: string) {
  return pathname.match(localeRegex) === null;
}
