// Local Storage Persistent Key
const STORAGE_KEY = 'kp_crm_customers_permanent_v3';

// Preset Sales Team (8 Sales members)
const SALES_OPTIONS = [
  { name: 'วุธ', class: 'bg-cyan-950 text-cyan-400 border-cyan-700', chartColor: '#06b6d4' },
  { name: 'อั๋น', class: 'bg-orange-950 text-orange-400 border-orange-700', chartColor: '#f97316' },
  { name: 'ท้อป', class: 'bg-stone-800 text-stone-300 border-stone-600', chartColor: '#78716c' },
  { name: 'จิ๊บ', class: 'bg-emerald-950 text-emerald-400 border-emerald-700', chartColor: '#10b981' },
  { name: 'เกด', class: 'bg-amber-950 text-amber-500 border-amber-700', chartColor: '#f59e0b' },
  { name: 'ม่า', class: 'bg-purple-950 text-purple-400 border-purple-700', chartColor: '#a855f7' },
  { name: 'ปุ๊ก', class: 'bg-rose-950 text-rose-400 border-rose-700', chartColor: '#f43f5e' },
  { name: 'เฟิร์น', class: 'bg-teal-950 text-teal-400 border-teal-700', chartColor: '#14b8a6' },
];

const VEHICLE_OPTIONS = [
  'หัวลาก',
  'ตู้10',
  'หาง',
  'หางพ่วง',
  'หางก้าง',
  'หางเรียบ',
  'ดั้ม',
  '6ล้อ',
  '10ล้อ',
  'รถตัด',
];

// Presets for the Webhook Simulator
const PRESETS = {
  tractor: {
    event: 'new_message',
    page_name: 'FB เคพีศรีราชา',
    platform: 'facebook',
    customer: {
      id: 'fb_cust_' + Math.floor(100000 + Math.random() * 900000),
      name: 'เสกสรร จันทะคุณ',
      tags: ['สนใจหัวลาก'],
    },
    message: {
      id: 'msg_' + Date.now(),
      text: 'สวัสดีครับแอดมิน สนใจรถหัวลากครับ สภาพพร้อมใช้มั้ยครับ ติดต่อ 063-9292339 ครับ',
      inserted_at: new Date().toISOString(),
    },
  },
  box10: {
    event: 'new_message',
    page_name: 'FB เคพีศรีราชา',
    platform: 'facebook',
    customer: {
      id: 'fb_cust_' + Math.floor(100000 + Math.random() * 900000),
      name: 'พี่โอ๊ก ชุมแพขนส่ง',
      tags: ['ตู้10'],
    },
    message: {
      id: 'msg_' + Date.now(),
      text: 'ขอรูปและราคาตู้10 หน่อยครับ โทร 083-5469139 สะดวกรับสายตลอด',
      inserted_at: new Date().toISOString(),
    },
  },
  trailer: {
    event: 'new_message',
    page_name: 'LOA เคพี',
    platform: 'line',
    customer: {
      id: 'line_cust_' + Math.floor(100000 + Math.random() * 900000),
      name: 'อุดม สีโชติ',
      tags: ['หางพ่วง'],
    },
    message: {
      id: 'msg_' + Date.now(),
      text: 'หางก้างปลา มีของเลยมั้ยครับ เบอร์ติดต่อ 087-1549523',
      inserted_at: new Date().toISOString(),
    },
  },
  dump: {
    event: 'new_message',
    page_name: 'TikTokเคพีศรีราชา',
    platform: 'web',
    customer: {
      id: 'tt_cust_' + Math.floor(100000 + Math.random() * 900000),
      name: 'กิตติศักดิ์ กลิ่นจันทร์',
      tags: ['รถดั้ม'],
    },
    message: {
      id: 'msg_' + Date.now(),
      text: 'สนใจดั้มครับ โทรหาผมหน่อย 098-4088872',
      inserted_at: new Date().toISOString(),
    },
  },
};

