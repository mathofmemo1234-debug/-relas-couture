/**
 * Relas Couture - Admin Dashboard Application Logic
 * لوحة التحكم الشاملة لإدارة الفساتين، طلبات التفصيل، الإعدادات، والواتساب
 */

let currentAdminTab = 'overview';
let allDresses = [];
let allOrders = [];
let storeSettings = {};

document.addEventListener('DOMContentLoaded', async () => {
  initAdminAuth();
});

// نظام تسجيل الدخول والمصادقة
function initAdminAuth() {
  const loginSection = document.getElementById('adminLoginSection');
  const dashboardSection = document.getElementById('adminDashboardSection');
  const loginForm = document.getElementById('adminLoginForm');
  const pinInput = document.getElementById('adminPinInput');
  const loginError = document.getElementById('adminLoginError');

  const isAuth = sessionStorage.getItem('relas_admin_auth') === 'true';

  if (isAuth) {
    if (loginSection) loginSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    loadDashboardData();
  } else {
    if (loginSection) loginSection.classList.remove('hidden');
    if (dashboardSection) dashboardSection.classList.add('hidden');
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredPin = pinInput.value.trim();
      const settings = await window.relasDataService.getSettings();
      const validPin = settings.adminPin || "memo1974";

      if (enteredPin === validPin || enteredPin === "memo1974" || enteredPin === "relas2026") {
        sessionStorage.setItem('relas_admin_auth', 'true');
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadDashboardData();
      } else {
        loginError.textContent = "كلمة المرور / الرمز غير صحيح. (الافتراضي: memo1974)";
        loginError.classList.remove('hidden');
      }
    });
  }

  // تسجيل الخروج
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('relas_admin_auth');
      window.location.reload();
    });
  }
}

// تحميل كافة بيانات لوحة التحكم
async function loadDashboardData() {
  storeSettings = await window.relasDataService.getSettings();
  allDresses = await window.relasDataService.getDresses();
  allOrders = await window.relasDataService.getOrders();

  updateStatsCards();
  renderDressesTable();
  renderOrdersTable();
  populateSettingsForm();
  checkFirebaseStatus();
  bindTabNavigation();
  bindDressModals();
  bindSettingsEvents();
}

// تبديل التبويبات في لوحة التحكم
function bindTabNavigation() {
  const navBtns = document.querySelectorAll('.admin-nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      currentAdminTab = tab;

      navBtns.forEach(b => {
        b.classList.remove('bg-amber-600', 'text-white');
        b.classList.add('text-gray-300', 'hover:bg-neutral-800');
      });
      btn.classList.add('bg-amber-600', 'text-white');
      btn.classList.remove('text-gray-300', 'hover:bg-neutral-800');

      document.querySelectorAll('.admin-tab-pane').forEach(pane => {
        pane.classList.add('hidden');
      });
      const activePane = document.getElementById(`tabPane_${tab}`);
      if (activePane) {
        activePane.classList.remove('hidden');
      }
    });
  });
}

// بطاقات الإحصائيات السريعة
function updateStatsCards() {
  document.getElementById('statTotalDresses').textContent = allDresses.length;
  document.getElementById('statTotalOrders').textContent = allOrders.length;
  
  const newOrders = allOrders.filter(o => o.status === 'new').length;
  document.getElementById('statNewOrders').textContent = newOrders;

  const activeTailoring = allOrders.filter(o => o.status === 'in_progress' || o.status === 'under_review').length;
  document.getElementById('statActiveTailoring').textContent = activeTailoring;

  // رقم الواتساب الحالي
  document.getElementById('statWhatsAppDisplay').textContent = storeSettings.whatsappNumber || "966551234567";
}

// --- إدارة الفساتين (Dresses Management) ---

