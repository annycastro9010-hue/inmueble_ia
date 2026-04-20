# Estructura del Proyecto: Inmueble IA

Actualizado automáticamente: 20/4/2026, 2:41:30 p. m.

```text
/inmueble_ia
├── .env.example
├── .gitignore
├── ESTRUCTURA_PROYECTO.md
├── legacy_static/
│   ├── index.html
│   ├── main.js
│   ├── package-lock.json
│   ├── package.json
│   ├── stitch_screen.html
│   └── style.css
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.js
├── public/
│   └── assets/
├── README.md
├── scripts/
│   └── update-docs.js
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ai/
│   │   │       └── route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── TourViewer.tsx
│   │   └── ui/
│   └── lib/
│       ├── ai-stager.ts
│       ├── supabase.ts
│       └── video-engine.ts
├── supabase-setup.sql
├── tailwind.config.js
└── tsconfig.json
```

## Notas de Desarrollo
- **src/app**: Contiene las rutas de Next.js.
- **src/lib**: Lógica de APIs (Supabase, AI Staging, etc).
- **src/components**: Componentes de React.
