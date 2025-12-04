const LS_SERVICES_KEY = 'dandelo_services';
const LS_STYLISTS_KEY = 'dandelo_stylists';
const LS_APPOINTMENTS_KEY = 'dandelo_appointments';
const ADMIN_PASSWORD_DEFAULT = 'dandelo123';

// 👉 URL del backend en Railway
const API_BASE = "https://web-production-b923d.up.railway.app";

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

// Limpieza de turnos y estadísticas
const cleanupBeforeInput = document.getElementById('cleanupBefore');
const cleanupBtn = document.getElementById('cleanupBtn');

const statsMonthInput = document.getElementById('statsMonth');
const statsSummaryEl = document.getElementById('statsSummary');
const exportStatsCsvBtn = document.getElementById('exportStatsCsv');
let statsChart = null; // instancia de Chart.js

const saveAdminChangesBtn = document.getElementById('saveAdminChangesBtn');
const resetDataBtn = document.getElementById('resetDataBtn');

const adminModal = document.getElementById('adminModal');
const adminModalTitle = document.getElementById('adminModalTitle');
const adminModalMessage = document.getElementById('adminModalMessage');
const adminModalCloseBtn = document.getElementById('adminModalCloseBtn');

// Galería (admin)
const galleryTitleInput  = document.getElementById('galleryTitleInput');
const galleryImageInput  = document.getElementById('galleryImageInput');
const galleryAddBtn      = document.getElementById('galleryAddBtn');
const galleryAdminListEl = document.getElementById('galleryAdminList');

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
let galleryItems = [];

// 🔄 Cargar turnos desde el backend
function loadAppointmentsFromBackend() {
  return fetch(`${API_BASE}/api/appointments`)
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(data => {
      appointments = (data || []).map(a => ({
        ...a,
        status: a.status || 'pendiente',
      }));
      renderAppointmentsAdmin();
      updateStatsFromUI();   // 👈 recalcula el resumen
    })
    .catch(err => {
      console.error("Error cargando turnos del backend", err);
      appointments = [];
      renderAppointmentsAdmin();
      updateStatsFromUI();
    });
}

// 🔄 Cargar servicios desde backend
function loadServicesFromBackend() {
  return fetch(`${API_BASE}/api/services`)
    .then(r => r.json())
    .then(data => {
      services = data && data.length ? data : defaultServices;
      setData(LS_SERVICES_KEY, services); // caché local opcional
      renderServicesAdmin();
    })
    .catch(err => {
      console.error("Error cargando servicios del backend", err);
      services = getData(LS_SERVICES_KEY, defaultServices);
      renderServicesAdmin();
    });
}

// 🔄 Cargar estilistas desde backend
function loadStylistsFromBackend() {
  return fetch(`${API_BASE}/api/stylists`)
    .then(r => r.json())
    .then(data => {
      stylists = data && data.length ? data : defaultStylists;
      setData(LS_STYLISTS_KEY, stylists);
      renderStylistsAdmin();
    })
    .catch(err => {
      console.error("Error cargando estilistas del backend", err);
      stylists = getData(LS_STYLISTS_KEY, defaultStylists);
      renderStylistsAdmin();
    });
}

