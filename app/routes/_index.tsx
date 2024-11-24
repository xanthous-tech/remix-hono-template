import { useLoaderData } from 'react-router';

import i18n from '~/lib/i18next.server';
import { localeCookie } from '~/lib/cookie.server';

import { Hero } from '~/components/landing/Hero';
import { LandingHeader } from '~/components/landing/LandingHeader';
import { Footer } from '~/components/landing/Footer';

export const loader = async ({ request }) => {
  const locale = await i18n.getLocale(request);
  const t = await i18n.getFixedT(request);

  return Response.json(
    {
      locale,
      title: t('title'),
      subtitle: t('subtitle'),
    },
    {
      headers: {
        'Set-Cookie': await localeCookie.serialize(locale),
      },
    },
  );
};

export const meta = ({ data }) => {
  return [
    { title: data.title },
    { name: 'description', content: data.subtitle },
  ];
};

export default function Index() {
  const { locale } = useLoaderData<typeof loader>();
  return (
    <div className="relative flex min-h-screen flex-col items-center gap-4">
      <LandingHeader locale={locale} />
      <Hero locale={locale} />
      <div className="flex flex-col items-center gap-4 pb-20">
        <img
          className="max-w-full sm:max-w-[70vw] md:max-w-[50vw]"
          src={`/images/${locale}/preview1.png`}
          alt="App Preview"
        />
      </div>
      <Footer locale={locale} />
    </div>
  );
}
