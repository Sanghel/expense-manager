# Quickstart / Validación: Refresco visual de la UI

**Feature**: [spec.md](./spec.md) · Contratos: [contracts/ui-components.md](./contracts/ui-components.md) · Formatos: [data-model.md](./data-model.md)

## Prerrequisitos

- `pnpm install` y un `.env.local` válido (sesión con Google, InsForge)
- Datos de prueba en una cuenta de desarrollo:
  - Al menos 5 cuentas, una con nombre de 40+ caracteres, una con una palabra larga sin espacios y una con saldo ≥ 1.000.000.000.
  - Categorías con grupos.
  - Un recordatorio mensual.

## Quality gates (cada PR)

```bash
pnpm type-check
```

```bash
pnpm lint
```

```bash
pnpm build
```

Luego, en otra terminal:

```bash
pnpm dev
```

Validar en el navegador integrado a **375×812 (móvil)** y **escritorio**.

---

## PR 1: Historia 1 (tarjetas de cuentas): `feature/NNN-account-cards-truncate`

1. Abre **Configuración → Cuentas**.
2. Comprueba cada tarjeta:
   - El icono es un círculo perfecto del mismo tamaño en todas las tarjetas.
   - El nombre ocupa una línea con "…" si no cabe.
   - Editar y eliminar quedan alineados a la derecha.
3. Pasa el cursor sobre un nombre truncado y luego enfócalo con Tab. En ambos casos el tooltip muestra el nombre completo.
4. En móvil, toca un nombre truncado: aparece el tooltip. Toca fuera: se cierra.
5. Pasa el cursor sobre un nombre corto: **no** aparece tooltip.
6. El saldo gigante no desborda la tarjeta.
7. En Chrome DevTools, en Accessibility, los botones se leen como "Editar cuenta {nombre}" y "Eliminar cuenta {nombre}".

## PR 2: Historia 2 (acciones con iconos): `feature/NNN-icon-actions`

1. Transacciones:
   - Exportar e Importar se ven como iconos y muestran tooltip con hover y foco.
   - "Nueva Transacción" conserva el texto.
   - Sincronizar correos se ve como icono. Al pulsarlo, el botón muestra spinner, queda deshabilitado y no cambia de tamaño.
2. Recorre las pantallas del inventario (R4 en [research.md](./research.md)): presupuestos, calendario, consejos, chat, préstamos, metas, configuración (Cron y Gmail). Todas las acciones utilitarias son iconos con tooltip.
3. Busca iconos distintos para la misma acción. No debe haber ninguno.
4. Con el teclado, recorre una pantalla con Tab: el foco es visible en cada botón de icono.
5. Lanza un error de acción (p. ej. sincronizar sin conexión): aparece el toaster de error y el botón vuelve a su estado normal.

## PR 3: Historia 3 (formularios): `feature/NNN-chakra-form-controls`

1. **Nueva transacción**:
   - Categoría: escribe "sup", la lista se filtra, y seleccionas con ↓ + Enter.
   - Cuenta: prueba la búsqueda sin tildes (escribe "credito" y debe encontrar "Crédito").
2. **Fecha**:
   - Abre el calendario: está en español y la semana empieza en lunes.
   - Selecciona un día y comprueba que el campo muestra DD/MM/AAAA.
   - Escribe `31/12/2026` a mano.
   - Limpia el campo.
3. **Mes (dashboard)**: cambia de mes con el selector y con las flechas. Los datos del dashboard se actualizan igual que antes.
4. **Recordatorio**: los selectores de tipo, día y mes y la frecuencia son combobox. Al editar un recordatorio existente, cada control muestra el valor guardado.
5. **Filtros y exportación de transacciones**, el **selector de moneda en Configuración** y el **selector del chat**: todos son combobox.
6. **Búsqueda sin resultados**: el combobox muestra "Sin resultados".
6a. **Porcentaje (presupuesto)**:
   - Usa los botones + y −.
   - Escribe `150` y sal del campo: queda en `100`.
   - Vacía el campo: se guarda sin valor.
   - No aparecen flechas nativas del navegador.
6b. **Color (categoría y cuenta)**:
   - Abre el selector: aparecen las 15 muestras. Elige una: el popover se cierra y el cuadro cambia de color.
   - Abre la sección personalizada, mueve el área o el tono, o escribe `#12ab34` en el campo hex: no se abre el selector del sistema.
   - Edita una categoría con un color personalizado ya guardado: se muestra ese color y, al guardar sin tocarlo, sigue siendo el mismo.
7. **Campo obligatorio vacío**: al guardar, se ve el estado de error uniforme.
8. **Invariante de datos (SC-006)**: con DevTools → Network, crea y edita una transacción, un recordatorio, una cuenta, un movimiento, un presupuesto con porcentaje y una categoría con color. El payload enviado tiene los mismos campos y formatos que en `develop` antes del cambio (fecha `YYYY-MM-DD`, ids uuid, moneda ISO, porcentaje numérico y color `#rrggbb` en minúsculas).
9. **Sin controles nativos**: en la consola, sobre cada pantalla con formularios, ejecuta lo siguiente. El resultado esperado es `0`:
   ```js
   document.querySelectorAll('select, input[type=date], input[type=month], input[type=number], input[type=color]').length
   ```

---

## Release (tras aprobación explícita del dueño)

1. Crea la rama `chore/bump-vX.Y.Z` con la versión en `package.json` y una entrada en `CHANGELOG.md`, y abre el PR a `develop`.
2. Abre el PR `develop → main` y **espera la aprobación manual** del dueño.
3. Crea el tag `vX.Y.Z` sobre `main` y publica el release en GitHub (`gh release create`).
