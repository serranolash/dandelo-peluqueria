const LS_SERVICES_KEY = 'dandelo_services';
const LS_STYLISTS_KEY = 'dandelo_stylists';
const LS_APPOINTMENTS_KEY = 'dandelo_appointments';
const ADMIN_PASSWORD_DEFAULT = 'dandelo123';

const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const adminPasswordInput = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');

const stylistsListEl = document.getElementById('stylistsList');
const addStylistBtn = document.getElementById('addStylistBtn');

const servicesAdminListEl = document.getElementById('servicesAdminList');
const addServiceBtn = document.getElementById('addServiceBtn');

const appointmentsListEl = document.getElementById('appointmentsList');
const filterOnlyPendingCheckbox = document.getElementById('filterOnlyPending');

const saveAdminChangesBtn = document.getElementById('saveAdminChangesBtn');
const resetDataBtn = document.getElementById('resetDataBtn');

const adminModal = document.getElementById('adminModal');
const adminModalTitle = document.getElementById('adminModalTitle');
const adminModalMessage = document.getElementById('adminModalMessage');
const adminModalCloseBtn = document.getElementById('adminModalCloseBtn');

const defaultStylists = [
  { id: 1, name: 'Danilo Dandelo' }
];

const defaultServices = [
  { id: 1, name: 'Corte Caballero', duration: 45, price: 15000 },
  { id: 2, name: 'Corte Dama', duration: 60, price: 20000 },
  { id: 3, name: 'Tinte Completo', duration: 90, price: 40000 },
  { id: 4, name: 'Barba & Perfilado', duration: 30, price: 12000 }
];

function getData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo LocalStorage', key, e);
    return fallback;
  }
}

function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error guardando LocalStorage', key, e);
  }
}

let stylists = getData(LS_STYLISTS_KEY, defaultStylists);
let services = getData(LS_SERVICES_KEY, defaultServices);
let appointments = [];

// 🔄 Cargar turnos desde el backend
function loadAppointmentsFromBackend() {
  fetch("https://web-production-b923d.up.railway.app/")
    .then(r => r.json())
    .then(data => {
      appointments = (data || []).map(a => ({
        ...a,
        status: a.status || 'pendiente',
      }));
      renderAppointmentsAdmin();
    })
    .catch(err => {
      console.error("Error cargando turnos del backend", err);
      appointments = [];
      renderAppointmentsAdmin();
    });
}

function openAdminModal(title, message) {
  adminModalTitle.textContent = title;
  adminModalMessage.textContent = message;
  adminModal.classList.remove('hidden');
}

function closeAdminModal() {
  adminModal.classList.add('hidden');
}

function renderStylistsAdmin() {
  stylistsListEl.innerHTML = '';
  if (!stylists.length) {
    stylistsListEl.innerHTML = '<p class="text-[11px] text-neutral-500">No hay peluqueros cargados.</p>';
    return;
  }
  stylists.forEach(st => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 border border-neutral-800 rounded-xl px-3 py-2 bg-neutral-950/80';
    row.innerHTML = `
      <input data-id="${st.id}" data-field="name" type="text"
        class="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-400"
        value="${st.name}">
      <button data-id="${st.id}" data-action="delete"
        class="text-[11px] px-2 py-1 rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10">
        Eliminar
      </button>
    `;
    stylistsListEl.appendChild(row);
  });
}

