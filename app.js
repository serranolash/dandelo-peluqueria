const LS_SERVICES_KEY = 'dandelo_services';
const LS_STYLISTS_KEY = 'dandelo_stylists';
const LS_APPOINTMENTS_KEY = 'dandelo_appointments';

// 👉 URL del backend en Railway
const API_BASE = "https://web-production-b923d.up.railway.app";

const defaultStylists = [{ id: 1, name: 'Danilo Dandelo' }];
const defaultServices = [
  { id: 1, name: 'Corte Caballero', duration: 45, price: 15000 },
  { id: 2, name: 'Corte Dama', duration: 60, price: 20000 },
  { id: 3, name: 'Tinte Completo', duration: 90, price: 40000 },
  { id: 4, name: 'Barba & Perfilado', duration: 30, price: 12000 }
];
const defaultTimeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

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

let services = getData(LS_SERVICES_KEY, defaultServices);
let stylists = getData(LS_STYLISTS_KEY, defaultStylists);
let appointments = getData(LS_APPOINTMENTS_KEY, []);

const servicesListEl = document.getElementById('servicesList');
const stylistSelectEl = document.getElementById('stylistSelect');
const toStep2Btn = document.getElementById('toStep2Btn');
const toStep3Btn = document.getElementById('toStep3Btn');
const backToStep1Btn = document.getElementById('backToStep1');
const backToStep2Btn = document.getElementById('backToStep2');
const stepPanels = {
  1: document.getElementById('step1'),
  2: document.getElementById('step2'),
  3: document.getElementById('step3'),
};
const stepIndicators = document.querySelectorAll('.step-indicator');

const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const currentMonthLabel = document.getElementById('currentMonthLabel');
const calendarGrid = document.getElementById('calendarGrid');
const timeSlotsEl = document.getElementById('timeSlots');

const summaryBox = document.getElementById('summaryBox');
const clientNameInput = document.getElementById('clientName');
const clientContactInput = document.getElementById('clientContact');
const confirmAppointmentBtn = document.getElementById('confirmAppointmentBtn');

const paymentsModal = document.getElementById('paymentsModal');
const openPaymentsBtn = document.getElementById('openPaymentsBtn');
const closePaymentsBtn = document.getElementById('closePaymentsBtn');
const genericModal = document.getElementById('genericModal');
const genericModalTitle = document.getElementById('genericModalTitle');
const genericModalMessage = document.getElementById('genericModalMessage');
const genericModalCloseBtn = document.getElementById('genericModalCloseBtn');

let selectedServiceId = null;
let selectedStylistId = stylists[0]?.id ?? null;
let currentMonth = new Date();
let selectedDate = null;
let selectedTime = null;

function showStep(step) {
  for (const n in stepPanels) {
    stepPanels[n].classList.toggle('hidden', Number(n) !== step);
  }
  stepIndicators.forEach(ind => {
    const stepNum = Number(ind.getAttribute('data-step'));
    ind.classList.toggle('step-active', stepNum === step);
  });
}

function renderServices() {
  servicesListEl.innerHTML = '';
  services.forEach(service => {
    const isSelected = service.id === selectedServiceId;
    const div = document.createElement('button');
    div.type = 'button';
    div.className =
      'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left text-xs ' +
      (isSelected
        ? 'border-amber-400 bg-amber-400/10 text-amber-100'
        : 'border-neutral-700 hover:border-amber-400/70 hover:bg-neutral-900 text-neutral-200');
    div.innerHTML = `
      <div>
        <div class="font-medium text-sm">${service.name}</div>
        <div class="text-[11px] text-neutral-400">${service.duration} min</div>
      </div>
      <div class="text-xs font-semibold text-amber-300">$${service.price.toLocaleString('es-AR')}</div>
    `;
    div.addEventListener('click', () => {
      selectedServiceId = service.id;
      renderServices();
      validateStep1();
    });
    servicesListEl.appendChild(div);
  });
}

function renderStylists() {
  stylistSelectEl.innerHTML = '';
  stylists.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st.id;
    opt.textContent = st.name;
    stylistSelectEl.appendChild(opt);
  });
  if (selectedStylistId == null && stylists.length) {
    selectedStylistId = stylists[0].id;
  }
  stylistSelectEl.value = selectedStylistId ?? '';
}

function validateStep1() {
  toStep2Btn.disabled = !selectedServiceId || !selectedStylistId;
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return { firstDay, lastDay, days };
}

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const { firstDay, days } = getMonthDays(year, month);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  currentMonthLabel.textContent = monthNames[month] + ' ' + year;

  calendarGrid.innerHTML = '';

  ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'text-[10px] text-neutral-400 text-center';
    h.textContent = d;
    calendarGrid.appendChild(h);
  });

  const startOffset = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    calendarGrid.appendChild(empty);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  days.forEach(date => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isPast = date < today;

    btn.textContent = String(date.getDate());
    btn.className =
      'w-8 h-8 rounded-full flex items-center justify-center text-[11px] ' +
      (isPast
        ? 'text-neutral-600 cursor-not-allowed bg-neutral-900/50'
        : isSelected
          ? 'bg-amber-400 text-neutral-900 font-semibold'
          : 'bg-neutral-900/80 text-neutral-200 hover:bg-neutral-800');

    if (!isPast) {
      btn.addEventListener('click', () => {
        selectedDate = date;
        renderCalendar();
        renderTimeSlots();
        validateStep2();
      });
    }

    calendarGrid.appendChild(btn);
  });
}

