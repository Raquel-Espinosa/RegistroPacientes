# ClinicaApp — Registro de Pacientes

App web para registro clínico multiprofesional. Los datos se guardan directamente en **Google Sheets** mediante Google Apps Script. Funciona 100% desde el navegador, sin servidor propio.

---

## Estructura del proyecto

```
clinica-app/
├── index.html          ← App principal
├── css/
│   └── style.css       ← Estilos
├── js/
│   ├── config.js       ← ⚙ CONFIGURACIÓN (editar antes de usar)
│   └── app.js          ← Lógica de la aplicación
├── Code.gs             ← Script para Google Apps Script (backend)
└── README.md
```

---

## Paso 1 — Configurar Google Apps Script (backend)

Este es el paso más importante: conecta la app con tu Google Sheets.

1. Ve a [https://script.google.com](https://script.google.com) e inicia sesión con tu cuenta de Google
2. Haz clic en **"Nuevo proyecto"**
3. Borra el código que aparece por defecto
4. Pega **todo el contenido** del archivo `Code.gs` de este proyecto
5. En el menú superior ve a **Implementar → Nueva implementación**
6. En "Tipo" selecciona **Aplicación web**
7. Configura:
   - **Descripción**: ClinicaApp
   - **Ejecutar como**: Yo (tu cuenta de Google)
   - **Quién tiene acceso**: Cualquier persona
8. Haz clic en **Implementar**
9. Acepta los permisos que solicite Google
10. **Copia la URL** que aparece (algo como `https://script.google.com/macros/s/ABC.../exec`)

> ⚠️ La primera vez Google crea automáticamente un Google Sheets nuevo en tu Drive llamado **"ClinicaApp — Base de Datos"** con las hojas `Pacientes` y `Entradas` ya configuradas.

---

## Paso 2 — Pegar la URL en la app

Abre el archivo `js/config.js` y reemplaza `TU_ID_AQUI` con la URL copiada:

```javascript
APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec",
```

---

## Paso 3 — Subir a GitHub Pages

1. Crea un repositorio en [https://github.com](https://github.com) (puede ser público o privado)
2. Sube todos los archivos **excepto `Code.gs`** (ese va en Apps Script, no en GitHub)
3. Ve a **Settings → Pages** en tu repositorio
4. En "Source" selecciona la rama `main` y carpeta `/ (root)`
5. Haz clic en **Save**
6. En 1-2 minutos tu app estará disponible en:
   `https://TU-USUARIO.github.io/TU-REPO/`

---

## Usuarios del sistema

Los usuarios se configuran en `js/config.js` y se guardan en el navegador. El administrador puede añadir más desde la interfaz.

| Usuario    | Contraseña | Rol                    |
|------------|------------|------------------------|
| admin      | 1234       | Administrador          |
| doctor     | 1234       | Médico / Especialista  |
| recepcion  | 1234       | Recepción (solo lectura)|

> **Importante**: Cambia las contraseñas antes de usar en producción.

---

## Roles y permisos

| Función                         | Admin | Médico | Recepción |
|---------------------------------|:-----:|:------:|:---------:|
| Ver lista de pacientes          |  ✓   |   ✓   |     ✓     |
| Registrar nuevo paciente        |  ✓   |   ✓   |           |
| Ver expediente completo         |  ✓   |   ✓   |     ✓     |
| Añadir entradas clínicas        |  ✓   |   ✓   |           |
| Gestionar usuarios              |  ✓   |        |           |

---

## Google Sheets — Estructura de las hojas

### Hoja `Pacientes`
| Columna | Descripción |
|---------|-------------|
| ID | Identificador único (P-xxxxx) |
| Nombre | Nombre completo |
| Fecha Nacimiento | Fecha |
| Edad | Texto calculado |
| Sexo | Masculino / Femenino / Otro |
| Cedula | Número de identificación |
| Telefono | Teléfono de contacto |
| Tel Emergencia | Teléfono de emergencia |
| Email | Correo electrónico |
| Direccion | Dirección |
| Tipo Sangre | A+, B-, O+, etc. |
| Estado | Activo / En seguimiento / Alta / Inactivo |
| Alergias | Lista separada por comas |
| Antecedentes | Texto libre |
| Medicamentos | Texto libre |
| Fecha Registro | Fecha y hora de registro |

### Hoja `Entradas`
| Columna | Descripción |
|---------|-------------|
| ID Entrada | Identificador único (E-xxxxx) |
| Paciente ID | ID del paciente relacionado |
| Tipo | Tipo de consulta |
| Prioridad | Normal / Importante / Urgente |
| Texto | Observaciones y resultados |
| Medico | Nombre del médico que registró |
| Especialidad | Especialidad del médico |
| Fecha | Fecha y hora del registro |

---

## Notas de seguridad

- Esta app usa **seguridad del lado del cliente** (los usuarios y contraseñas están en config.js). Es adecuada para uso interno en redes de confianza.
- Para un entorno con mayor seguridad, considera mover la autenticación al Apps Script y usar roles protegidos desde el backend.
- No subas datos reales de pacientes a repositorios públicos de GitHub.
- Cumple con las normativas de privacidad médica aplicables en tu país (HIPAA, LFPDPPP, RGPD, etc.).

---

## Soporte y personalización

Para añadir campos, cambiar el nombre de la clínica, o ajustar los colores edita:
- `js/config.js` — configuración general
- `css/style.css` — colores y estilos (modifica las variables CSS al inicio del archivo)