// 🔄 Cargar galería desde backend (admin)
function loadGalleryFromBackend() {
  if (!galleryAdminListEl) return Promise.resolve();

  return fetch(`${API_BASE}/api/gallery`)
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      galleryItems = Array.isArray(data) ? data : [];
      renderGalleryAdmin();
    })
    .catch(err => {
      console.error('Error cargando galería del backend', err);
      galleryItems = [];
      renderGalleryAdmin();
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

// Render galería en panel admin
function renderGalleryAdmin() {
  if (!galleryAdminListEl) return;

  galleryAdminListEl.innerHTML = '';

  if (!galleryItems.length) {
    galleryAdminListEl.innerHTML =
      '<p class="text-[11px] text-neutral-500">Todavía no hay fotos cargadas en la galería.</p>';
    return;
  }

  galleryItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'border border-neutral-800 rounded-2xl bg-neutral-950/80 overflow-hidden flex flex-col';

    card.innerHTML = `
      <div class="aspect-[4/3] bg-neutral-900 overflow-hidden">
        <img
          src="${item.imageData}"
          alt="${item.title || 'Trabajo de la galería'}"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="p-2.5 text-[11px] flex flex-col gap-1">
        <div class="font-semibold text-neutral-100">${item.title || 'Sin título'}</div>
        <div class="text-neutral-500">
          ${item.createdAt ? new Date(item.createdAt).toLocaleString('es-AR') : ''}
        </div>
      </div>
    `;

    galleryAdminListEl.appendChild(card);
  });
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

    // Carga inicial desde backend
    Promise.all([
      loadServicesFromBackend(),
      loadStylistsFromBackend(),
      loadAppointmentsFromBackend(),
      loadGalleryFromBackend()
    ]).catch(() => {});
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
      updateStatsFromUI();
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

    // Persistimos el cambio de estado en el backend
    fetch(`${API_BASE}/api/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: appt.status })
    })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(updated => {
        const idx = appointments.findIndex(a => a.id === id);
        if (idx !== -1) {
          appointments[idx] = updated;
        }
        setData(LS_APPOINTMENTS_KEY, appointments);
        renderAppointmentsAdmin();
        updateStatsFromUI();
      })
      .catch(err => {
        console.error('Error actualizando estado de turno', err);
        openAdminModal('Error', 'No se pudo actualizar el estado de turno en el servidor.');
      });
  });
}

// Limpieza de turnos viejos llamando al backend
function initCleanup() {
  if (!cleanupBtn) return;

  cleanupBtn.addEventListener('click', () => {
    const value = cleanupBeforeInput.value;
    if (!value) {
      openAdminModal('Fecha requerida', 'Elegí una fecha para eliminar turnos anteriores.');
      return;
    }

    fetch(`${API_BASE}/api/appointments/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ before: value })
    })
      .then(r => r.json())
      .then(res => {
        const removed = res.removed ?? 0;
        const kept = res.kept ?? 0;
        openAdminModal(
          'Limpieza realizada',
          `Se eliminaron ${removed} turnos. Quedan ${kept} turnos en total.`
        );
        loadAppointmentsFromBackend();
      })
      .catch(err => {
        console.error(err);
        openAdminModal('Error', 'No se pudo limpiar los turnos. Probá más tarde.');
      });
  });
}

