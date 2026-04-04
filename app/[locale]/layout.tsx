import '@/app/globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import BottomNav from '@/components/BottomNav';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'es' | 'en' | 'de')) {
    notFound();
  }

  const messages = await getMessages();

  return (
  <html lang={locale}>
    <head>
      <link rel="manifest" href="/manifest.json" />
    </head>
    <body>
      <NextIntlClientProvider messages={messages}>
        {children}
        <BottomNav />
      </NextIntlClientProvider>
    </body>
  </html>
);
}