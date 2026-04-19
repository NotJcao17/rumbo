'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const locale = pathname.split('/')[1] || 'en'

  const esMapa    = pathname === `/${locale}` || pathname === `/${locale}/map`
  const esEscaner = pathname.includes('/scanner')
  const esConfig  = pathname.includes('/settings')

  return (
    <nav
      className="fixed bottom-3 left-3 right-3 glass rounded-2xl shadow-[0_8px_32px_rgba(8,145,178,0.16),0_2px_8px_rgba(0,0,0,0.08)] z-40"
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="flex items-center h-16 max-w-md mx-auto px-2">

        {/* Mapa */}
        <Link href={`/${locale}`} className="relative flex flex-col items-center gap-0.5 flex-1 text-center py-2">
          {esMapa && (
            <span className="absolute inset-1 rounded-xl bg-primary/10 transition-all duration-300" />
          )}
          <span className={`relative transition-all duration-300 ${esMapa ? '' : 'opacity-50'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill={esMapa ? '#0891B2' : '#AAAAAA'}
              />
            </svg>
          </span>
          <span className={`text-[10px] font-semibold truncate w-full transition-colors duration-200 ${esMapa ? 'text-primary' : 'text-gray-400'}`}>
            {t('mapa')}
          </span>
        </Link>

        {/* Escáner — botón central destacado */}
        <Link href={`/${locale}/scanner`} className="relative flex flex-col items-center gap-0.5 flex-1 text-center py-2">
          {esEscaner && (
            <span className="absolute inset-1 rounded-xl bg-primary/10 transition-all duration-300" />
          )}
          <span className={`relative transition-all duration-300 ${esEscaner ? '' : 'opacity-50'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15.2C10.2 15.2 8.8 13.8 8.8 12S10.2 8.8 12 8.8 15.2 10.2 15.2 12 13.8 15.2 12 15.2zM12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7zM2 13H4V11H2V13zM20 13H22V11H20V13zM11 2V4H13V2H11zM11 20V22H13V20H11z"
                fill={esEscaner ? '#0891B2' : '#AAAAAA'}
              />
            </svg>
          </span>
          <span className={`text-[10px] font-semibold truncate w-full transition-colors duration-200 ${esEscaner ? 'text-primary' : 'text-gray-400'}`}>
            {t('escaner')}
          </span>
        </Link>

        {/* Configuración */}
        <Link href={`/${locale}/settings`} className="relative flex flex-col items-center gap-0.5 flex-1 text-center py-2">
          {esConfig && (
            <span className="absolute inset-1 rounded-xl bg-primary/10 transition-all duration-300" />
          )}
          <span className={`relative transition-all duration-300 ${esConfig ? '' : 'opacity-50'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.02 7.02 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                fill={esConfig ? '#0891B2' : '#AAAAAA'}
              />
            </svg>
          </span>
          <span className={`text-[10px] font-semibold truncate w-full transition-colors duration-200 ${esConfig ? 'text-primary' : 'text-gray-400'}`}>
            {t('config')}
          </span>
        </Link>

      </div>
    </nav>
  )
}
