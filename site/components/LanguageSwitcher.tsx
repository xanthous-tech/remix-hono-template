import { Languages } from 'lucide-react';
import Cookies from 'js-cookie';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useEffect } from 'react';

export function LanguageSwitcher() {
  const localeNames = ['English', '中文'];
  const locales = ['en', 'zh'];
  const defaultLocale = 'en';
  const localeRegex = new RegExp(`/(${locales.join('|')})`);

  function getLocaleFromCookie() {
    const localeCookieJsonStringBase64 =
      Cookies.get('locale') ?? btoa(`"${defaultLocale}"`);
    const localeCookieJsonString = atob(localeCookieJsonStringBase64);
    const locale = JSON.parse(localeCookieJsonString);
    return locale;
  }

  function setLocaleCookie(locale: string) {
    const localeCookieJsonString = JSON.stringify(locale);
    const localeCookieJsonStringBase64 = btoa(localeCookieJsonString);
    Cookies.set('locale', localeCookieJsonStringBase64, {
      sameSite: 'lax',
    });
  }

  function isPathnameContainsLocale(locale: string) {
    return window.location.pathname.startsWith(`/${locale}`);
  }

  function isPathnameInDefaultLocale() {
    return window.location.pathname.match(localeRegex) === null;
  }

  useEffect(() => {
    const locale = getLocaleFromCookie();
    console.log(locale);
    if (locale !== defaultLocale && isPathnameInDefaultLocale()) {
      window.location.href = `/${locale}${window.location.pathname.replace(
        localeRegex,
        '',
      )}`;
    }
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-9 px-0">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale, index) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => {
              console.log(locale);
              setLocaleCookie(locale);
              if (isPathnameContainsLocale(locale)) {
                window.location.reload();
              } else {
                if (locale === defaultLocale) {
                  console.log(window.location.href);
                  console.log(window.location.pathname);
                  // remove last locale component from the URL
                  window.location.href = `${window.location.href.replace(
                    localeRegex,
                    '',
                  )}`;
                } else {
                  if (window.location.pathname === '/') {
                    window.location.href = `/${locale}`;
                  } else {
                    window.location.href = `/${locale}${window.location.pathname.replace(
                      localeRegex,
                      '',
                    )}`;
                  }
                }
              }
            }}
          >
            {localeNames[index]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