function initActions() {
  // guardar cambios de servicios/estilistas en backend
  saveAdminChangesBtn.addEventListener('click', () => {
    Promise.all([
      fetch(`${API_BASE}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(services),
      }),
      fetch(`${API_BASE}/api/stylists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stylists),
      })
    ])
      .then(() => {
        // opcional: cache local
        setData(LS_STYLISTS_KEY, stylists);
        setData(LS_SERVICES_KEY, services);
        openAdminModal(
          'Cambios guardados',
          'Los datos se guardaron en el servidor y se verán igual en todos los dispositivos.'
        );
      })
      .catch(err => {
        console.error(err);
        openAdminModal(
          'Error',
          'No se pudieron guardar los cambios en el servidor. Probá más tarde.'
        );
      });
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

// =================== GALERÍA: INIT ===================

function initGalleryAdmin() {
  if (!galleryAddBtn || !galleryImageInput) return;

  galleryAddBtn.addEventListener('click', () => {
    const title = (galleryTitleInput?.value || '').trim();
    const file = galleryImageInput.files[0];

    if (!file) {
      openAdminModal('Imagen requerida', 'Elegí una foto para agregar a la galería.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result; // data:image/...;base64,...

      const newItem = {
        id: Date.now(),
        title: title || 'Trabajo sin título',
        imageData,
        createdAt: new Date().toISOString(),
      };

      fetch(`${API_BASE}/api/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      })
        .then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(saved => {
          galleryItems.push(saved);
          renderGalleryAdmin();
          if (galleryTitleInput) galleryTitleInput.value = '';
          galleryImageInput.value = '';
          openAdminModal(
            'Foto agregada',
            'El trabajo se agregó a la galería y ya puede verse en la app del cliente.'
          );
        })
        .catch(err => {
          console.error('Error guardando foto de galería', err);
          openAdminModal(
            'Error',
            'No se pudo guardar la foto en el servidor. Probá de nuevo en unos minutos.'
          );
        });
    };

    reader.onerror = () => {
      console.error('Error leyendo archivo de imagen');
      openAdminModal('Error', 'No se pudo leer la imagen seleccionada.');
    };

    reader.readAsDataURL(file);
  });
}

// =================== ESTADÍSTICAS MENSUALES ===================

function computeMonthlyStats(year, month) {
  const result = {
    confirmedCount: 0,
    confirmedAmount: 0,
    canceledCount: 0,
    canceledAmount: 0,
    pendingCount: 0,
  };

  appointments.forEach(appt => {
    const dateStr = appt.dateISO || appt.date;
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d)) return;
    if (d.getFullYear() !== year || d.getMonth() !== month) return;

    const price = Number(appt.price) || 0;

    switch (appt.status) {
      case 'confirmado':
        result.confirmedCount++;
        result.confirmedAmount += price;
        break;
      case 'cancelado':
        result.canceledCount++;
        result.canceledAmount += price;
        break;
      default:
        result.pendingCount++;
    }
  });

  return result;
}

function updateStatsFromUI() {
  if (!statsMonthInput) return;

  const value = statsMonthInput.value || new Date().toISOString().slice(0, 7);
  statsMonthInput.value = value;
  const [yearStr, monthStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  const stats = computeMonthlyStats(year, month);

  if (statsSummaryEl) {
    statsSummaryEl.innerHTML = `
      <div class="border border-neutral-800 rounded-xl p-2 bg-neutral-950/80">
        <div class="text-neutral-400">Turnos confirmados (realizados)</div>
        <div class="text-sm font-semibold text-emerald-300">${stats.confirmedCount}</div>
        <div class="text-[11px] text-neutral-400">
          Ingresos: $${stats.confirmedAmount.toLocaleString('es-AR')}
        </div>
      </div>
      <div class="border border-neutral-800 rounded-xl p-2 bg-neutral-950/80">
        <div class="text-neutral-400">Turnos cancelados</div>
        <div class="text-sm font-semibold text-red-300">${stats.canceledCount}</div>
        <div class="text-[11px] text-neutral-400">
          Pérdida potencial: $${stats.canceledAmount.toLocaleString('es-AR')}
        </div>
      </div>
      <div class="border border-neutral-800 rounded-xl p-2 bg-neutral-950/80">
        <div class="text-neutral-400">Turnos pendientes</div>
        <div class="text-sm font-semibold text-amber-300">${stats.pendingCount}</div>
        <div class="text-[11px] text-neutral-500">Aún sin resultado</div>
      </div>
    `;
  }

  const ctx = document.getElementById('statsChart');
  if (ctx && window.Chart) {
    if (statsChart) statsChart.destroy();
    statsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Confirmados', 'Cancelados'],
        datasets: [
          {
            label: 'Monto',
            data: [stats.confirmedAmount, stats.canceledAmount],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }
}

function initStatsUI() {
  if (!statsMonthInput) return;

  statsMonthInput.addEventListener('change', updateStatsFromUI);

  if (exportStatsCsvBtn) {
    exportStatsCsvBtn.addEventListener('click', () => {
      const value = statsMonthInput.value || new Date().toISOString().slice(0, 7);
      const [yearStr, monthStr] = value.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr) - 1;

      const rows = [['fecha', 'hora', 'servicio', 'precio', 'estado']];
      appointments.forEach(appt => {
        const d = new Date(appt.dateISO || appt.date);
        if (isNaN(d) || d.getFullYear() !== year || d.getMonth() !== month) return;
        rows.push([
          d.toISOString().slice(0, 10),
          appt.time || '',
          (appt.serviceName || '').replace(/,/g, ' '),
          Number(appt.price || 0),
          appt.status || 'pendiente',
        ]);
      });

      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `turnos_${value}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  updateStatsFromUI();
}

// =================== INICIO DOM ===================

document.addEventListener('DOMContentLoaded', () => {
  renderStylistsAdmin();
  renderServicesAdmin();
  renderGalleryAdmin();
  initLogin();
  initStylistsAdmin();
  initServicesAdmin();
  initAppointmentsAdmin();
  initActions();
  initCleanup();
  initStatsUI();
  initGalleryAdmin();   // 👈 nuevo
});
