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

  // Reset / Clear All Data Button
  const btnClearAll = document.getElementById('btn-clear-all-data');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', async () => {
      const ok = confirm('⚠️ คำเตือน: คุณต้องการล้างข้อมูลเคสลูกค้าทั้งหมดในระบบใช่หรือไม่?');
      if (!ok) return;

      const doubleCheck = confirm('กรุณายืนยันอีกครั้ง: ข้อมูลเคสลูกค้าทั้งหมดจะถูกลบถาวร!');
      if (!doubleCheck) return;

      try {
        saveLocalCustomers([]);
        state.cachedCustomers = [];
        filterAndRenderLocal();
        updateLocalStats([]);

        await fetch('/api/customers/all/clear', { method: 'DELETE' });
        showToast('ล้างข้อมูลเคสลูกค้าทั้งหมดเรียบร้อยแล้ว', 'success');
        loadStats();
        loadCustomers();
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการล้างข้อมูล', 'error');
      }
    });
  }

  // Refresh Button
  document.getElementById('btn-refresh').addEventListener('click', () => {
    loadStats();
    loadCustomers();
    showToast('รีเฟรชข้อมูลล่าสุดเรียบร้อย', 'success');
  });

  // Pagination
  document.getElementById('btn-prev-page').addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      loadCustomers();
    }
  });

  document.getElementById('btn-next-page').addEventListener('click', () => {
    if (state.page < state.totalPages) {
      state.page++;
      loadCustomers();
    }
  });

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
  document.getElementById('btn-close-modal').addEventListener('click', closeCustomerModal);
  document.getElementById('btn-close-modal-footer').addEventListener('click', closeCustomerModal);

  // Delete Customer inside Modal
  document.getElementById('btn-delete-customer-modal').addEventListener('click', async () => {
    if (!state.activeCustomerId) return;
    const ok = confirm('คุณต้องการลบข้อมูลลูกค้ารายนี้ใช่หรือไม่?');
    if (!ok) return;

    await deleteCustomerById(state.activeCustomerId);
    closeCustomerModal();
  });

  // Simulator Modal Controls
  document.getElementById('btn-open-simulator').addEventListener('click', openSimulatorModal);
  document.getElementById('btn-close-simulator').addEventListener('click', closeSimulatorModal);
  document.getElementById('btn-close-simulator-footer').addEventListener('click', closeSimulatorModal);

  // Simulator Preset Buttons
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('border-indigo-500', 'bg-indigo-950/30'));
      btn.classList.add('border-indigo-500', 'bg-indigo-950/30');
      const presetKey = btn.getAttribute('data-preset');
      initSimulatorPayload(presetKey);
    });
  });

  // Send Simulated Webhook Button
  document.getElementById('btn-send-simulated-webhook').addEventListener('click', sendSimulatedWebhook);
}

// -------------------------------------------------------------
// FILTER & RENDER ENGINE
// -------------------------------------------------------------

