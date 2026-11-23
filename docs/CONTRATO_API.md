# Ficha de Interoperabilidad · Contrato API REST (`smora` ↔ App Móvil)

## Datos generales del contrato
- **Backend de referencia:** [`https://github.com/santiago99-mora/smora.git`](https://github.com/santiago99-mora/smora.git)
- **Protocolo y formato:** `HTTPS` (producción/EAS `preview`) · `JSON` UTF-8
- **Autenticación:** `JWT` (`Bearer`) devuelto en `access_token` y enviado en `Authorization: Bearer <token>`
- **Usuario de prueba (seed automático):**
  - `email`: `demo@gestortareas.app`
  - `password`: `Demo1234!`

---

## Endpoints de Autenticación

### 1. `POST /api/auth/register`
Registra un usuario nuevo y retorna su token inicial.
- **Request:**
```json
{
  "email": "usuario@email.com",
  "password": "mi_password"
}
```
- **Responses:**
  - `201 Created`: `{ "access_token": "<jwt>", "token_type": "bearer", "user": { "id": 2, "email": "usuario@email.com", "created_at": "..." } }`
  - `409 Conflict`: correo ya registrado
  - `422 Unprocessable Entity`: email inválido o contraseña menor a 6 caracteres

### 2. `POST /api/auth/login`
Autentica credenciales existentes.
- **Request:**
```json
{
  "email": "demo@gestortareas.app",
  "password": "Demo1234!"
}
```
- **Responses:**
  - `200 OK`: `{ "access_token": "<jwt>", "token_type": "bearer", "user": { ... } }`
  - `401 Unauthorized`: credenciales inválidas

### 3. `GET /api/auth/me`
Valida la vigencia del JWT guardado al restaurar sesión.
- **Headers:** `Authorization: Bearer <token>`
- **Responses:** `200 OK` (`UserResponse`) · `401 Unauthorized` (token ausente/expirado)

---

## Endpoints de Tareas (Todos requieren `Authorization: Bearer <token>`)

### 4. `GET /api/tasks`
Lista las tareas pertenecientes al usuario autenticado.
- **Response `200 OK`:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Validar login JWT",
    "description": "Comprobar guardado en SecureStore.",
    "priority": "alta",
    "status": "pendiente",
    "created_at": "2026-11-23T12:00:00Z"
  }
]
```

### 5. `POST /api/tasks`
Crea una tarea nueva (`title` obligatorio; `description` y `priority` opcionales).
- **Request:**
```json
{
  "title": "Comprar materiales de oficina",
  "description": "Opcional",
  "priority": "media"
}
```
- **Response `201 Created`:** objeto `TaskResponse` con `status: "pendiente"`.

### 6. `GET /api/tasks/{id}` y `PUT /api/tasks/{id}`
Obtiene el detalle (`GET`) o actualiza una tarea propia (`PUT`). Responde `404 Not Found` si no existe o pertenece a otro usuario.

### 7. `PATCH /api/tasks/{id}/status`
Actualiza el estado de la tarea.
- **Request:**
```json
{
  "status": "resuelta"
}
```
- **Valores permitidos:** `"pendiente"` | `"resuelta"`.

### 8. `DELETE /api/tasks/{id}`
Elimina la tarea del usuario autenticado.
- **Response:** `204 No Content` (cuerpo vacío; el cliente REST no intenta parsear JSON).

---

## Manejo de fallos y contingencia
- **HTTP `401`:** `apiClient` invoca el hook registrado por `AuthContext`, borra el token de `expo-secure-store` y redirige a `/(auth)/login` con aviso visible.
- **Fallo de red / timeout (10 s):** se clasifica como `network` / `timeout` y se muestra `StateFeedback` con botón *Reintentar*.
- **Mock contractual (`EXPO_PUBLIC_USE_MOCK=true` o selector en UI):** replica exactamente estos esquemas y códigos HTTP en memoria para pruebas o defensa si el servidor externo se encontrara caído.