// Application State
const state = {
  page: 1,
  limit: 20,
  source: 'ALL',
  hasPhone: true,
  search: '',
  totalPages: 1,
  totalCustomers: 0,
  activeCustomerId: null,
  vehicleChartInstance: null,
  salesChartInstance: null,
  cachedCustomers: [],
};

// -------------------------------------------------------------
// LOCAL STORAGE PERSISTENCE ENGINE (Instant & Permanent Data)
// -------------------------------------------------------------

const DEFAULT_INITIAL_LEADS = [
  {
    id: 'lead_real_001',
    pancakeCustomerId: '24266314679620841',
    name: 'อมร จิ๊บจ๊าบ',
    primaryPhone: '0935498942',
    interestedVehicle: 'หัวลาก',
    assignedSales: 'จิ๊บ',
    leadSource: 'FB เคพีศรีราชา',
    receivedDate: '21/8/2026',
    receivedTime: '14:20',
    notes: 'สนใจรถหัวลากครับ สภาพสวยๆ',
    lastContactAt: new Date().toISOString(),
    phones: [{ phoneNumber: '0935498942', carrier: 'AIS' }],
    messages: [
      { id: 'm1', senderType: 'CUSTOMER', text: 'สนใจรถหัวลาก', sentAt: new Date().toISOString() },
      { id: 'm2', senderType: 'CUSTOMER', text: '0935498942', extractedPhones: '["0935498942"]', sentAt: new Date().toISOString() },
    ],
  },
  {
    id: 'lead_real_002',
    pancakeCustomerId: 'tt_cust_274159',
    name: 'กิตติศักดิ์ กลิ่นจันทร์',
    primaryPhone: '0984088872',
    interestedVehicle: 'ดั้ม',
    assignedSales: 'วุธ',
    leadSource: 'TikTok เคพีศรีราชา',
    receivedDate: '21/8/2026',
    receivedTime: '07:06',
    notes: 'สนใจดั้มครับ โทรหาผมหน่อย',
    lastContactAt: new Date(Date.now() - 3600000).toISOString(),
    phones: [{ phoneNumber: '0984088872', carrier: 'AIS' }],
    messages: [
      { id: 'm3', senderType: 'CUSTOMER', text: 'สนใจดั้มครับ โทรหาผมหน่อย 098-4088872', extractedPhones: '["0984088872"]', sentAt: new Date().toISOString() },
    ],
  },
  {
    id: 'lead_real_003',
    pancakeCustomerId: 'cust_real_003',
    name: 'Wichaphat Chomphu',
    primaryPhone: '0820876792',
    interestedVehicle: 'หัวลาก',
    assignedSales: 'อั๋น',
    leadSource: 'FB เคพีศรีราชา',
    receivedDate: '19/8/2026',
    receivedTime: '12:56',
    notes: 'สนใจรถหัวลากครับ',
    lastContactAt: new Date(Date.now() - 86400000).toISOString(),
    phones: [{ phoneNumber: '0820876792', carrier: 'DTAC' }],
    messages: [
      { id: 'm4', senderType: 'CUSTOMER', text: 'สนใจรถหัวลาก 0820876792', extractedPhones: '["0820876792"]', sentAt: new Date().toISOString() },
    ],
  },
];

function getLocalCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLocalCustomers(DEFAULT_INITIAL_LEADS);
      return DEFAULT_INITIAL_LEADS;
    }
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) return list;
    saveLocalCustomers(DEFAULT_INITIAL_LEADS);
    return DEFAULT_INITIAL_LEADS;
  } catch {
    return DEFAULT_INITIAL_LEADS;
  }
}