function renderServicesAdmin() {
  servicesAdminListEl.innerHTML = '';
  if (!services.length) {
    servicesAdminListEl.innerHTML = '<p class="text-[11px] text-neutral-500">No hay servicios cargados.</p>';
    return;
  }
  services.forEach(s => {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-12 gap-2 border border-neutral-800 rounded-xl px-3 py-2 bg-neutral-950/80 items-center';
    row.innerHTML = `
      <input data-id="${s.id}" data-field="name" type="text"
        class="col-span-5 bg-neutral-950 border border-neutral-700 rounded-xl px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400"
        value="${s.name}" placeholder="Nombre">
      <input data-id="${s.id}" data-field="duration" type="number" min="0"
        class="col-span-2 bg-neutral-950 border border-neutral-700 rounded-xl px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400"
        value="${s.duration}" placeholder="Min">
      <input data-id="${s.id}" data-field="price" type="number" min="0"
        class="col-span-3 bg-neutral-950 border border-neutral-700 rounded-xl px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400"
        value="${s.price}" placeholder="Precio">
      <button data-id="${s.id}" data-action="delete"
        class="col-span-2 text-[11px] px-2 py-1 rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10">
        Eliminar
      </button>
    `;
    servicesAdminListEl.appendChild(row);
  });
}

function renderAppointmentsAdmin() {
  appointmentsListEl.innerHTML = '';
  if (!appointments.length) {
    appointmentsListEl.innerHTML = '<p class="text-[11px] text-neutral-500">Todavía no hay turnos tomados desde el cliente.</p>';
    return;
  }

  const onlyPending = filterOnlyPendingCheckbox && filterOnlyPendingCheckbox.checked;

  const sorted = [...appointments].sort((a, b) => {
    const da = new Date(a.dateISO || a.date);
    const db = new Date(b.dateISO || b.date);
    if (da.getTime() === db.getTime()) {
      return (a.time || '').localeCompare(b.time || '');
    }
    return da - db;
  });

  sorted.forEach(appt => {
    if (onlyPending && appt.status !== 'pendiente') return;

    const dateObj = new Date(appt.dateISO || appt.date);
    const dateStr = isNaN(dateObj.getTime())
      ? (appt.dateISO || '')
      : dateObj.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

    const statusLabel =
      appt.status === 'confirmado'
        ? '<span class="text-emerald-300 font-semibold">Confirmado</span>'
        : appt.status === 'cancelado'
          ? '<span class="text-red-300 font-semibold">Cancelado</span>'
          : '<span class="text-amber-300 font-semibold">Pendiente</span>';

    const row = document.createElement('div');
    row.className = 'border border-neutral-800 rounded-xl p-3 bg-neutral-950/90 flex flex-col gap-1';
    row.innerHTML = `
      <div class="flex items-center justify-between gap-2 text-[11px]">
        <div class="font-semibold text-neutral-100">${appt.clientName || 'Sin nombre'}</div>
        <div class="text-neutral-400">${dateStr} • ${(appt.time || '')} hs</div>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-neutral-300">
        <span>Servicio: <span class="text-neutral-100">${appt.serviceName || '-'}</span></span>
        <span>Estilista: <span class="text-neutral-100">${appt.stylistName || '-'}</span></span>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-neutral-300">
        <span>Contacto: <span class="font-mono text-neutral-100">${appt.clientContact || '-'}</span></span>
        <span>Precio: <span class="text-amber-300">$${(appt.price || 0).toLocaleString('es-AR')}</span></span>
      </div>
      <div class="flex items-center justify-between mt-1 text-[11px]">
        <div>Estado: ${statusLabel}</div>
        <div class="flex gap-1">
          <button data-id="${appt.id}" data-action="confirm"
            class="px-2 py-1 rounded-lg border border-emerald-400/60 text-emerald-200 hover:bg-emerald-400/10 text-[10px]">
            Confirmar
          </button>
          <button data-id="${appt.id}" data-action="cancel"
            class="px-2 py-1 rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10 text-[10px]">
            Cancelar
          </button>
        </div>
      </div>
    `;
    appointmentsListEl.appendChild(row);
  });

  if (!appointmentsListEl.innerHTML.trim()) {
    appointmentsListEl.innerHTML = '<p class="text-[11px] text-neutral-500">No hay turnos que coincidan con el filtro actual.</p>';
  }
}

