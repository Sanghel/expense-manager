# Seguridad de Tokens y Cookies

## Tokens visibles en el navegador (DevTools → Network → Cookies)

Lo que se ve en las peticiones es completamente normal y seguro:

| Cookie | Propósito | ¿Es peligroso? |
|--------|-----------|----------------|
| `__Host-next-auth.csrf-token` | Token CSRF de NextAuth para proteger formularios de autenticación | ✅ Seguro — es un hash público diseñado para ser visible |
| `__Secure-next-auth.callback-url` | URL de retorno después del login | ✅ Seguro — solo contiene la URL del dashboard |
| `__Secure-next-auth.session-token` | Sesión del usuario cifrada | ✅ Seguro — formato JWE (A256GCM), cifrado con `NEXTAUTH_SECRET`, ilegible sin la clave del servidor |

### ¿Qué hay dentro del `session-token`?

El token empieza con `eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0` que decodifica a `{"alg":"dir","enc":"A256GCM"}`. Es un **JSON Web Encryption (JWE)**, no un JWT simple. Su contenido (user ID, email) está **cifrado**, no solo codificado en base64. Sin `NEXTAUTH_SECRET` es imposible leerlo.

El `INSFORGE_API_KEY` (clave de admin) **nunca aparece en el navegador** — solo existe en `lib/insforge-admin.ts` que es server-side exclusivamente.

---

## Variables de entorno y su exposición

| Variable | Exposición | Usado en |
|----------|------------|---------|
| `NEXTAUTH_SECRET` | Server-only | Cifrar/descifrar la session cookie |
| `NEXTAUTH_URL` | Server-only | Configuración de NextAuth |
| `GOOGLE_CLIENT_ID` | Server-only | OAuth flow |
| `GOOGLE_CLIENT_SECRET` | Server-only | OAuth flow |
| `INSFORGE_API_KEY` | Server-only | `lib/insforge-admin.ts` |
| `NEXT_PUBLIC_INSFORGE_URL` | Pública (URL del servidor) | Base URL, no sensible |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Pública (visible en JS bundle) | **No se usa en código activo** — candidata a eliminar |
| `ANTHROPIC_API_KEY` | Server-only | `lib/actions/ai.actions.ts` |

### Acción recomendada: remover `NEXT_PUBLIC_INSFORGE_ANON_KEY`

El cliente público (`lib/insforge.ts`) que usa esta variable no está importado en ningún componente activo. Pasos para limpiar:

1. En Vercel dashboard → Settings → Environment Variables: eliminar `NEXT_PUBLIC_INSFORGE_ANON_KEY`
2. Eliminar o refactorizar `lib/insforge.ts` (el archivo no tiene uso activo)
3. No es necesario reemplazar con nada, ya que todos los accesos a datos van por `insforgeAdmin`

---

## Conclusión

La arquitectura actual es segura:
- La clave de admin de InsForge (`INSFORGE_API_KEY`) nunca sale del servidor
- Los tokens de NextAuth en cookies son cifrados/firmados y seguros
- La única mejora posible es eliminar `NEXT_PUBLIC_INSFORGE_ANON_KEY` que está sin uso