function saveLocalCustomers(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

function mergeCustomerRecords(serverRecords) {
  const localMap = new Map();
  let localList = getLocalCustomers();

  if (!localList || localList.length === 0) {
    localList = [...DEFAULT_INITIAL_LEADS];
  }

  for (const item of localList) {
    const key = item.pancakeCustomerId || item.primaryPhone || item.id;
    if (key) localMap.set(key, item);
  }

  if (Array.isArray(serverRecords) && serverRecords.length > 0) {
    for (const item of serverRecords) {
      const key = item.pancakeCustomerId || item.primaryPhone || item.id;
      if (!key) continue;

      if (localMap.has(key)) {
        const existing = localMap.get(key);
        localMap.set(key, {
          ...existing,
          ...item,
          assignedSales: existing.assignedSales || item.assignedSales,
          interestedVehicle: existing.interestedVehicle || item.interestedVehicle,
          notes: existing.notes || item.notes,
        });
      } else {
        localMap.set(key, item);
      }
    }
  }

  let merged = Array.from(localMap.values()).sort((a, b) => {
    const timeA = new Date(a.lastContactAt || a.firstContactAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.lastContactAt || b.firstContactAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  if (merged.length === 0) {
    merged = [...DEFAULT_INITIAL_LEADS];
  }

  saveLocalCustomers(merged);
  return merged;
}

// -------------------------------------------------------------
// DOM INITIALIZATION
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initLucide();
  initEventListeners();

  // Instant render from local cache (0.001s instant load!)
  state.cachedCustomers = getLocalCustomers();
  if (state.cachedCustomers.length > 0) {
    renderTableWithCustomers(state.cachedCustomers);
    updateLocalStats(state.cachedCustomers);
  }

  // Background server fetch & live sync
  loadStats();
  loadCustomers();
  initSimulatorPayload('tractor');

  // Silent live poll every 8 seconds for new incoming Pancake leads
  setInterval(() => {
    silentSync();
  }, 8000);
});

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Event Listeners
function initEventListeners() {
  // Search input with debounce and clear button
  let searchTimeout;
  const searchInput = document.getElementById('customer-search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.search = val.trim();
      state.page = 1;
      filterAndRenderLocal();
      loadCustomers();
    }, 250);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    state.search = '';
    state.page = 1;
    filterAndRenderLocal();
    loadCustomers();
  });

  // Source Filter Buttons (All, FB, LINE, TikTok)
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('bg-brand-600', 'text-white'));
      btn.classList.add('bg-brand-600', 'text-white');
      state.source = btn.getAttribute('data-source');
      state.page = 1;
      filterAndRenderLocal();
      loadCustomers();
    });
  });

  // Refresh Button
  const btnRefresh = document.getElementById('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      loadStats();
      loadCustomers();
      showToast('รีเฟรชข้อมูลล่าสุดเรียบร้อย', 'success');
    });
  }

  // Quick Add Lead Modal Controls
  const btnOpenQuickAdd = document.getElementById('btn-open-quick-add');
  if (btnOpenQuickAdd) {
    btnOpenQuickAdd.addEventListener('click', openQuickAddModal);
  }
  const btnCloseQA = document.getElementById('btn-close-quick-add');
  if (btnCloseQA) btnCloseQA.addEventListener('click', closeQuickAddModal);
  const btnCloseQAFooter = document.getElementById('btn-close-quick-add-footer');
  if (btnCloseQAFooter) btnCloseQAFooter.addEventListener('click', closeQuickAddModal);

  const formQA = document.getElementById('quick-add-form');
  if (formQA) {
    formQA.addEventListener('submit', handleQuickAddSubmit);
  }

  // Customer Modal Controls
  const btnCloseModal = document.getElementById('btn-close-modal');
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeCustomerModal);
  const btnCloseModalFooter = document.getElementById('btn-close-modal-footer');
  if (btnCloseModalFooter) btnCloseModalFooter.addEventListener('click', closeCustomerModal);

  // Webhook Simulator Modal Controls
  const btnOpenSim = document.getElementById('btn-open-simulator');
  if (btnOpenSim) btnOpenSim.addEventListener('click', openSimulatorModal);
  const btnCloseSim = document.getElementById('btn-close-simulator');
  if (btnCloseSim) btnCloseSim.addEventListener('click', closeSimulatorModal);
  const btnCloseSimFooter = document.getElementById('btn-close-simulator-footer');
  if (btnCloseSimFooter) btnCloseSimFooter.addEventListener('click', closeSimulatorModal);
  const btnSendSim = document.getElementById('btn-send-simulated-webhook');
  if (btnSendSim) btnSendSim.addEventListener('click', sendSimulatedWebhook);

  // Simulator Preset Buttons
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active-preset', 'border-indigo-500/50', 'bg-indigo-950/20'));
      btn.classList.add('active-preset', 'border-indigo-500/50', 'bg-indigo-950/20');
      initSimulatorPayload(btn.getAttribute('data-preset'));
    });
  });

  // Copy Webhook URL
  const btnCopyWebhook = document.getElementById('copy-webhook-btn');
  if (btnCopyWebhook) {
    btnCopyWebhook.addEventListener('click', () => {
      const fullUrl = `${window.location.origin}/api/webhooks/pancake`;
      navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('คัดลอก URL Webhook แล้ว: ' + fullUrl, 'success');
      });
    });
  }

  // Export CSV
  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      window.open('/api/customers/export/csv', '_blank');
      showToast('กำลังดาวน์โหลดไฟล์ Excel/CSV...', 'info');
    });
  }

  // Clear All
  const btnClearAll = document.getElementById('btn-clear-all');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', async () => {
      const ok = confirm('⚠️ คุณต้องการล้างข้อมูลเคสลูกค้าทั้งหมดใช่หรือไม่?');
      if (!ok) return;
      saveLocalCustomers([]);
      state.cachedCustomers = [];
      filterAndRenderLocal();
      updateLocalStats([]);
      showToast('ล้างข้อมูลเรียบร้อยแล้ว', 'success');
    });
  }
}

