# Informe de incidencias · Gestor de tareas

**Estudiante:** Santiago (`santiago99-mora` — completar nombre y apellido)  
**Fecha:** 23/11/2026 (en progreso)  
**Proyecto / rama Git:** `gestor-tareas-debugging` · `https://github.com/santiago99-mora/gestor_tareas.git` · rama `main` (base `73ec2d9`, deps `890aaed`)  
**Entorno (Expo SDK, Android, dispositivo):** Expo SDK `~57.0.0` (`expo@57.0.33`, React Native `0.86.3`, React `19.2.3`), Node `v24.21.0`, dispositivo físico Android con Expo Go  

## Resumen ejecutivo
Se ejecutó la línea base del proyecto (`npm run typecheck` con 0 errores y `npm test` con 2 suites fallidas / 3 tests fallidos de 9) y se levantó la aplicación en un dispositivo físico Android para reproducir las misiones de la guía. Se detectaron, corrigieron y verificaron con pruebas automatizadas **6 incidencias** (4 principales y 2 adicionales en `src/utils/` y `app/index.tsx`), pasando la suite completa a **5 suites y 16 tests aprobados** (0 fallos de Jest y 0 errores de TypeScript).

## Incidencia 1
- **Título de incidencia:** El indicador de carga queda trabado y vacía la lista tras un error de servicio
- **Pasos para reproducir:**
  1. Abrir la pantalla principal del gestor de tareas con las 5 tareas cargadas.
  2. Presionar el botón **«⚠ Simular error API»**.
- **Esperado / observado:**
  - *Esperado:* mostrar el mensaje de error del servicio, detener el indicador de carga y mantener una vista consistente para reintentar.
  - *Observado:* se muestra el aviso `"No pudimos cargar las tareas. Probá otra vez."` y el error en consola (`HTTP 503`), pero desaparecen las 5 tareas de la pantalla porque `loading` permanece en `true` (`data={loading ? [] : visibleTasks}`).
- **Herramienta usada (DevTools / consola / test):** LogBox de Expo en dispositivo Android (`Log 2 of 2`, captura guardada) e inspección de código.
- **Hipótesis y evidencia:** `loadTasks` solo restablece `loading` dentro del bloque `try`; cuando `fetchTasks(true)` lanza la excepción, la ejecución salta al `catch` sin ejecutar `setLoading(false)`. En la captura de LogBox (`app/index.tsx:33:20`, frame `loadTasks`) se observa la línea `31 setLoading(false);` antes del `catch`.
- **Archivo y función involucrada:** `app/index.tsx` → `loadTasks` (líneas 25–36 y línea 80).
- **Causa raíz:** Falta de bloque `finally` para garantizar `setLoading(false)` tanto en éxito como en error.
- **Corrección aplicada:** Se movió `setLoading(false)` al bloque `finally` en `loadTasks` y se agregó control de solicitud más reciente (`latestRequestId`) para evitar respuestas obsoletas.
- **Prueba de regresión:** `__tests__/TaskManagerScreen.test.tsx` (*«detiene el estado de carga y conserva las tareas visibles ante un error del servicio»*) + `__tests__/taskService.test.ts` (*«lanza error HTTP 503 cuando simulateFailure es true»*).
- **Estado:** Corregido

## Incidencia 2
- **Título de incidencia:** La búsqueda por nombre distingue mayúsculas/minúsculas y no ignora espacios
- **Pasos para reproducir:**
  1. Ejecutar `npm test` (casos de `__tests__/taskFilters.test.ts`), o buscar `'VALIDAR'` / `'  login  '` en el campo `"Buscar por nombre..."`.
- **Esperado / observado:**
  - *Esperado:* encontrar tareas coincidiendo sin importar mayúsculas ni espacios al principio o al final (`1` resultado).
  - *Observado:* `npm test` falla en 2 casos (`Expected length: 1, Received length: 0, Received array: []`).
