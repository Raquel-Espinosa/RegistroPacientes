// ╔══════════════════════════════════════════════════════════════════╗
// ║            CONFIGURACIÓN — CLINICA APP                          ║
// ║  Edita este archivo con tu URL de Google Apps Script            ║
// ╚══════════════════════════════════════════════════════════════════╝

const CONFIG = {

  // 1. Pega aquí la URL de tu Google Apps Script desplegado como Web App
  //    Instrucciones en README.md
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx70xrmc9PUa9SLgklAIrXDZAAStchqTSGXjMAxiCwEdBQogM-N_EvUvLF0bf-WR8Vg/exec",

  // 2. Usuarios del sistema (se guardan localmente en localStorage)
  //    El admin puede añadir más usuarios desde la interfaz
  USERS: [
    { user: "admin",     pass: "1234", nombre: "Administrador",     rol: "admin",     especialidad: "" },
    { user: "doctor",    pass: "1234", nombre: "Dr. Carlos Méndez", rol: "doctor",    especialidad: "Medicina General" },
    { user: "recepcion", pass: "1234", nombre: "Laura Torres",      rol: "recepcion", especialidad: "" }
  ],

  // 3. Nombre de la clínica (aparece en la interfaz)
  CLINICA_NOMBRE: "ClinicaApp"
};
