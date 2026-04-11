// ═══════════════════════════════════════════════
//  CLINICA APP — JavaScript principal
// ═══════════════════════════════════════════════

// ── Estado global ──
let currentUser = null;
let allPacientes = [];
let currentPacienteId = null;

// ── Helpers localStorage de usuarios ──
function getUsers() {
  const stored = localStorage.getItem('clinica_users');
  return stored ? JSON.parse(stored) : CONFIG.USERS;
}
function saveUsers(users) {
  localStorage.setItem('clinica_users', JSON.stringify(users));
}

// ── Inicialización ──
window.addEventListener('DOMContentLoaded', () => {
  const stored = sessionStorage.getItem('clinica_session');
  if (stored) {
    currentUser = JSON.parse(stored);
    startApp();
  }
});

// ── LOGIN ──
function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const users = getUsers();
  const found = users.find(u => u.user === user && u.pass === pass);
  if (found) {
    currentUser = found;
    sessionStorage.setItem('clinica_session', JSON.stringify(found));
    document.getElementById('login-error').classList.add('hidden');
    startApp();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

function doLogout() {
  sessionStorage.removeItem('clinica_session');
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

// ── Iniciar app ──
function startApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Actualizar sidebar
  const initials = currentUser.nombre.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('sidebar-name').textContent = currentUser.nombre;
  const roles = { admin: 'Administrador', doctor: 'Médico / Especialista', recepcion: 'Recepción' };
  document.getElementById('sidebar-role').textContent = roles[currentUser.rol] || currentUser.rol;

  // Ocultar nav items según rol
  document.querySelectorAll('[data-roles]').forEach(el => {
    const allowed = el.getAttribute('data-roles').split(',');
    if (!allowed.includes(currentUser.rol)) el.style.display = 'none';
  });

  showPage('pacientes');
  cargarPacientes();
}

// ── NAVEGACIÓN ──
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + name).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById('nav-' + name.split('-')[0]);
  if (nav) nav.classList.add('active');

  if (name === 'usuarios') renderUsuarios();
}

// ════════════════════════════════════════════
//  GOOGLE SHEETS API (via Apps Script)
// ════════════════════════════════════════════

async function sheetRequest(params) {
  const url = CONFIG.APPS_SCRIPT_URL;
  try {
    const res = await fetch(url + '?' + new URLSearchParams({ ...params, t: Date.now() }));
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Error conectando con Google Sheets:', e);
    throw e;
  }
}

async function sheetPost(params) {
  const url = CONFIG.APPS_SCRIPT_URL;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Error en POST a Google Sheets:', e);
    throw e;
  }
}

// ════════════════════════════════════════════
//  PACIENTES
// ════════════════════════════════════════════

async function cargarPacientes() {
  const bar = document.getElementById('loading-bar');
  bar.classList.remove('hidden');
  try {
    const data = await sheetRequest({ action: 'getPacientes' });
    allPacientes = data.pacientes || [];
    renderPacientes(allPacientes);
  } catch (e) {
    allPacientes = [];
    renderPacientes([]);
    bar.textContent = '⚠ No se pudo conectar con Google Sheets. Verifica la URL en config.js';
  } finally {
    bar.classList.add('hidden');
  }
}

function renderPacientes(lista) {
  const grid = document.getElementById('pacientes-grid');
  const empty = document.getElementById('empty-state');
  if (!lista.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = lista.map(p => {
    const sexoClass = p.sexo === 'Masculino' ? 'm' : p.sexo === 'Femenino' ? 'f' : 'o';
    const initials = p.nombre ? p.nombre.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : '??';
    const estadoPill = { 'Activo':'pill-green','En seguimiento':'pill-blue','Alta':'pill-gray','Inactivo':'pill-gray' }[p.estado] || 'pill-gray';
    const alergiaTag = p.alergias ? `<span class="pill pill-red">⚠ Alergias</span>` : '';
    return `
      <div class="paciente-card" onclick="abrirExpediente('${p.id}')">
        <div class="card-top">
          <div class="avatar ${sexoClass}">${initials}</div>
          <div>
            <div class="card-name">${p.nombre}</div>
            <div class="card-id">${p.id} · ${p.cedula || ''}</div>
          </div>
        </div>
        <div class="card-pills">
          ${p.edad ? `<span class="pill pill-gray">${p.edad} años</span>` : ''}
          ${p.sangre ? `<span class="pill pill-blue">${p.sangre}</span>` : ''}
          <span class="pill ${estadoPill}">${p.estado || 'Activo'}</span>
          ${alergiaTag}
        </div>
      </div>`;
  }).join('');
}

function filterPacientes() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const filtrados = allPacientes.filter(p =>
    (p.nombre || '').toLowerCase().includes(q) ||
    (p.id || '').toLowerCase().includes(q) ||
    (p.cedula || '').toLowerCase().includes(q)
  );
  renderPacientes(filtrados);
}

