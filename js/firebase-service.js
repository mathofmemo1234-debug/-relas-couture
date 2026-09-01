/**
 * Relas Couture - Firebase & Local Storage Service
 * خدمة إدارة قواعد البيانات والتخزين السحابي / المحلي لمتجر ريلاس
 */

const STORAGE_KEYS = {
  DRESSES: 'relas_dresses_v1',
  ORDERS: 'relas_orders_v1',
  SETTINGS: 'relas_settings_v1',
  FIREBASE_CONFIG: 'relas_firebase_config_v1'
};

class RelasDataService {
  constructor() {
    this.db = null;
    this.isFirebaseReady = false;
    this.init();
  }

  init() {
    // 1. تهيئة التخزين المحلي بالبيانات الافتراضية إذا لم تكن موجودة
    this.ensureLocalDefaults();

    // 2. محاولة تهيئة Firebase إذا توفرت الإعدادات
    this.initFirebaseFromStorage();
  }

  ensureLocalDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(window.INITIAL_SETTINGS || {}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DRESSES)) {
      localStorage.setItem(STORAGE_KEYS.DRESSES, JSON.stringify(window.INITIAL_DRESSES || []));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      // عينة طلب أولي للتجربة
      const demoOrders = [
        {
          id: "ORD-2026-001",
          date: new Date().toISOString().split('T')[0],
          customerName: "سارة العتيبي",
          customerPhone: "0559876543",
          dressType: "فستان زفاف ملكي خاص",
          dressModelRef: "Aurora Bridal Gown",
          eventDate: "2026-11-20",
          notes: "تعديل طول الذيل ليكون 2.5 متر، وإضافة تطريز دانتيل خفيف على الطرحة.",
          status: "in_progress", // new, under_review, in_progress, fitting_ready, completed
          statusText: "جاري التفصيل",
          statusColor: "purple",
          measurements: {
            total_length: 147,
            neck_length: 9,
            shoulder_width: 39,
            bust_distance: 19,
            bust_circ: 92,
            underbust_circ: 77,
            waist_circ: 69,
            bust_height: 27,
            hip_circ: 98,
            hip_height: 20,
            arm_length: 59,
            bicep_width: 29,
            wrist_circ: 16
          },
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(demoOrders));
    }
  }

  initFirebaseFromStorage() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
      if (savedConfig && window.firebase) {
        const config = JSON.parse(savedConfig);
        if (config.apiKey && config.projectId) {
          if (!firebase.apps.length) {
            firebase.initializeApp(config);
          }
          this.db = firebase.firestore();
          this.isFirebaseReady = true;
          console.log("💎 تم الاتصال بنجاح بقاعدة بيانات Firebase Firestore");
        }
      }
    } catch (e) {
      console.warn("تعذر الاتصال بـ Firebase، سيتم استخدام التخزين المحلي السريع.", e);
      this.isFirebaseReady = false;
    }
  }

  // --- دوال الإعدادات العامة والتواصل ---

  async getSettings() {
    try {
      if (this.isFirebaseReady && this.db) {
        const doc = await this.db.collection("settings").doc("general").get();
        if (doc.exists) {
          return { ...window.INITIAL_SETTINGS, ...doc.data() };
        }
      }
    } catch (e) {
      console.warn("استرجاع الإعدادات من التخزين المحلي:", e);
    }
    const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return local ? JSON.parse(local) : (window.INITIAL_SETTINGS || {});
  }

  async saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    try {
      if (this.isFirebaseReady && this.db) {
        await this.db.collection("settings").doc("general").set(settings, { merge: true });
      }
    } catch (e) {
      console.error("خطأ في حفظ إعدادات Firebase:", e);
    }
    return settings;
  }

  // --- دوال إدارة الفساتين (Dresses CRUD) ---

  async getDresses() {
    try {
      if (this.isFirebaseReady && this.db) {
        const snapshot = await this.db.collection("dresses").get();
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          localStorage.setItem(STORAGE_KEYS.DRESSES, JSON.stringify(list));
          return list;
        }
      }
    } catch (e) {
      console.warn("جلب الفساتين من التخزين المحلي:", e);
    }
    const local = localStorage.getItem(STORAGE_KEYS.DRESSES);
    return local ? JSON.parse(local) : (window.INITIAL_DRESSES || []);
  }

  async addDress(dressData) {
    const id = "relas-" + Date.now();
    const newDress = {
      ...dressData,
      id,
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString()
    };

    // حفظ محلي أولاً
    const dresses = await this.getDresses();
    dresses.unshift(newDress);
    localStorage.setItem(STORAGE_KEYS.DRESSES, JSON.stringify(dresses));

    // حفظ سحابي في Firebase إذا توفر
    try {
      if (this.isFirebaseReady && this.db) {
        await this.db.collection("dresses").doc(id).set(newDress);
      }
    } catch (e) {
      console.error("خطأ إضافة فستان في Firebase:", e);
    }
    return newDress;
  }

  async updateDress(id, updatedData) {
    const dresses = await this.getDresses();
    const index = dresses.findIndex(d => d.id === id);
    if (index !== -1) {
      dresses[index] = { ...dresses[index], ...updatedData, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.DRESSES, JSON.stringify(dresses));

      try {
        if (this.isFirebaseReady && this.db) {
          await this.db.collection("dresses").doc(id).update(updatedData);
        }
      } catch (e) {
        console.error("خطأ تحديث فستان في Firebase:", e);
      }
      return dresses[index];
    }
    throw new Error("الفستان غير موجود");
  }

  async deleteDress(id) {
    let dresses = await this.getDresses();
    dresses = dresses.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DRESSES, JSON.stringify(dresses));

    try {
      if (this.isFirebaseReady && this.db) {
        await this.db.collection("dresses").doc(id).delete();
      }
    } catch (e) {
      console.error("خطأ حذف فستان من Firebase:", e);
    }
    return true;
  }

  async getDressById(id) {
    const dresses = await this.getDresses();
    return dresses.find(d => d.id === id) || null;
  }

  // --- دوال إدارة طلبات القياسات والتفصيل (Orders & Measurements) ---

  async getOrders() {
    try {
      if (this.isFirebaseReady && this.db) {
        const snapshot = await this.db.collection("orders").orderBy("createdAt", "desc").get();
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(list));
          return list;
        }
      }
    } catch (e) {
      console.warn("جلب الطلبات من التخزين المحلي:", e);
    }
    const local = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return local ? JSON.parse(local) : [];
  }

  async saveCustomOrder(orderData) {
    const orderId = "ORD-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      ...orderData,
      id: orderId,
      status: "new",
      statusText: "جديد (بانتظار المراجعة)",
      statusColor: "yellow",
      createdAt: new Date().toISOString()
    };

    const orders = await this.getOrders();
    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    try {
      if (this.isFirebaseReady && this.db) {
        await this.db.collection("orders").doc(orderId).set(newOrder);
      }
    } catch (e) {
      console.error("خطأ حفظ الطلب في Firebase:", e);
    }
    return newOrder;
  }

  async updateOrderStatus(id, newStatus) {
    const statusMap = {
      new: { text: "جديد", color: "yellow" },
      under_review: { text: "قيد المراجعة", color: "blue" },
      in_progress: { text: "جاري التفصيل", color: "purple" },
      fitting_ready: { text: "جاهز للبروفة / الاستلام", color: "orange" },
      completed: { text: "مكتمل ومسلّم", color: "green" },
      cancelled: { text: "ملغي", color: "red" }
    };

    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const info = statusMap[newStatus] || { text: newStatus, color: "gray" };
      orders[index].status = newStatus;
      orders[index].statusText = info.text;
      orders[index].statusColor = info.color;
      orders[index].updatedAt = new Date().toISOString();

      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

      try {
        if (this.isFirebaseReady && this.db) {
          await this.db.collection("orders").doc(id).update({
            status: newStatus,
            statusText: info.text,
            statusColor: info.color,
            updatedAt: orders[index].updatedAt
          });
        }
      } catch (e) {
        console.error("خطأ تحديث حالة الطلب في Firebase:", e);
      }
      return orders[index];
    }
    throw new Error("الطلب غير موجود");
  }

  async deleteOrder(id) {
    let orders = await this.getOrders();
    orders = orders.filter(o => o.id !== id);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    try {
      if (this.isFirebaseReady && this.db) {
        await this.db.collection("orders").doc(id).delete();
      }
    } catch (e) {
      console.error("خطأ حذف الطلب في Firebase:", e);
    }
    return true;
  }

  // --- دوال إدارة إعدادات Firebase من لوحة التحكم ---

  getFirebaseConfig() {
    const config = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    return config ? JSON.parse(config) : null;
  }

  saveFirebaseConfig(config) {
    if (!config) {
      localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
      this.isFirebaseReady = false;
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
    this.initFirebaseFromStorage();
    return true;
  }

  // إنشاء رابط واتساب منسق
  async generateWhatsAppLink(message, customPhone = null) {
    const settings = await this.getSettings();
    let phone = customPhone || settings.whatsappNumber || "966551234567";
    // تنظيف الرقم من أي مسافات أو رموز زائفة
    phone = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encoded}`;
  }
}

// كائن خدمة البيانات العام
window.relasDataService = new RelasDataService();