// -------------------------------------------------------------
// FILTER & LOCAL RENDER
// -------------------------------------------------------------

function filterAndRenderLocal() {
  let list = getLocalCustomers();

  if (state.source && state.source !== 'ALL') {
    list = list.filter((c) => (c.leadSource || '').includes(state.source));
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter((c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.primaryPhone || '').includes(q) ||
      (c.interestedVehicle || '').toLowerCase().includes(q) ||
      (c.assignedSales || '').toLowerCase().includes(q) ||
      (c.leadSource || '').toLowerCase().includes(q)
    );
  }

  renderTableWithCustomers(list);
  updateLocalStats(getLocalCustomers());
}

function updateLocalStats(list) {
  const withPhones = list.filter((c) => !!c.primaryPhone).length;
  let assignedCount = 0;
  const salesMap = {};
  const vehicleMap = {};

  for (const c of list) {
    if (c.assignedSales) {
      assignedCount++;
      salesMap[c.assignedSales] = (salesMap[c.assignedSales] || 0) + 1;
    }
    if (c.interestedVehicle) {
      vehicleMap[c.interestedVehicle] = (vehicleMap[c.interestedVehicle] || 0) + 1;
    }
  }

  const elPhones = document.getElementById('stat-total-phones');
  if (elPhones) elPhones.innerText = withPhones.toLocaleString();

  const elAssigned = document.getElementById('stat-total-assigned');
  if (elAssigned) elAssigned.innerText = assignedCount.toLocaleString();

  const elPending = document.getElementById('stat-pending-assigned');
  if (elPending) elPending.innerText = Math.max(0, withPhones - assignedCount).toLocaleString();

  SALES_OPTIONS.forEach((sales) => {
    const el = document.getElementById(`team-count-${sales.name}`);
    if (el) {
      el.innerText = `${salesMap[sales.name] || 0}`;
    }
  });

  renderVehicleChart(vehicleMap);
  renderSalesChart(salesMap);
}

// -------------------------------------------------------------
// SERVER DATA SYNC
// -------------------------------------------------------------