// ── Guardar nuevo paciente ──
async function guardarPaciente() {
  const campos = { nombre:'f-nombre', nacimiento:'f-nacimiento', sexo:'f-sexo', cedula:'f-cedula' };
  let validos = true;
  Object.entries(campos).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.style.borderColor = 'var(--danger)'; validos = false; }
    else el.style.borderColor = '';
  });
  if (!validos) {
    mostrarError('form-error', 'Completa los campos obligatorios (*)');
    return;
  }

  const id = 'P-' + Date.now().toString(36).toUpperCase();
  const paciente = {
    action: 'addPaciente',
    id, nombre: v('f-nombre'), nacimiento: v('f-nacimiento'), edad: v('f-edad'),
    sexo: v('f-sexo'), cedula: v('f-cedula'), telefono: v('f-telefono'),
    telEmergencia: v('f-tel-emergencia'), email: v('f-email'), direccion: v('f-direccion'),
    sangre: v('f-sangre'), estado: v('f-estado'), alergias: v('f-alergias'),
    antecedentes: v('f-antecedentes'), medicamentos: v('f-medicamentos'),
    fechaRegistro: new Date().toLocaleString('es-MX')
  };

  try {
    document.getElementById('form-error').classList.add('hidden');
    await sheetPost(paciente);
    document.getElementById('form-success').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('form-success').classList.add('hidden');
      limpiarFormulario();
      cargarPacientes();
      showPage('pacientes');
    }, 1500);
  } catch (e) {
    mostrarError('form-error', 'Error al guardar. Verifica la URL del Apps Script en config.js');
  }
}

function limpiarFormulario() {
  ['f-nombre','f-nacimiento','f-edad','f-cedula','f-telefono','f-tel-emergencia',
   'f-email','f-direccion','f-alergias','f-antecedentes','f-medicamentos'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-sexo').value = '';
  document.getElementById('f-sangre').value = '';
  document.getElementById('f-estado').value = 'Activo';
}

// ── Calcular edad ──
function calcEdad() {
  const val = document.getElementById('f-nacimiento').value;
  if (!val) return;
  const diff = Date.now() - new Date(val).getTime();
  const edad = Math.floor(diff / (1000*60*60*24*365.25));
  document.getElementById('f-edad').value = edad + ' años';
}

// ════════════════════════════════════════════
//  EXPEDIENTE
// ════════════════════════════════════════════

async function abrirExpediente(id) {
  currentPacienteId = id;
  showPage('expediente');
  const paciente = allPacientes.find(p => p.id === id);
  if (!paciente) return;

  const sexoClass = paciente.sexo === 'Masculino' ? 'm' : paciente.sexo === 'Femenino' ? 'f' : 'o';
  const initials = paciente.nombre.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const estadoPill = { 'Activo':'pill-green','En seguimiento':'pill-blue','Alta':'pill-gray','Inactivo':'pill-gray' }[paciente.estado] || 'pill-gray';

  const alergiaHTML = paciente.alergias ? `
    <div class="exp-alergias">
      ⚠ <strong>Alergias:</strong> ${paciente.alergias}
    </div>` : '';

  const canAdd = ['admin','doctor'].includes(currentUser.rol);

  document.getElementById('expediente-content').innerHTML = `
    <div class="expediente-header">
      <div class="avatar-lg ${sexoClass}">${initials}</div>
      <div style="flex:1">
        <div class="exp-name">${paciente.nombre}</div>
        <div class="exp-meta">
          <span class="pill pill-gray">${paciente.edad || ''}</span>
          ${paciente.sangre ? `<span class="pill pill-blue">${paciente.sangre}</span>` : ''}
          <span class="pill ${estadoPill}">${paciente.estado || 'Activo'}</span>
          <span class="pill pill-gray">${paciente.sexo || ''}</span>
        </div>
        <div style="font-size:13px; color:var(--text-2)">
          ${paciente.cedula ? `<strong>ID:</strong> ${paciente.cedula}` : ''}
          ${paciente.telefono ? ` · ${paciente.telefono}` : ''}
        </div>
        ${paciente.antecedentes ? `<div style="font-size:13px;color:var(--text-2);margin-top:6px"><strong>Antecedentes:</strong> ${paciente.antecedentes}</div>` : ''}
        ${paciente.medicamentos ? `<div style="font-size:13px;color:var(--text-2);margin-top:2px"><strong>Medicamentos:</strong> ${paciente.medicamentos}</div>` : ''}
        ${alergiaHTML}
      </div>
    </div>

    <div class="entradas-header">
      <h3>Historial Clínico</h3>
      ${canAdd ? `<button class="btn-primary" style="width:auto" onclick="openModal()">+ Añadir entrada</button>` : ''}
    </div>
    <div id="entradas-list"><div class="loading-bar">Cargando historial...</div></div>
  `;

  try {
    const data = await sheetRequest({ action: 'getEntradas', pacienteId: id });
    const entradas = (data.entradas || []).reverse();
    renderEntradas(entradas);
  } catch (e) {
    document.getElementById('entradas-list').innerHTML = '<div class="loading-bar">⚠ No se pudo cargar el historial</div>';
  }
}

function renderEntradas(entradas) {
  const el = document.getElementById('entradas-list');
  if (!entradas.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Sin entradas clínicas aún</p></div>';
    return;
  }
  el.innerHTML = entradas.map(e => {
    const pillPrio = { 'Normal':'pill-gray','Importante':'pill-amber','Urgente':'pill-red' }[e.prioridad] || 'pill-gray';
    return `
      <div class="entrada-card ${e.prioridad || 'Normal'}">
        <div class="entrada-meta">
          <div class="avatar-sm" style="width:30px;height:30px;font-size:11px">${(e.medico||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
          <div>
            <div class="entrada-doctor">${e.medico || 'Desconocido'}</div>
            <div class="entrada-fecha">${e.especialidad || ''}</div>
          </div>
          <span class="pill pill-blue" style="margin-left:4px">${e.tipo || ''}</span>
          <span class="pill ${pillPrio}">${e.prioridad || 'Normal'}</span>
          <span class="entrada-fecha" style="margin-left:auto">${e.fecha || ''}</span>
        </div>
        <div class="entrada-texto">${e.texto || ''}</div>
      </div>`;
  }).join('');
}

// ── Modal nueva entrada ──
function openModal() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('e-texto').value = '';
  document.getElementById('e-tipo').value = 'Consulta general';
  document.getElementById('e-prioridad').value = 'Normal';
  document.getElementById('modal-error').classList.add('hidden');
}

