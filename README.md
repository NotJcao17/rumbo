# Rumbo 🧭

PWA para conectar turistas del Mundial FIFA 2026 con pequeños negocios locales en la Ciudad de México.

Desarrollado para el track **Fundación Coppel — Cancha justa en el mundial para los negocios turísticos locales**.

[Demo funcional](https://rumbo-orpin.vercel.app)

---

## ¿Qué es Rumbo?

Rumbo permite a los turistas:
- Generar rutas personalizadas según sus preferencias (gastronomía, cultura, compras)
- Consultar fichas de negocios con precios convertidos a su moneda
- Traducir menús físicos de restaurantes usando la cámara del celular

No requiere descarga — funciona directo desde el navegador como PWA.

---

## Stack tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Framework | Next.js 16 + TypeScript (App Router) |
| PWA | @ducanh2912/next-pwa |
| Estilos | Tailwind CSS v4 |
| Internacionalización | next-intl v4 |
| Base de datos | Supabase (PostgreSQL + PostGIS) |
| Mapas | Mapbox GL JS + Directions API |
| OCR y traducción | Gemini Flash |
| Conversión de divisas | Frankfurter API |
| Hosting | Vercel |

---

## Correr el proyecto localmente

### Requisitos
- Node.js 18+
- npm

### Instalación

```bash
git clone https://github.com/NotJcao17/rumbo.git
cd rumbo
npm install
```

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
GEMINI_API_KEY=
```

Solicita los valores al equipo.

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

> El servidor usa webpack (`--webpack`) en lugar de Turbopack por compatibilidad
> con los paquetes instalados. Es esperado que arranque más lento que un proyecto
> Next.js estándar.

## Idiomas soportados para el mvp

| Código | Idioma |
|--------|--------|
| `en` | Inglés (default) |
| `es` | Español |
| `de` | Alemán |

---

## Usuarios de la app

- **Turista extranjero** — genera rutas, traduce menús, convierte precios
- **Turista nacional** — descubre negocios auténticos fuera de zonas turísticas
- **Dueño de negocio** — registra y administra su negocio en la plataforma
- **Administrador** — revisa y aprueba los negocios antes de publicarlos

---

## Licencia

Proyecto desarrollado por Indivisa Tech para hackathon. Abril 2026.