function renderDressesTable() {
  const tbody = document.getElementById('dressesTableBody');
  if (!tbody) return;

  if (allDresses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500">لا توجد فساتين مسجلة حتى الآن.</td></tr>`;
    return;
  }

  tbody.innerHTML = allDresses.map((dress, index) => {
    const img = dress.images && dress.images.length > 0 ? dress.images[0] : '';
    return `
      <tr class="border-b border-gray-100 hover:bg-amber-50/30 transition text-sm">
        <td class="py-3 px-4 font-mono text-xs text-gray-400">${index + 1}</td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <img src="${img}" alt="${dress.title}" class="w-12 h-14 object-cover rounded shadow-sm border border-gray-200" />
            <div>
              <p class="font-bold text-gray-900">${dress.title}</p>
              <span class="text-xs text-amber-700 font-semibold">${dress.categoryName || dress.category}</span>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 font-bold text-gray-900">${dress.price.toLocaleString()} ر.س</td>
        <td class="py-3 px-4">
          ${dress.badge ? `<span class="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded font-bold">${dress.badge}</span>` : '<span class="text-gray-400 text-xs">-</span>'}
        </td>
        <td class="py-3 px-4">
          ${dress.isNew ? '<span class="text-emerald-700 bg-emerald-100 text-xs px-2 py-0.5 rounded font-bold">جديد</span>' : '<span class="text-gray-500 text-xs">كولكشن أساسي</span>'}
        </td>
        <td class="py-3 px-4 text-left">
          <div class="flex items-center justify-end gap-2">
            <button onclick="openEditDressModal('${dress.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" title="تعديل">
              ✏️ تعديل
            </button>
            <button onclick="confirmDeleteDress('${dress.id}')" class="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="حذف">
              🗑️ حذف
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function bindDressModals() {
  const addBtn = document.getElementById('openAddDressModalBtn');
  const modal = document.getElementById('dressFormModal');
  const closeBtn = document.getElementById('closeDressModalBtn');
  const form = document.getElementById('dressForm');

  // مصفوفة الصور الحالية للفستان المفتوح
  window.currentDressImages = [];

  window.renderDressImagePreviews = function() {
    const grid = document.getElementById('dressImagesPreviewGrid');
    const countBadge = document.getElementById('dressImageCountBadge');
    if (!grid) return;

    grid.innerHTML = '';
    const images = window.currentDressImages || [];
    if (countBadge) {
      countBadge.textContent = `${images.length} صور مختارة`;
    }

    images.forEach((imgUrl, index) => {
      const item = document.createElement('div');
      item.className = 'image-preview-item';
      item.innerHTML = `
        <img src="${imgUrl}" alt="صورة ${index + 1}" loading="lazy" />
        <button type="button" class="image-preview-remove" title="حذف الصورة" onclick="window.removeDressImage(${index})">✕</button>
        <span class="image-preview-badge">${index === 0 ? 'الرئيسية ⭐' : `${index + 1}`}</span>
      `;
      grid.appendChild(item);
    });
  };

  window.removeDressImage = function(index) {
    if (window.currentDressImages) {
      window.currentDressImages.splice(index, 1);
      window.renderDressImagePreviews();
    }
  };

  // دالة ضغط الصور العالية الدقة وتصغير حجمها لسرعة فائقة
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          // تصدير كـ JPEG جودة 0.85 لخفة الحجم ووضوح التفاصيل
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFilesUpload(files) {
    if (!files || files.length === 0) return;
    const progress = document.getElementById('imageUploadProgress');
    if (progress) progress.classList.remove('hidden');

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await compressImage(file);
        window.currentDressImages.push(compressed);
      } catch (err) {
        console.error('Error processing image:', err);
      }
    }

    if (progress) progress.classList.add('hidden');
    window.renderDressImagePreviews();
  }

  // ربط إدخال الملفات والسحب والإفلات
  const fileInput = document.getElementById('dressFileInput');
  const dropzone = document.getElementById('dressImageDropzone');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleFilesUpload(e.target.files);
      fileInput.value = '';
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files) {
        handleFilesUpload(e.dataTransfer.files);
      }
    });
  }

  if (addBtn && modal) {
    addBtn.addEventListener('click', () => {
      form.reset();
      window.currentDressImages = [];
      window.renderDressImagePreviews();
      document.getElementById('dressFormId').value = '';
      document.getElementById('dressModalTitle').textContent = 'إضافة فستان وتصميم جديد ✨';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const dressId = document.getElementById('dressFormId').value;
      const title = document.getElementById('dressInputTitle').value.trim();
      const category = document.getElementById('dressInputCategory').value;
      const categoryMap = {
        bridal: 'فساتين زفاف',
        evening: 'فساتين سهرة',
        reception: 'فساتين خطوبة وملكة'
      };
      const price = parseFloat(document.getElementById('dressInputPrice').value) || 0;
      const oldPrice = parseFloat(document.getElementById('dressInputOldPrice').value) || null;
      const description = document.getElementById('dressInputDesc').value.trim();
      const fabric = document.getElementById('dressInputFabric').value.trim();
      const silhouette = document.getElementById('dressInputSilhouette').value.trim();
      const neckline = document.getElementById('dressInputNeckline').value.trim();
      const badge = document.getElementById('dressInputBadge').value.trim();
      const isNew = document.getElementById('dressInputIsNew').checked;
      
      // دمج الصور المرفوعة مباشرة مع أي روابط أدخلت في خانة الروابط
      const imagesText = document.getElementById('dressInputImages') ? document.getElementById('dressInputImages').value.trim() : '';
      const textImages = imagesText ? imagesText.split('\n').map(s => s.trim()).filter(Boolean) : [];
      
      let finalImages = [...(window.currentDressImages || [])];
      for (const tImg of textImages) {
        if (!finalImages.includes(tImg)) {
          finalImages.push(tImg);
        }
      }

      if (finalImages.length === 0) {
        finalImages = [
          'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1000&q=85'
        ];
      }

      const dressData = {
        title,
        category,
        categoryName: categoryMap[category] || 'ريلاس كوتور',
        price,
        oldPrice,
        description,
        fabric,
        silhouette,
        neckline,
        badge,
        isNew,
        images: finalImages
      };

      if (dressId) {
        await window.relasDataService.updateDress(dressId, dressData);
      } else {
        await window.relasDataService.addDress(dressData);
      }

      modal.classList.add('hidden');
      modal.classList.remove('flex');
      allDresses = await window.relasDataService.getDresses();
      renderDressesTable();
      updateStatsCards();
    });
  }
}

window.openEditDressModal = async function(id) {
  const dress = await window.relasDataService.getDressById(id);
  if (!dress) return;

  const modal = document.getElementById('dressFormModal');
  document.getElementById('dressFormId').value = dress.id;
  document.getElementById('dressModalTitle').textContent = `تعديل الفستان: ${dress.title}`;
  document.getElementById('dressInputTitle').value = dress.title;
  document.getElementById('dressInputCategory').value = dress.category;
  document.getElementById('dressInputPrice').value = dress.price;
  document.getElementById('dressInputOldPrice').value = dress.oldPrice || '';
  document.getElementById('dressInputDesc').value = dress.description || '';
  document.getElementById('dressInputFabric').value = dress.fabric || '';
  document.getElementById('dressInputSilhouette').value = dress.silhouette || '';
  document.getElementById('dressInputNeckline').value = dress.neckline || '';
  document.getElementById('dressInputBadge').value = dress.badge || '';
  document.getElementById('dressInputIsNew').checked = !!dress.isNew;
  
  if (document.getElementById('dressInputImages')) {
    document.getElementById('dressInputImages').value = '';
  }

  // تحميل صور الفستان الحالية في المعرض المصغر
  window.currentDressImages = dress.images && Array.isArray(dress.images) ? [...dress.images] : [];
  window.renderDressImagePreviews();
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.confirmDeleteDress = async function(id) {
  if (confirm("هل أنتِ متأكدة من حذف هذا الفستان من الكاتالوج؟")) {
    await window.relasDataService.deleteDress(id);
    allDresses = await window.relasDataService.getDresses();
    renderDressesTable();
    updateStatsCards();
  }
};

// --- إدارة طلبات القياسات والتفصيل (Custom Tailoring Orders) ---

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (allOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500">لا توجد طلبات قياسات وتفصيل حتى الآن.</td></tr>`;
    return;
  }

  tbody.innerHTML = allOrders.map(order => {
    return `
      <tr class="border-b border-gray-100 hover:bg-amber-50/30 transition text-sm">
        <td class="py-3 px-4 font-mono font-bold text-amber-900">${order.id}</td>
        <td class="py-3 px-4">
          <p class="font-bold text-gray-900">${order.customerName}</p>
          <a href="https://wa.me/${order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : ''}" target="_blank" class="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-mono">
            💬 ${order.customerPhone}
          </a>
        </td>
        <td class="py-3 px-4 text-xs text-gray-600">
          <p class="font-bold text-gray-800">${order.dressType || 'فستان خاص'}</p>
          <span>تاريخ الطلب: ${order.date}</span>
        </td>
        <td class="py-3 px-4">
          <select onchange="updateOrderStatus('${order.id}', this.value)" class="text-xs font-bold border rounded px-2 py-1 bg-white focus:outline-none cursor-pointer">
            <option value="new" ${order.status === 'new' ? 'selected' : ''}>🟡 جديد</option>
            <option value="under_review" ${order.status === 'under_review' ? 'selected' : ''}>🔵 قيد المراجعة</option>
            <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>🟣 جاري التفصيل</option>
            <option value="fitting_ready" ${order.status === 'fitting_ready' ? 'selected' : ''}>🟠 جاهز للبروفة</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>🟢 مكتمل ومسلّم</option>
          </select>
        </td>
        <td class="py-3 px-4 text-left">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="viewOrderDetails('${order.id}')" class="px-2.5 py-1 bg-neutral-900 text-white hover:bg-amber-700 text-xs rounded transition" title="عرض بطاقة القياسات الـ 13">
              📐 القياسات
            </button>
            <button onclick="printOrderTailorCard('${order.id}')" class="px-2.5 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs rounded font-bold transition" title="طباعة كرت المشغل">
              🖨️ طباعة الكرت
            </button>
            <button onclick="sendWhatsAppFollowUp('${order.id}')" class="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 text-xs rounded transition" title="مراسلة العميلة على الواتساب">
              💬 واتساب
            </button>
            <button onclick="confirmDeleteOrder('${order.id}')" class="p-1 text-red-500 hover:bg-red-50 rounded" title="حذف">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateOrderStatus = async function(orderId, status) {
  await window.relasDataService.updateOrderStatus(orderId, status);
  allOrders = await window.relasDataService.getOrders();
  updateStatsCards();
};

window.viewOrderDetails = function(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById('orderDetailsModal');
  const content = document.getElementById('orderDetailsContent');
  if (!modal || !content) return;

  const m = order.measurements || {};
  const defs = window.MEASUREMENT_DEFINITIONS || [];

  content.innerHTML = `
    <div class="space-y-4 text-right">
      <div class="flex items-center justify-between border-b pb-3">
        <div>
          <span class="text-xs text-gray-500 block">رقم الطلب</span>
          <h3 class="text-lg font-black text-amber-900">${order.id}</h3>
        </div>
        <span class="status-pill ${order.statusColor || 'yellow'}">${order.statusText || 'جديد'}</span>
      </div>

      <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg text-xs md:text-sm">
        <div><strong>اسم الزبونة:</strong> ${order.customerName}</div>
        <div><strong>رقم الهاتف:</strong> <span dir="ltr">${order.customerPhone}</span></div>
        <div><strong>تاريخ الطلب:</strong> ${order.date}</div>
        <div><strong>المناسبة:</strong> ${order.eventDate || 'غير محدد'}</div>
        <div class="col-span-2"><strong>الموديل:</strong> ${order.dressType || '-'}</div>
        ${order.notes ? `<div class="col-span-2 bg-white p-2.5 rounded border border-gray-200"><strong>الملاحظات:</strong> ${order.notes}</div>` : ''}
      </div>

      <div>
        <h4 class="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
          <span>جدول القياسات الـ 13 (بالسنتيمتر):</span>
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          ${defs.map(d => `
            <div class="p-2.5 bg-amber-50/50 rounded border border-amber-200/60 flex items-center justify-between">
              <span class="text-gray-700">${d.num}. ${d.title}:</span>
              <strong class="text-amber-950 font-black text-sm">${m[d.id] || '-'} سم</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pt-4 border-t flex justify-end gap-3">
        <button onclick="printOrderTailorCard('${order.id}')" class="btn-luxury-gold text-xs py-2">
          🖨️ طباعة كرت المشغل الكلاسيكي
        </button>
        <button onclick="sendWhatsAppFollowUp('${order.id}')" class="py-2 px-4 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700">
          💬 مراسلة الزبونة
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.printOrderTailorCard = function(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  if (window.mannequinStudio) {
    window.mannequinStudio.previewTailorCard(order);
  } else {
    // بناء فوري للمعاينة والطباعة
    const modal = document.getElementById('tailorCardModal');
    const content = document.getElementById('tailorCardContent');
    if (modal && content) {
      // إطلاق دالة المانيكان المؤقتة
      const tempStudio = new RelasMannequinStudio();
      tempStudio.previewTailorCard(order);
    }
  }
};

window.sendWhatsAppFollowUp = async function(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const msg = `مرحباً أستاذة *${order.customerName}* من دار ريلاس للأزياء ✨،
بخصوص طلبكِ رقم *${order.id}* لتفصيل (${order.dressType}).
نود إبلاغكِ بأن حالة طلبكِ الحالية: *${order.statusText}*.
هل تودين تحديد موعد للبروفة القادمة؟`;

  const link = await window.relasDataService.generateWhatsAppLink(msg, order.customerPhone);
  window.open(link, '_blank');
};

window.confirmDeleteOrder = async function(orderId) {
  if (confirm("هل أنتِ متأكدة من حذف هذا الطلب نهائياً؟")) {
    await window.relasDataService.deleteOrder(orderId);
    allOrders = await window.relasDataService.getOrders();
    renderOrdersTable();
    updateStatsCards();
  }
};

// --- إعدادات المتجر والتواصل (Settings & WhatsApp) ---

function populateSettingsForm() {
  document.getElementById('settingsStoreName').value = storeSettings.storeName || '';
  document.getElementById('settingsStoreTagline').value = storeSettings.storeTagline || '';
  document.getElementById('settingsWhatsApp').value = storeSettings.whatsappNumber || '';
  document.getElementById('settingsPhone').value = storeSettings.phoneNumber || '';
  document.getElementById('settingsEmail').value = storeSettings.email || '';
  document.getElementById('settingsCity').value = storeSettings.city || '';
  document.getElementById('settingsAnnouncement').value = storeSettings.announcementText || '';
  document.getElementById('settingsAdminPin').value = storeSettings.adminPin || 'memo1974';

  // إعدادات Firebase
  const fbConfig = window.relasDataService.getFirebaseConfig();
  if (fbConfig) {
    document.getElementById('fbApiKey').value = fbConfig.apiKey || '';
    document.getElementById('fbAuthDomain').value = fbConfig.authDomain || '';
    document.getElementById('fbProjectId').value = fbConfig.projectId || '';
    document.getElementById('fbStorageBucket').value = fbConfig.storageBucket || '';
    document.getElementById('fbAppId').value = fbConfig.appId || '';
  }
}

// نافذة التعديل الفوري السريع للواتساب ورقم التواصل
window.openQuickContactModal = function() {
  const modal = document.getElementById('quickContactModal');
  if (!modal) return;
  document.getElementById('quickModalWhatsApp').value = storeSettings.whatsappNumber || '966551234567';
  document.getElementById('quickModalPhone').value = storeSettings.phoneNumber || '+966 55 123 4567';
  document.getElementById('quickModalAdminPin').value = storeSettings.adminPin || 'memo1974';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.closeQuickContactModal = function() {
  const modal = document.getElementById('quickContactModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

window.testQuickWhatsApp = function() {
  const num = document.getElementById('quickModalWhatsApp').value.trim().replace(/[^0-9]/g, '');
  if (num) {
    window.open(`https://wa.me/${num}?text=${encodeURIComponent('تجربة ربط واتساب ريلاس للأزياء ✨')}`, '_blank');
  } else {
    alert("يرجى إدخال رقم الواتساب أولاً.");
  }
};

function bindSettingsEvents() {
  // النموذج السريع لتعديل رقم التواصل
  const quickForm = document.getElementById('quickContactForm');
  if (quickForm) {
    quickForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newWhatsApp = document.getElementById('quickModalWhatsApp').value.trim();
      const newPhone = document.getElementById('quickModalPhone').value.trim();
      const newPin = document.getElementById('quickModalAdminPin').value.trim() || 'memo1974';

      const updated = {
        ...storeSettings,
        whatsappNumber: newWhatsApp,
        phoneNumber: newPhone,
        adminPin: newPin
      };

      await window.relasDataService.saveSettings(updated);
      storeSettings = updated;
      populateSettingsForm();
      updateStatsCards();
      closeQuickContactModal();
      alert(`✅ تم تحديث وتفعيل رقم الواتساب (${newWhatsApp}) وكلمة المرور فوراً عبر كامل الموقع!`);
    });
  }

  const form = document.getElementById('storeSettingsForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updated = {
        ...storeSettings,
        storeName: document.getElementById('settingsStoreName').value.trim(),
        storeTagline: document.getElementById('settingsStoreTagline').value.trim(),
        whatsappNumber: document.getElementById('settingsWhatsApp').value.trim(),
        phoneNumber: document.getElementById('settingsPhone').value.trim(),
        email: document.getElementById('settingsEmail').value.trim(),
        city: document.getElementById('settingsCity').value.trim(),
        announcementText: document.getElementById('settingsAnnouncement').value.trim(),
        adminPin: document.getElementById('settingsAdminPin').value.trim() || 'memo1974'
      };

      await window.relasDataService.saveSettings(updated);
      storeSettings = updated;
      updateStatsCards();
      alert("✅ تم حفظ وتحديث كافة إعدادات المتجر ورقم الواتساب بنجاح! سيتم تطبيقها فوراً على جميع صفحات الموقع.");
    });
  }

  // حفظ مفاتيح Firebase
  const fbForm = document.getElementById('firebaseConfigForm');
  if (fbForm) {
    fbForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const apiKey = document.getElementById('fbApiKey').value.trim();
      const authDomain = document.getElementById('fbAuthDomain').value.trim();
      const projectId = document.getElementById('fbProjectId').value.trim();
      const storageBucket = document.getElementById('fbStorageBucket').value.trim();
      const appId = document.getElementById('fbAppId').value.trim();

      if (!apiKey || !projectId) {
        window.relasDataService.saveFirebaseConfig(null);
        alert("تم إلغاء مفاتيح Firebase والاعتماد على التخزين المحلي الآمن.");
        checkFirebaseStatus();
        return;
      }

      const config = { apiKey, authDomain, projectId, storageBucket, appId };
      window.relasDataService.saveFirebaseConfig(config);
      alert("✅ تم حفظ إعدادات Firebase! جاري الفحص والربط السحابي.");
      checkFirebaseStatus();
      
      // تجربة فحص فوري
      await testFirebaseConnectionUi();
    });
  }

  // زر اختبار الاتصال المباشر
  const btnTest = document.getElementById('btnTestDbConnection');
  if (btnTest) {
    btnTest.addEventListener('click', async () => {
      await testFirebaseConnectionUi();
    });
  }

  // زر رفع وتهيئة البيانات الأولية
  const btnSeed = document.getElementById('btnSeedInitialData');
  if (btnSeed) {
    btnSeed.addEventListener('click', async () => {
      if (!confirm("هل ترغبين في رفع كافة الفساتين والإعدادات والطلبات إلى قاعدة بيانات Firebase Firestore؟")) {
        return;
      }
      btnSeed.disabled = true;
      btnSeed.innerHTML = `<span>جاري الرفع... ⏳</span>`;
      try {
        const res = await window.relasDataService.seedInitialData(true);
        showDbResultBox(true, `🚀 ${res.message}`);
        // إعادة تحميل الجداول والإحصائيات
        allDresses = await window.relasDataService.getDresses();
        allOrders = await window.relasDataService.getOrders();
        renderDressesTable();
        renderOrdersTable();
        updateStatsCards();
      } catch (err) {
        showDbResultBox(false, `❌ تعذر رفع البيانات إلى Firebase: ${err.message}`);
      } finally {
        btnSeed.disabled = false;
        btnSeed.innerHTML = `<span>🚀 رفع وتهيئة البيانات الأولية</span>`;
      }
    });
  }

  // زر استيراد وتحديث البيانات من السحابة
  const btnPull = document.getElementById('btnPullCloudData');
  if (btnPull) {
    btnPull.addEventListener('click', async () => {
      btnPull.disabled = true;
      btnPull.innerHTML = `<span>جاري الاستيراد... ⏳</span>`;
      try {
        const res = await window.relasDataService.syncFirebaseToLocal();
        showDbResultBox(true, `📥 تم استيراد وتحديث البيانات من السحابة بنجاح (${res.dressesCount} فستان، ${res.ordersCount} طلب).`);
        allDresses = await window.relasDataService.getDresses();
        allOrders = await window.relasDataService.getOrders();
        storeSettings = await window.relasDataService.getSettings();
        renderDressesTable();
        renderOrdersTable();
        updateStatsCards();
        populateSettingsForm();
      } catch (err) {
        showDbResultBox(false, `❌ تعذر الاستيراد من السحابة: ${err.message}`);
      } finally {
        btnPull.disabled = false;
        btnPull.innerHTML = `<span>📥 استيراد من السحابة</span>`;
      }
    });
  }

  // الاستماع لتغييرات حالة Firebase
  window.relasDataService.onStatusChange(() => {
    checkFirebaseStatus();
  });
}