function renderTimeSlots() {
  timeSlotsEl.innerHTML = '';
  if (!selectedDate) {
    const msg = document.createElement('p');
    msg.className = 'text-[11px] text-neutral-500';
    msg.textContent = 'Elegí primero una fecha.';
    timeSlotsEl.appendChild(msg);
    return;
  }
  defaultTimeSlots.forEach(time => {
    const isSelected = selectedTime === time;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = time;
    btn.className =
      'px-3 py-1.5 rounded-full border text-[11px] ' +
      (isSelected
        ? 'border-amber-400 bg-amber-400/10 text-amber-100'
        : 'border-neutral-700 text-neutral-200 hover:border-amber-400/70 hover:bg-neutral-900');
    btn.addEventListener('click', () => {
      selectedTime = time;
      renderTimeSlots();
      validateStep2();
    });
    timeSlotsEl.appendChild(btn);
  });
}

function validateStep2() {
  toStep3Btn.disabled = !selectedDate || !selectedTime;
}

function renderSummary() {
  const service = services.find(s => s.id === selectedServiceId);
  const stylist = stylists.find(s => s.id === selectedStylistId);
  if (!service || !stylist || !selectedDate || !selectedTime) return;

  const dateStr = selectedDate.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  summaryBox.innerHTML = `
    <div><span class="text-neutral-400">Servicio:</span> <span class="font-semibold text-neutral-100">${service.name}</span></div>
    <div><span class="text-neutral-400">Duración:</span> ${service.duration} min</div>
    <div><span class="text-neutral-400">Estilista:</span> ${stylist.name}</div>
    <div><span class="text-neutral-400">Fecha:</span> ${dateStr}</div>
    <div><span class="text-neutral-400">Hora:</span> ${selectedTime} hs</div>
    <div><span class="text-neutral-400">Precio estimado:</span> <span class="text-amber-300 font-semibold">$${service.price.toLocaleString('es-AR')}</span></div>
  `;
}

function openGenericModal(title, message) {
  genericModalTitle.textContent = title;
  genericModalMessage.textContent = message;
  genericModal.classList.remove('hidden');
}

function closeGenericModal() {
  genericModal.classList.add('hidden');
}

function initModals() {
  if (openPaymentsBtn) {
    openPaymentsBtn.addEventListener('click', () => {
      paymentsModal.classList.remove('hidden');
    });
  }
  if (closePaymentsBtn) {
    closePaymentsBtn.addEventListener('click', () => {
      paymentsModal.classList.add('hidden');
    });
  }
  if (paymentsModal) {
    paymentsModal.addEventListener('click', (e) => {
      if (e.target === paymentsModal) paymentsModal.classList.add('hidden');
    });
  }

  if (genericModalCloseBtn) {
    genericModalCloseBtn.addEventListener('click', closeGenericModal);
  }
  if (genericModal) {
    genericModal.addEventListener('click', (e) => {
      if (e.target === genericModal) closeGenericModal();
    });
  }
}

function onConfirmAppointment() {
  const service = services.find(s => s.id === selectedServiceId);
  const stylist = stylists.find(s => s.id === selectedStylistId);
  if (!service || !stylist || !selectedDate || !selectedTime) {
    openGenericModal('Faltan datos', 'Completá todos los pasos antes de confirmar el turno.');
    return;
  }
  const clientName = clientNameInput.value.trim();
  const clientContact = clientContactInput.value.trim();
  if (!clientName || !clientContact) {
    openGenericModal('Datos del cliente', 'Ingresá tu nombre y un medio de contacto para confirmar la reserva.');
    return;
  }

  const appointment = {
    id: Date.now(),
    serviceId: service.id,
    stylistId: stylist.id,
    serviceName: service.name,
    stylistName: stylist.name,
    dateISO: selectedDate.toISOString(),
    time: selectedTime,
    clientName,
    clientContact,
    price: service.price,
    status: 'pendiente',
  };

  // ✅ Guardar turno en el backend correcto
  fetch(`${API_BASE}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(appointment)
  })
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(() => {
      openGenericModal(
        'Turno confirmado',
        'Tu turno fue reservado correctamente. Te esperamos el día seleccionado a las ' + selectedTime + ' hs.'
      );
      clientNameInput.value = '';
      clientContactInput.value = '';
    })
    .catch(err => {
      console.error(err);
      openGenericModal('Error', 'No se pudo guardar el turno. Intentalo más tarde.');
    });
}

function initSteps() {
  showStep(1);
  renderServices();
  renderStylists();
  validateStep1();

  stylistSelectEl.addEventListener('change', (e) => {
    selectedStylistId = Number(e.target.value);
    validateStep1();
  });

  toStep2Btn.addEventListener('click', () => {
    showStep(2);
    renderCalendar();
    renderTimeSlots();
    validateStep2();
  });

  backToStep1Btn.addEventListener('click', () => {
    showStep(1);
  });

  toStep3Btn.addEventListener('click', () => {
    renderSummary();
    showStep(3);
  });

  backToStep2Btn.addEventListener('click', () => {
    showStep(2);
  });

  prevMonthBtn.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
    renderTimeSlots();
    validateStep2();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
    renderTimeSlots();
    validateStep2();
  });

  confirmAppointmentBtn.addEventListener('click', onConfirmAppointment);
}

document.addEventListener('DOMContentLoaded', () => {
  initSteps();
  initModals();
});
