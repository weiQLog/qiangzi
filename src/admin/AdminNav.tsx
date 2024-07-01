'use client';

import SiteGrid from '@/components/SiteGrid';
import {
  PATH_ADMIN_CONFIGURATION,
  PATH_ADMIN_MAP_PHOTOS,
  checkPathPrefix,
  isPathAdminConfiguration,
} from '@/site/paths';
import { clsx } from 'clsx/lite';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BiCog } from 'react-icons/bi';

export default function AdminNav({
  items,
}: {
  items: {
    label: string,
    href: string,
    count: number,
  }[]
}) {
  const pathname = usePathname();
  const [shouldShowNav, setShouldShowNav] = useState(pathname !== PATH_ADMIN_MAP_PHOTOS);
  useEffect(() => {
    setShouldShowNav(pathname !== PATH_ADMIN_MAP_PHOTOS);
  }, [pathname]);
  return (
    shouldShowNav && <SiteGrid
      contentMain={
        <div className={clsx(
          'flex gap-2 md:gap-4',
          'border-b border-gray-200 dark:border-gray-800 pb-3',
        )}>
          <div className={clsx(
            'flex gap-2 md:gap-4',
            'flex-grow overflow-x-auto',
          )}>
            {items.map(({ label, href, count }) =>
              <Link
                key={label}
                href={href}
                className={clsx(
                  'flex gap-0.5',
                  checkPathPrefix(pathname, href) ? 'font-bold' : 'text-dim',
                )}
              >
                <span>{label}</span>
                <span>({count})</span>
              </Link>)}
          </div>
          <Link
            href={PATH_ADMIN_CONFIGURATION}
            className={isPathAdminConfiguration(pathname)
              ? 'font-bold'
              : 'text-dim'}
          >
            <BiCog
              size={18}
              className="inline-block"
              aria-label="App Configuration"
            />
          </Link>
        </div>
      }
    />
  );
}
