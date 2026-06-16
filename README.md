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

## Release

El versionado se hace bumping `package.json` (`"version": "x.y.z"`) y haciendo push a `main`. El workflow de GitHub Actions (`.github/workflows/build-and-push.yml`) hace lo siguiente:

1. Lee la versión de `package.json`.
2. Construye la imagen Docker (linux/amd64) con `pnpm build` (usa `.env` → URLs de producción).
3. La publica en el Zot registry con tres tags:
   - `registry.full4media.com/apps/todo-app:<version>`
   - `registry.full4media.com/apps/todo-app:sha-<short-sha>`
   - `registry.full4media.com/apps/todo-app:latest`
4. Hace commit automático en `asixc/gitops-config` actualizando `apps/base/todo-app/deployment.yaml` con el nuevo tag.
5. FluxCD reconcilia y aplica el cambio en el cluster.

El subtítulo `v<version>` en el header se inyecta en build time desde `package.json` (ver `vite.config.js` y `src/version.js`), por lo que siempre está sincronizado.

### Secrets requeridos en GitHub (repo `asixc/todo-app-front`)

- `REGISTRY_USERNAME`: usuario robot del Zot (ej. `github-actions`).
- `REGISTRY_PASSWORD`: password del robot.
- `GITOPS_TOKEN`: Personal Access Token con scope `repo` sobre `asixc/gitops-config`, para que el workflow pueda hacer commit ahí.

> **Importante:** las URLs de la API en `.env` apuntan a producción (`api.todo.full4media.com`). Para desarrollo local, `pnpm dev` usa automáticamente `.env.development` con `localhost:8080`. No hace falta cambiar nada para cambiar de entorno.