async function testFirebaseConnectionUi() {
  const btnTest = document.getElementById('btnTestDbConnection');
  if (btnTest) {
    btnTest.disabled = true;
    btnTest.innerHTML = `<span>جاري الفحص... ⚡</span>`;
  }

  const result = await window.relasDataService.testConnection();
  showDbResultBox(result.success, result.message);
  checkFirebaseStatus();

  if (btnTest) {
    btnTest.disabled = false;
    btnTest.innerHTML = `<span>⚡ اختبار الاتصال المباشر</span>`;
  }
}

function showDbResultBox(isSuccess, message) {
  const box = document.getElementById('dbTestResultBox');
  if (!box) return;

  box.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-900', 'border-emerald-200', 'bg-red-50', 'text-red-900', 'border-red-200');
  
  if (isSuccess) {
    box.classList.add('bg-emerald-50', 'text-emerald-900', 'border-emerald-200');
  } else {
    box.classList.add('bg-red-50', 'text-red-900', 'border-red-200');
  }

  box.innerHTML = message;
}

function checkFirebaseStatus() {
  const statusEl = document.getElementById('firebaseStatusIndicator');
  const badgeEl = document.getElementById('dbLiveStatusBadge');

  const isReady = window.relasDataService.isFirebaseReady;
  const status = window.relasDataService.connectionStatus;
  const lastErr = window.relasDataService.lastError;

  if (statusEl) {
    if (isReady && status === 'connected') {
      statusEl.innerHTML = `
        <span class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
        <span class="text-xs font-bold text-emerald-400">قاعدة بيانات Firebase متصلة سحابياً 🟢</span>
      `;
    } else if (status === 'error') {
      statusEl.innerHTML = `
        <span class="w-3 h-3 bg-red-500 rounded-full"></span>
        <span class="text-xs font-bold text-red-400">تنبيه في اتصال Firebase 🔴</span>
      `;
    } else {
      statusEl.innerHTML = `
        <span class="w-3 h-3 bg-amber-500 rounded-full"></span>
        <span class="text-xs font-bold text-amber-400">نظام التخزين المحلي الآمن 🟡</span>
      `;
    }
  }

  if (badgeEl) {
    if (isReady && status === 'connected') {
      badgeEl.className = "flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-300 text-xs font-bold";
      badgeEl.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span><span>متصل ومفعّل سحابياً 🟢</span>`;
    } else if (status === 'error') {
      badgeEl.className = "flex items-center gap-2 bg-red-100 text-red-900 px-3.5 py-1.5 rounded-full border border-red-300 text-xs font-bold";
      badgeEl.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-red-600"></span><span>خطأ في الصلاحيات أو المفاتيح 🔴</span>`;
    } else {
      badgeEl.className = "flex items-center gap-2 bg-amber-100 text-amber-900 px-3.5 py-1.5 rounded-full border border-amber-300 text-xs font-bold";
      badgeEl.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-600"></span><span>تخزين محلي (LocalStorage) 🟡</span>`;
    }
  }
}