async function silentSync() {
  try {
    const res = await fetch('/api/customers?limit=50');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      const merged = mergeCustomerRecords(data.data);
      state.cachedCustomers = merged;
      filterAndRenderLocal();
    }
  } catch {
    // silent fallback
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/customers/stats');
    const data = await res.json();
    if (!data.success) return;

    const stats = data.data;
    if (stats.totalWithPhones > 0) {
      document.getElementById('stat-total-phones').innerText = stats.totalWithPhones.toLocaleString();
      document.getElementById('stat-total-messages').innerText = stats.totalMessages.toLocaleString();

      let assignedCount = 0;
      if (stats.salesBreakdown) {
        Object.values(stats.salesBreakdown).forEach((cnt) => (assignedCount += Number(cnt)));
      }
      document.getElementById('stat-total-assigned').innerText = assignedCount.toLocaleString();
      document.getElementById('stat-pending-assigned').innerText = Math.max(0, stats.totalWithPhones - assignedCount).toLocaleString();

      SALES_OPTIONS.forEach((sales) => {
        const el = document.getElementById(`team-count-${sales.name}`);
        if (el) {
          const count = (stats.salesBreakdown && stats.salesBreakdown[sales.name]) || 0;
          el.innerText = `${count}`;
        }
      });

      renderVehicleChart(stats.vehicleBreakdown);
      renderSalesChart(stats.salesBreakdown);
    }
  } catch (err) {
    console.warn('Silent stats fetch fallback');
  }
}

async function loadCustomers() {
  try {
    const res = await fetch('/api/customers?limit=50');
    const data = await res.json();

    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      const merged = mergeCustomerRecords(data.data);
      state.cachedCustomers = merged;
    }
    filterAndRenderLocal();
  } catch (err) {
    filterAndRenderLocal();
  }
}

// -------------------------------------------------------------
// TABLE RENDERER
// -------------------------------------------------------------

function renderTableWithCustomers(customers) {
  const tbody = document.getElementById('customer-table-body');
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-5 py-12 text-center text-slate-500">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
          <p class="font-medium text-slate-400">ยังไม่มีเคสลูกค้าที่ให้เบอร์โทร</p>
          <p class="text-xs text-slate-500 mt-1">ระบบจะบันทึกและแสดงเคสลงตารางนี้ทันทีที่ลูกค้าส่งเบอร์โทรเข้ามาใน Pancake!</p>
        </td>
      </tr>
    `;
    initLucide();
    return;
  }

  tbody.innerHTML = customers.map((c) => {
    const primaryPhone = c.primaryPhone || (c.phones && c.phones[0]?.phoneNumber) || '-';
    const dateDisplay = c.receivedDate || (c.lastContactAt ? new Date(c.lastContactAt).toLocaleDateString('th-TH') : '-');
    const timeDisplay = c.receivedTime || (c.lastContactAt ? new Date(c.lastContactAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-');
    const vehicle = c.interestedVehicle || 'หัวลาก';
    const source = c.leadSource || 'FB เคพีศรีราชา';

    const sourceBadge = source.includes('LINE')
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center w-fit"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1"></span>LINE OA</span>`
      : source.includes('TikTok')
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-pink-400 border border-pink-900 flex items-center w-fit"><span class="w-1.5 h-1.5 rounded-full bg-pink-400 mr-1"></span>TikTok</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 text-blue-400 border border-blue-800 flex items-center w-fit"><span class="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1"></span>FB เคพี</span>`;

    const vehicleOptionsHtml = VEHICLE_OPTIONS.map((v) =>
      `<option value="${v}" ${vehicle === v ? 'selected' : ''}>${v}</option>`
    ).join('');

    const salesOptionsHtml = `
      <option value="" ${!c.assignedSales ? 'selected' : ''}>-- ยังไม่จ่ายงาน --</option>
      ${SALES_OPTIONS.map((s) => `
        <option value="${s.name}" ${c.assignedSales === s.name ? 'selected' : ''}>
          ${s.name}
        </option>
      `).join('')}
    `;

    return `
      <tr class="table-row-hover border-b border-slate-800/80 transition-colors" data-customer-id="${c.id}">
        <td class="px-4 py-3 text-xs text-slate-300 font-mono">${escapeHtml(dateDisplay)}</td>
        <td class="px-4 py-3 text-xs text-slate-400 font-mono">${escapeHtml(timeDisplay)}</td>
        <td class="px-4 py-3">${sourceBadge}</td>
        <td class="px-4 py-3">
          <div class="flex items-center space-x-2">
            <span class="font-semibold text-slate-100 text-sm">${escapeHtml(c.name || 'ลูกค้าใหม่')}</span>
          </div>
        </td>
        <td class="px-4 py-3">
          <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-xs tracking-wider">
            ${formatPhoneDisplay(primaryPhone)}
          </span>
        </td>
        <td class="px-4 py-3">
          <select class="vehicle-select px-2.5 py-1 rounded-lg bg-dark-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-brand-500 font-medium" data-customer-id="${c.id}">
            ${vehicleOptionsHtml}
          </select>
        </td>
        <td class="px-4 py-3">
          <select class="sales-select px-2.5 py-1 rounded-lg bg-dark-900 border border-slate-700 text-xs font-bold focus:outline-none focus:border-brand-500 transition-colors ${c.assignedSales ? 'text-brand-400 border-brand-500/50' : 'text-slate-400'}" data-customer-id="${c.id}">
            ${salesOptionsHtml}
          </select>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center space-x-1.5">
            <button class="btn-copy-line px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-semibold transition-all flex items-center space-x-1" data-customer-id="${c.id}" title="คัดลอกสรุปเคสส่งกลุ่ม LINE">
              <i data-lucide="send" class="w-3 h-3"></i>
              <span>ส่งให้เซลล์</span>
            </button>
            <button class="btn-delete-lead p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors" data-customer-id="${c.id}" title="ลบเคสนี้">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initLucide();
  attachTableEventHandlers();
}

