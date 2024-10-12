import { Link, useLocation } from '@remix-run/react';
import { cn } from '~/lib/utils';

export function SiteHeader() {
  const { pathname } = useLocation();

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 max-w-screen-2xl items-center'>
        {/* Main Nav */}
        <div className='mr-4 flex'>
          <Link to='/' className='mr-6 flex items-center space-x-2'>
            {/* <Icons.logo className="h-6 w-6" /> */}
            <span className='hidden font-bold sm:inline-block'>Template</span>
          </Link>
          <nav className='flex items-center gap-6 text-sm'>
            <Link
              to='/'
              className={cn(
                'transition-colors hover:text-stone-500',
                pathname === '/' ? 'text-stone-700' : 'text-stone-400',
              )}
            >
              Home
            </Link>
            {/* <Link
              to="/xhs"
              className={cn(
                'transition-colors hover:text-stone-500',
                pathname?.startsWith('/xhs')
                  ? 'text-stone-700'
                  : 'text-stone-400',
              )}
            >
              小红书
            </Link> */}
          </nav>
        </div>
        {/* TODO: Mobile Nav */}
      </div>
    </header>
  );
}
