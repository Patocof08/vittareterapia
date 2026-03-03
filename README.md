# Vittare Terapia

Plataforma de marketplace de terapia que conecta psicólogos con clientes en Latinoamérica.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Storage, Realtime)
- **Deploy:** Vercel

## Correr localmente

```sh
# 1. Clonar el repositorio
git clone <URL_DEL_REPO>

# 2. Entrar al directorio
cd vittareterapia

# 3. Instalar dependencias
npm install

# 4. Crear archivo de variables de entorno
cp .env.example .env.local
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY

# 5. Iniciar servidor de desarrollo
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en `localhost:8080` |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Linter ESLint |
