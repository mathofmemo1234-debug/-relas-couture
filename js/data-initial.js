/**
 * Relas Couture - Initial Data & Defaults
 * بيانات الفساتين والإعدادات الأولية لمتجر ريلاس للأزياء
 */

const INITIAL_SETTINGS = {
  storeName: "ريلاس لفساتين السهرة والزفاف",
  storeTagline: "لكونكِ أنثى راقية... تشرفنا في تصميم وتفصيل قطعتكِ الخاصة",
  whatsappNumber: "966551234567",
  phoneNumber: "+966 55 123 4567",
  email: "contact@relas-couture.com",
  city: "الرياض، المملكة العربية السعودية",
  address: "طريق الملك فهد، العليا، الرياض",
  currency: "ر.س",
  announcementText: "✨ استمتعي بتجربة التفصيل الحصري واستوديو القياسات الذكي مع ريلاس | شحن وتوصيل لكافة مدن المملكة والخليج",
  instagramUrl: "https://instagram.com",
  snapchatUrl: "https://snapchat.com",
  tiktokUrl: "https://tiktok.com",
  adminPin: "123456" // كلمة المرور الافتراضية للوحة التحكم
};

const INITIAL_DRESSES = [
  {
    id: "relas-01",
    title: "فستان زفاف 'أورورا' الملكي (Aurora Bridal Gown)",
    category: "bridal",
    categoryName: "فساتين زفاف",
    price: 8500,
    oldPrice: 10500,
    featured: true,
    isNew: true,
    rating: 5.0,
    reviewsCount: 24,
    description: "فستان زفاف ملكي فاخر بقصة A-Line مصنوع من الدانتيل الفرنسي المطرز يدوياً بحبات الكريستال واللؤلؤ، مع طرحة كاتدرائية فاخرة وذيل ملكي يمنحكِ إطلالة ساحرة في ليلتكِ الكبرى.",
    fabric: "ميكادو حرير طبيعي، دانتيل فرنسي شانتيلي، تول إيطالي",
    silhouette: "A-Line ملكي مع ذيل قابل للفك",
    neckline: "فتحة عنق Sweetheart كلاسيكية مع أكتاف منسدلة",
    colors: ["أوف وايت ملكي (Off-White)", "عاجي كلاسيكي (Ivory)"],
    images: [
      "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=85"
    ],
    badge: "الأكثر طلباً"
  },
  {
    id: "relas-02",
    title: "فستان سهرة 'سيرين' المخملي بلون الزمرد (Serene Velvet Gown)",
    category: "evening",
    categoryName: "فساتين سهرة",
    price: 3400,
    oldPrice: 4200,
    featured: true,
    isNew: true,
    rating: 4.9,
    reviewsCount: 18,
    description: "فستان سهرة فاخر باللون الزمردي الأخضر الملكي من قماش المخمل الحريري مع شال درابيه جانبي مطرز بتطريزات ذهبية ناعمة وقصة حورية البحر التي تبرز القوام بأناقة متناهية.",
    fabric: "مخمل كوتور إيطالي، تطريز يدوي بخيوط الذهب",
    silhouette: "قصة حورية البحر (Mermaid)",
    neckline: "كتف واحد غير متماثل (One Shoulder)",
    colors: ["أخضر زمردي", "أزرق ملكي", "عنابي كلاسيكي"],
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=85"
    ],
    badge: "كولكشن الهوت كوتور"
  },
  {
    id: "relas-03",
    title: "فستان زفاف 'إيلينا' الهوت كوتور (Elena Couture Bridal)",
    category: "bridal",
    categoryName: "فساتين زفاف",
    price: 9800,
    oldPrice: 12000,
    featured: true,
    isNew: false,
    rating: 5.0,
    reviewsCount: 31,
    description: "تحفة فنية من دار ريلاس، فستان زفاف مطرز بالكامل بنقوش زهرية ثلاثية الأبعاد 3D Florals مع أكمام شفافة وطبقات من التول الحريري الخفيف لإطلالة خيالية.",
    fabric: "أورجانزا حرير، تول فرنسي، ورود ثلاثية الأبعاد مصنوعة يدوياً",
    silhouette: "Ball Gown برنسيس فخم",
    neckline: "ياقة وهمية عالية (Illusion High Neck)",
    colors: ["عاجي ناصع", "أوف وايت ناعم"],
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=85"
    ],
    badge: "تصميم حصري"
  },
  {
    id: "relas-04",
    title: "فستان خطوبة وملكة 'سيلين' الذهبي (Celine Royal Gold)",
    category: "reception",
    categoryName: "فساتين خطوبة وملكة",
    price: 4600,
    oldPrice: 5500,
    featured: true,
    isNew: true,
    rating: 4.9,
    reviewsCount: 15,
    description: "فستان ملكة وخطوبة ساحر بتدرجات الذهب الشامبين والبرونز مع كاب ملكي ينسدل من الأكتاف وتطريزات براقة تعكس الأضواء في كافة الزوايا.",
    fabric: "تول مطرز بالباييت والكريستال السواروفسكي، كريب كوتور",
    silhouette: "مستقيم مع تنورة إضافية قابلة للإزالة (Over-skirt)",
    neckline: "ياقة مربعة عصرية مع حمالات رفيعة مطرزة",
    colors: ["شامبين ذهبي", "وردي بودري (Blush Pink)"],
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=1000&q=85"
    ],
    badge: "جديد الموسم"
  },
  {
    id: "relas-05",
    title: "فستان سهرة 'رويال بلاك' الأسود الفاخر (Royal Black Evening)",
    category: "evening",
    categoryName: "فساتين سهرة",
    price: 3200,
    oldPrice: 3900,
    featured: false,
    isNew: false,
    rating: 4.8,
    reviewsCount: 12,
    description: "كلاسيكية الكوتور التي لا تزول، فستان سهرة أسود ملكي بقصة كورسيه منحوتة بدقة وأكمام منسدلة من التول مع شق جانبي أنيق.",
    fabric: "ستان دوق كوتور (Duchess Satin)، كورسيه داخلي مدعوم",
    silhouette: "كولام ستريت مع درابيه ناعم",
    neckline: "أوف شولدر كلاسيكي",
    colors: ["أسود ملكي", "كحلي ليلي (Midnight Blue)"],
    images: [
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1000&q=85"
    ],
    badge: "كلاسيكيات ريلاس"
  },
  {
    id: "relas-06",
    title: "فستان زفاف 'فلورا' الناعم البوهيمي (Flora Bohemian Bridal)",
    category: "bridal",
    categoryName: "فساتين زفاف",
    price: 6900,
    oldPrice: 8200,
    featured: false,
    isNew: true,
    rating: 5.0,
    reviewsCount: 9,
    description: "تصميم خفيف وناعم للعروس العصرية المحبة للبساطة الراقية، يتميز بتطريزات أوراق الشجر الطبيعية وظهر مكشوف على شكل V مع ذيل رقيق.",
    fabric: "شيفون حرير، دانتيل بوهيمي ناعم",
    silhouette: "انسيابي ناعم (Soft Flowing A-Line)",
    neckline: "فتحة عنق V-Neck أمامية وخلفية",
    colors: ["أوف وايت نقي"],
    images: [
      "https://images.unsplash.com/photo-1511280394243-52467d0259b3?auto=format&fit=crop&w=1000&q=85"
    ],
    badge: "نعومة وفخامة"
  }
];

