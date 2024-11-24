import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const { t } = useTranslation('translation', { lng: locale });

  return (
    <div className="w-full">
      <footer className="mx-12 p-4 flex justify-between border-t">
        <div className="flex gap-4">
          <Link to="/terms">{t('terms')}</Link>
          <Link to="/privacy">{t('privacy')}</Link>
        </div>
        <div>©{new Date().getFullYear()} My Company</div>
      </footer>
    </div>
  );
}