function closeModal(e) {
  if (!e || e.target.id === 'modal-overlay') {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
}

async function guardarEntrada() {
  const texto = document.getElementById('e-texto').value.trim();
  if (!texto) {
    mostrarError('modal-error', 'Las observaciones son obligatorias');
    return;
  }

  const entrada = {
    action: 'addEntrada',
    pacienteId: currentPacienteId,
    tipo: v('e-tipo'),
    prioridad: v('e-prioridad'),
    texto,
    medico: currentUser.nombre,
    especialidad: currentUser.especialidad || '',
    fecha: new Date().toLocaleString('es-MX')
  };

  try {
    await sheetPost(entrada);
    closeModal();
    // Recargar entradas
    const data = await sheetRequest({ action: 'getEntradas', pacienteId: currentPacienteId });
    renderEntradas((data.entradas || []).reverse());
  } catch (e) {
    mostrarError('modal-error', 'Error al guardar. Verifica la conexión con Google Sheets.');
  }
}

// ════════════════════════════════════════════
//  USUARIOS
// ════════════════════════════════════════════

function renderUsuarios() {
  const users = getUsers();
  const roles = { admin:'Administrador', doctor:'Médico / Especialista', recepcion:'Recepción' };
  document.getElementById('users-tbody').innerHTML = users.map(u => `
    <tr>
      <td><strong>${u.nombre}</strong><br><span style="color:var(--text-3);font-size:12px;font-family:monospace">${u.user}</span></td>
      <td><span class="pill pill-blue">${roles[u.rol] || u.rol}</span></td>
      <td><span style="font-family:monospace;font-size:13px;color:var(--text-3)">${u.pass}</span></td>
      <td>${u.especialidad || '—'}</td>
    </tr>
  `).join('');
}

function addUser() {
  const nombre = document.getElementById('nu-nombre').value.trim();
  const user   = document.getElementById('nu-user').value.trim();
  const pass   = document.getElementById('nu-pass').value.trim();
  const rol    = document.getElementById('nu-rol').value;
  const esp    = document.getElementById('nu-especialidad').value.trim();
  if (!nombre || !user || !pass) { alert('Completa nombre, usuario y contraseña'); return; }

  const users = getUsers();
  if (users.find(u => u.user === user)) { alert('Ese nombre de usuario ya existe'); return; }
  users.push({ nombre, user, pass, rol, especialidad: esp });
  saveUsers(users);
  renderUsuarios();
  ['nu-nombre','nu-user','nu-pass','nu-especialidad'].forEach(id => document.getElementById(id).value = '');
}

// ════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════

function v(id) { return document.getElementById(id).value; }

function mostrarError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}
