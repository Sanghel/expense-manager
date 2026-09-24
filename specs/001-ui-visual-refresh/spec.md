# Feature Specification: Refresco visual de la UI (acciones con iconos, controles de formulario unificados y tarjetas de cuentas)

**Feature Branch**: `feature/001-ui-visual-refresh` (se entrega en 3 ramas/PRs independientes, una por historia)

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Quiero cambiar varias cosas en la aplicación que no se estan viendo como quiero: 1. Iconos en las acciones del aplicativo en lugar de botones con texto por ejm: sincronizar correos, cargar, descargar, son acciones que se pueden con iconos de botones de lucide. 2. Migrar todos los componentes de formulario a componentes visuales de chakra-ui ya que por ejm el select no estoy segurado pero actualmente creo que es un select nativo, quiero que sea el combobox de chakra por ejm, de igual manera el datepicker de chakra creo que no se esta utilizando, por supuesto con los colores del aplicativo como tal. 3. Las cards de las cuentas no se ven correctamente en la pagina de configuracion buscar una estrategia para cortar el nombre con tooltip y que no se deforme el circulo del icono de la cuenta por ejm. Para todos estos ajustes quiero trabajar en ramas, PRs a develop, cuando apruebe pasar a main y actualizar el release del repositorio"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tarjetas de cuentas legibles en Configuración (Priority: P1)

Como usuario, en la sección "Mis Cuentas" de la página de Configuración quiero ver cada cuenta en una tarjeta ordenada: el icono de la cuenta siempre como un círculo perfecto, el nombre en una sola línea (recortado con "…" si es largo) y el nombre completo visible al pasar el cursor o mantener pulsado, sin que los botones de editar/eliminar ni las etiquetas ("Banco", "Por defecto") desplacen o deformen el contenido.

**Why this priority**: Es un defecto visible hoy (captura: nombres como "Bancolombia Ahorros" o "Dolares en efectivo" parten en dos líneas y el icono se aplasta a óvalo). Es el cambio más acotado y de mayor impacto percibido; se puede entregar solo.

**Independent Test**: Crear cuentas con nombres cortos y muy largos (p. ej. 40+ caracteres), abrir Configuración en móvil y escritorio y verificar que todas las tarjetas tienen la misma estructura, el icono es circular y el nombre largo se recorta y muestra completo en el tooltip.

**Acceptance Scenarios**:

1. **Given** una cuenta con nombre más largo que el ancho disponible, **When** el usuario ve su tarjeta, **Then** el nombre ocupa una sola línea terminada en "…" y el icono conserva forma circular con el mismo tamaño que en las demás tarjetas.
2. **Given** un nombre recortado, **When** el usuario pasa el cursor sobre él (escritorio) o lo mantiene pulsado / enfoca con teclado (móvil / teclado), **Then** aparece un tooltip con el nombre completo.
3. **Given** un nombre que cabe completo, **When** el usuario pasa el cursor, **Then** no se muestra tooltip redundante.
4. **Given** varias cuentas en la misma fila, **When** se muestran, **Then** los botones de editar/eliminar, el tipo de cuenta, la insignia "Por defecto" y el saldo quedan alineados de forma consistente entre tarjetas.

---

### User Story 2 - Acciones con botones de icono (Priority: P2)

Como usuario, quiero que las acciones utilitarias de la aplicación (p. ej. sincronizar correos, cargar/importar, descargar/exportar, refrescar, editar, eliminar) se presenten como botones de icono compactos y reconocibles, con una etiqueta descriptiva al pasar el cursor, en lugar de botones con texto largo que ocupan espacio, sobre todo en móvil.

**Why this priority**: Mejora densidad y limpieza visual de toda la app, pero afecta muchas pantallas y requiere inventario; no bloquea el uso.

**Independent Test**: Recorrer las pantallas con acciones utilitarias (transacciones, configuración/Gmail, exportación, importación de extractos, etc.) y verificar que cada acción se muestra como icono con tooltip, se puede activar con teclado y un lector de pantalla anuncia su nombre.

**Acceptance Scenarios**:

