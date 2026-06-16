# Todo App 
<img width="787" alt="Captura de Pantalla 2024-09-24 a las 17 19 01" src="https://github.com/user-attachments/assets/3c13eb20-917c-48e9-a32f-58855b299b77">

## Desarrollo

Requiere Node 22+ y pnpm 11+.

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo (http://localhost:3000)
pnpm dev

# Build de producción (genera dist/)
pnpm build

# Previsualizar el build
pnpm preview

# Tests
pnpm test
```

### Variables de entorno

Usa `VITE_*` (no `REACT_APP_*`). Hay dos ficheros:

- `.env` — valores de producción.
- `.env.development` — valores para desarrollo local (`http://localhost:8080`).

### Nota sobre pnpm 11 y esbuild

pnpm 11 ejecuta un pre-check antes de cada comando que falla con `ERR_PNPM_IGNORED_BUILDS: esbuild@0.27.7` porque bloquea el `postinstall` de esbuild por defecto. El binario ya está disponible en `node_modules/.pnpm/esbuild@0.27.7/.../bin/esbuild` y funciona, así que basta con:

```bash
pnpm config set ignore-scripts true
```

Es un setting global de pnpm, no requiere cambios al proyecto. Sin esto, `pnpm dev`, `pnpm build` y `pnpm test` abortan con exit 1.