function filterAndRenderLocal() {
  let list = getLocalCustomers();

  if (state.source !== 'ALL') {
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
    const params = new URLSearchParams({
      page: state.page,
      limit: state.limit,
    });

    if (state.source !== 'ALL') params.append('lead_source', state.source);
    if (state.search) params.append('search', state.search);

    const res = await fetch(`/api/customers?${params.toString()}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.data)) {
      const merged = mergeCustomerRecords(data.data);
      state.cachedCustomers = merged;
      state.totalPages = data.pagination?.totalPages || 1;
      state.totalCustomers = merged.length;

      document.getElementById('pagination-summary').innerText = `แสดง ${merged.length} จาก ${merged.length} เคส`;
      document.getElementById('pagination-current-page').innerText = `${state.page} / ${state.totalPages}`;

      filterAndRenderLocal();
    }
  } catch (err) {
    console.warn('Using local persistent cache for customer table');
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

  tbody.innerHTML = customers.map((c) => renderCustomerRow(c)).join('');
  initLucide();
  attachTableEventHandlers();
}

function renderCustomerRow(c) {
  const dateObj = new Date(c.lastContactAt || c.firstContactAt || c.createdAt || Date.now());
  const dateStr = c.receivedDate || `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
  const timeStr = c.receivedTime || `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

  // Phone Column
  let phoneHtml = '<span class="text-slate-500 text-xs italic">-</span>';
  if (c.primaryPhone) {
    const formatted = formatPhoneDisplay(c.primaryPhone);
    phoneHtml = `
      <div class="flex items-center space-x-1.5">
        <span class="font-mono text-emerald-400 font-bold text-xs tracking-wider">${formatted}</span>
        <button class="btn-copy-phone p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" data-phone="${c.primaryPhone}" title="คัดลอกเบอร์">
          <i data-lucide="copy" class="w-3 h-3"></i>
        </button>
      </div>
    `;
  }

  // Vehicle Select Options
  const vehicleOptionsHtml = VEHICLE_OPTIONS.map(
    (v) => `<option value="${v}" ${c.interestedVehicle === v ? 'selected' : ''}>${v}</option>`
  ).join('');

  // Sales Select Options (all 8 members)
  const salesOptionsHtml = SALES_OPTIONS.map(
    (s) => `<option value="${s.name}" ${c.assignedSales === s.name ? 'selected' : ''}>${s.name}</option>`
  ).join('');

  // Sales Badge Style
  const assignedSalesObj = SALES_OPTIONS.find((s) => s.name === c.assignedSales);
  const salesSelectClass = assignedSalesObj
    ? assignedSalesObj.class
    : 'bg-dark-900 text-slate-400 border-slate-700';

  return `
    <tr class="hover:bg-slate-800/40 transition-colors group" data-id="${c.id}">
      <!-- Col A: วันที่รับ -->
      <td class="px-4 py-3.5 font-mono text-slate-300 text-xs">
        ${dateStr}
      </td>

      <!-- Col B: เวลา -->
      <td class="px-3 py-3.5 font-mono text-slate-400 text-xs">
        ${timeStr}
      </td>

      <!-- Col C: ที่มา -->
      <td class="px-4 py-3.5">
        <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-dark-900 border border-slate-700 text-slate-300">
          ${c.leadSource || 'FB เคพีศรีราชา'}
        </span>
      </td>

      <!-- Col D: ชื่อลูกค้า -->
      <td class="px-4 py-3.5">
        <div class="font-semibold text-slate-100 flex items-center space-x-1.5 cursor-pointer btn-view-customer hover:text-brand-400 transition-colors" data-id="${c.id}">
          <span>${c.name}</span>
          <i data-lucide="external-link" class="w-3 h-3 text-slate-500"></i>
        </div>
      </td>

      <!-- Col E: เบอร์โทร -->
      <td class="px-4 py-3.5">
        ${phoneHtml}
      </td>

      <!-- Col F: รถที่สนใจ -->
      <td class="px-4 py-3.5">
        <select class="select-vehicle bg-dark-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:border-brand-500 focus:outline-none" data-id="${c.id}">
          <option value="" ${!c.interestedVehicle ? 'selected' : ''}>-- เลือกรถ --</option>
          ${vehicleOptionsHtml}
        </select>
      </td>

      <!-- Col G: เซลล์ที่รับ -->
      <td class="px-4 py-3.5">
        <select class="select-sales border rounded-full px-3 py-1 text-xs font-bold focus:outline-none cursor-pointer ${salesSelectClass}" data-id="${c.id}">
          <option value="" ${!c.assignedSales ? 'selected' : ''}>-- ยังไม่จ่ายงาน --</option>
          ${salesOptionsHtml}
        </select>
      </td>

      <!-- Action: ส่งต่อให้เซลล์ & ปุ่มลบ -->
      <td class="px-4 py-3.5 text-right flex items-center justify-end space-x-1.5">
        <button
          class="btn-send-sales px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 hover:text-white text-xs font-medium transition-all flex items-center space-x-1"
          data-id="${c.id}"
          title="คัดลอกข้อความสรุปเคสส่งให้เซลล์ทาง LINE"
        >
          <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          <span>ส่งให้เซลล์</span>
        </button>

        <button
          class="btn-delete-row p-1.5 rounded-lg bg-dark-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-800 transition-all"
          data-id="${c.id}"
          title="ลบลูกค้ารายนี้"
        >
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </td>
    </tr>
  `;
}

// -------------------------------------------------------------
// EVENT HANDLERS & PERSISTENT UPDATES
// -------------------------------------------------------------

function attachTableEventHandlers() {
  // Vehicle Change Listener
  document.querySelectorAll('.select-vehicle').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const custId = e.target.getAttribute('data-id');
      const vehicle = e.target.value;

      // Update in Local Cache immediately (100% permanent)
      const list = getLocalCustomers();
      const item = list.find((x) => x.id === custId);
      if (item) {
        item.interestedVehicle = vehicle;
        saveLocalCustomers(list);
        updateLocalStats(list);
      }

      await updateCustomerAssignment(custId, { interestedVehicle: vehicle });
    });
  });

  // Sales Change Listener
  document.querySelectorAll('.select-sales').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const custId = e.target.getAttribute('data-id');
      const sales = e.target.value;

      // Update in Local Cache immediately (100% permanent)
      const list = getLocalCustomers();
      const item = list.find((x) => x.id === custId);
      if (item) {
        item.assignedSales = sales;
        saveLocalCustomers(list);
        filterAndRenderLocal();
      }

      await updateCustomerAssignment(custId, { assignedSales: sales });
    });
  });

  // Copy Phone Buttons
  document.querySelectorAll('.btn-copy-phone').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const phone = btn.getAttribute('data-phone');
      navigator.clipboard.writeText(phone).then(() => {
        showToast(`คัดลอกเบอร์ ${phone} เรียบร้อย!`, 'success');
      });
    });
  });

  // Delete Row Button
  document.querySelectorAll('.btn-delete-row').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const custId = btn.getAttribute('data-id');
      const ok = confirm('คุณต้องการลบข้อมูลเคสลูกค้ารายนี้ใช่หรือไม่?');
      if (!ok) return;
      await deleteCustomerById(custId);
    });
  });

  // Send Sales Button (LINE Template Generator)
  document.querySelectorAll('.btn-send-sales').forEach((btn) => {
    btn.addEventListener('click', async () => {
      e.stopPropagation();
      const custId = btn.getAttribute('data-id');
      const list = getLocalCustomers();
      const c = list.find((x) => x.id === custId);

      if (c) {
        const text = `🚛 เคสลูกค้าใหม่จาก ${c.leadSource || 'FB เคพีศรีราชา'}\n👤 ชื่อ: ${c.name}\n📞 เบอร์: ${formatPhoneDisplay(c.primaryPhone)}\n🚗 รถที่สนใจ: ${c.interestedVehicle || 'ไม่ได้ระบุ'}\n👨‍💼 เซลล์: ${c.assignedSales || 'ยังไม่ระบุ'}`;
        navigator.clipboard.writeText(text).then(() => {
          showToast(`คัดลอกข้อความส่งเคสให้เซลล์เรียบร้อย! สามารถวางส่งใน LINE ได้ทันที`, 'success');
        });
      } else {
        try {
          const res = await fetch(`/api/customers/${custId}/forward-sales`, { method: 'POST' });
          const data = await res.json();
          if (data.success && data.data?.text) {
            navigator.clipboard.writeText(data.data.text).then(() => {
              showToast(`คัดลอกข้อความส่งเคสให้เซลล์เรียบร้อย! สามารถวางส่งใน LINE ได้ทันที`, 'success');
            });
          }
        } catch {
          showToast('เกิดข้อผิดพลาดในการสร้างข้อความส่งเคส', 'error');
        }
      }
    });
  });

  // View Customer Profile Modal
  document.querySelectorAll('.btn-view-customer').forEach((btn) => {
    btn.addEventListener('click', () => {
      const custId = btn.getAttribute('data-id');
      openCustomerModal(custId);
    });
  });
}

// Delete Customer Helper
async function deleteCustomerById(customerId) {
  try {
    // Delete locally first
    const list = getLocalCustomers().filter((x) => x.id !== customerId);
    saveLocalCustomers(list);
    filterAndRenderLocal();
    showToast('ลบเคสลูกค้าเรียบร้อยแล้ว', 'success');

    // Sync deletion to server
    await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
  } catch (err) {
    console.error('Delete error:', err);
  }
}

// Update Assignment via API
async function updateCustomerAssignment(customerId, updates) {
  try {
    const res = await fetch(`/api/customers/${customerId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
    }
  } catch {
    showToast('บันทึกลงระบบเครื่องแล้ว', 'success');
  }
}

// Format Phone
function formatPhoneDisplay(p) {
  if (!p) return '-';
  if (p.length === 10) {
    return `${p.substring(0, 3)}-${p.substring(3)}`;
  }
  return p;
}

// Customer Profile Modal
async function openCustomerModal(customerId) {
  state.activeCustomerId = customerId;
  const modal = document.getElementById('customer-modal');
  modal.classList.remove('hidden');

  const list = getLocalCustomers();
  const c = list.find((x) => x.id === customerId);

  if (c) {
    document.getElementById('modal-customer-name').innerText = c.name;
    document.getElementById('modal-pancake-id').innerText = `Pancake ID: ${c.pancakeCustomerId || '-'} • ที่มา: ${c.leadSource || 'FB เคพีศรีราชา'}`;

    const phonesContainer = document.getElementById('modal-phones-list');
    if (c.primaryPhone) {
      phonesContainer.innerHTML = `
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-dark-950/70 border border-slate-800">
          <div>
            <div class="font-mono text-emerald-400 font-bold text-xs tracking-wider">${formatPhoneDisplay(c.primaryPhone)}</div>
            <div class="text-[10px] text-slate-500">เบอร์หลักของลูกค้า</div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            เบอร์โทรศัพท์
          </span>
        </div>
      `;
    } else {
      phonesContainer.innerHTML = `<div class="text-slate-500 italic">ยังไม่มีเบอร์โทรในระบบ</div>`;
    }

    renderMessageTimeline(c.messages || []);
    initLucide();
  }

  try {
    const res = await fetch(`/api/customers/${customerId}`);
    const data = await res.json();
    if (data.success && data.data) {
      const serverC = data.data;
      renderMessageTimeline(serverC.messages || []);
      initLucide();
    }
  } catch {
    // silent
  }
}

function renderMessageTimeline(messages) {
  const timelineContainer = document.getElementById('modal-messages-timeline');
  if (messages && messages.length > 0) {
    timelineContainer.innerHTML = messages.map((m) => {
      let phonesExtracted = [];
      try {
        phonesExtracted = JSON.parse(m.extractedPhones || '[]');
      } catch {
        phonesExtracted = [];
      }

      const phoneBadges = phonesExtracted.map((ph) => `
        <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
          🎯 ตรวจพบเบอร์: ${formatPhoneDisplay(ph)}
        </span>
      `).join(' ');

      return `
        <div class="p-3 rounded-xl bg-dark-950/80 border border-slate-800 space-y-1.5 group relative" id="msg-box-${m.id}">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span class="font-semibold text-brand-400">${m.senderType === 'ADMIN' ? 'แอดมิน' : 'ลูกค้า'}</span>
            <div class="flex items-center space-x-2">
              <span class="font-mono">${new Date(m.sentAt).toLocaleTimeString('th-TH')}</span>
              <button class="btn-delete-msg text-slate-600 hover:text-rose-400 transition-colors" data-msg-id="${m.id}" title="ลบข้อความนี้">
                <i data-lucide="trash" class="w-3 h-3"></i>
              </button>
            </div>
          </div>
          <p class="text-slate-200 text-xs">${escapeHtml(m.text)}</p>
          ${phoneBadges ? `<div class="pt-1 flex flex-wrap gap-1">${phoneBadges}</div>` : ''}
        </div>
      `;
    }).join('');
  } else {
    timelineContainer.innerHTML = `<div class="text-slate-500 italic p-3">ไม่มีประวัติข้อความ</div>`;
  }
}

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

    const res = await fetch('/api/webhooks/pancake', {
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
        loadCustomers();
        loadStats();
      }, 500);
    } else {
      responseBox.className = 'p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 font-mono text-[11px] block';
      responseBox.innerHTML = `❌ HTTP ${res.status}: ${data.error || 'Webhook Error'}`;
    }
  } catch (err) {
    responseBox.classList.remove('hidden');
    responseBox.className = 'p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 font-mono text-[11px] block';
    responseBox.innerHTML = `❌ Network Error: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="send" class="w-3.5 h-3.5"></i><span>ส่ง Webhook เข้าสู่ระบบ</span>`;
    initLucide();
  }
}

