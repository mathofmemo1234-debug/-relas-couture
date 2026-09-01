/**
 * Relas Couture - Interactive Mannequin & Measurements Studio Engine
 * محرك المانيكان التفاعلي واستوديو القياسات الذكي
 */

class RelasMannequinStudio {
  constructor(options = {}) {
    this.currentUnit = 'cm'; // 'cm' or 'inch'
    this.definitions = window.MEASUREMENT_DEFINITIONS || [];
    this.activePoint = null;
    this.values = {};
    this.init();
  }

  init() {
    this.initDefaultValues();
    this.renderFormFields();
    this.bindSvgHotspots();
    this.bindUnitSwitcher();
    this.bindFormEvents();
  }

  initDefaultValues() {
    this.definitions.forEach(def => {
      this.values[def.id] = def.default;
    });
  }

  // بناء حقول الإدخال الـ 13 مع القوائم المنسدلة الذكية
  renderFormFields() {
    const container = document.getElementById('measurementFieldsContainer');
    if (!container) return;

    container.innerHTML = '';

    this.definitions.forEach(def => {
      const card = document.createElement('div');
      card.className = 'measurement-card flex flex-col gap-2 transition-all duration-300';
      card.id = `card_${def.id}`;
      card.dataset.id = def.id;
      card.dataset.num = def.num;

      // توليد خيارات منسدلة سريعة
      let optionsHtml = `<option value="">اختيار سريع أو كتابة رقم</option>`;
      const step = (def.max - def.min) > 20 ? 2 : 1;
      for (let v = def.min; v <= def.max; v += step) {
        const isSelected = v === def.default ? 'selected' : '';
        optionsHtml += `<option value="${v}" ${isSelected}>${v} ${def.unit}</option>`;
      }

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="badge-number">${def.num}</span>
            <div>
              <label for="input_${def.id}" class="font-bold text-gray-900 text-sm md:text-base cursor-pointer">
                ${def.title}
              </label>
              <span class="text-xs text-gray-500 block font-serif">${def.enTitle}</span>
            </div>
          </div>
          <span class="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-800 rounded border border-amber-200">
            النقطة (${def.num})
          </span>
        </div>

        <p class="text-xs text-gray-600 leading-relaxed pr-9">${def.description}</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pr-9">
          <!-- قائمة منسدلة بأرقام نموذجية -->
          <div>
            <label class="text-[11px] text-gray-500 mb-1 block">قائمة منسدلة</label>
            <select class="w-full text-xs md:text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:border-amber-600 focus:outline-none bg-white transition select-preset" data-target="input_${def.id}">
              ${optionsHtml}
            </select>
          </div>

          <!-- حقل رقمي دقيق مع أزرار زيادة ونقصان -->
          <div>
            <label class="text-[11px] text-gray-500 mb-1 block">القياس الدقيق (${def.unit})</label>
            <div class="relative flex items-center">
              <input 
                type="number" 
                id="input_${def.id}" 
                name="${def.id}" 
                value="${def.default}" 
                min="${def.min}" 
                max="${def.max}" 
                step="0.5"
                class="w-full text-sm font-bold text-gray-900 border border-gray-300 rounded px-3 py-1.5 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition pl-10"
                required
              />
              <span class="absolute left-3 text-xs font-bold text-gray-400 unit-label">${def.unit}</span>
            </div>
          </div>
        </div>
      `;

      // أحداث التركيز والتمرير لمزامنة المانيكان
      card.addEventListener('mouseenter', () => this.highlightPoint(def.num, false));
      card.addEventListener('mouseleave', () => this.unhighlightPoint(def.num));
      
      const numInput = card.querySelector(`#input_${def.id}`);
      const selectPreset = card.querySelector('.select-preset');

      numInput.addEventListener('focus', () => this.highlightPoint(def.num, true));
      numInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
          this.values[def.id] = val;
        }
      });

      selectPreset.addEventListener('change', (e) => {
        if (e.target.value) {
          numInput.value = e.target.value;
          this.values[def.id] = parseFloat(e.target.value);
          this.highlightPoint(def.num, false);
        }
      });