1. **Given** la pantalla con la acción "Sincronizar correos", **When** el usuario la ve, **Then** aparece un botón de icono de sincronización; al pasar el cursor o enfocarlo se muestra "Sincronizar correos".
2. **Given** una acción de icono en curso (p. ej. sincronizando), **When** el usuario la ha pulsado, **Then** el botón muestra un estado de carga y queda deshabilitado hasta terminar, sin cambiar su tamaño.
3. **Given** un usuario que navega con teclado o lector de pantalla, **When** enfoca un botón de icono, **Then** el foco es visible y el nombre accesible describe la acción en español.
4. **Given** una acción principal de creación o confirmación (p. ej. "Nueva Cuenta", "Guardar", confirmar eliminación), **When** se muestra, **Then** conserva su texto (puede llevar icono además).

---

### User Story 3 - Controles de formulario unificados con el sistema de diseño (Priority: P3)

Como usuario, quiero que todos los campos de formulario (selectores, fechas, meses, porcentajes y colores) tengan el mismo aspecto y comportamiento del sistema de diseño de la app, con sus colores, en lugar de controles nativos del navegador que se ven distintos en cada dispositivo. En particular:
- Los selectores deben permitir buscar y filtrar opciones al escribir.
- Las fechas deben elegirse en un calendario desplegable.
- El porcentaje se ajusta con un campo numérico propio de la app.
- El color personalizado se elige con un selector de color de la app, no con el del sistema operativo.

**Why this priority**: Es el cambio más amplio (≈12 selectores y el campo de fecha actuales) y con más riesgo de regresión en formularios que guardan datos; se hace después de los ajustes visuales rápidos.

**Independent Test**: Abrir cada formulario (transacción, recordatorio, cuenta, movimiento entre cuentas, presupuesto, categoría, filtros, exportación, selector de mes, moneda, grupo, frecuencia, chat) y verificar que ningún control nativo del navegador aparece, que se puede buscar dentro de los selectores y que los datos guardados son idénticos a los de antes del cambio.

**Acceptance Scenarios**:

1. **Given** el formulario de nueva transacción, **When** el usuario abre el selector de categoría y escribe "sup", **Then** la lista se filtra a las opciones que contienen ese texto y puede seleccionar con ratón, toque o teclado (flechas + Enter).
2. **Given** un campo de fecha, **When** el usuario lo activa, **Then** se abre un calendario con los colores de la app, en español (meses y días), con semana empezando en lunes, y también puede escribir la fecha manualmente.
3. **Given** un formulario editado con valores existentes, **When** se abre, **Then** cada control nuevo muestra el valor guardado y, al guardar sin cambios, los datos persistidos no cambian.
4. **Given** el tema actual de la app (oscuro), **When** se abre cualquier selector, calendario o selector de color, **Then** los desplegables usan la paleta de la app con contraste suficiente.
5. **Given** un campo obligatorio vacío, **When** se intenta guardar, **Then** el control muestra el estado de error y el mensaje igual que los demás campos.
6. **Given** el formulario de presupuesto con el campo de porcentaje, **When** el usuario escribe o usa los botones de subir/bajar, **Then** el valor queda entre 0 y 100, con paso 1 y el sufijo "%", y el campo vacío sigue significando "sin valor".
7. **Given** el formulario de categoría o de cuenta, **When** el usuario abre el selector de color, **Then** ve las 15 muestras predefinidas actuales y puede elegir un color personalizado con un área de color, un control de tono y un campo hexadecimal, sin que se abra el selector de color del sistema operativo.

---

### Edge Cases

- Nombre de cuenta de una sola palabra muy larga sin espacios (p. ej. "CuentaDeAhorrosProgramadoVivienda2026"): debe recortarse igual, sin desbordar la tarjeta.
- Tarjeta de cuenta con icono emoji vs. icono gráfico vs. sin icono: el círculo mantiene tamaño y forma en todos los casos.
- Saldos muy grandes (p. ej. "COP 1.124.841.000,00"): no deben desbordar la tarjeta.
- Pantallas muy estrechas (≤ 360 px): las tarjetas y los botones de icono siguen siendo pulsables (área táctil mínima de 44×44 px).
- Dispositivos táctiles sin hover:
  - Nombres recortados: el nombre completo se muestra al tocarlo.
  - Botones de icono: tocar ejecuta la acción, así que no se muestra tooltip al tocar. El nombre de la acción sigue disponible para lectores de pantalla y como tooltip con el foco del teclado.
