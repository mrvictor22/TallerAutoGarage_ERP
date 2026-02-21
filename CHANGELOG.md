# Changelog

Registro de cambios significativos del proyecto.

---

## 2026-02-21 — Estrategia Multi-Taller

### Contexto
El sistema pasó de servir a un solo taller (Taller Autogarage) a necesitar soportar múltiples clientes independientes. Se diseñó e implementó una estrategia de branching y deployment que permite a cada taller tener su propia instancia sin duplicar código.

### Cambios realizados

#### Branching por cliente
- Creada rama `deploy/autogarage` para Taller Autogarage
- Creada rama `deploy/autosymas` para Autos y Mas
- `master` queda como source of truth (código compartido)
- Todas las features y fixes se desarrollan en master y se distribuyen a las ramas de talleres

#### Fix crítico: URLs hardcodeadas
- **Archivos modificados:**
  - `src/stores/auth.ts` — Eliminadas 4 ocurrencias de `tallerautogarage.apexcodelabs.com` como fallback en funciones de auth (signUp, resetPassword, updateEmail, signInWithMagicLink)
  - `src/app/api/admin/invite-user/route.ts` — Reemplazado fallback hardcodeado por validación de `NEXT_PUBLIC_SITE_URL`
  - `src/app/api/admin/resend-invite/route.ts` — Mismo fix que invite-user
- **Impacto:** Sin este fix, el segundo taller (Autos y Mas) redirigía usuarios al dominio de Autogarage en flujos de autenticación

#### Nuevos archivos
- `.env.example` — Documenta todas las variables de entorno requeridas por cada deployment de taller (Supabase, site URL, Twilio)
- `scripts/distribute.sh` — Script para automatizar el merge de master hacia todas las ramas `deploy/*`
- `.gitignore` — Agregada excepción para `.env.example`

#### Documentación
- `CLAUDE.md` — Agregada sección completa "Estrategia Multi-Taller" con:
  - Arquitectura de ramas
  - Tabla de talleres activos
  - Reglas de branching y naming convention
  - Workflow de desarrollo
  - Proceso de onboarding de nuevo taller

#### Configuración Vercel (hallazgos)
- Se instaló Vercel CLI y se inspeccionaron ambos proyectos via API
- **Estado encontrado:**
  - Ambos proyectos apuntaban a `master` como production branch (deployan simultáneamente)
  - `taller_autos_y_mas` solo tenía 2 env vars (faltaban SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL, Twilio)
  - `taller-auto-garage-erp` tenía 8 env vars completas
- **La API de Vercel no permite cambiar production branch programáticamente** — requiere cambio manual en dashboard

### Pendiente (acción manual del usuario)

- [ ] Cambiar production branch en Vercel:
  - `taller-auto-garage-erp`: master → `deploy/autogarage`
  - `taller_autos_y_mas`: master → `deploy/autosymas`
- [ ] Agregar `NEXT_PUBLIC_SITE_URL` en ambos proyectos de Vercel:
  - Autogarage: `https://tallerautogarage.apexcodelabs.com`
  - Autos y Mas: `https://autosymas.apexcodelabs.com`
- [ ] Completar env vars faltantes en `taller_autos_y_mas`:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `CRON_SECRET`
  - Variables de Twilio (cuando se active WhatsApp)

---

## 2026-01-27 — Commits anteriores (resumen)

- **feat(orders):** Generación de PDF para órdenes de servicio con Puppeteer
- **fix(pdf):** Compatibilidad con Vercel usando @sparticuz/chromium-min
- **fix(payments):** Permitir a mechanic_lead registrar pagos
- **feat(notifications):** Sistema de notificaciones in-app con recordatorios periódicos
- **feat(dashboard):** Widgets clickeables con navegación a órdenes filtradas
- **fix(dashboard):** Separar ganancias (mano de obra) de repuestos en KPIs
- **fix(users):** Eliminar columnas inexistentes en aprobación de usuarios
