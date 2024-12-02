import { useEffect } from 'react';
import { Languages } from 'lucide-react';
import Cookies from 'js-cookie';

import {
  locales,
  defaultLocale,
  localeNames,
  localeRegex,
} from '@site/config/locale';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

export function LanguageSwitcher() {
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
              setLocaleCookie(locale);
              if (isPathnameContainsLocale(locale)) {
                window.location.reload();
              } else {
                if (locale === defaultLocale) {
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