function initLogin() {
  loginBtn.addEventListener('click', () => {
    const pwd = adminPasswordInput.value.trim();
    if (!pwd) {
      openAdminModal('Contraseña requerida', 'Ingresá la contraseña para continuar.');
      return;
    }
    if (pwd !== ADMIN_PASSWORD_DEFAULT) {
      openAdminModal('Acceso denegado', 'La contraseña ingresada no es correcta.');
      return;
    }
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    // 🔄 Ahora, cuando entra el admin, cargamos turnos desde el backend
    loadAppointmentsFromBackend();
  });
}

function initStylistsAdmin() {
  addStylistBtn.addEventListener('click', () => {
    const nextId = stylists.length ? Math.max(...stylists.map(s => s.id)) + 1 : 1;
    stylists.push({ id: nextId, name: 'Nuevo peluquero' });
    renderStylistsAdmin();
  });

  stylistsListEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    stylists = stylists.filter(st => st.id !== id);
    renderStylistsAdmin();
  });

  stylistsListEl.addEventListener('input', (e) => {
    const input = e.target;
    const id = Number(input.getAttribute('data-id'));
    const field = input.getAttribute('data-field');
    const sty = stylists.find(s => s.id === id);
    if (!sty) return;
    sty[field] = input.value;
  });
}

function initServicesAdmin() {
  addServiceBtn.addEventListener('click', () => {
    const nextId = services.length ? Math.max(...services.map(s => s.id)) + 1 : 1;
    services.push({
      id: nextId,
      name: 'Nuevo servicio',
      duration: 30,
      price: 0
    });
    renderServicesAdmin();
  });

  servicesAdminListEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    services = services.filter(s => s.id !== id);
    renderServicesAdmin();
  });

  servicesAdminListEl.addEventListener('input', (e) => {
    const input = e.target;
    const id = Number(input.getAttribute('data-id'));
    const field = input.getAttribute('data-field');
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    if (field === 'duration' || field === 'price') {
      svc[field] = Number(input.value) || 0;
    } else {
      svc[field] = input.value;
    }
  });
}

function initAppointmentsAdmin() {
  if (filterOnlyPendingCheckbox) {
    filterOnlyPendingCheckbox.addEventListener('change', () => {
      renderAppointmentsAdmin();
    });
  }

  appointmentsListEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    const action = btn.getAttribute('data-action');
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;

    if (action === 'confirm') {
      appt.status = 'confirmado';
    } else if (action === 'cancel') {
      appt.status = 'cancelado';
    }
    setData(LS_APPOINTMENTS_KEY, appointments);
    renderAppointmentsAdmin();
  });
}

function initActions() {
  saveAdminChangesBtn.addEventListener('click', () => {
    setData(LS_STYLISTS_KEY, stylists);
    setData(LS_SERVICES_KEY, services);
    setData(LS_APPOINTMENTS_KEY, appointments);
    openAdminModal('Cambios guardados', 'Los datos se guardaron correctamente en este dispositivo.');
  });

  resetDataBtn.addEventListener('click', () => {
    stylists = [...defaultStylists];
    services = [...defaultServices];
    setData(LS_STYLISTS_KEY, stylists);
    setData(LS_SERVICES_KEY, services);
    renderStylistsAdmin();
    renderServicesAdmin();
    openAdminModal('Datos restaurados', 'Se restauraron los peluqueros y servicios por defecto. Los turnos agendados no se modificaron.');
  });

  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) closeAdminModal();
  });
  adminModalCloseBtn.addEventListener('click', closeAdminModal);
}

document.addEventListener('DOMContentLoaded', () => {
  renderStylistsAdmin();
  renderServicesAdmin();
  // 👇 ya no llamamos a renderAppointmentsAdmin aquí,
  // porque ahora se hace después de login con los datos del backend:
  // renderAppointmentsAdmin();
  initLogin();
  initStylistsAdmin();
  initServicesAdmin();
  initAppointmentsAdmin();
  initActions();
});