- **Herramienta usada (DevTools / consola / test):** Jest (`npm test`).
- **Hipótesis y evidencia:** La función de filtrado realiza una comparación literal con `includes` sin normalizar el texto de entrada ni el título. Evidencia: fallos en `__tests__/taskFilters.test.ts` líneas 12 y 15.
- **Archivo y función involucrada:** `src/utils/taskFilters.ts` → `filterTasks` (línea 10).
- **Causa raíz:** `task.title.includes(query)` no aplica `.trim()` ni `.toLowerCase()`.
- **Corrección aplicada:** Se normalizó la consulta con `query.trim().toLowerCase()`, devolviendo `byStatus` cuando queda vacía, y comparando contra `task.title.toLowerCase()`.
- **Prueba de regresión:** `__tests__/taskFilters.test.ts` (4/4 casos aprobados tras la corrección, incluyendo `'VALIDAR'` y `'  login  '`).
- **Estado:** Corregido

## Incidencia 3
- **Título de incidencia:** La validación permite crear tareas compuestas únicamente por espacios
- **Pasos para reproducir:**
  1. Ejecutar `npm test` (`__tests__/taskValidation.test.ts`), o ingresar `'   '` en `"Ej.: Revisar documentación"` y presionar **«Agregar»**.
- **Esperado / observado:**
  - *Esperado:* rechazar un título compuesto solo por espacios (`isValidTaskTitle('   ') === false`).
  - *Observado:* `isValidTaskTitle('   ')` devuelve `true` (`Expected: false, Received: true`).
- **Herramienta usada (DevTools / consola / test):** Jest (`npm test`).
- **Hipótesis y evidencia:** La validación solo comprueba la longitud cruda de la cadena sin eliminar espacios en los extremos. Evidencia: fallo en `__tests__/taskValidation.test.ts` línea 8.
- **Archivo y función involucrada:** `src/utils/taskValidation.ts` → `isValidTaskTitle` (líneas 1–3) y `app/index.tsx` → `addTask` (línea 61).
- **Causa raíz:** Se evalúa `title.length > 0` sin `.trim()`, y `addTask` almacena `newTitle` sin recortar espacios.
- **Corrección aplicada:** Se actualizó `isValidTaskTitle` a `title.trim().length > 0` en `src/utils/taskValidation.ts` y se aplicó `newTitle.trim()` al crear la tarea en `addTask` (`app/index.tsx`).
- **Prueba de regresión:** `__tests__/taskValidation.test.ts` (3/3 casos aprobados tras la corrección, rechazando `''` y `'   '`).
- **Estado:** Corregido

## Incidencia 4
- **Título de incidencia:** El listado no se actualiza al escribir en el buscador
- **Pasos para reproducir:**
  1. Escribir texto en el campo `"Buscar por nombre..."` sin cambiar la pestaña de estado.
- **Esperado / observado:**
  - *Esperado:* `visibleTasks` se recalcula en cada cambio de `query`.
  - *Observado:* la lista visible permanece congelada hasta que cambia `tasks` o `status`.
- **Herramienta usada (DevTools / consola / test):** Inspección estática de código y verificación en componente.
- **Hipótesis y evidencia:** El cálculo memorizado de tareas filtradas no incluye a `query` como dependencia.
- **Archivo y función involucrada:** `app/index.tsx` → `visibleTasks` (`useMemo`, línea 42).
- **Causa raíz:** Arreglo de dependencias incompleto (`[tasks, status]` en lugar de `[tasks, query, status]`).
- **Corrección aplicada:** Se incluyó `query` en el arreglo de dependencias de `useMemo`: `[tasks, query, status]`.
- **Prueba de regresión:** `__tests__/TaskManagerScreen.test.tsx` (*«filtra en vivo al escribir en el buscador sin distinguir mayúsculas ni espacios»*).
- **Estado:** Corregido