// قائمة بالقياسات الـ 13 المعتمدة في بطاقة ريلاس للأزياء
const MEASUREMENT_DEFINITIONS = [
  {
    id: "total_length",
    num: 1,
    title: "الطول الكلي",
    enTitle: "Total Length",
    unit: "سم",
    min: 120,
    max: 180,
    default: 145,
    description: "يقاس من أعلى نقطة في الكتف بمحاذاة الرقبة مروراً بأعلى نقطة في الصدر وصولاً إلى الأرض (مع احتساب ارتفاع الحذاء).",
    bodyArea: "length",
    stepGuide: "قفي باستقامة مع ارتداء الحذاء المناسب للمناسبة، ومدي شريط القياس من الكتف إلى الأرض."
  },
  {
    id: "neck_length",
    num: 2,
    title: "طول الرقبة",
    enTitle: "Neck Length",
    unit: "سم",
    min: 5,
    max: 20,
    default: 9,
    description: "يقاس من بداية الرقبة عند عظمة الترقوة حتى أسفل الفك.",
    bodyArea: "neck",
    stepGuide: "ارفعي ذقنكِ قليلاً وقيسي المسافة العمودية بين قاعدة الرقبة وأسفل الذقن."
  },
  {
    id: "shoulder_width",
    num: 3,
    title: "عرض الكتفين",
    enTitle: "Shoulder Width",
    unit: "سم",
    min: 30,
    max: 55,
    default: 38,
    description: "يقاس من طرف عظمة الكتف الأيمن إلى طرف عظمة الكتف الأيسر من جهة الظهر.",
    bodyArea: "shoulders",
    stepGuide: "مرري شريط القياس أفقياً على ظهرك بين عظمتي الكتفين البارزتين."
  },
  {
    id: "bust_distance",
    num: 4,
    title: "المسافة بين الصدرين (طول بين النهدين)",
    enTitle: "Bust Point to Point",
    unit: "سم",
    min: 14,
    max: 28,
    default: 19,
    description: "المسافة الأفقية بين أبرز نقطتين في الصدر (الحلمتين).",
    bodyArea: "bust_points",
    stepGuide: "قيسي المسافة الأفقية المستقيمة بين أعلى نقطتين في الصدر."
  },
  {
    id: "bust_circ",
    num: 5,
    title: "محيط الصدر",
    enTitle: "Bust Circumference",
    unit: "سم",
    min: 75,
    max: 140,
    default: 90,
    description: "يقاس شريط القياس حول محيط الصدر بالكامل عند أبرز نقطة مع ارتداء حمالة الصدر المخصصة للمناسبة.",
    bodyArea: "bust",
    stepGuide: "لفي الشريط أفقياً حول الصدر مع التأكد من استوائه على الظهر دون شد مفرط."
  },
  {
    id: "underbust_circ",
    num: 6,
    title: "محيط تحت الصدر",
    enTitle: "Underbust Circumference",
    unit: "سم",
    min: 60,
    max: 125,
    default: 76,
    description: "يقاس الشريط دائرياً حول القفص الصدري تحت الصدر مباشرة.",
    bodyArea: "underbust",
    stepGuide: "لفي شريط القياس مباشرة أسفل قاعدة الصدر حيث يستقر شريط حمالة الصدر."
  },
  {
    id: "waist_circ",
    num: 7,
    title: "محيط الخصر",
    enTitle: "Waist Circumference",
    unit: "سم",
    min: 55,
    max: 120,
    default: 68,
    description: "يقاس حول أضيق جزء من الجذع (فوق السرة بحوالي 2-3 سم).",
    bodyArea: "waist",
    stepGuide: "انحني جانباً لتحديد خط الخصر الطبيعي، ثم لفي الشريط حوله مع التنفس الطبيعي."
  },
  {
    id: "bust_height",
    num: 8,
    title: "طول قصة الصدر (ارتفاع الصدر)",
    enTitle: "Bust Height / Front Length",
    unit: "سم",
    min: 20,
    max: 45,
    default: 26,
    description: "يقاس عمودياً من نقطة التقاء الكتف مع الرقبة نزولاً إلى أبرز نقطة في الصدر أو حتى خط الخصر.",
    bodyArea: "bust_cut",
    stepGuide: "مدي الشريط من أعلى الكتف عمودياً حتى أعلى نقطة في الصدر ثم إلى خط الكورسيه."
  },
  {
    id: "hip_circ",
    num: 9,
    title: "محيط الورك (الأرداف)",
    enTitle: "Hip Circumference",
    unit: "سم",
    min: 80,
    max: 150,
    default: 96,
    description: "يقاس حول أعرض وأبرز نقطة في الأرداف والوركين مع ضم القدمين.",
    bodyArea: "hips",
    stepGuide: "ضمي قدميكِ معاً ولفي شريط القياس حول أبرز نقطة في المؤخرة والأرداف بمستوى أفقي تام."
  },
  {
    id: "hip_height",
    num: 10,
    title: "ارتفاع الورك",
    enTitle: "Hip Height",
    unit: "سم",
    min: 15,
    max: 30,
    default: 20,
    description: "المسافة العمودية من خط الخصر الطبيعي نزولاً إلى أوسع نقطة في الورك.",
    bodyArea: "hip_height",
    stepGuide: "قيسي المسافة العمودية على الجانب من خط الخصر إلى خط أوسع نقطة في الأرداف."
  },
  {
    id: "arm_length",
    num: 11,
    title: "طول الذراع",
    enTitle: "Arm Length",
    unit: "سم",
    min: 45,
    max: 75,
    default: 58,
    description: "يقاس من عظمة الكتف مروراً بالمرفق وهو مثني قليلاً وصولاً إلى عظمة المعصم.",
    bodyArea: "arm",
    stepGuide: "اثني ذراعك بزاوية خفيفة وقيسي من نقطة الكتف فوق المرفق إلى المعصم."
  },
  {
    id: "bicep_width",
    num: 12,
    title: "عرض الزندة (محيط العضلة)",
    enTitle: "Bicep / Upper Arm Circumference",
    unit: "سم",
    min: 20,
    max: 50,
    default: 28,
    description: "يقاس دائرياً حول أوسع نقطة في الذراع العلوي (الزندة) والذراع مسترخٍ.",
    bodyArea: "bicep",
    stepGuide: "ارخي ذراعكِ بجانبكِ ولفي الشريط حول أعرض جزء في أعلى الذراع."
  },
  {
    id: "wrist_circ",
    num: 13,
    title: "دوران المعصم",
    enTitle: "Wrist Circumference",
    unit: "سم",
    min: 12,
    max: 24,
    default: 16,
    description: "يقاس حول عظمة المعصم مباشرة عند نهاية اليد.",
    bodyArea: "wrist",
    stepGuide: "لفي شريط القياس حول المعصم فوق العظمة البارزة مباشرة بشكل مريح."
  }
];

if (typeof window !== "undefined") {
  window.INITIAL_SETTINGS = INITIAL_SETTINGS;
  window.INITIAL_DRESSES = INITIAL_DRESSES;
  window.MEASUREMENT_DEFINITIONS = MEASUREMENT_DEFINITIONS;
}
