import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/utils';
import { Button } from '@shared/components/ui/button';

import { LanguageSwitcher } from './LanguageSwitcher';

interface SiteHeaderProps {
  locale: string;
}

export function LandingHeader({ locale }: SiteHeaderProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation('translation', { lng: locale });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Main Nav */}
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            {/* <Icons.logo className="h-6 w-6" /> */}
            <span className="font-bold inline-block">{t('title')}</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/"
              className={cn(
                'transition-colors hover:text-stone-500',
                pathname === '/' ? 'text-stone-700' : 'text-stone-400',
              )}
            >
              {t('home')}
            </Link>
            <Link
              to="/faq"
              className={cn(
                'transition-colors hover:text-stone-500',
                pathname.startsWith('/faq')
                  ? 'text-stone-700'
                  : 'text-stone-400',
              )}
            >
              {t('faq')}
            </Link>
          </nav>
        </div>
        {/* TODO: Mobile Nav */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            <LanguageSwitcher />
            {/* <Button asChild>
              <Link
                to="/signin"
                // target="_blank"
                // rel="noreferrer"
              >
                {t('signin')}
              </Link>
            </Button> */}
          </nav>
        </div>
      </div>
    </header>
  );
}
