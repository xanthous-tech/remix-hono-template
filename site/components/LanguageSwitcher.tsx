import { useEffect } from 'react';
import { Languages } from 'lucide-react';

import {
  locales,
  defaultLocale,
  localeNames,
  localeRegex,
  getLocaleFromCookie,
  setLocaleCookie,
  isPathnameInDefaultLocale,
  isPathnameContainsLocale,
} from '@site/utils/locale';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  useEffect(() => {
    const locale = getLocaleFromCookie();
    if (
      locale !== defaultLocale &&
      isPathnameInDefaultLocale(window.location.pathname)
    ) {
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
              if (isPathnameContainsLocale(window.location.pathname, locale)) {
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
