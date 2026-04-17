# Guía de Contribución

## Flujo de trabajo

1. Fork del repositorio
2. Crear rama desde `develop`: `git checkout -b feature/<issue>-descripcion`
3. Desarrollar y commitear siguiendo Conventional Commits
4. Push y abrir PR hacia `develop`
5. Esperar revisión y merge

## Conventional Commits

```
feat:     nueva funcionalidad
fix:      corrección de bug
docs:     cambios en documentación
refactor: refactorización sin cambio funcional
chore:    mantenimiento (deps, config)
```

## Estándares de código

- TypeScript estricto — sin `any` explícito
- Sin `console.log` en código mergeado
- Server Components por defecto; `'use client'` solo cuando sea necesario
- Validación con Zod en Server Actions
- Componentes UI nuevos en `components/ui/` si son reutilizables

## Estructura de branches

```
main        → producción
develop     → integración
feature/*   → tareas individuales (base: develop)
```

## Variables de entorno

Nunca commitear `.env.local` ni credenciales reales. Usar `.env.example` como referencia.
