import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from '~/components/landing/page-header';

interface HeroProps {
  locale: string;
}

export function Hero({ locale }: HeroProps) {
  const { t } = useTranslation('translation', { lng: locale });

  return (
    <PageHeader>
      <PageHeaderHeading>{t('subtitle')}</PageHeaderHeading>
      <PageHeaderDescription>{t('description')}</PageHeaderDescription>
      <PageActions>
        <Link to="/signin">
          <img
            src={`/locales/${locale}/download_appstore.svg`}
            alt={t('download_appstore')}
          />
        </Link>
      </PageActions>
    </PageHeader>
  );
}