function attachTableEventHandlers() {
  // Sales assignment dropdown change
  document.querySelectorAll('.sales-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const custId = e.target.getAttribute('data-customer-id');
      const salesName = e.target.value;

      const list = getLocalCustomers();
      const item = list.find((c) => c.id === custId || c.pancakeCustomerId === custId);
      if (item) {
        item.assignedSales = salesName || null;
        saveLocalCustomers(list);
        updateLocalStats(list);
      }

      if (salesName) {
        sel.className = 'sales-select px-2.5 py-1 rounded-lg bg-dark-900 border border-brand-500/50 text-brand-400 text-xs font-bold focus:outline-none';
        showToast(`จ่ายงานให้เซลล์ "${salesName}" เรียบร้อยแล้ว`, 'success');
      } else {
        sel.className = 'sales-select px-2.5 py-1 rounded-lg bg-dark-900 border border-slate-700 text-slate-400 text-xs font-bold focus:outline-none';
      }
    });
  });

  // Vehicle dropdown change
  document.querySelectorAll('.vehicle-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const custId = e.target.getAttribute('data-customer-id');
      const vehicle = e.target.value;

      const list = getLocalCustomers();
      const item = list.find((c) => c.id === custId || c.pancakeCustomerId === custId);
      if (item) {
        item.interestedVehicle = vehicle;
        saveLocalCustomers(list);
        updateLocalStats(list);
        showToast(`เปลี่ยนรุ่นรถที่สนใจเป็น "${vehicle}" เรียบร้อย`, 'info');
      }
    });
  });

  // 1-Click Copy LINE Forward Text
  document.querySelectorAll('.btn-copy-line').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const custId = btn.getAttribute('data-customer-id');
      const list = getLocalCustomers();
      const c = list.find((item) => item.id === custId || item.pancakeCustomerId === custId);
      if (!c) return;

      const primaryPhone = c.primaryPhone || (c.phones && c.phones[0]?.phoneNumber) || '-';
      const sales = c.assignedSales || 'ยังไม่ระบุ';
      const vehicle = c.interestedVehicle || 'หัวลาก';
      const dateDisplay = c.receivedDate || new Date().toLocaleDateString('th-TH');
      const timeDisplay = c.receivedTime || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      const lineMessage = `🎯 [ส่งต่อเคสลูกค้า KP Sriracha]
👤 ชื่อลูกค้า: ${c.name || 'ลูกค้าใหม่'}
📞 เบอร์โทร: ${primaryPhone}
🚛 รถที่สนใจ: ${vehicle}
👨‍💼 เซลล์ผู้ดูแล: ${sales}
📱 ช่องทาง: ${c.leadSource || 'FB เคพีศรีราชา'}
⏰ วันที่: ${dateDisplay} เวลา ${timeDisplay}
💬 ข้อความ: ${c.notes || '-'}`;

      navigator.clipboard.writeText(lineMessage).then(() => {
        showToast(`📋 คัดลอกเคสคุณ "${c.name}" พร้อมส่งให้เซลล์ใน LINE แล้ว!`, 'success');
      });
    });
  });

  // Delete single lead
  document.querySelectorAll('.btn-delete-lead').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const custId = btn.getAttribute('data-customer-id');
      const list = getLocalCustomers().filter((c) => c.id !== custId && c.pancakeCustomerId !== custId);
      saveLocalCustomers(list);
      filterAndRenderLocal();
      updateLocalStats(list);
      showToast('ลบเคสลูกค้าเรียบร้อยแล้ว', 'info');
    });
  });
}

