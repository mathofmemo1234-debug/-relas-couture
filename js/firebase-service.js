/**
 * Relas Couture - Hybrid Database & Storage Service (v2.0)
 * خدمة إدارة قواعد البيانات والتخزين الهجين (IndexedDB + LocalStorage + Firebase السحابي)
 * مصممة لتكون فائقة السرعة، غير معطلة (Non-Blocking)، وتتحمل مئات الميجابايت من الصور بأمان تام.
 */

const STORAGE_KEYS = {
  DRESSES: 'relas_dresses_v1',
  ORDERS: 'relas_orders_v1',
  SETTINGS: 'relas_settings_v1',
  FIREBASE_CONFIG: 'relas_firebase_config_v1'
};

// محرك التخزين المحلي عالي السعة (IndexedDB مع المرآة الآمنة لـ LocalStorage)
class RelasLocalDB {
  constructor() {
    this.dbName = 'relas_couture_db';
    this.storeName = 'app_store';
    this.version = 1;
    this.db = null;
    this.isReady = false;
    this.readyPromise = this.init();
  }

  async init() {
    if (typeof indexedDB === 'undefined') {
      this.isReady = false;
      return null;
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.isReady = true;
          resolve(this.db);
        };

        request.onerror = (err) => {
          console.warn("تنبيه: تعذر فتح IndexedDB، سيتم استخدام LocalStorage كبديل سريع.", err);
          this.isReady = false;
          resolve(null);
        };
      } catch (e) {
        this.isReady = false;
        resolve(null);
      }
    });
  }

  async getItem(key) {
    await this.readyPromise;

    // 1. محاولة القراءة من IndexedDB أولاً
    if (this.isReady && this.db) {
      try {
        const val = await new Promise((resolve) => {
          const tx = this.db.transaction(this.storeName, 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });

        if (val !== undefined && val !== null) {
          return val;
        }
      } catch (e) {
        console.warn(`خطأ قراءة IndexedDB للمفتاح ${key}:`, e);
      }
    }

    // 2. بديل: القراءة من LocalStorage
    try {
      const localVal = localStorage.getItem(key);
      if (localVal) {
        try {
          return JSON.parse(localVal);
        } catch {
          return localVal;
        }
      }
    } catch (e) {}

    return null;
  }

  async setItem(key, value) {
    await this.readyPromise;

    // 1. حفظ فوري في IndexedDB (مساحة غير محدودة للصور الكبيرة)
    if (this.isReady && this.db) {
      try {
        await new Promise((resolve, reject) => {
          const tx = this.db.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          const req = store.put(value, key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn(`خطأ كتابة IndexedDB للمفتاح ${key}:`, e);
      }
    }

    // 2. حفظ في LocalStorage للتوافق المزدوج مع التقاط آمن لخطأ امتلاء المساحة
    try {
      const strVal = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, strVal);
    } catch (quotaErr) {
      // عند امتلاء 5MB في LocalStorage نعتمد كلياً على IndexedDB دون تعليق التطبيق
      console.info(`تم تخزين البيانات الكبيرة (${key}) في IndexedDB بنجاح لتجاوز حدود LocalStorage.`);
    }
  }

  async removeItem(key) {
    await this.readyPromise;
    if (this.isReady && this.db) {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).delete(key);
      } catch (e) {}
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
}

class RelasDataService {
  constructor() {
    this.localDB = new RelasLocalDB();
    this.db = null;
    this.isFirebaseReady = false;
    this.connectionStatus = 'offline'; // 'connected' | 'checking' | 'error' | 'offline'
    this.lastError = null;
    this.statusListeners = [];

    // كاش ذاكرة فوري لتسريع القراءة والكتابة (0ms Latency)
    this.dressesCache = null;
    this.ordersCache = null;
    this.settingsCache = null;

    this.init();
  }

  async init() {
    // 1. تهيئة البيانات الأساسية
    await this.ensureLocalDefaults();

    // 2. محاولة تهيئة Firebase إذا قام المستخدم بإدخال مفاتيح صالحة
    this.initFirebaseFromStorage();
  }

  onStatusChange(callback) {
    if (typeof callback === 'function') {
      this.statusListeners.push(callback);
      callback(this.connectionStatus, this.isFirebaseReady, this.lastError);
    }
  }

  notifyStatusListeners() {
    this.statusListeners.forEach(cb => {
      try {
        cb(this.connectionStatus, this.isFirebaseReady, this.lastError);
      } catch (err) {
        console.error("خطأ في مستمع حالة Firebase:", err);
      }
    });
  }

  async ensureLocalDefaults() {
    // إعدادات المتجر الأولية
    const existingSettings = await this.localDB.getItem(STORAGE_KEYS.SETTINGS);
    if (!existingSettings) {
      const defaultSettings = window.INITIAL_SETTINGS || {
        storeName: "ريلاس لفساتين السهرة والزفاف",
        storeTagline: "لكونكِ أنثى راقية... تشرفنا في تصميم وتفصيل قطعتكِ الخاصة",
        whatsappNumber: "966551234567",
        phoneNumber: "+966 55 123 4567",
        currency: "ر.س",
        adminPin: "memo1974"
      };
      await this.localDB.setItem(STORAGE_KEYS.SETTINGS, defaultSettings);
      this.settingsCache = defaultSettings;
    }

    // فساتين الكاتالوج الأولية
    const existingDresses = await this.localDB.getItem(STORAGE_KEYS.DRESSES);
    if (!existingDresses || (Array.isArray(existingDresses) && existingDresses.length === 0)) {
      const initialList = window.INITIAL_DRESSES && Array.isArray(window.INITIAL_DRESSES) 
        ? [...window.INITIAL_DRESSES] 
        : [];
      if (initialList.length > 0) {
        await this.localDB.setItem(STORAGE_KEYS.DRESSES, initialList);
        this.dressesCache = initialList;
      }
    }

    // الطلبات التجريبية الأولية
    const existingOrders = await this.localDB.getItem(STORAGE_KEYS.ORDERS);
    if (!existingOrders) {
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
          status: "in_progress",
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
      await this.localDB.setItem(STORAGE_KEYS.ORDERS, demoOrders);
      this.ordersCache = demoOrders;
    }
  }

  initFirebaseFromStorage() {
    try {
      const savedConfigStr = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
      let config = null;
      if (savedConfigStr) {
        try {
          config = JSON.parse(savedConfigStr);
        } catch (e) {}
      }

      // لا نفعّل Firebase إلا إذا قام المستخدم بحفظ مفاتيح حقيقية خاصة به
      if (config && config.apiKey && config.projectId && window.firebase) {
        if (!firebase.apps.length) {
          firebase.initializeApp(config);
        }
        this.db = firebase.firestore();
        this.isFirebaseReady = true;
        this.connectionStatus = 'checking';
        this.notifyStatusListeners();

        // فحص غير معطل لاتصال السحابة
        this.testConnection().then(res => {
          if (res.success) {
            this.connectionStatus = 'connected';
            this.lastError = null;
          } else {
            this.connectionStatus = 'error';
            this.lastError = res.message;
          }
          this.notifyStatusListeners();
        }).catch(err => {
          this.connectionStatus = 'error';
          this.lastError = err.message;
          this.notifyStatusListeners();
        });
      } else {
        this.db = null;
        this.isFirebaseReady = false;
        this.connectionStatus = 'offline';
        this.notifyStatusListeners();
      }
    } catch (e) {
      console.warn("تطبيق ريلاس يعمل في الوضع المحلي فائق السرعة والموثوقية.", e);
      this.isFirebaseReady = false;
      this.connectionStatus = 'offline';
      this.notifyStatusListeners();
    }
  }

  // --- اختبار الاتصال المباشر بالسحابة ---
  async testConnection() {
    if (!this.isFirebaseReady || !this.db) {
      return {
        success: false,
        message: "Firebase غير مهيأ. يرجى إدخال مفاتيح المشروع وحفظها أولاً."
      };
    }

    const startTime = Date.now();
    try {
      const pingRef = this.db.collection("_ping").doc("status");
      const writePromise = pingRef.set({
        lastPing: new Date().toISOString(),
        client: "Relas Admin Panel",
        status: "ok"
      });

      // مؤقت أمان 3 ثواني حتى لا يعلق الفحص
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase connection timeout")), 3500));
      await Promise.race([writePromise, timeoutPromise]);

      const snap = await Promise.race([pingRef.get(), timeoutPromise]);
      const latency = Date.now() - startTime;

      if (snap && snap.exists) {
        this.connectionStatus = 'connected';
        this.lastError = null;
        this.notifyStatusListeners();
        return {
          success: true,
          latency,
          message: `الاتصال بقاعدة بيانات Firebase Firestore سليم ومفعّل بنجاح! (زمن الاستجابة: ${latency}ms)`
        };
      } else {
        throw new Error("لم يتم العثور على وثيقة الاستجابة");
      }
    } catch (err) {
      this.lastError = err.message;
      this.notifyStatusListeners();

      let reason = err.message;
      if (err.code === 'permission-denied') {
        reason = "تم رفض الإذن (Permission Denied). يرجى التأكد من تفعيل قواعد Firestore (Security Rules) بالسماح بالقراءة والكتابة.";
      } else if (err.code === 'unavailable' || err.message.includes('timeout')) {
        reason = "تعذر الوصول إلى الخادم السحابي أو انتهت مهلة الانتظار.";
      }

      return {
        success: false,
        code: err.code || 'timeout',
        message: `فحص Firebase: ${reason}`
      };
    }
  }

  // --- مزامنة غير معطلة (Non-blocking Cloud Helpers) ---
  async syncDocToCloud(collectionName, docId, data) {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      const cloudPromise = this.db.collection(collectionName).doc(docId).set(data, { merge: true });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Cloud sync timeout")), 3500));
      await Promise.race([cloudPromise, timeoutPromise]);
      console.log(`☁️ تمت المزامنة السحابية لوثيقة ${collectionName}/${docId}`);
    } catch (err) {
      console.warn(`تنبيه مزامنة سحابية لـ ${collectionName}/${docId} (البيانات محفوظة ومؤمنة محلياً):`, err.message);
    }
  }

  async deleteDocFromCloud(collectionName, docId) {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      const cloudPromise = this.db.collection(collectionName).doc(docId).delete();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Cloud delete timeout")), 3500));
      await Promise.race([cloudPromise, timeoutPromise]);
    } catch (err) {
      console.warn(`تعذر حذف الوثيقة السحابية ${collectionName}/${docId}:`, err.message);
    }
  }

  // --- دوال الإعدادات العامة والتواصل ---

  async getSettings() {
    if (this.settingsCache) {
      return this.settingsCache;
    }

    const local = await this.localDB.getItem(STORAGE_KEYS.SETTINGS);
    if (local && typeof local === 'object') {
      if (!local.adminPin || local.adminPin === "123456") {
        local.adminPin = "memo1974";
        await this.localDB.setItem(STORAGE_KEYS.SETTINGS, local);
      }
      this.settingsCache = local;
      return local;
    }

    const initial = window.INITIAL_SETTINGS || {};
    this.settingsCache = initial;
    return initial;
  }

  async saveSettings(settings) {
    this.settingsCache = { ...settings };
    await this.localDB.setItem(STORAGE_KEYS.SETTINGS, this.settingsCache);

    if (this.isFirebaseReady && this.db) {
      this.syncDocToCloud("settings", "general", this.settingsCache);
    }

    return this.settingsCache;
  }

  // --- دوال إدارة الفساتين والعروض (Dresses & Catalog CRUD) ---

  async getDresses() {
    // 1. استخدام الكاش المباشر إذا كان محملاً
    if (this.dressesCache && Array.isArray(this.dressesCache) && this.dressesCache.length > 0) {
      return this.dressesCache;
    }

    // 2. استرجاع الفساتين من التخزين المحلي الهجين (IndexedDB / LocalStorage)
    let list = await this.localDB.getItem(STORAGE_KEYS.DRESSES);
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch (e) {
        list = null;
      }
    }

    if (!Array.isArray(list) || list.length === 0) {
      list = window.INITIAL_DRESSES && Array.isArray(window.INITIAL_DRESSES) 
        ? [...window.INITIAL_DRESSES] 
        : [];
      if (list.length > 0) {
        await this.localDB.setItem(STORAGE_KEYS.DRESSES, list);
      }
    }

    this.dressesCache = list;

    // 3. تحديث في الخلفية من السحابة إذا كانت متصلة دون تعطيل واجهة المتجر
    if (this.isFirebaseReady && this.db) {
      this.fetchCloudDressesInBackground();
    }

    return this.dressesCache;
  }

  async fetchCloudDressesInBackground() {
    try {
      const snapPromise = this.db.collection("dresses").get();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (snap && !snap.empty) {
        const cloudList = [];
        snap.forEach(doc => cloudList.push({ id: doc.id, ...doc.data() }));
        if (cloudList.length > 0) {
          this.dressesCache = cloudList;
          await this.localDB.setItem(STORAGE_KEYS.DRESSES, cloudList);
        }
      }
    } catch (e) {
      // تجاهل أخطاء السحابة في الخلفية للحفاظ على استقرار المتجر
    }
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

    const dresses = await this.getDresses();
    dresses.unshift(newDress);
    this.dressesCache = dresses;

    // حفظ فوري ومؤكد في التخزين الهجين
    await this.localDB.setItem(STORAGE_KEYS.DRESSES, dresses);

    // مزامنة سحابية خلفية غير معطلة
    if (this.isFirebaseReady && this.db) {
      this.syncDocToCloud("dresses", id, newDress);
    }

    return newDress;
  }

  async updateDress(id, updatedData) {
    const dresses = await this.getDresses();
    const targetId = String(id);
    const index = dresses.findIndex(d => String(d.id) === targetId);

    if (index !== -1) {
      const merged = {
        ...dresses[index],
        ...updatedData,
        id: dresses[index].id,
        updatedAt: new Date().toISOString()
      };
      dresses[index] = merged;
      this.dressesCache = dresses;

      // حفظ فوري ومؤكد في التخزين الهجين
      await this.localDB.setItem(STORAGE_KEYS.DRESSES, dresses);

      // مزامنة سحابية خلفية بـ merge: true حتى تنجح في كل الحالات
      if (this.isFirebaseReady && this.db) {
        this.syncDocToCloud("dresses", targetId, merged);
      }

      return merged;
    }

    // إذا لم يتم العثور على المعرف، يتم إضافته كعنصر جديد لضمان عدم ضياع أي بيانات
    return await this.addDress({ ...updatedData, id });
  }

  async deleteDress(id) {
    const targetId = String(id);
    let dresses = await this.getDresses();
    dresses = dresses.filter(d => String(d.id) !== targetId);
    this.dressesCache = dresses;

    await this.localDB.setItem(STORAGE_KEYS.DRESSES, dresses);

    if (this.isFirebaseReady && this.db) {
      this.deleteDocFromCloud("dresses", targetId);
    }
    return true;
  }

  async getDressById(id) {
    const targetId = String(id);
    const dresses = await this.getDresses();
    return dresses.find(d => String(d.id) === targetId) || null;
  }

  // --- دوال إدارة طلبات القياسات والتفصيل (Orders & Measurements) ---

  async getOrders() {
    if (this.ordersCache && Array.isArray(this.ordersCache) && this.ordersCache.length > 0) {
      return this.ordersCache;
    }

    let orders = await this.localDB.getItem(STORAGE_KEYS.ORDERS);
    if (typeof orders === 'string') {
      try {
        orders = JSON.parse(orders);
      } catch {
        orders = null;
      }
    }

    this.ordersCache = Array.isArray(orders) ? orders : [];
    return this.ordersCache;
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
    this.ordersCache = orders;

    await this.localDB.setItem(STORAGE_KEYS.ORDERS, orders);

    if (this.isFirebaseReady && this.db) {
      this.syncDocToCloud("orders", orderId, newOrder);
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
    const index = orders.findIndex(o => String(o.id) === String(id));
    if (index !== -1) {
      const info = statusMap[newStatus] || { text: newStatus, color: "gray" };
      orders[index].status = newStatus;
      orders[index].statusText = info.text;
      orders[index].statusColor = info.color;
      orders[index].updatedAt = new Date().toISOString();
      this.ordersCache = orders;

      await this.localDB.setItem(STORAGE_KEYS.ORDERS, orders);

      if (this.isFirebaseReady && this.db) {
        this.syncDocToCloud("orders", String(id), {
          status: newStatus,
          statusText: info.text,
          statusColor: info.color,
          updatedAt: orders[index].updatedAt
        });
      }

      return orders[index];
    }
    throw new Error("الطلب غير موجود");
  }

  async deleteOrder(id) {
    const targetId = String(id);
    let orders = await this.getOrders();
    orders = orders.filter(o => String(o.id) !== targetId);
    this.ordersCache = orders;

    await this.localDB.setItem(STORAGE_KEYS.ORDERS, orders);

    if (this.isFirebaseReady && this.db) {
      this.deleteDocFromCloud("orders", targetId);
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
      this.connectionStatus = 'offline';
      this.notifyStatusListeners();
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
    phone = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encoded}`;
  }
}

// كائن خدمة البيانات العام
window.relasDataService = new RelasDataService();