- Selector con lista vacía o búsqueda sin resultados: muestra un mensaje "Sin resultados" en lugar de una lista vacía.
- Selectores con muchas opciones (p. ej. decenas de categorías): se muestran en una lista plana ordenada igual que hoy, y la búsqueda al escribir sustituye a la navegación manual. Agrupar categorías por grupo queda fuera de alcance.
- Color guardado que no es una de las 15 muestras (color personalizado): el selector lo muestra como seleccionado en el modo personalizado y lo conserva sin alterarlo al guardar.
- Porcentaje fuera de rango escrito a mano (p. ej. 150 o -5): se ajusta al límite válido (100 o 0) al salir del campo.
- Fechas límite: selección de fechas futuras/pasadas según lo que ya permite cada formulario; zonas horarias no deben desplazar el día guardado.
- Acción de icono que falla (p. ej. sincronización con error): se muestra la notificación de error existente y el botón vuelve a su estado normal.

## Requirements *(mandatory)*

### Functional Requirements

**Tarjetas de cuentas (Historia 1)**

- **FR-001**: La tarjeta de cuenta en Configuración DEBE mostrar el nombre en una sola línea, recortado con "…" cuando no quepa.
- **FR-002**: Cuando el nombre esté recortado, DEBE mostrarse el nombre completo en un tooltip accesible por cursor, foco de teclado y pulsación en táctil.
- **FR-003**: El contenedor del icono de la cuenta DEBE mantener proporción 1:1 y tamaño fijo, sin encogerse ni deformarse independientemente de la longitud del nombre o del número de etiquetas.
- **FR-004**: Las acciones editar/eliminar de la tarjeta DEBEN ocupar un espacio fijo que no reduzca el icono ni empuje el saldo, y DEBEN tener nombre accesible ("Editar cuenta X", "Eliminar cuenta X").
- **FR-005**: El saldo y las etiquetas (tipo de cuenta, "Por defecto") DEBEN mantenerse legibles y alineados de forma consistente entre tarjetas en móvil y escritorio.

**Acciones con iconos (Historia 2)**

- **FR-006**: Las acciones utilitarias (sincronizar, importar/cargar, exportar/descargar, refrescar, editar, eliminar, copiar, filtrar y similares) DEBEN mostrarse como botones de icono de un único conjunto de iconos consistente (Lucide), en lugar de botones con texto.
- **FR-007**: Todo botón de icono DEBE tener un nombre accesible en español y un tooltip con ese mismo texto, visible al pasar el cursor y al recibir el foco del teclado. En táctil, tocar ejecuta la acción y no muestra tooltip.
- **FR-008**: Los botones de icono DEBEN mostrar estado de carga y deshabilitado durante operaciones asíncronas, sin cambiar de tamaño.
- **FR-009**: Las acciones principales de creación y confirmación, y las destructivas dentro de diálogos de confirmación, DEBEN conservar texto visible.
- **FR-010**: El mismo tipo de acción DEBE usar el mismo icono en toda la aplicación (p. ej. un único icono para "descargar/exportar").

**Controles de formulario (Historia 3)**

- **FR-011**: Todos los selectores de la aplicación DEBEN reemplazarse por el control de selección del sistema de diseño, con búsqueda/filtrado al escribir y navegación completa por teclado.
- **FR-012**: Todos los campos de fecha DEBEN usar un selector de fecha del sistema de diseño con calendario desplegable, en español, semana empezando en lunes, y permitir escritura manual.
- **FR-013**: Los selectores de mes (p. ej. en el dashboard) DEBEN usar un control del sistema de diseño coherente con el selector de fecha.
- **FR-014**: Todos los controles de formulario DEBEN usar los colores y tokens del tema de la app, con contraste suficiente en el modo de color actual (oscuro). Al usar tokens semánticos y no colores fijos, un futuro modo claro no requerirá rehacer los controles.
- **FR-015**: La migración NO DEBE cambiar los valores que se guardan: mismo formato de fecha, mismos identificadores de categoría/cuenta/moneda, mismo comportamiento de valores por defecto y validaciones.
- **FR-016**: Los estados de error, deshabilitado y obligatorio DEBEN mostrarse de forma uniforme en todos los controles.
- **FR-017**: Tras la migración no DEBE quedar ningún control de formulario nativo del navegador visible al usuario. Esto incluye el selector de color del sistema y las flechas nativas de los campos numéricos. La única excepción es el campo de archivo oculto de la importación de extractos, que el usuario nunca ve (se activa desde la zona de arrastrar y soltar).
- **FR-020**: El campo de porcentaje DEBE ser un control numérico del sistema de diseño con botones de subir/bajar, límites de 0 a 100, paso 1 y sufijo "%". DEBE emitir el mismo valor que hoy: número, o "sin valor" si está vacío.
- **FR-021**: El selector de color DEBE ser un control del sistema de diseño con:
  - Las 15 muestras predefinidas actuales.
  - Un modo personalizado con área de color, control de tono y campo hexadecimal.

  DEBE guardar el color en el mismo formato que hoy: hexadecimal `#rrggbb` en minúsculas.

