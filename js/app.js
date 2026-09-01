/**
 * Relas Couture - Storefront Application Logic
 * منطق واجهة المتجر الرئيسية، الفلاتر، المعاينة السريعة، وربط الواتساب
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initStorefront();
});

let currentDresses = [];
let activeCategory = 'all';
let currentSort = 'default';

async function initStorefront() {
  await updateGlobalSettings();
  await loadAndRenderDresses();
  bindCategoryFilters();
  bindSorting();
  bindMobileMenu();
  bindQuickViewModal();
}

// تحديث الإعدادات العامة في واجهة المتجر
async function updateGlobalSettings() {
  const settings = await window.relasDataService.getSettings();

  // تحديث شريط الإعلانات
  const bannerEl = document.getElementById('announcementBannerText');
  if (bannerEl && settings.announcementText) {
    bannerEl.textContent = settings.announcementText;
  }

  // تحديث أزرار وروابط الواتساب العائمة والعامة
  const waBtn = document.getElementById('floatingWhatsAppBtn');
  if (waBtn) {
    const waLink = await window.relasDataService.generateWhatsAppLink(
      `مرحباً دار ريلاس للأزياء ✨، أود الاستفسار عن فساتين الزفاف والسهرة وتحديد موعد لأخذ القياسات.`
    );
    waBtn.href = waLink;
  }

  // تحديث رقم الهاتف في الفوتر والنافبار
  const phoneEls = document.querySelectorAll('.store-phone-display');
  phoneEls.forEach(el => el.textContent = settings.phoneNumber || settings.whatsappNumber);

  // تحديث عنوان المتجر
  const storeTitles = document.querySelectorAll('.store-title-display');
  storeTitles.forEach(el => el.textContent = settings.storeName);
}

// جلب وعرض الفساتين
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

  let filtered = currentDresses;

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
      <div class="col-span-full py-16 text-center bg-white rounded-lg border border-amber-100 p-8">
        <span class="text-4xl block mb-3">👗</span>
        <h3 class="text-lg font-bold text-gray-800 mb-1">لا توجد تصاميم في هذا التصنيف حالياً</h3>
        <p class="text-sm text-gray-500 mb-4">يمكنكِ طلب تفصيل تصميمكِ الخاص مباشرة عبر استوديو القياسات.</p>
        <a href="measurements.html" class="btn-luxury-gold text-sm">استوديو أخذ القياسات التفاعلي ✨</a>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = filtered.map(dress => {
    const installment = Math.round(dress.price / 4);
    const mainImg = dress.images && dress.images.length > 0 ? dress.images[0] : 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1000&q=85';
    
    return `
      <div class="dress-card group rounded-sm" data-id="${dress.id}">
        <!-- صورة الفستان والبادجات -->
        <div class="dress-image-wrapper">
          <img src="${mainImg}" alt="${dress.title}" loading="lazy" />
          
          <!-- البادجات العلوية -->
          <div class="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            ${dress.badge ? `<span class="bg-black/85 text-amber-200 text-[11px] font-bold px-2.5 py-1 tracking-wider uppercase backdrop-blur-sm">${dress.badge}</span>` : ''}
            ${dress.isNew ? `<span class="bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 uppercase">جديد</span>` : ''}
          </div>

          <!-- أوفرلاي الإجراء السريع عند التحويم -->
          <div class="dress-action-overlay">
            <button onclick="openQuickView('${dress.id}')" class="flex-1 bg-white text-black py-2 text-xs font-bold hover:bg-amber-100 transition shadow">
              معاينة سريعة 👁️
            </button>
            <a href="measurements.html?dressId=${dress.id}&model=${encodeURIComponent(dress.title)}" class="flex-1 bg-amber-700 text-white py-2 text-xs font-bold text-center hover:bg-amber-800 transition shadow">
              تفصيل بمقاسكِ 📏
            </a>
          </div>
        </div>

        <!-- تفاصيل الفستان والسعر -->
        <div class="p-4 bg-white flex flex-col justify-between flex-grow">
          <div>
            <span class="text-[11px] uppercase tracking-widest text-amber-800 font-semibold block mb-1">
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
              <span class="text-xs text-amber-600 font-semibold">شامل الضريبة</span>
            </div>

            <!-- محاكي تمارا وتابي 4 دفعات (مثل روزا كلارا) -->
            <div class="flex items-center justify-between bg-amber-50/50 p-2 rounded border border-amber-100/60 text-[11px] text-gray-600">
              <span>أو قسّميها على 4 دفعات بقيمة:</span>
              <span class="font-bold text-black">${installment} ر.س / شهر</span>
            </div>

            <!-- أزرار الإجراء السريع للعميلة -->
            <div class="grid grid-cols-2 gap-2 mt-3">
              <button onclick="contactWhatsAppForDress('${dress.id}')" class="w-full py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-bold hover:bg-emerald-600 hover:text-white transition flex items-center justify-center gap-1">
                <span>واتساب</span> 💬
              </button>
              <a href="measurements.html?dressId=${dress.id}&model=${encodeURIComponent(dress.title)}" class="w-full py-2 bg-black text-white rounded text-xs font-bold text-center hover:bg-amber-600 transition flex items-center justify-center gap-1">
                <span>أخذ المقاس</span> 📐
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// فلاتر التصنيفات
function bindCategoryFilters() {
  const filterBtns = document.querySelectorAll('.category-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-black', 'text-white');
        b.classList.add('bg-transparent', 'text-gray-700');
      });
      btn.classList.add('bg-black', 'text-white');
      btn.classList.remove('bg-transparent', 'text-gray-700');

      activeCategory = btn.dataset.category || 'all';
      renderDressesList();
    });
  });
}

// خيارات الترتيب
function bindSorting() {
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderDressesList();
    });
  }
}

// نافذة المعاينة السريعة
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <!-- معرض الصور -->
      <div class="space-y-3">
        <div class="relative rounded-lg overflow-hidden bg-neutral-100 border border-gray-200">
          <img id="quickViewMainImage" src="${images[0]}" alt="${dress.title}" class="w-full h-96 md:h-[480px] object-cover" />
          ${dress.badge ? `<span class="absolute top-3 right-3 bg-black/85 text-amber-200 text-xs font-bold px-3 py-1">${dress.badge}</span>` : ''}
        </div>
        ${images.length > 1 ? `
          <div class="flex gap-2 overflow-x-auto pb-1">
            ${images.map((img, idx) => `
              <button onclick="document.getElementById('quickViewMainImage').src='${img}'" class="w-16 h-20 rounded border-2 border-transparent hover:border-amber-600 overflow-hidden flex-shrink-0">
                <img src="${img}" class="w-full h-full object-cover" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- معلومات الفستان والحجز والتفصيل -->
      <div class="space-y-4 text-right">
        <div>
          <span class="text-xs uppercase tracking-widest text-amber-700 font-bold">${dress.categoryName || 'ريلاس كوتور'}</span>
          <h2 class="text-xl md:text-2xl font-black text-gray-900 mt-1">${dress.title}</h2>
          <div class="flex items-center gap-2 mt-2">
            <div class="flex text-amber-500 text-sm">★★★★★</div>
            <span class="text-xs text-gray-500">(${dress.reviewsCount || 12} تقييم زبونة موثقة)</span>
          </div>
        </div>

        <div class="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
          <div class="flex items-baseline gap-3 mb-1">
            <span class="text-2xl font-black text-gray-950">${dress.price.toLocaleString()} ر.س</span>
            ${dress.oldPrice ? `<span class="text-sm text-gray-400 line-through">${dress.oldPrice.toLocaleString()} ر.س</span>` : ''}
          </div>
          <p class="text-xs text-amber-900">✨ السعر يشمل القماش الفاخر، التطريز اليدوي، والبروفة الخاصة.</p>
          <div class="mt-2 text-xs text-gray-700 flex items-center justify-between border-t border-amber-200/60 pt-2">
            <span>تقسيط تابي وتمارا:</span>
            <span class="font-bold text-black">${installment} ر.س / شهرياً (4 دفعات بدون فوائد)</span>
          </div>
        </div>

        <div>
          <h4 class="font-bold text-gray-900 text-sm mb-1">تفاصيل التصميم والقماش:</h4>
          <p class="text-xs md:text-sm text-gray-600 leading-relaxed">${dress.description || 'تصميم كوتور حصري من دار ريلاس للأزياء.'}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded border border-gray-200">
          <div><strong class="text-gray-900 block">نوع القماش:</strong> <span class="text-gray-600">${dress.fabric || 'أقمشة كوتور أوروبية'}</span></div>
          <div><strong class="text-gray-900 block">القصة (Silhouette):</strong> <span class="text-gray-600">${dress.silhouette || 'كلاسيك راقي'}</span></div>
          <div><strong class="text-gray-900 block">الياقة / الصدر:</strong> <span class="text-gray-600">${dress.neckline || 'Sweetheart'}</span></div>
          <div><strong class="text-gray-900 block">الألوان المتوفرة:</strong> <span class="text-gray-600">${dress.colors ? dress.colors.join('، ') : 'عاجي، أوف وايت'}</span></div>
        </div>

        <div class="pt-4 border-t border-gray-200 space-y-2.5">
          <a href="measurements.html?dressId=${dress.id}&model=${encodeURIComponent(dress.title)}" class="w-full btn-luxury-gold py-3 text-sm text-center block shadow-lg">
            <span>ابدئي أخذ قياساتكِ لهذا الفستان 📐✨</span>
          </a>
          <button onclick="contactWhatsAppForDress('${dress.id}')" class="w-full py-2.5 bg-emerald-600 text-white rounded text-xs md:text-sm font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow">
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
💰 *السعر:* ${dress.price} ر.س
🔗 *الرابط:* ${window.location.origin + window.location.pathname}#${dress.id}

أرجو تزويدي بمواعيد البروفة والتفصيل المتاحة.`;

  const link = await window.relasDataService.generateWhatsAppLink(msg);
  window.open(link, '_blank');
};

function bindMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenuDrawer');
  const closeBtn = document.getElementById('closeMobileMenuBtn');

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
  if (closeBtn && mobileMenu) {
    closeBtn.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  }
}
