# Adeco Next.js Proxy API (Compat Layer)

Este paquete genera **endpoints Next.js** por cada archivo PHP del backend legado.
Cada ruta **preserva exactamente** la estructura JSON original porque proxy-a la respuesta del PHP en el servidor.

## Configuración
1) Copiá `src/` dentro de tu proyecto Next.js (App Router).
2) Agregá `.env.local` con:
   LEGACY_PHP_BASE=http://localhost/api

> Reemplazá por la URL real donde vive tu PHP.

## Cómo se mapean las rutas
- `LEGACY_PHP_BASE` + `/ruta/en/php` se expone como `/api/<ruta-en-next>`
- Ejemplos:
  - `get-access-hist.php` → `/api/get-access-hist`
  - `folder/tools.php` → `/api/folder-tools`

Se generaron **51** endpoints a partir de tu `api.zip`.

## Por qué este enfoque
- Evita CORS (mismo dominio), manteniendo **exacto** el JSON y los códigos HTTP.
- Te permite migrar internamente cada endpoint a Node/SQL cuando quieras, **sin cambiar el frontend**.
- Cuando re-escribas un PHP, solo reemplazá el `proxy` por la consulta en MySQL desde Node.

## Re-escritura progresiva (opcional)
Dentro de cada `route.ts`, podés sustituir la función `proxy` por una versión nativa que use `mysql2/promise` y devuelva **el mismo JSON**.
