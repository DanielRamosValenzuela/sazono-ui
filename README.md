# Sazono UI

Frontend principal de Sazono construido con Next.js.

## Enfoque

- App Router usando `src/app`
- estructura FSD pragmatica bajo `src/`
- separacion temprana entre experiencia `qr`, `staff` y `admin`
- routing localizado con `next-intl` para `es` y `en`

## Estructura inicial

```text
src/
  app/
  views/
  widgets/
  features/
  entities/
  shared/
```

## Documentacion

- [UI docs](D:\Programacion\Sazono\sazono-ui\docs\README.md)

## Scripts

```bash
npm run dev
npm run lint
```

## Variables de entorno

- copia `.env.example`
- define `API_BASE_URL` apuntando al backend monolítico
- el navegador no habla directo al backend; usa `/api/backend/*` y Next hace proxy server-side

## Rutas base

- `/es`
- `/es/admin`
- `/es/qr`
- `/es/staff`
- `/en`
- `/en/admin`
- `/en/qr`
- `/en/staff`