**Entrega (todas las historias)**

- **FR-018**: Cada historia DEBE entregarse en su propia rama creada desde `develop` y su propio PR hacia `develop`, verificable y revertible de forma independiente.
- **FR-019**: Tras la aprobación explícita del dueño del proyecto, los cambios DEBEN promoverse de `develop` a `main` y publicarse como una nueva versión del repositorio (versión, changelog, tag y release).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las tarjetas de cuentas en Configuración muestran el icono circular y el nombre en una línea, con nombres de 1 a 60 caracteres, en anchos de pantalla de 360 px a 1920 px.
- **SC-002**: El 100 % de los nombres recortados muestran el nombre completo vía tooltip por cursor, teclado y toque.
- **SC-003**: El 100 % de las acciones utilitarias inventariadas son botones de icono con nombre accesible y tooltip; ningún botón de icono carece de nombre accesible en una auditoría de accesibilidad.
- **SC-004**: 0 controles de formulario nativos del navegador visibles en la app tras la Historia 3. Hoy hay unos 12 selectores, 1 campo de fecha, 1 campo numérico de porcentaje y 1 selector de color del sistema.
- **SC-005**: Un usuario encuentra y selecciona una categoría escribiendo en el selector en menos de 5 segundos.
- **SC-006**: 0 diferencias en los datos guardados al crear/editar transacciones, recordatorios, cuentas y movimientos antes y después de la migración de formularios.
- **SC-007**: Cada historia llega a `develop` en un PR independiente, y la versión resultante se publica en `main` con su release solo tras aprobación explícita.

## Assumptions

- La Historia 1 se limita a las tarjetas de "Mis Cuentas" en Configuración; si otras vistas reutilizan la misma tarjeta, heredan la corrección.
- "Lucide" se interpreta como el estilo de iconos preferido; se asume que puede obtenerse con la librería de iconos ya presente en el proyecto (que incluye el conjunto Lucide) sin añadir una dependencia nueva. El cambio de conjunto de iconos se aplica a las acciones tocadas en la Historia 2; migrar todos los iconos decorativos de la app queda fuera de alcance.
- Las acciones principales (crear, guardar, confirmar) conservan texto; solo las acciones utilitarias/secundarias pasan a icono.
- "Combobox con búsqueda" aplica a todos los selectores para consistencia; en listas muy cortas (p. ej. frecuencia, moneda) la búsqueda puede estar presente aunque se use poco.
- Formato de fecha mostrado: DD/MM/AAAA; primer día de semana: lunes; idioma español.
- Los componentes del sistema de diseño (Chakra UI v3) cubren select/combobox y selector de fecha en la versión instalada o una actualización menor; si el selector de fecha requiere una dependencia o actualización, se justifica en el plan.
- No hay cambios de base de datos ni de API; es una feature solo de UI.
- La app hoy solo tiene modo oscuro. Esta feature no añade modo claro. Los controles usan tokens semánticos del tema para no bloquearlo en el futuro. El requisito de contraste en claro y oscuro de la constitución (principio V) se cumple sobre el único modo existente.
- El campo de monto (`InputAmount`) ya es un campo de texto del sistema de diseño con formato propio y no muestra controles nativos, así que no se migra.
- Orden de entrega sugerido: Historia 1 → Historia 2 → Historia 3; la release a `main` puede agrupar las tres o hacerse por historia, según decida el dueño del proyecto al aprobar.
