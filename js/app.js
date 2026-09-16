/**
 * Relas Couture - Storefront Application Logic
 * منطق واجهة المتجر الرئيسية، الفلاتر، المعاينة السريعة، وربط الواتساب
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initStorefront();
});

let currentDresses = [];
let availableCategories = [];
let activeCategory = 'all';
let currentSort = 'default';
let flashCountdownInterval = null;

// حالة لوحة الرسم التفاعلية
let sketchCanvas = null;
let sketchCtx = null;
let isDrawing = false;
let canvasBrushColor = '#141414';
let canvasBrushSize = 3;
let isEraserActive = false;
let uploadedSketchBase64 = null;

async function initStorefront() {
  await applyStoreTheme();
  await loadCategories();
  await loadAndRenderDresses();
  bindSorting();
  bindMobileMenu();
  bindQuickViewModal();
  startFlashCountdown();
  initUserAuth();
  await initCart();
  initSketchStudio();
}

// ========================================================
// 1. تطبيق مظهر وهوية المتجر والألوان والبنرات ديناميكياً
// ========================================================
async function applyStoreTheme() {
  const settings = await window.relasDataService.getSettings();

  // تطبيق متغيرات الألوان على مستوى الجذر :root
  const root = document.documentElement;
  if (settings.primaryColor) {
    root.style.setProperty('--color-gold-primary', settings.primaryColor);
    root.style.setProperty('--color-gold-dark', settings.primaryColor);
  }
  if (settings.secondaryColor) {
    root.style.setProperty('--color-noir', settings.secondaryColor);
  }
  if (settings.bgColor) {
    root.style.setProperty('--color-bg-ivory', settings.bgColor);
    document.body.style.backgroundColor = settings.bgColor;
  }
  if (settings.accentColor) {
    root.style.setProperty('--color-gold-accent', settings.accentColor);
  }

  // تحديث شريط الإعلانات العلوي
  const announcementBar = document.getElementById('announcementBar');
  const bannerTextEl = document.getElementById('announcementBannerText');
  if (announcementBar && settings.announcementBg) {
    announcementBar.style.backgroundColor = settings.announcementBg;
  }
  if (bannerTextEl) {
    if (settings.announcementColor) bannerTextEl.style.color = settings.announcementColor;
    if (settings.announcementText) bannerTextEl.textContent = settings.announcementText;
  }

  // تحديث صورة البانر الرئيسي والعناوين
  const heroImg = document.getElementById('heroBackgroundImage');
  if (heroImg && settings.heroImage) {
    heroImg.src = settings.heroImage;
  }
  const heroTitle = document.getElementById('heroMainTitle');
  if (heroTitle && settings.heroTitle) {
    heroTitle.innerHTML = `${settings.heroTitle}<br><span class="gold-gradient-text">${settings.storeTagline || 'تشرفنا في تصميم قطعتكِ الخاصة'}</span>`;
  }
  const heroSubtitle = document.getElementById('heroMainSubtitle');
  if (heroSubtitle && settings.heroSubtitle) {
    heroSubtitle.textContent = settings.heroSubtitle;
  }

  // تحديث نصوص العروض في قسم الفلاش
  const flashPromo = document.getElementById('flashDealsPromoText');
  if (flashPromo && settings.discountPromoText) {
    flashPromo.textContent = settings.discountPromoText;
  }

  // تحديث روابط الواتساب في الموقع
  const waBtn = document.getElementById('floatingWhatsAppBtn');
  if (waBtn) {
    const waLink = await window.relasDataService.generateWhatsAppLink(
      `مرحباً دار ريلاس للأزياء ✨، أود الاستفسار عن التصاميم وأخذ القياسات بالطلب.`
    );
    waBtn.href = waLink;
  }
  const headerWa = document.getElementById('headerWaBtn');
  if (headerWa) {
    const waLink = await window.relasDataService.generateWhatsAppLink(`مرحباً دار ريلاس للأزياء ✨`);
    headerWa.href = waLink;
  }

  // تحديث أسماء وأرقام المتجر
  document.querySelectorAll('.store-city-display').forEach(el => el.textContent = settings.city || 'الرياض، المملكة العربية السعودية');
  document.querySelectorAll('.store-phone-display').forEach(el => el.textContent = settings.phoneNumber || settings.whatsappNumber);
  document.querySelectorAll('.store-title-display').forEach(el => el.textContent = settings.storeName);
}

// ========================================================
// 2. تحميل وإدارة التبويبات الفلاشية والتصنيفات الديناميكية
// ========================================================
async function loadCategories() {
  availableCategories = await window.relasDataService.getCategories();
  renderCategoryTabs();
}

function renderCategoryTabs() {
  const container = document.getElementById('categoryFiltersContainer');
  if (!container) return;

  container.innerHTML = availableCategories.map(cat => {
    const isActive = activeCategory === cat.id;
    const isFlash = cat.isFlash || cat.id === 'flash_deals';

    let btnClasses = "flash-tab-btn px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 transition shadow-sm ";
    if (isActive) {
      btnClasses += "active ";
    } else if (isFlash) {
      btnClasses += "bg-gradient-to-r from-amber-500/10 to-red-500/10 text-red-700 border border-red-200 hover:bg-red-50 ";
    } else {
      btnClasses += "bg-white text-gray-700 border border-gray-200 hover:bg-amber-50/50 hover:border-amber-300 ";
    }

    return `
      <button 
        class="${btnClasses}" 
        data-category="${cat.id}"
        onclick="selectCategory('${cat.id}')"
      >
        <span>${cat.icon || '👗'}</span>
        <span>${cat.name}</span>
        ${isFlash ? `<span class="w-2 h-2 rounded-full bg-red-500 animate-ping mr-0.5"></span>` : ''}
      </button>
    `;
  }).join('');
}

window.selectCategory = function(catId) {
  activeCategory = catId;
  renderCategoryTabs();
  renderDressesList();

  // تأثير حركي خفيف للتركيز على الشبكة
  const grid = document.getElementById('dressesGrid');
  if (grid) {
    grid.classList.add('opacity-40');
    setTimeout(() => grid.classList.remove('opacity-40'), 180);
  }
};

window.filterByFlashDeals = function() {
  selectCategory('flash_deals');
  const collectionsSec = document.getElementById('collections');
  if (collectionsSec) {
    collectionsSec.scrollIntoView({ behavior: 'smooth' });
  }
};

// ========================================================
// 3. عداد تنازلي لعروض الفلاش (Flash Deals Countdown)
// ========================================================
function startFlashCountdown() {
  if (flashCountdownInterval) clearInterval(flashCountdownInterval);

  function getTargetTime() {
    const target = new Date();
    target.setHours(23, 59, 59, 999);
    return target.getTime();
  }

  let targetTime = getTargetTime();

  function update() {
    const now = Date.now();
    let diff = targetTime - now;
    if (diff <= 0) {
      targetTime = getTargetTime() + 86400000;
      diff = targetTime - now;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const hEl = document.getElementById('flashHours');
    const mEl = document.getElementById('flashMinutes');
    const sEl = document.getElementById('flashSeconds');

    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
    if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  flashCountdownInterval = setInterval(update, 1000);
}

// ========================================================
// 4. استعراض الفساتين والكاتالوج
// ========================================================
async function loadAndRenderDresses() {
  const gridContainer = document.getElementById('dressesGrid');
  if (!gridContainer) return;

  gridContainer.innerHTML = `
    <div class="col-span-full py-16 text-center">
      <div class="inline-block animate-spin w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full mb-3"></div>
      <p class="text-gray-500 font-serif">جاري استعراض كولكشن ريلاس الفاخر...</p>
    </div>
  `;

  currentDresses = await window.relasDataService.getDresses();
  renderDressesList();
}

function renderDressesList() {
  const gridContainer = document.getElementById('dressesGrid');
  if (!gridContainer) return;

  let filtered = [...currentDresses];

  if (activeCategory !== 'all') {
    filtered = filtered.filter(d => d.category === activeCategory);
  }

  if (currentSort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'newest') {
    filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }

  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-xl border border-amber-100 p-8 shadow-sm">
        <span class="text-5xl block mb-3">👗</span>
        <h3 class="text-lg font-bold text-gray-800 mb-1">لا توجد تصاميم في هذا التصنيف حالياً</h3>
        <p class="text-xs md:text-sm text-gray-500 mb-5">يمكنكِ طلب تفصيل تصميمكِ المفضل أو رسم تفصيلة خاصة لموديلكِ مباشرة.</p>
        <div class="flex flex-wrap justify-center gap-3">
          <button onclick="openSketchModal()" class="btn-luxury-gold text-xs py-2.5 px-6">
            <span>طلب تفصيل ورسم خاص</span> 🎨
          </button>
          <a href="measurements.html" class="btn-luxury-outline text-xs py-2.5 px-6">استوديو القياسات الذكي ✨</a>
        </div>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = filtered.map(dress => {
    const installment = Math.round(dress.price / 4);
    const mainImg = dress.images && dress.images.length > 0 ? dress.images[0] : 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1000&q=85';
    const isFlash = dress.category === 'flash_deals' || (dress.badge && dress.badge.includes('فلاش'));

    return `
      <div class="dress-card group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 ${isFlash ? 'ring-2 ring-amber-500/60' : ''}" data-id="${dress.id}">
        <!-- صورة الفستان والبادجات -->
        <div class="dress-image-wrapper relative overflow-hidden aspect-[3/4] bg-neutral-100">
          <img src="${mainImg}" alt="${dress.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          
          <!-- البادجات العلوية -->
          <div class="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            ${dress.badge ? `<span class="${isFlash ? 'flash-pulse-badge text-white' : 'bg-black/85 text-amber-200'} text-[11px] font-black px-3 py-1 tracking-wider uppercase rounded-sm shadow-md">${dress.badge}</span>` : ''}
            ${dress.isNew ? `<span class="bg-amber-600/95 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase rounded-sm shadow">جديد</span>` : ''}
          </div>

          <!-- أوفرلاي الإجراء السريع عند التحويم -->
          <div class="dress-action-overlay absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button onclick="openQuickView('${dress.id}')" class="flex-1 bg-white text-black py-2 rounded text-xs font-bold hover:bg-amber-100 transition shadow">
              معاينة 👁️
            </button>
            <button onclick="addDressToCart('${dress.id}')" class="flex-1 bg-amber-600 text-white py-2 rounded text-xs font-bold hover:bg-amber-700 transition shadow flex items-center justify-center gap-1">
              <span>أضيفي للسلة</span> 🛍️
            </button>
          </div>
        </div>

        <!-- تفاصيل الفستان والسعر -->
        <div class="p-4 bg-white flex flex-col justify-between flex-grow">
          <div>
            <span class="text-[11px] uppercase tracking-widest text-amber-800 font-bold block mb-1">
              ${dress.categoryName || 'ريلاس كوتور'}
            </span>
            <h3 class="font-bold text-gray-900 text-sm md:text-base leading-snug mb-2 group-hover:text-amber-700 transition">
              <a href="javascript:void(0)" onclick="openQuickView('${dress.id}')">${dress.title}</a>
            </h3>
          </div>

          <div class="pt-3 border-t border-gray-100 mt-2">
            <div class="flex items-baseline justify-between mb-2">
              <div class="flex items-baseline gap-2">
                <span class="font-black text-lg text-gray-950">${dress.price.toLocaleString()} ر.س</span>
                ${dress.oldPrice ? `<span class="text-xs text-gray-400 line-through">${dress.oldPrice.toLocaleString()} ر.س</span>` : ''}
              </div>
              <span class="text-[11px] text-amber-700 font-semibold">شامل الضريبة والبروفة</span>
            </div>

            <!-- محاكي تمارا وتابي 4 دفعات -->
            <div class="flex items-center justify-between bg-amber-50/50 p-2 rounded-lg border border-amber-100/60 text-[11px] text-gray-600 mb-3">
              <span>تقسيط 4 دفعات:</span>
              <span class="font-black text-black">${installment} ر.س / شهر</span>
            </div>

            <!-- أزرار الإجراءات للزبونة -->
            <div class="grid grid-cols-3 gap-1.5">
              <button onclick="addDressToCart('${dress.id}')" class="py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm" title="إضافة إلى السلة">
                <span>السلة</span> 🛍️
              </button>
              <button onclick="openSketchModalForDress('${dress.id}')" class="py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded text-xs font-bold transition flex items-center justify-center gap-1" title="إضافة تفصيلة أو رسمة خاصة">
                <span>تفصيلة</span> 🎨
              </button>
              <button onclick="contactWhatsAppForDress('${dress.id}')" class="py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-300 rounded text-xs font-bold transition flex items-center justify-center gap-1" title="مراسلة واتساب">
                <span>واتساب</span> 💬
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function bindSorting() {
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderDressesList();
    });
  }
}

// ========================================================
// 5. سلة المشتريات المتكاملة والتخفيض الشرطي
// ========================================================
async function initCart() {
  await updateCartUI();
}

window.openCartDrawer = async function() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) {
    await updateCartUI();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeCartDrawer = function() {
  const overlay = document.getElementById('cartDrawerOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.addDressToCart = async function(dressId) {
  const dress = await window.relasDataService.getDressById(dressId);
  if (!dress) return;

  await window.relasDataService.addToCart({
    dressId: dress.id,
    title: dress.title,
    price: dress.price,
    image: dress.images && dress.images[0] ? dress.images[0] : '',
    categoryName: dress.categoryName || 'ريلاس كوتور',
    quantity: 1
  });

  await updateCartUI();
  showToastNotification(`🛍️ تمت إضافة "${dress.title}" إلى سلة مشترياتكِ بنجاح!`);
  openCartDrawer();
};

window.updateCartItemQty = async function(cartItemId, delta) {
  await window.relasDataService.updateCartQuantity(cartItemId, delta);
  await updateCartUI();
};

window.removeCartItem = async function(cartItemId) {
  await window.relasDataService.removeFromCart(cartItemId);
  await updateCartUI();
};

async function updateCartUI() {
  const cart = await window.relasDataService.getCart();
  const settings = await window.relasDataService.getSettings();

  // حساب إجمالي القطع والمجموع الفرعي
  let totalCount = 0;
  let subtotal = 0;
  cart.forEach(item => {
    const qty = item.quantity || 1;
    totalCount += qty;
    subtotal += (item.price || 0) * qty;
  });

  // تحديث عدادات السلة في الهيدر والزر العائم
  const headerBadge = document.getElementById('headerCartCount');
  const floatingBadge = document.getElementById('floatingCartCount');
  const drawerCountBadge = document.getElementById('cartDrawerTotalCountBadge');

  if (headerBadge) headerBadge.textContent = totalCount;
  if (floatingBadge) floatingBadge.textContent = totalCount;
  if (drawerCountBadge) drawerCountBadge.textContent = totalCount;

  // قائمة عناصر السلة في الدرج
  const itemsContainer = document.getElementById('cartItemsList');
  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="text-center py-16 space-y-3">
          <span class="text-5xl block">🛍️</span>
          <h4 class="font-bold text-gray-800 text-sm">سلتكِ فارغة حالياً</h4>
          <p class="text-xs text-gray-400">استكشفي تشكيلات ريلاس الراقية واختاري قطعتكِ المفضلة.</p>
          <button onclick="closeCartDrawer()" class="btn-luxury-gold text-xs py-2 px-6 mt-2 font-bold">
            استكشفي الكاتالوج ✨
          </button>
        </div>
      `;
    } else {
      itemsContainer.innerHTML = cart.map(item => `
        <div class="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative">
          <!-- الصورة المصغرة أو الرسمة -->
          <div class="w-20 h-24 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 border">
            <img src="${item.sketchUrl || item.image || 'favicon.png'}" class="w-full h-full object-cover" />
          </div>

          <!-- التفاصيل وأزرار التحكم -->
          <div class="flex-grow flex flex-col justify-between text-right">
            <div>
              <span class="text-[10px] uppercase tracking-wider text-amber-800 font-bold block">${item.categoryName || 'ريلاس كوتور'}</span>
              <h4 class="font-bold text-gray-900 text-xs md:text-sm leading-tight">${item.title}</h4>
              ${item.customNotes ? `<p class="text-[10px] text-gray-500 line-clamp-1 mt-0.5">تفصيلة: ${item.customNotes}</p>` : ''}
              ${item.sketchUrl ? `<span class="inline-block text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold mt-1">🎨 رسمة خاصة</span>` : ''}
            </div>

            <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
              <span class="font-black text-sm text-neutral-950">${((item.price || 0) * (item.quantity || 1)).toLocaleString()} ر.س</span>
              
              <!-- محدد الكمية -->
              <div class="flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5">
                <button onclick="updateCartItemQty('${item.cartItemId}', -1)" class="w-6 h-6 rounded bg-white hover:bg-gray-200 flex items-center justify-center text-xs font-bold shadow-sm">-</button>
                <span class="text-xs font-bold px-1.5">${item.quantity || 1}</span>
                <button onclick="updateCartItemQty('${item.cartItemId}', 1)" class="w-6 h-6 rounded bg-white hover:bg-gray-200 flex items-center justify-center text-xs font-bold shadow-sm">+</button>
              </div>
            </div>
          </div>

          <!-- زر الحذف -->
          <button onclick="removeCartItem('${item.cartItemId}')" class="absolute top-2 left-2 text-gray-400 hover:text-red-600 text-xs p-1" title="حذف">✕</button>
        </div>
      `).join('');
    }
  }

  // حساب نظام التخفيض التلقائي الشرطي (Threshold Discount Engine)
  const isDiscountEnabled = settings.discountEnabled !== false;
  const threshold = parseFloat(settings.discountThreshold) || 5000;
  const discountType = settings.discountType || 'percentage';
  const isPercentDiscount = (discountType === 'percentage' || discountType === 'percent');
  const discountVal = parseFloat(settings.discountValue) || 15;
  
  let discountAmount = 0;
  let isThresholdReached = false;

  if (isDiscountEnabled && subtotal >= threshold && subtotal > 0) {
    isThresholdReached = true;
    if (isPercentDiscount) {
      discountAmount = Math.round(subtotal * (discountVal / 100));
    } else {
      discountAmount = Math.min(discountVal, subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  // تحديث شريط تقدم التخفيض في السلة
  const progressBox = document.getElementById('cartDiscountProgressContainer');
  if (progressBox) {
    if (!isDiscountEnabled || subtotal === 0) {
      progressBox.innerHTML = `
        <div class="text-[11px] text-gray-600 text-center">
          ✨ استمتعي بشحن فاخر مجاني وتنسيق بروفة القياسات مع ريلاس.
        </div>
      `;
    } else if (isThresholdReached) {
      const discountText = isPercentDiscount ? `${discountVal}%` : `${discountVal.toLocaleString()} ر.س`;
      progressBox.innerHTML = `
        <div class="discount-unlocked-banner text-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">🎉</span>
            <div>
              <strong class="block text-emerald-900">مبارك! تم تفعيل خصم ${discountText}</strong>
              <span class="text-[10px] text-emerald-700">وفرتِ ${discountAmount.toLocaleString()} ر.س على طلبيتكِ</span>
            </div>
          </div>
          <span class="text-sm">✨</span>
        </div>
      `;
    } else {
      const remaining = Math.max(0, threshold - subtotal);
      const percent = Math.min(100, Math.round((subtotal / threshold) * 100));
      const discountText = isPercentDiscount ? `${discountVal}%` : `${discountVal.toLocaleString()} ر.س`;

      progressBox.innerHTML = `
        <div class="discount-progress-box">
          <div class="flex justify-between text-xs font-bold text-amber-950">
            <span>🎁 احصلي على خصم ${discountText} فوراً!</span>
            <span class="text-amber-800">تبقّى ${remaining.toLocaleString()} ر.س</span>
          </div>
          <div class="discount-progress-track">
            <div class="discount-progress-bar" style="width: ${percent}%;"></div>
          </div>
          <p class="text-[10px] text-gray-500 mt-1.5">أضيفي قطعاً بقيمة ${remaining.toLocaleString()} ر.س لتفعيل الخصم التلقائي.</p>
        </div>
      `;
    }
  }

  // تحديث أرقام المجموع والخصم والإجمالي
  const subtotalEl = document.getElementById('cartSubtotalText');
  const discountRow = document.getElementById('cartDiscountRow');
  const discountAmountEl = document.getElementById('cartDiscountAmountText');
  const finalTotalEl = document.getElementById('cartFinalTotalText');

  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString()} ر.س`;

  if (discountRow && discountAmountEl) {
    if (discountAmount > 0) {
      discountRow.classList.remove('hidden');
      discountAmountEl.textContent = `-${discountAmount.toLocaleString()} ر.س`;
    } else {
      discountRow.classList.add('hidden');
    }
  }

  if (finalTotalEl) finalTotalEl.textContent = `${finalTotal.toLocaleString()} ر.س`;
}

window.checkoutCartViaWhatsApp = async function() {
  const cart = await window.relasDataService.getCart();
  if (cart.length === 0) {
    alert("سلة المشتريات فارغة، يرجى اختيار التصاميم أولاً.");
    return;
  }

  const settings = await window.relasDataService.getSettings();
  const currentUser = await window.relasDataService.getCurrentUser();

  let subtotal = 0;
  let itemsBreakdown = cart.map((item, idx) => {
    const qty = item.quantity || 1;
    const itemTotal = (item.price || 0) * qty;
    subtotal += itemTotal;
    let desc = `${idx + 1}. *${item.title}* × ${qty} = ${itemTotal.toLocaleString()} ر.س`;
    if (item.customNotes) desc += `\n   └ 🎨 *تفصيلة:* ${item.customNotes}`;
    return desc;
  }).join('\n');

  // حساب الخصم
  let discountAmount = 0;
  const isDiscountEnabled = settings.discountEnabled !== false;
  const threshold = parseFloat(settings.discountThreshold) || 5000;
  const discountType = settings.discountType || 'percentage';
  const isPercentDiscount = (discountType === 'percentage' || discountType === 'percent');
  const discountVal = parseFloat(settings.discountValue) || 15;

  if (isDiscountEnabled && subtotal >= threshold) {
    if (isPercentDiscount) {
      discountAmount = Math.round(subtotal * (discountVal / 100));
    } else {
      discountAmount = Math.min(discountVal, subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const customerGreeting = currentUser 
    ? `الزبونة الكريمة: *${currentUser.name}* (📱 ${currentUser.phone || '-'} | ✉️ ${currentUser.email})`
    : `زبونة ريلاس الراقية`;

  let msg = `✨ *طلب شراء جديد من سلة ريلاس للأزياء* ✨
-----------------------------
👤 ${customerGreeting}

👗 *القطع المختارة:*
${itemsBreakdown}

-----------------------------
💰 *المجموع الفرعي:* ${subtotal.toLocaleString()} ر.س`;

  if (discountAmount > 0) {
    msg += `\n🎉 *التخفيض المطبق:* -${discountAmount.toLocaleString()} ر.س`;
  }

  msg += `\n🏷️ *المجموع الإجمالي النهائي:* ${finalTotal.toLocaleString()} ر.س
-----------------------------
أرجو تأكيد الطلب وحجز موعد البروفة والتفصيل.`;

  const link = await window.relasDataService.generateWhatsAppLink(msg);
  window.open(link, '_blank');
};

// ========================================================
// 6. نظام تسجيل الدخول وحساب الزبونة بالبريد الإلكتروني (Email Auth)
// ========================================================
function initUserAuth() {
  updateUserAccountUI();

  // نموذج تسجيل الدخول
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errBox = document.getElementById('loginErrorBox');

      try {
        const user = await window.relasDataService.loginUser({ email, password });
        closeAuthModal();
        updateUserAccountUI();
        showToastNotification(`🌸 مرحباً بعودتكِ أستاذة ${user.name}!`);
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
        }
      }
    });
  }

  // نموذج إنشاء حساب جديد
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const phone = document.getElementById('registerPhone').value.trim();
      const password = document.getElementById('registerPassword').value;
      const errBox = document.getElementById('registerErrorBox');

      try {
        const user = await window.relasDataService.registerUser({ name, email, password, phone });
        closeAuthModal();
        updateUserAccountUI();
        showToastNotification(`✨ أهلاً بكِ في دار ريلاس للأزياء، تشرفنا بانضمامكِ!`);
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
        }
      }
    });
  }
}

async function updateUserAccountUI() {
  const currentUser = await window.relasDataService.getCurrentUser();
  const desktopContainer = document.getElementById('userAccountSection');
  const mobileContainer = document.getElementById('mobileUserAccountSection');

  if (currentUser) {
    const userHtml = `
      <div class="relative group inline-block text-right">
        <button class="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 transition">
          <span>🌸</span>
          <span class="max-w-[100px] truncate">${currentUser.name.split(' ')[0]}</span>
          <span class="text-[10px]">▼</span>
        </button>
        <div class="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 hidden group-hover:block z-50 animate-in fade-in duration-150">
          <div class="px-3 py-1.5 border-b border-gray-100 text-[11px]">
            <p class="font-bold text-gray-900">${currentUser.name}</p>
            <p class="text-gray-400 truncate">${currentUser.email}</p>
          </div>
          <a href="javascript:void(0)" onclick="openCartDrawer()" class="block px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50">🛍️ سلة مشترياتي</a>
          <a href="measurements.html" class="block px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50">📐 بطاقة قياساتي</a>
          <button onclick="logoutCustomer()" class="w-full text-right px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1">🚪 تسجيل الخروج</button>
        </div>
      </div>
    `;
    if (desktopContainer) desktopContainer.innerHTML = userHtml;
    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <div class="flex items-center justify-between text-xs">
          <div>
            <span class="font-bold text-gray-900">أهلاً، ${currentUser.name} 🌸</span>
            <p class="text-gray-400 text-[10px]">${currentUser.email}</p>
          </div>
          <button onclick="logoutCustomer()" class="text-red-600 text-xs font-bold underline">خروج</button>
        </div>
      `;
    }
  } else {
    const guestHtml = `
      <button onclick="openAuthModal()" class="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-amber-800 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition">
        <span>👤</span>
        <span class="hidden sm:inline">تسجيل الدخول</span>
      </button>
    `;
    if (desktopContainer) desktopContainer.innerHTML = guestHtml;
    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <button onclick="openAuthModal(); document.getElementById('mobileMenuDrawer').classList.add('hidden');" class="w-full text-center py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold">
          تسجيل الدخول / إنشاء حساب بالبريد 👤
        </button>
      `;
    }
  }
}

window.openAuthModal = function() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    switchAuthTab('login');
  }
};

window.closeAuthModal = function() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

window.switchAuthTab = function(tab) {
  const tabLogin = document.getElementById('authTabLogin');
  const tabReg = document.getElementById('authTabRegister');
  const formLogin = document.getElementById('loginForm');
  const formReg = document.getElementById('registerForm');

  if (tab === 'login') {
    tabLogin.classList.add('border-amber-600', 'text-amber-900');
    tabLogin.classList.remove('border-transparent', 'text-gray-400');
    tabReg.classList.remove('border-amber-600', 'text-amber-900');
    tabReg.classList.add('border-transparent', 'text-gray-400');
    formLogin.classList.remove('hidden');
    formReg.classList.add('hidden');
  } else {
    tabReg.classList.add('border-amber-600', 'text-amber-900');
    tabReg.classList.remove('border-transparent', 'text-gray-400');
    tabLogin.classList.remove('border-amber-600', 'text-amber-900');
    tabLogin.classList.add('border-transparent', 'text-gray-400');
    formReg.classList.remove('hidden');
    formLogin.classList.add('hidden');
  }
};

window.logoutCustomer = async function() {
  await window.relasDataService.logoutUser();
  await updateUserAccountUI();
  showToastNotification('تم تسجيل الخروج بنجاح.');
};

// ========================================================
// 7. استوديو الرسم والتفصيل الخاص التفاعلي (Interactive Sketch Canvas)
// ========================================================
function initSketchStudio() {
  sketchCanvas = document.getElementById('sketchPadCanvas');
  if (!sketchCanvas) return;

  sketchCtx = sketchCanvas.getContext('2d');
  
  const rect = sketchCanvas.getBoundingClientRect();
  sketchCanvas.width = rect.width || 560;
  sketchCanvas.height = 280;
  
  sketchCtx.lineCap = 'round';
  sketchCtx.lineJoin = 'round';
  sketchCtx.strokeStyle = canvasBrushColor;
  sketchCtx.lineWidth = canvasBrushSize;

  // أحداث الماوس
  sketchCanvas.addEventListener('mousedown', startDrawing);
  sketchCanvas.addEventListener('mousemove', draw);
  sketchCanvas.addEventListener('mouseup', stopDrawing);
  sketchCanvas.addEventListener('mouseleave', stopDrawing);

  // أحداث اللمس للأجهزة الذكية والهواتف
  sketchCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    sketchCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  sketchCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    sketchCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  sketchCanvas.addEventListener('touchend', (e) => {
    const mouseEvent = new MouseEvent('mouseup', {});
    sketchCanvas.dispatchEvent(mouseEvent);
  });

  // ربط نموذج إرسال التفصيلة
  const form = document.getElementById('sketchOrderForm');
  if (form) {
    form.addEventListener('submit', handleSketchFormSubmit);
  }
}

function getCanvasCoordinates(e) {
  const rect = sketchCanvas.getBoundingClientRect();
  const scaleX = sketchCanvas.width / rect.width;
  const scaleY = sketchCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function startDrawing(e) {
  isDrawing = true;
  const coords = getCanvasCoordinates(e);
  sketchCtx.beginPath();
  sketchCtx.moveTo(coords.x, coords.y);
}

function draw(e) {
  if (!isDrawing) return;
  const coords = getCanvasCoordinates(e);
  sketchCtx.lineTo(coords.x, coords.y);
  sketchCtx.stroke();
}

function stopDrawing() {
  if (isDrawing) {
    sketchCtx.closePath();
    isDrawing = false;
  }
}

window.setCanvasColor = function(color, btn) {
  canvasBrushColor = color;
  isEraserActive = false;
  sketchCtx.strokeStyle = color;
  sketchCtx.lineWidth = canvasBrushSize;

  document.querySelectorAll('.sketch-color-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const eraserBtn = document.getElementById('canvasEraserBtn');
  if (eraserBtn) eraserBtn.classList.remove('bg-amber-100', 'font-bold');
};

window.setCanvasBrushSize = function(size) {
  canvasBrushSize = parseInt(size, 10);
  sketchCtx.lineWidth = canvasBrushSize;
};

window.setCanvasEraser = function(btn) {
  isEraserActive = true;
  sketchCtx.strokeStyle = '#ffffff';
  sketchCtx.lineWidth = canvasBrushSize * 3;
  if (btn) btn.classList.add('bg-amber-100', 'font-bold');
};

window.clearCanvasSketch = function() {
  if (sketchCtx && sketchCanvas) {
    sketchCtx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
  }
};

window.switchSketchMode = function(mode) {
  const drawContainer = document.getElementById('sketchDrawContainer');
  const uploadContainer = document.getElementById('sketchUploadContainer');
  const drawBtn = document.getElementById('sketchModeDrawBtn');
  const uploadBtn = document.getElementById('sketchModeUploadBtn');

  if (mode === 'draw') {
    drawContainer.classList.remove('hidden');
    uploadContainer.classList.add('hidden');
    drawBtn.className = "flex-1 py-1.5 rounded-md text-xs font-bold bg-white text-gray-900 shadow-sm transition";
    uploadBtn.className = "flex-1 py-1.5 rounded-md text-xs font-bold text-gray-600 hover:text-gray-900 transition";
  } else {
    drawContainer.classList.add('hidden');
    uploadContainer.classList.remove('hidden');
    uploadBtn.className = "flex-1 py-1.5 rounded-md text-xs font-bold bg-white text-gray-900 shadow-sm transition";
    drawBtn.className = "flex-1 py-1.5 rounded-md text-xs font-bold text-gray-600 hover:text-gray-900 transition";
  }
};

window.handleSketchFileUpload = function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedSketchBase64 = evt.target.result;
    const previewBox = document.getElementById('sketchUploadPreview');
    const previewImg = document.getElementById('sketchUploadImg');
    if (previewBox && previewImg) {
      previewImg.src = uploadedSketchBase64;
      previewBox.classList.remove('hidden');
    }
  };
  reader.readAsDataURL(file);
};

window.removeUploadedSketch = function() {
  uploadedSketchBase64 = null;
  const previewBox = document.getElementById('sketchUploadPreview');
  const fileInput = document.getElementById('sketchFileInput');
  if (previewBox) previewBox.classList.add('hidden');
  if (fileInput) fileInput.value = '';
};

window.openSketchModal = function(dressRef = null) {
  const modal = document.getElementById('sketchModal');
  if (!modal) return;

  window._sketchDressRef = dressRef || "طلب تفصيل حر وتصميم خاص";
  
  // ملء بيانات الزبونة المسجلة تلقائياً إن وجدت
  window.relasDataService.getCurrentUser().then(u => {
    if (u) {
      const nameInput = document.getElementById('sketchCustomerName');
      const phoneInput = document.getElementById('sketchCustomerPhone');
      if (nameInput && !nameInput.value) nameInput.value = u.name || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = u.phone || '';
    }
  });

  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.openSketchModalForDress = function(dressId) {
  window.relasDataService.getDressById(dressId).then(dress => {
    if (dress) {
      openSketchModal(dress.title);
      const notesEl = document.getElementById('sketchNotes');
      if (notesEl) notesEl.value = `أرغب في إجراء تعديل وتفصيلة خاصة على فستان: (${dress.title}): `;
    } else {
      openSketchModal();
    }
  });
};

window.closeSketchModal = function() {
  const modal = document.getElementById('sketchModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

async function handleSketchFormSubmit(e) {
  e.preventDefault();

  const customerName = document.getElementById('sketchCustomerName').value.trim();
  const customerPhone = document.getElementById('sketchCustomerPhone').value.trim();
  const fabric = document.getElementById('sketchFabric').value.trim();
  const color = document.getElementById('sketchColor').value.trim();
  const notes = document.getElementById('sketchNotes').value.trim();

  let sketchDataUrl = uploadedSketchBase64;
  if (!sketchDataUrl && sketchCanvas) {
    sketchDataUrl = sketchCanvas.toDataURL('image/png');
  }

  const sketchRecord = {
    customerName,
    customerPhone,
    dressRef: window._sketchDressRef || "تفصيل ورسمة خاصة",
    sketchImage: sketchDataUrl,
    fabric,
    color,
    notes
  };

  await window.relasDataService.saveCustomSketch(sketchRecord);
  closeSketchModal();

  showToastNotification("🎨 تم حفظ رسمتكِ وتفصيلتكِ بنجاح وإرسالها للمشغل!");

  // فتح الواتساب لإرسال التفاصيل مباشرة للمصممة
  const msg = `مرحباً دار ريلاس للأزياء ✨،
أود طلب تفصيل تصميم خاص برسمة وملاحظات كوتور:
👤 *الاسم:* ${customerName}
📱 *الهاتف:* ${customerPhone}
👗 *المرجع:* ${sketchRecord.dressRef}
🧵 *نوع القماش:* ${fabric || 'حسب اقتراح المصممة'}
🎨 *اللون:* ${color || 'حسب التنسيق'}
📝 *التفاصيل والتعديل:*
${notes}

(تم حفظ كروكي الرسمة في نظام ريلاس، أرجو تأكيد موعد التفصيل)`;

  const link = await window.relasDataService.generateWhatsAppLink(msg, customerPhone);
  window.open(link, '_blank');
}

window.addSketchToCart = async function() {
  const customerName = document.getElementById('sketchCustomerName').value.trim() || "زبونة ريلاس";
  const fabric = document.getElementById('sketchFabric').value.trim();
  const color = document.getElementById('sketchColor').value.trim();
  const notes = document.getElementById('sketchNotes').value.trim();

  let sketchDataUrl = uploadedSketchBase64;
  if (!sketchDataUrl && sketchCanvas) {
    sketchDataUrl = sketchCanvas.toDataURL('image/png');
  }

  await window.relasDataService.addToCart({
    dressId: "custom-sketch-" + Date.now(),
    title: `طلب تفصيل خاص: ${window._sketchDressRef || 'تصميم كوتور خاص'}`,
    price: 3500,
    categoryName: "تفصيل ورسم خاص 🎨",
    customNotes: `${notes} (قماش: ${fabric || '-'}، لون: ${color || '-'})`,
    sketchUrl: sketchDataUrl,
    quantity: 1
  });

  closeSketchModal();
  await updateCartUI();
  showToastNotification("🛍️ تم إضافة طلب التفصيل برسمتكِ إلى سلة المشتريات!");
  openCartDrawer();
};

// ========================================================
// 8. المعاينة السريعة للفستان (Quick View Modal)
// ========================================================
function bindQuickViewModal() {
  const modal = document.getElementById('quickViewModal');
  const closeBtn = document.getElementById('closeQuickViewBtn');
  if (modal && closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    });
  }
}

window.openQuickView = async function(dressId) {
  const dress = await window.relasDataService.getDressById(dressId);
  if (!dress) return;

  const modal = document.getElementById('quickViewModal');
  const content = document.getElementById('quickViewContent');
  if (!modal || !content) return;

  const installment = Math.round(dress.price / 4);
  const images = dress.images && dress.images.length > 0 ? dress.images : ['https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1000&q=85'];

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-right">
      <!-- معرض الصور -->
      <div class="space-y-3">
        <div class="relative rounded-xl overflow-hidden bg-neutral-100 border border-gray-200">
          <img id="quickViewMainImage" src="${images[0]}" alt="${dress.title}" class="w-full h-80 sm:h-96 md:h-[460px] object-cover" />
          ${dress.badge ? `<span class="absolute top-3 right-3 bg-black/85 text-amber-200 text-xs font-bold px-3 py-1 rounded shadow">${dress.badge}</span>` : ''}
        </div>
        ${images.length > 1 ? `
          <div class="flex gap-2 overflow-x-auto pb-1">
            ${images.map((img, idx) => `
              <button onclick="document.getElementById('quickViewMainImage').src='${img}'" class="w-16 h-20 rounded-lg border-2 border-transparent hover:border-amber-600 overflow-hidden flex-shrink-0">
                <img src="${img}" class="w-full h-full object-cover" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- معلومات الفستان والحجز والتفصيل -->
      <div class="space-y-4">
        <div>
          <span class="text-xs uppercase tracking-widest text-amber-700 font-bold">${dress.categoryName || 'ريلاس كوتور'}</span>
          <h2 class="text-xl md:text-2xl font-black text-gray-900 mt-1">${dress.title}</h2>
          <div class="flex items-center gap-2 mt-2">
            <div class="flex text-amber-500 text-sm">★★★★★</div>
            <span class="text-xs text-gray-500">(${dress.reviewsCount || 15} تقييم زبونة موثقة)</span>
          </div>
        </div>

        <div class="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
          <div class="flex items-baseline gap-3 mb-1">
            <span class="text-2xl font-black text-gray-950">${dress.price.toLocaleString()} ر.س</span>
            ${dress.oldPrice ? `<span class="text-sm text-gray-400 line-through">${dress.oldPrice.toLocaleString()} ر.س</span>` : ''}
          </div>
          <p class="text-xs text-amber-900">✨ السعر يشمل القماش الفاخر، التطريز اليدوي، والبروفة الخاصة.</p>
          <div class="mt-2 text-xs text-gray-700 flex items-center justify-between border-t border-amber-200/60 pt-2">
            <span>تقسيط تابي وتمارا 4 دفعات:</span>
            <span class="font-bold text-black">${installment} ر.س / شهرياً</span>
          </div>
        </div>

        <div>
          <h4 class="font-bold text-gray-900 text-xs mb-1">تفاصيل التصميم والقماش:</h4>
          <p class="text-xs md:text-sm text-gray-600 leading-relaxed">${dress.description || 'تصميم كوتور حصري من دار ريلاس للأزياء.'}</p>
        </div>

        <div class="grid grid-cols-2 gap-2.5 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div><strong class="text-gray-900 block">نوع القماش:</strong> <span class="text-gray-600">${dress.fabric || 'أقمشة كوتور أوروبية'}</span></div>
          <div><strong class="text-gray-900 block">القصة:</strong> <span class="text-gray-600">${dress.silhouette || 'كلاسيك راقي'}</span></div>
          <div><strong class="text-gray-900 block">الياقة / الصدر:</strong> <span class="text-gray-600">${dress.neckline || 'Sweetheart'}</span></div>
          <div><strong class="text-gray-900 block">الألوان المتوفرة:</strong> <span class="text-gray-600">${dress.colors ? dress.colors.join('، ') : 'أوف وايت، عاجي، أسود'}</span></div>
        </div>

        <div class="pt-2 space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="addDressToCart('${dress.id}'); document.getElementById('quickViewModal').classList.add('hidden');" class="w-full btn-luxury-gold py-2.5 text-xs font-bold shadow flex items-center justify-center gap-1.5">
              <span>أضيفي إلى السلة</span> 🛍️
            </button>
            <button onclick="openSketchModalForDress('${dress.id}'); document.getElementById('quickViewModal').classList.add('hidden');" class="w-full bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold py-2.5 flex items-center justify-center gap-1">
              <span>تعديل أو رسمة خاصة</span> 🎨
            </button>
          </div>

          <a href="measurements.html?dressId=${dress.id}&model=${encodeURIComponent(dress.title)}" class="w-full btn-luxury-primary py-2.5 text-xs text-center block shadow">
            <span>أخذ القياسات الـ 13 على المانيكان 📏✨</span>
          </a>

          <button onclick="contactWhatsAppForDress('${dress.id}')" class="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow">
            <span>استفسري أو احجزي موعد بروفة على الواتساب</span> 💬
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.contactWhatsAppForDress = async function(dressId) {
  const dress = await window.relasDataService.getDressById(dressId);
  if (!dress) return;

  const msg = `مرحباً دار ريلاس للأزياء ✨،
أود الاستفسار وتفصيل الموديل التالي:
👗 *${dress.title}*
💰 *السعر:* ${dress.price.toLocaleString()} ر.س
🔗 *الرابط:* ${window.location.origin + window.location.pathname}#${dress.id}

أرجو تزويدي بمواعيد البروفة والتفصيل المتاحة.`;

  const link = await window.relasDataService.generateWhatsAppLink(msg);
  window.open(link, '_blank');
};

function bindMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenuDrawer');

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

// نظام إشعارات توست ناعم للمتجر
function showToastNotification(message) {
  let toast = document.getElementById('storeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'storeToast';
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-xl shadow-2xl text-xs md:text-sm font-bold bg-neutral-900 text-amber-300 border border-amber-600/50 transition-all duration-300 transform translate-y-10 opacity-0 flex items-center gap-2';
    document.body.appendChild(toast);
  }

  toast.innerHTML = message;
  toast.style.transform = 'translate(-50%, 0)';
  toast.style.opacity = '1';

  clearTimeout(window._storeToastTimeout);
  window._storeToastTimeout = setTimeout(() => {
    toast.style.transform = 'translate(-50%, 20px)';
    toast.style.opacity = '0';
  }, 4000);
}