// -------------------------------------------------------------
// CHARTS & VISUALIZATION
// -------------------------------------------------------------

function renderVehicleChart(breakdown = {}) {
  const ctx = document.getElementById('vehicleChart') || document.getElementById('vehicleDemandChart');
  if (!ctx) return;

  const validEntries = Object.entries(breakdown).filter(([k, v]) => v > 0);
  let labels = validEntries.map(([k]) => k);
  let values = validEntries.map(([, v]) => v);

  if (labels.length === 0) {
    labels = ['หัวลาก', 'ตู้10', 'หาง', 'ดั้ม'];
    values = [0, 0, 0, 0];
  }

  if (state.vehicleChartInstance) {
    try {
      state.vehicleChartInstance.destroy();
    } catch {
      // ignore
    }
  }

  state.vehicleChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ['#0ea5e9', '#f97316', '#10b981', '#a855f7', '#f43f5e', '#eab308', '#64748b', '#06b6d4'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 },
        },
      },
      cutout: '65%',
    },
  });
}

function renderSalesChart(breakdown = {}) {
  const ctx = document.getElementById('salesChart') || document.getElementById('salesPerformanceChart');
  if (!ctx) return;

  const labels = SALES_OPTIONS.map((s) => s.name);
  const values = labels.map((name) => breakdown[name] || 0);
  const colors = SALES_OPTIONS.map((s) => s.chartColor);

  if (state.salesChartInstance) {
    try {
      state.salesChartInstance.destroy();
    } catch {
      // ignore
    }
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
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11, weight: 'bold' } } },
        y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', stepSize: 1 }, beginAtZero: true },
      },
    },
  });
}

// -------------------------------------------------------------
// UTILITIES
// -------------------------------------------------------------

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass =
    type === 'success'
      ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
      : type === 'error'
      ? 'bg-rose-950/90 border-rose-600 text-rose-200'
      : 'bg-dark-900 border-slate-700 text-slate-200';

  toast.className = `px-4 py-2.5 rounded-xl border shadow-xl flex items-center space-x-2 text-xs font-medium backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" class="w-4 h-4 flex-shrink-0"></i>
    <span>${msg}</span>
  `;

  container.appendChild(toast);
  initLucide();

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