// -------------------------------------------------------------
// QUICK ADD LEAD MODAL
// -------------------------------------------------------------

function openQuickAddModal() {
  const modal = document.getElementById('quick-add-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeQuickAddModal() {
  const modal = document.getElementById('quick-add-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleQuickAddSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('qa-name').value.trim();
  const phone = document.getElementById('qa-phone').value.trim();
  const source = document.getElementById('qa-source').value;
  const vehicle = document.getElementById('qa-vehicle').value;
  const sales = document.getElementById('qa-sales').value;
  const notes = document.getElementById('qa-notes').value.trim();

  if (!phone) {
    showToast('กรุณากรอกเบอร์โทรศัพท์', 'error');
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const now = new Date();
  const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const leadId = 'lead_' + Date.now();

  const newLead = {
    id: leadId,
    pancakeCustomerId: 'manual_' + Date.now(),
    name: name || 'ลูกค้าใหม่',
    primaryPhone: cleanPhone,
    interestedVehicle: vehicle,
    assignedSales: sales || null,
    leadSource: source,
    receivedDate: dateStr,
    receivedTime: timeStr,
    notes: notes,
    lastContactAt: now.toISOString(),
    phones: [{ phoneNumber: cleanPhone, carrier: 'AIS' }],
    messages: notes ? [{ id: 'm_' + Date.now(), senderType: 'CUSTOMER', text: notes, sentAt: now.toISOString() }] : [],
  };

  const list = getLocalCustomers();
  list.unshift(newLead);
  saveLocalCustomers(list);
  filterAndRenderLocal();
  closeQuickAddModal();
  document.getElementById('quick-add-form').reset();

  showToast(`บันทึกเคส "${name}" เรียบร้อยแล้ว!`, 'success');

  // Background server sync
  try {
    await fetch('/api/webhooks/pancake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'manual_lead',
        page_name: source,
        customer: { id: newLead.pancakeCustomerId, name: newLead.name, phone_number: newLead.primaryPhone, notes: newLead.notes },
        message: { id: 'msg_' + Date.now(), text: `${notes || ''} สนใจ ${vehicle} เบอร์ ${phone}`, inserted_at: now.toISOString() },
      }),
    });
  } catch {
    // silent
  }
}

function closeCustomerModal() {
  document.getElementById('customer-modal').classList.add('hidden');
  state.activeCustomerId = null;
}

// -------------------------------------------------------------
// WEBHOOK SIMULATOR
// -------------------------------------------------------------

function openSimulatorModal() {
  document.getElementById('simulator-modal').classList.remove('hidden');
}