      container.appendChild(card);
    });
  }

  // ربط نقاط المانيكان في ملف SVG
  bindSvgHotspots() {
    const nodes = document.querySelectorAll('.hotspot-node');
    nodes.forEach(node => {
      const num = parseInt(node.dataset.num);
      node.addEventListener('click', () => this.selectPoint(num));
      node.addEventListener('mouseenter', () => this.highlightPoint(num, false));
      node.addEventListener('mouseleave', () => this.unhighlightPoint(num));
    });
  }

  // تحديد نقطة والتركيز على حقلها
  selectPoint(num) {
    const def = this.definitions.find(d => d.num === num);
    if (!def) return;

    this.highlightPoint(num, true);

    const card = document.getElementById(`card_${def.id}`);
    const input = document.getElementById(`input_${def.id}`);
    if (card && input) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    }
  }

  // إبراز نقطة معينة على المانيكان وتحديث دليل الإرشادات
  highlightPoint(num, isSelected = false) {
    this.activePoint = num;
    const def = this.definitions.find(d => d.num === num);
    if (!def) return;

    // تحديث نقاط SVG
    document.querySelectorAll('.hotspot-node').forEach(node => {
      if (parseInt(node.dataset.num) === num) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    // تحديث خطوط الإرشاد
    document.querySelectorAll('.guideline-path').forEach(line => {
      if (parseInt(line.dataset.num) === num) {
        line.classList.add('highlighted');
      } else {
        line.classList.remove('highlighted');
      }
    });

    // تحديث بطاقة الحقل
    document.querySelectorAll('.measurement-card').forEach(c => {
      if (parseInt(c.dataset.num) === num) {
        c.classList.add('active-field');
      } else {
        c.classList.remove('active-field');
      }
    });

    // تحديث صندوق الإرشاد التوضيحي (Guide Box)
    this.updateGuideBox(def);
  }

  unhighlightPoint(num) {
    if (this.activePoint === num) {
      // إبقاء التحديد خفيفاً أو العودة للوضع الطبيعي
    }
  }

  updateGuideBox(def) {
    const guideBox = document.getElementById('mannequinActiveGuide');
    if (!guideBox) return;

    guideBox.innerHTML = `
      <div class="flex items-center gap-3 mb-2">
        <span class="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-sm shadow">
          ${def.num}
        </span>
        <h4 class="font-bold text-gray-900 text-base">${def.title} <span class="text-xs text-amber-700 font-normal">(${def.enTitle})</span></h4>
      </div>
      <p class="text-xs md:text-sm text-gray-700 leading-relaxed mb-2">${def.description}</p>
      <div class="p-2.5 bg-amber-50/80 rounded border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
        <span class="text-amber-600 font-bold">💡 طريقة القياس:</span>
        <span>${def.stepGuide}</span>
      </div>
    `;
  }

  // محول الوحدات بين السنتيمتر والإنش
  bindUnitSwitcher() {
    const btnCm = document.getElementById('unitCmBtn');
    const btnInch = document.getElementById('unitInchBtn');

    if (btnCm && btnInch) {
      btnCm.addEventListener('click', () => this.switchUnit('cm'));
      btnInch.addEventListener('click', () => this.switchUnit('inch'));
    }
  }

  switchUnit(unit) {
    if (this.currentUnit === unit) return;
    this.currentUnit = unit;

    const btnCm = document.getElementById('unitCmBtn');
    const btnInch = document.getElementById('unitInchBtn');

    if (unit === 'cm') {
      btnCm?.classList.add('bg-black', 'text-white');
      btnCm?.classList.remove('bg-gray-100', 'text-gray-700');
      btnInch?.classList.remove('bg-black', 'text-white');
      btnInch?.classList.add('bg-gray-100', 'text-gray-700');
    } else {
      btnInch?.classList.add('bg-black', 'text-white');
      btnInch?.classList.remove('bg-gray-100', 'text-gray-700');
      btnCm?.classList.remove('bg-black', 'text-white');
      btnCm?.classList.add('bg-gray-100', 'text-gray-700');
    }

    // تحويل القيم
    this.definitions.forEach(def => {
      const input = document.getElementById(`input_${def.id}`);
      if (input) {
        let val = parseFloat(input.value) || def.default;
        if (unit === 'inch') {
          val = (val / 2.54).toFixed(1);
        } else {
          val = (val * 2.54).toFixed(1);
        }
        input.value = val;
        this.values[def.id] = parseFloat(val);
      }
    });

    document.querySelectorAll('.unit-label').forEach(lbl => {
      lbl.textContent = unit === 'cm' ? 'سم' : 'إنش';
    });
  }

  bindFormEvents() {
    const form = document.getElementById('measurementForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleFormSubmit(form);
    });

    const printBtn = document.getElementById('previewCardBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.previewTailorCard());
    }
  }

  // جمع كافة البيانات وحفظ الطلب + إرسال واتساب
  async handleFormSubmit(form) {
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>جاري حفظ الطلب...</span>`;
    }

    const formData = new FormData(form);
    const customerName = formData.get('customerName') || 'عميلة ريلاس';
    const customerPhone = formData.get('customerPhone') || '';
    const eventDate = formData.get('eventDate') || '';
    const dressType = formData.get('dressType') || 'فستان سهرة وزفاف خاص';
    const notes = formData.get('notes') || '';
    const dateStr = formData.get('orderDate') || new Date().toISOString().split('T')[0];

    // جمع القياسات الـ 13
    const measurements = {};
    this.definitions.forEach(def => {
      const inp = document.getElementById(`input_${def.id}`);
      measurements[def.id] = inp ? parseFloat(inp.value) : def.default;
    });

    const orderData = {
      date: dateStr,
      customerName,
      customerPhone,
      eventDate,
      dressType,
      notes,
      unit: this.currentUnit,
      measurements
    };

    try {
      // 1. حفظ في قاعدة البيانات (Firebase / LocalStorage)
      const savedOrder = await window.relasDataService.saveCustomOrder(orderData);

      // 2. تجهيز رسالة الواتساب الفاخرة
      const whatsappMsg = this.buildWhatsAppMessage(savedOrder);
      const whatsappUrl = await window.relasDataService.generateWhatsAppLink(whatsappMsg);

      // 3. عرض نافذة النجاح والتوجيه للواتساب
      this.showSuccessModal(savedOrder, whatsappUrl);

    } catch (error) {
      console.error("خطأ أثناء حفظ الطلب:", error);
      alert("حدث خطأ أثناء حفظ الطلب، يرجى المحاولة مرة أخرى.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>تأكيد وحفظ القياسات ✨</span>`;
      }
    }
  }

  // بناء نص رسالة الواتساب الفاخرة المنسقة
  buildWhatsAppMessage(order) {
    const unitText = order.unit === 'inch' ? 'إنش' : 'سم';
    const m = order.measurements;

    return `✨ *طلب تفصيل جديد - ريلاس للأزياء (Relas Couture)* ✨
-------------------------------------
👑 *اسم الزبونة:* ${order.customerName}
📱 *رقم الهاتف:* ${order.customerPhone}
📅 *تاريخ الطلب:* ${order.date}
👗 *نوع الفستان:* ${order.dressType}
${order.eventDate ? `🎉 *تاريخ المناسبة:* ${order.eventDate}` : ''}
🔢 *رقم الطلب:* ${order.id}

📏 *القياسات الدقيقة (${unitText}):*
1. الطول الكلي: ${m.total_length || '-'} ${unitText}
2. طول الرقبة: ${m.neck_length || '-'} ${unitText}
3. عرض الكتفين: ${m.shoulder_width || '-'} ${unitText}
4. طول بين النهدين (المسافة): ${m.bust_distance || '-'} ${unitText}
5. محيط الصدر: ${m.bust_circ || '-'} ${unitText}
6. محيط تحت الصدر: ${m.underbust_circ || '-'} ${unitText}
7. محيط الخصر: ${m.waist_circ || '-'} ${unitText}
8. طول قصة الصدر: ${m.bust_height || '-'} ${unitText}
9. محيط الورك: ${m.hip_circ || '-'} ${unitText}
10. ارتفاع الورك: ${m.hip_height || '-'} ${unitText}
11. طول الذراع: ${m.arm_length || '-'} ${unitText}
12. عرض الزندة: ${m.bicep_width || '-'} ${unitText}
13. دوران المعصم: ${m.wrist_circ || '-'} ${unitText}

${order.notes ? `📝 *ملاحظات وتفاصيل خاصة:*
${order.notes}` : ''}
-------------------------------------
🌟 *لكونكِ أنثى راقية... تشرفنا في تصميم وتفصيل قطعتكِ الخاصة*
_تم الإرسال عبر استوديو ريلاس للقياسات الذكية_`;
  }

  // عرض بطاقة القياسات الكلاسيكية المطابقة للصورة المرفقة
  previewTailorCard(orderData = null) {
    const name = orderData ? orderData.customerName : (document.getElementById('customerName')?.value || 'فاطمة الأحمد');
    const phone = orderData ? orderData.customerPhone : (document.getElementById('customerPhone')?.value || '0501234567');
    const date = orderData ? orderData.date : (document.getElementById('orderDate')?.value || new Date().toISOString().split('T')[0]);
    const m = orderData ? orderData.measurements : {};

    if (!orderData) {
      this.definitions.forEach(def => {
        const inp = document.getElementById(`input_${def.id}`);
        m[def.id] = inp ? inp.value : def.default;
      });
    }

    const modal = document.getElementById('tailorCardModal');
    const content = document.getElementById('tailorCardContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="vintage-tailor-card" id="printTailorCardSection">
        <!-- شماعة ريلاس واللوقو -->
        <div class="tailor-header-hanger text-center">
          <div class="inline-block relative">
            <svg class="w-48 h-16 mx-auto" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 8 C100 2, 110 2, 110 8 C110 14, 90 18, 100 24 L10 50 C20 40, 180 40, 190 50 L100 24" stroke="#1c1103" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M92 24 C85 20, 80 12, 90 8 C96 6, 104 6, 110 8 C120 12, 115 20, 108 24" fill="#ffffff" stroke="#1c1103" stroke-width="1.5"/>
              <circle cx="100" cy="22" r="4" fill="#deb03f" stroke="#1c1103" stroke-width="1.5"/>
            </svg>
          </div>
          <h1 class="text-3xl font-black font-traditional tracking-wide text-neutral-900 mt-1">ريلاس للازياء</h1>
        </div>

        <!-- بيانات الزبونة -->
        <div class="space-y-2 text-right text-lg font-bold font-traditional text-neutral-950 mb-4 px-2">
          <div class="flex justify-between items-center border-b border-dashed border-amber-900/40 pb-1">
            <span>التاريخ:</span>
            <span class="tailor-dots-line text-left">${date}</span>
          </div>
          <div class="flex justify-between items-center border-b border-dashed border-amber-900/40 pb-1">
            <span>إسم الزبونة:</span>
            <span class="tailor-dots-line text-left">${name}</span>
          </div>
          <div class="flex justify-between items-center border-b border-dashed border-amber-900/40 pb-1">
            <span>رقم الهاتف:</span>
            <span class="tailor-dots-line text-left" dir="ltr">${phone}</span>
          </div>
        </div>

        <!-- عنوان القياسات والجدول الكلاسيكي -->
        <div class="text-center my-3">
          <h2 class="text-2xl font-black font-traditional text-neutral-950 inline-block px-6 py-1 bg-amber-200/50 rounded-full border border-amber-900/20">
            الـقـيـاسـات:
          </h2>
        </div>

        <!-- شبكة القياسات الـ 13 مع رسم المانيكان في الجانب -->
        <div class="grid grid-cols-12 gap-3 items-center">
          <!-- رسم المانيكان الأيقوني المشغول بالورود -->
          <div class="col-span-4 text-center py-2">
            <svg class="w-full max-h-80 mx-auto" viewBox="0 0 100 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- حامل المانيكان الخشبي -->
              <line x1="50" y1="170" x2="50" y2="230" stroke="#5a3d1b" stroke-width="4" stroke-linecap="round"/>
              <path d="M45 230 L55 230 M40 235 L60 235" stroke="#5a3d1b" stroke-width="3" stroke-linecap="round"/>
              
              <!-- شبكة المانيكان الكورسيه المشغول -->
              <path d="M30 40 C35 30, 65 30, 70 40 C75 55, 68 70, 62 85 C58 95, 58 105, 68 125 C78 145, 65 170, 50 170 C35 170, 22 145, 32 125 C42 105, 42 95, 38 85 C32 70, 25 55, 30 40 Z" fill="#ffffff" stroke="#5a3d1b" stroke-width="2"/>
              
              <!-- أشرطة الكورسيه والأزهار الزخرفية -->
              <path d="M35 45 L35 60 M65 45 L65 60" stroke="#8b263e" stroke-width="2.5"/>
              <path d="M30 75 Q50 85 70 75" stroke="#5a3d1b" stroke-width="1.5" stroke-dasharray="2 2"/>
              <path d="M38 100 Q50 108 62 100" stroke="#5a3d1b" stroke-width="1.5" stroke-dasharray="2 2"/>
              <path d="M28 135 Q50 150 72 135" stroke="#5a3d1b" stroke-width="1.5" stroke-dasharray="2 2"/>
              <circle cx="48" cy="85" r="3" fill="#8b263e"/>
              <circle cx="56" cy="115" r="3" fill="#3b7a57"/>
              <circle cx="42" cy="140" r="3" fill="#8b263e"/>
            </svg>
          </div>

          <!-- قائمة القياسات الـ 13 -->
          <div class="col-span-8 space-y-1.5 font-traditional text-sm md:text-base font-bold text-neutral-900 pr-2">
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>الطول الكلي:</span>
              <span class="font-black text-amber-950">${m.total_length || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>طول الرقبة:</span>
              <span class="font-black text-amber-950">${m.neck_length || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>عرض الكتفين:</span>
              <span class="font-black text-amber-950">${m.shoulder_width || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>طول بين النهدين:</span>
              <span class="font-black text-amber-950">${m.bust_distance || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>محيط الصدر:</span>
              <span class="font-black text-amber-950">${m.bust_circ || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>محيط تحت الصدر:</span>
              <span class="font-black text-amber-950">${m.underbust_circ || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>محيط الخصر:</span>
              <span class="font-black text-amber-950">${m.waist_circ || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>طول قصة الصدر:</span>
              <span class="font-black text-amber-950">${m.bust_height || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>محيط الورك:</span>
              <span class="font-black text-amber-950">${m.hip_circ || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>ارتفاع الورك:</span>
              <span class="font-black text-amber-950">${m.hip_height || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>طول الذراع:</span>
              <span class="font-black text-amber-950">${m.arm_length || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>عرض الزندة:</span>
              <span class="font-black text-amber-950">${m.bicep_width || '-'} سم</span>
            </div>
            <div class="flex justify-between border-b border-dotted border-amber-900/60 pb-0.5">
              <span>دوران المعصم:</span>
              <span class="font-black text-amber-950">${m.wrist_circ || '-'} سم</span>
            </div>
          </div>
        </div>

        <!-- العبارة الأيقونية الختامية المطابقة للكرت -->
        <div class="tailor-quote-box">
          <p class="text-white font-traditional font-black leading-relaxed">
            لكونكِ انثى راقيه<br>
            تشرفنا في تصميم<br>
            قطعتكِ الخاصه ...<br>
            <span class="text-yellow-200">ريلاس للازياء.</span>
          </p>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  showSuccessModal(order, whatsappUrl) {
    const modal = document.getElementById('orderSuccessModal');
    if (!modal) return;

    const summary = document.getElementById('orderSuccessSummary');
    if (summary) {
      summary.innerHTML = `
        <p class="font-bold text-gray-900 mb-1">رقم الطلب: <span class="text-amber-700">${order.id}</span></p>
        <p class="text-sm text-gray-600">تم حفظ القياسات بنجاح في سجلات دار ريلاس للأزياء. اضغطي على الزر أدناه لمراسلة فريق التصميم على الواتساب وتأكيد موعد البروفة.</p>
      `;
    }

    const waBtn = document.getElementById('successWhatsAppBtn');
    if (waBtn) {
      waBtn.href = whatsappUrl;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

// تهيئة الاستوديو عند تحميل المستند
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('measurementForm')) {
    window.mannequinStudio = new RelasMannequinStudio();
  }
});