## Otras incidencias (opcional)
- **Incidencia 5 — Marcar una tarea como completada no actualiza la UI (`app/index.tsx` → `toggleTask`, líneas 46–52):**
  - *Causa raíz:* mutaba `found.completed` directamente y pasaba la misma referencia a `setTasks(tasks)`.
  - *Corrección aplicada:* actualización inmutable mediante `setTasks((previous) => previous.map(...))`.
  - *Prueba de regresión:* `__tests__/TaskManagerScreen.test.tsx` (*«actualiza la interfaz de forma inmutable al cambiar el estado de una tarea»*).
  - *Estado:* Corregido
- **Incidencia 6 — Al cambiar de filtro queda expandida otra tarjeta (`app/index.tsx` → `FlatList` `keyExtractor`, línea 81):**
  - *Causa raíz:* usaba `String(index)` en vez de `item.id`, acoplando el estado local `expanded` de `TaskCard` a la posición visual.
  - *Corrección aplicada:* cambiado a `keyExtractor={(item) => item.id}`.
  - *Prueba de regresión:* `__tests__/TaskManagerScreen.test.tsx` (*«mantiene la identidad de cada tarjeta expandida al cambiar de pestaña»*).
  - *Estado:* Corregido

## Pruebas
| Prueba | Antes | Después | Evidencia |
|---|---|---|---|
| Búsqueda | Falla: 2 tests rojos en `taskFilters.test.ts`; en pantalla `useMemo` omite `query`. | `taskFilters.ts` y `useMemo` en `app/index.tsx` corregidos (`taskFilters.test.ts` 4/4 y test en `TaskManagerScreen.test.tsx`). | `npm test` PASS (`5/5` suites, `16/16` tests). |
| Validación | Falla: 1 test rojo en `taskValidation.test.ts` (`isValidTaskTitle('   ')` retorna `true`). | `taskValidation.ts` y `newTitle.trim()` en `app/index.tsx` corregidos (`taskValidation.test.ts` 3/3 y test de pantalla). | `npm test` PASS (`5/5` suites, `16/16` tests). |
| Actualización de estado | Sin cobertura automatizada; `toggleTask` muta `tasks` en sitio. | `toggleTask` actualizado de forma inmutable con `.map(...)` y verificado con `toggle-t01`. | `__tests__/TaskManagerScreen.test.tsx` PASS. |
| Error de servicio | Dispara `HTTP 503` y banner rojo, pero `loading` queda en `true` y oculta la lista. | `setLoading(false)` movido a `finally` en `loadTasks` con control `latestRequestId`. | Captura LogBox Android `Log 2 of 2` + `TaskManagerScreen.test.tsx` y `taskService.test.ts` PASS. |

## Conclusión y control de cambios
- **Commits preliminares registrados:** `73ec2d9` (línea base inicial) · `890aaed` (alineación de dependencias SDK 57) · `022bbbe` (corrección de filtros y validaciones).
- **Commit final (hash):** *Completar con el hash luego de subir el commit de cierre de Etapa 1.*
- **Mensaje del commit:** *Completar con el mensaje del commit de cierre de Etapa 1.*
- **Qué aprendí y cómo lo aplicaría a mi app final:** Diferenciar síntoma de causa raíz antes de editar código (por ejemplo: mutación de estado vs. dependencias faltantes en `useMemo`, `finally` en promesas que pueden fallar, e importancia de claves estables por `id` en `FlatList`). En la integración final con backend real (`smora`) aplicaré el mismo manejo explícito de carga/error con `finally`, cancelación de solicitudes y pruebas automatizadas de regresión desde el inicio.

## Transparencia de uso de asistentes de IA (EDI 2026)
- **Asistente utilizado:** Antigravity (agente de programación).
- **Tipo de consultas realizadas:** análisis del plan del EDI 2026, guía paso a paso para inicialización de Git, resolución de conflictos de dependencias (`ERESOLVE`) en Expo SDK 57, diagnóstico de las 6 incidencias de `src/utils/` y `app/index.tsx`, redacción guiada de pruebas de regresión en Jest/RNTL y estructuración del informe técnico.
