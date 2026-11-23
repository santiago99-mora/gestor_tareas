# Informe de incidencias · Gestor de tareas

**Estudiante:** Santiago (`santiago99-mora` — completar nombre y apellido)  
**Fecha:** 23/11/2026 (en progreso)  
**Proyecto / rama Git:** `gestor-tareas-debugging` · `https://github.com/santiago99-mora/gestor_tareas.git` · rama `main` (base `73ec2d9`, deps `890aaed`)  
**Entorno (Expo SDK, Android, dispositivo):** Expo SDK `~57.0.0` (`expo@57.0.33`, React Native `0.86.3`, React `19.2.3`), Node `v24.21.0`, dispositivo físico Android con Expo Go  

## Resumen ejecutivo
Se ejecutó la línea base del proyecto (`npm run typecheck` con 0 errores y `npm test` con 2 suites fallidas / 3 tests fallidos de 9) y se levantó la aplicación en un dispositivo físico Android para reproducir las misiones de la guía. Hasta el momento se dejaron registradas **4 incidencias principales y 2 adicionales** (1 reproducida con captura de LogBox en Android, 2 evidenciadas mediante Jest y 3 identificadas en el análisis de código para verificar y corregir en los próximos pasos). Las correcciones y pruebas de regresión finales se encuentran **en curso**.

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
- **Corrección aplicada:** *Pendiente (mover `setLoading(false)` a `finally`).*
- **Prueba de regresión:** *Pendiente (agregar test de pantalla simulando fallo en `fetchTasks(true)`).*
- **Estado:** Pendiente

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
- **Corrección aplicada:** Se actualizó `isValidTaskTitle` a `title.trim().length > 0` en `src/utils/taskValidation.ts` (resta recortar `newTitle.trim()` en `app/index.tsx` en el siguiente paso).
- **Prueba de regresión:** `__tests__/taskValidation.test.ts` (3/3 casos aprobados tras la corrección, rechazando `''` y `'   '`).
- **Estado:** Corregido (validación) · Pendiente trim al guardar en `app/index.tsx`

## Incidencia 4
- **Título de incidencia:** El listado no se actualiza al escribir en el buscador
- **Pasos para reproducir:**
  1. Escribir texto en el campo `"Buscar por nombre..."` sin cambiar la pestaña de estado.
- **Esperado / observado:**
  - *Esperado:* `visibleTasks` se recalcula en cada cambio de `query`.
  - *Observado:* la lista visible permanece congelada hasta que cambia `tasks` o `status`.
- **Herramienta usada (DevTools / consola / test):** Inspección estática de código (pendiente verificación en pantalla tras corregir `taskFilters.ts`).
- **Hipótesis y evidencia:** El cálculo memorizado de tareas filtradas no incluye a `query` como dependencia.
- **Archivo y función involucrada:** `app/index.tsx` → `visibleTasks` (`useMemo`, línea 42).
- **Causa raíz:** Arreglo de dependencias incompleto (`[tasks, status]` en lugar de `[tasks, query, status]`).
- **Corrección aplicada:** *Pendiente.*
- **Prueba de regresión:** *Pendiente (agregar test de pantalla cambiando texto en `testID="search-input"`).*
- **Estado:** Pendiente

## Otras incidencias (opcional)
- **Incidencia 5 — Marcar una tarea como completada no actualiza la UI (`app/index.tsx` → `toggleTask`, líneas 46–52):**
  - *Causa raíz:* muta `found.completed` directamente y pasa la misma referencia a `setTasks(tasks)`.
  - *Estado:* Pendiente (reemplazar por actualización inmutable con `.map(...)` y sumar test de regresión).
- **Incidencia 6 — Al cambiar de filtro queda expandida otra tarjeta (`app/index.tsx` → `FlatList` `keyExtractor`, línea 81):**
  - *Causa raíz:* usa `String(index)` en vez de `item.id`, acoplando el estado local `expanded` de `TaskCard` a la posición visual.
  - *Estado:* Pendiente (cambiar a `(item) => item.id` y sumar test de regresión).

## Pruebas
| Prueba | Antes | Después | Evidencia |
|---|---|---|---|
| Búsqueda | Falla: 2 tests rojos en `taskFilters.test.ts`; en pantalla `useMemo` omite `query`. | `taskFilters.ts` corregido (`taskFilters.test.ts` 4/4); pendiente `query` en `useMemo` de `app/index.tsx`. | Salida Jest antes (2 fallos) y después (`taskFilters.test.ts` PASS). |
| Validación | Falla: 1 test rojo en `taskValidation.test.ts` (`isValidTaskTitle('   ')` retorna `true`). | `taskValidation.ts` corregido (`taskValidation.test.ts` 3/3); pendiente `newTitle.trim()` en `app/index.tsx`. | Salida Jest antes (1 fallo) y después (`taskValidation.test.ts` PASS). |
| Actualización de estado | Sin cobertura automatizada; `toggleTask` muta `tasks` en sitio. | *Pendiente* | Inspección de `app/index.tsx:46-52` (pendiente captura/test). |
| Error de servicio | Dispara `HTTP 503` y banner rojo, pero `loading` queda en `true` y oculta la lista. | *Pendiente* | Captura LogBox Android `Log 2 of 2` (`app/index.tsx:33:20`). |

## Conclusión y control de cambios
- **Commits preliminares registrados:** `73ec2d9` (línea base inicial) · `890aaed` (alineación de dependencias SDK 57).
- **Commit final (hash):** *Pendiente (al concluir correcciones y pruebas).*
- **Mensaje del commit:** *Pendiente.*
- **Qué aprendí y cómo lo aplicaría a mi app final:** *Pendiente al finalizar el taller.*

## Transparencia de uso de asistentes de IA (EDI 2026)
- **Asistente utilizado:** Antigravity (agente de programación).
- **Tipo de consultas realizadas:** análisis del plan del EDI 2026, guía paso a paso para inicialización de Git, resolución de conflictos de dependencias (`ERESOLVE`) en Expo SDK 57, orientación para reproducción de fallos en Android y pre-registro estructurado de incidencias observadas (sin generación ni modificación automática de código fuente de la app hasta esta etapa).
