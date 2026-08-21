/**
 * Pancake Customer Intelligence & Sales Lead CRM Controller
 */

// Application State
const state = {
  page: 1,
  limit: 20,
  source: 'ALL',
  hasPhone: false,
  search: '',
  totalPages: 1,
  totalCustomers: 0,
  activeCustomerId: null,
  vehicleChartInstance: null,
  salesChartInstance: null,
};

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

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  initLucide();
  initEventListeners();
  loadStats();
  loadCustomers();
  initSimulatorPayload('tractor');
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
      loadCustomers();
    }, 300);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    state.search = '';
    state.page = 1;
    loadCustomers();
    searchInput.focus();
  });

  // Source Filter Chips
  document.querySelectorAll('.source-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.source-tab').forEach((t) => {
        t.classList.remove('bg-brand-500', 'text-white');
        t.classList.add('text-slate-400');
      });
      tab.classList.add('bg-brand-500', 'text-white');
      tab.classList.remove('text-slate-400');

      const src = tab.getAttribute('data-source');
      state.source = src === 'ALL' ? 'ALL' : src;
      state.page = 1;
      loadCustomers();
    });
  });

  // Has Phone Checkbox
  document.getElementById('filter-has-phone').addEventListener('change', (e) => {
    state.hasPhone = e.target.checked;
    state.page = 1;
    loadCustomers();
  });

  // Refresh Table Button
  document.getElementById('btn-refresh-table').addEventListener('click', () => {
    loadStats();
    loadCustomers();
    showToast('อัปเดตข้อมูลเรียบร้อยแล้ว', 'info');
  });

  // Clear All Data Button
  document.getElementById('btn-clear-all').addEventListener('click', async () => {
    const ok = confirm('⚠️ คุณต้องการลบข้อมูลลูกค้าและประวัติแชททั้งหมดในระบบใช่หรือไม่?');
    if (!ok) return;

    try {
      const res = await fetch('/api/customers/all/clear', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว', 'success');
        loadStats();
        loadCustomers();
      } else {
        showToast(data.error || 'ไม่สามารถลบข้อมูลได้', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
    }
  });

  // Pagination Buttons
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

  // Copy Webhook URL
  document.getElementById('copy-webhook-btn').addEventListener('click', () => {
    const fullUrl = window.location.origin + '/api/webhooks/pancake';
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('คัดลอก Webhook URL เรียบร้อย!', 'success');
    });
  });

  // Export CSV Button
  document.getElementById('btn-export-csv').addEventListener('click', () => {
    window.location.href = '/api/customers/export/csv';
    showToast('กำลังดาวน์โหลดไฟล์ Excel/CSV...', 'info');
  });

  // Sync Google Sheets Button
  document.getElementById('btn-sync-sheets').addEventListener('click', async () => {
    try {
      showToast('กำลังซิงค์ข้อมูลไปยัง Google Sheets...', 'info');
      const res = await fetch('/api/customers/sync/sheets', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'ซิงค์ Google Sheets สำเร็จ!', 'success');
      } else {
        showToast(data.error || 'ซิงค์ Google Sheets ไม่สำเร็จ', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets', 'error');
    }
  });

  // Modal Controls
  document.getElementById('btn-close-modal').addEventListener('click', closeCustomerModal);
  document.getElementById('btn-close-modal-footer').addEventListener('click', closeCustomerModal);

  // Delete Customer from Modal Footer
  document.getElementById('btn-delete-current-customer').addEventListener('click', async () => {
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

// Load Stats & Render Charts
async function loadStats() {
  try {
    const res = await fetch('/api/customers/stats');
    const data = await res.json();
    if (!data.success) return;

    const stats = data.data;

    // Update KPI Numbers
    document.getElementById('stat-total-customers').innerText = stats.totalCustomers.toLocaleString();
    document.getElementById('stat-total-phones').innerText = stats.totalWithPhones.toLocaleString();
    document.getElementById('stat-total-messages').innerText = stats.totalMessages.toLocaleString();

    let assignedCount = 0;
    if (stats.salesBreakdown) {
      Object.values(stats.salesBreakdown).forEach((cnt) => (assignedCount += Number(cnt)));
    }
    document.getElementById('stat-total-assigned').innerText = assignedCount.toLocaleString();

    const phoneRate = stats.totalCustomers > 0
      ? Math.round((stats.totalWithPhones / stats.totalCustomers) * 100)
      : 0;
    document.getElementById('stat-phone-rate').innerText = `${phoneRate}%`;

    // Update Sales Team Counters for all 8 members
    SALES_OPTIONS.forEach((sales) => {
      const el = document.getElementById(`team-count-${sales.name}`);
      if (el) {
        const count = (stats.salesBreakdown && stats.salesBreakdown[sales.name]) || 0;
        el.innerText = `${count}`;
      }
    });

    // Render Charts
    renderVehicleChart(stats.vehicleBreakdown);
    renderSalesChart(stats.salesBreakdown);
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Load Customer List
async function loadCustomers() {
  const tbody = document.getElementById('customer-table-body');
  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="px-5 py-8 text-center text-slate-500">
        <i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-brand-500"></i>
        <span>กำลังโหลดข้อมูลลูกค้า...</span>
      </td>
    </tr>
  `;
  initLucide();

  try {
    const params = new URLSearchParams({
      page: state.page,
      limit: state.limit,
    });

    if (state.source !== 'ALL') params.append('lead_source', state.source);
    if (state.hasPhone) params.append('has_phone', 'true');
    if (state.search) params.append('search', state.search);

    const res = await fetch(`/api/customers?${params.toString()}`);
    const data = await res.json();

    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-400">Failed to load data</td></tr>`;
      return;
    }

    const customers = data.data;
    state.totalPages = data.pagination.totalPages || 1;
    state.totalCustomers = data.pagination.total || 0;

    // Update Pagination UI
    document.getElementById('pagination-summary').innerText = `แสดง ${customers.length} จาก ${data.pagination.total} รายการ`;
    document.getElementById('pagination-current-page').innerText = `${data.pagination.page} / ${state.totalPages}`;
    document.getElementById('btn-prev-page').disabled = data.pagination.page <= 1;
    document.getElementById('btn-next-page').disabled = data.pagination.page >= state.totalPages;

    if (customers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-5 py-12 text-center text-slate-500">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
            <p class="font-medium text-slate-400">ยังไม่มีข้อมูลลูกค้า</p>
            <p class="text-xs text-slate-500 mt-1">กดปุ่ม "จำลองแชทลูกค้า (Simulator)" ด้านบน เพื่อทดสอบเพิ่มลูกค้าและสกัดเบอร์โทรได้ทันที!</p>
          </td>
        </tr>
      `;
      initLucide();
      return;
    }

    tbody.innerHTML = customers.map((c) => renderCustomerRow(c)).join('');
    initLucide();

    // Attach Event Handlers
    attachTableEventHandlers();

  } catch (err) {
    console.error('Failed to load customers:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-400">Error loading customer list</td></tr>`;
  }
}

// Render Single Table Row
function renderCustomerRow(c) {
  const dateObj = new Date(c.lastContactAt || c.firstContactAt);
  const dateStr = c.receivedDate || `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
  const timeStr = c.receivedTime || `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

  // Phone Column
  let phoneHtml = '<span class="text-slate-500 text-xs italic">ยังไม่ได้เบอร์</span>';
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

// Attach Event Listeners to Table elements
function attachTableEventHandlers() {
  // Vehicle Change Listener
  document.querySelectorAll('.select-vehicle').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const custId = e.target.getAttribute('data-id');
      const vehicle = e.target.value;
      await updateCustomerAssignment(custId, { interestedVehicle: vehicle });
      loadStats();
    });
  });

  // Sales Change Listener
  document.querySelectorAll('.select-sales').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const custId = e.target.getAttribute('data-id');
      const sales = e.target.value;
      await updateCustomerAssignment(custId, { assignedSales: sales });
      loadStats();
      loadCustomers();
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
      const ok = confirm('คุณต้องการลบข้อมูลลูกค้ารายนี้ใช่หรือไม่?');
      if (!ok) return;
      await deleteCustomerById(custId);
    });
  });

  // Send Sales Button (LINE Template Generator)
  document.querySelectorAll('.btn-send-sales').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const custId = btn.getAttribute('data-id');
      try {
        const res = await fetch(`/api/customers/${custId}/forward-sales`, { method: 'POST' });
        const data = await res.json();
        if (data.success && data.data?.text) {
          navigator.clipboard.writeText(data.data.text).then(() => {
            showToast(`คัดลอกข้อความส่งเคสให้เซลล์เรียบร้อย! สามารถวางส่งใน LINE ได้ทันที`, 'success');
          });
        }
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการสร้างข้อความส่งเคส', 'error');
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
    const res = await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('ลบข้อมูลลูกค้าเรียบร้อยแล้ว', 'success');
      loadStats();
      loadCustomers();
    } else {
      showToast(data.error || 'ลบข้อมูลไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
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
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
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

  try {
    const res = await fetch(`/api/customers/${customerId}`);
    const data = await res.json();
    if (!data.success) return;

    const c = data.data;
    document.getElementById('modal-customer-name').innerText = c.name;
    document.getElementById('modal-pancake-id').innerText = `Pancake ID: ${c.pancakeCustomerId} • ที่มา: ${c.leadSource || 'FB เคพีศรีราชา'}`;

    // Phones list
    const phonesContainer = document.getElementById('modal-phones-list');
    if (c.phones && c.phones.length > 0) {
      phonesContainer.innerHTML = c.phones.map((p) => `
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-dark-950/70 border border-slate-800">
          <div>
            <div class="font-mono text-emerald-400 font-bold text-xs tracking-wider">${formatPhoneDisplay(p.phoneNumber)}</div>
            <div class="text-[10px] text-slate-500">ข้อความดิบ: "${p.rawExtracted}" • รูปแบบสากล: ${p.e164Format}</div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ${p.carrier || 'AIS'}
          </span>
        </div>
      `).join('');
    } else {
      phonesContainer.innerHTML = `<div class="text-slate-500 italic">ยังไม่มีเบอร์โทรในระบบ</div>`;
    }

    // Message timeline with delete message button
    renderMessageTimeline(c.messages || []);

    initLucide();
  } catch (err) {
    console.error('Failed to load customer profile modal:', err);
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

    // Attach message delete listeners
    document.querySelectorAll('.btn-delete-msg').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const msgId = btn.getAttribute('data-msg-id');
        try {
          const res = await fetch(`/api/customers/messages/${msgId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            const el = document.getElementById(`msg-box-${msgId}`);
            if (el) el.remove();
            showToast('ลบข้อความเรียบร้อยแล้ว', 'success');
            loadStats();
          }
        } catch (err) {
          showToast('ลบข้อความไม่สำเร็จ', 'error');
        }
      });
    });
  } else {
    timelineContainer.innerHTML = `<div class="text-slate-500 italic p-3">ไม่มีประวัติข้อความ</div>`;
  }
}

function closeCustomerModal() {
  document.getElementById('customer-modal').classList.add('hidden');
  state.activeCustomerId = null;
}

// Webhook Simulator
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

// Chart.js Visualizations
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
          backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899'],
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

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
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