function closeSimulatorModal() {
  document.getElementById('simulator-modal').classList.add('hidden');
  document.getElementById('simulator-response-box').classList.add('hidden');
}

function initSimulatorPayload(presetKey) {
  const payload = PRESETS[presetKey] || PRESETS.tractor;
  document.getElementById('simulator-payload-editor').value = JSON.stringify(payload, null, 2);
}

async function sendSimulatedWebhook() {
  const editor = document.getElementById('simulator-payload-editor');
  const responseBox = document.getElementById('simulator-response-box');
  const btn = document.getElementById('btn-send-simulated-webhook');

  try {
    const rawJson = editor.value;
    const parsedPayload = JSON.parse(rawJson);

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>กำลังส่ง...</span>`;
    initLucide();

    const res = await fetch('/api/webhooks/pancake?secret=local_dev_pancake_secret_key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedPayload),
    });

    const data = await res.json();
    responseBox.classList.remove('hidden');

    if (res.ok) {
      responseBox.className = 'p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-mono text-[11px] block';
      responseBox.innerHTML = `✅ HTTP ${res.status}: รับ Webhook สำเร็จ! กำลังสกัดเบอร์โทรและอัปเดตลงตาราง...`;
      showToast('ส่งแชททดสอบสำเร็จ! ตาราง CRM ได้รับข้อมูลแล้ว', 'success');

      setTimeout(() => {
        loadStats();
        loadCustomers();
      }, 500);
    } else {
      responseBox.className = 'p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 font-mono text-[11px] block';
      responseBox.innerHTML = `❌ HTTP ${res.status}: ${data.error || 'เกิดข้อผิดพลาด'}`;
    }
  } catch (err) {
    responseBox.classList.remove('hidden');
    responseBox.className = 'p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 font-mono text-[11px] block';
    responseBox.innerHTML = `❌ JSON ไม่ถูกต้อง: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="send" class="w-3.5 h-3.5"></i><span>ส่งแชททดสอบ</span>`;
    initLucide();
  }
}

// -------------------------------------------------------------
// VISUALIZATIONS (Chart.js)
// -------------------------------------------------------------

function renderVehicleChart(breakdown = {}) {
  const ctx = document.getElementById('vehicleChart');
  if (!ctx) return;

  const labels = Object.keys(breakdown).length > 0 ? Object.keys(breakdown) : ['หัวลาก', 'ตู้10', 'หาง', 'ดั้ม'];
  const values = Object.keys(breakdown).length > 0 ? Object.values(breakdown) : [8, 6, 4, 2];

  if (state.vehicleChartInstance) {
    state.vehicleChartInstance.destroy();
  }

  state.vehicleChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#14b8a6', '#f43f5e', '#eab308'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { size: 10 } },
        },
      },
      cutout: '70%',
    },
  });
}

function renderSalesChart(breakdown = {}) {
  const ctx = document.getElementById('salesChart');
  if (!ctx) return;

  const labels = SALES_OPTIONS.map((s) => s.name);
  const values = labels.map((name) => (breakdown && breakdown[name]) || 0);
  const colors = SALES_OPTIONS.map((s) => s.chartColor);

  if (state.salesChartInstance) {
    state.salesChartInstance.destroy();
  }

  state.salesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'จำนวนเคสที่ได้รับ',
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
        y: {
          ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 },
          grid: { color: '#334155' },
          beginAtZero: true,
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');

  const borderColors = {
    success: 'border-emerald-500/50 bg-emerald-950/90 text-emerald-300',
    error: 'border-red-500/50 bg-red-950/90 text-red-300',
    info: 'border-indigo-500/50 bg-indigo-950/90 text-indigo-300',
  };

  toast.className = `px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-xl text-xs font-medium flex items-center space-x-2 animate-in slide-in-from-bottom-3 duration-200 ${borderColors[type] || borderColors.info}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPhoneDisplay(num) {
  if (!num) return '-';
  const clean = String(num).replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6)}`;
  }
  return num;
}
