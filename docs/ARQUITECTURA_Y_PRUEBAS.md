# Arquitectura, Seguridad, Accesibilidad y Matriz de Pruebas

## 1. Mapa de arquitectura por capas
- **`app/_layout.tsx` y `app/index.tsx`:** envuelven la app en `SafeAreaProvider` + `AuthProvider` y protegen rutas (`!token` → `/(auth)/login`; `token` → `/(app)/tasks`).
- **`src/context/AuthContext.tsx`:** restaura sesión al arranque desde `expo-secure-store`, valida vigencia con `GET /api/auth/me` (conservando resiliencia si inicia offline y cerrando sesión si devuelve `401`) y expone `signIn`, `signUp`, `signOut` y cambio de modo API/Mock.
- **`src/services/apiClient.ts`:** cliente `fetch` centralizado con `AbortController`, timeout de 45 s, parseo de errores FastAPI (`detail`), soporte `204 No Content`, inyección de `Authorization: Bearer` y callback global `401`.
- **`src/services/taskService.ts`:** adapta `ApiTask` (`id: number`, `status: 'pendiente' | 'resuelta'`, `description: string | null`) al modelo de interfaz `Task` (`id: string`, `completed: boolean`, `description: string`).
- **`src/components/`:** componentes reutilizables (`TaskCard`, `StatusTabs`, `StateFeedback`) con JSDoc/TSDoc y atributos de accesibilidad.
- **`src/theme/theme.ts`:** tokens centralizados del tema oscuro de alto contraste (`COLORS`, `MONO_FONT`, `RADII`) compartidos entre pantallas y componentes.

## 2. Revisión de accesibilidad aplicada
- **Áreas táctiles:** controles `check` y `expandButton` en `TaskCard` ampliados con `hitSlop` a ≥ 48 dp efectivos; botones principales y pestañas con `minHeight` entre 42 y 48 dp.
- **Etiquetas semánticas:** `accessibilityRole`, `accessibilityLabel` contextual por tarea (incluyendo borrado: *«Eliminar tarea <título>»*), `accessibilityState` (`selected`, `checked`, `expanded`, `disabled`) y `accessibilityRole="alert"` en errores.
- **Claves visuales no dependientes solo de color:** tarjetas de estado (`StateFeedback`) muestran etiqueta explícita (`SIN CONEXIÓN`, `ERROR DE SERVIDOR`, `SIN RESULTADOS`), y las tareas combinan tilde, tachado y texto de estado (`Pendiente` / `Completada`).
- **Teclado:** `KeyboardAvoidingView`, `keyboardShouldPersistTaps="handled"`, `returnKeyType="done"` y `onSubmitEditing` en formularios.

## 3. Matriz de pruebas automatizadas (`npm test`)

| Suite | Cobertura principal | Estado |
|---|---|---|
| `__tests__/apiClient.test.ts` | Header `Authorization`, `204 No Content`, hook `401` y error `network`. | PASS (4 tests) |
| `__tests__/LoginScreen.test.tsx` | Validación previa, envío de credenciales y error `401` no bloqueante. | PASS (2 tests) |
| `__tests__/authValidation.test.ts` | Formato de email, longitud mínima de clave y confirmación. | PASS (2 tests) |
| `__tests__/TaskManagerScreen.test.tsx` | Búsqueda en vivo, `PATCH` toggle, error 503, estado sin red, `keyExtractor` por `id` y alta válida. | PASS (5 tests) |
| `__tests__/taskService.test.ts` | `GET /api/tasks`, `POST`, `PATCH /status`, `DELETE` y compatibilidad mock 503. | PASS (4 tests) |
| `__tests__/TaskCard.test.tsx` | Toggle y expansión de detalle en tarjeta. | PASS (2 tests) |
| `__tests__/taskFilters.test.ts` | Case-insensitive, trim y filtro por estado. | PASS (4 tests) |
| `__tests__/taskValidation.test.ts` | Rechazo de vacío, solo espacios y aceptación con trim. | PASS (3 tests) |

Total verificado: **8 suites, 26 pruebas aprobadas** y **0 errores de TypeScript** (`npm run typecheck`).
