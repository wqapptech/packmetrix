import type { SectionCategory, SectionTypeDef } from "./base-types";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const REGISTRY = [
  // ─── Content ──────────────────────────────────────────────────────────────

  {
    type: "itinerary" as const,
    label: "Itinerary",
    labelAr: "البرنامج اليومي",
    icon: "map",
    description: "Day-by-day schedule of the trip",
    descriptionAr: "جدول الرحلة يوماً بيوم",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "days",
        label: "Days",
        labelAr: "الأيام",
        type: "repeater",
        itemLabel: "Day",
        itemLabelAr: "يوم",
        itemFields: [
          {
            key: "day",
            label: "Day #",
            labelAr: "رقم اليوم",
            type: "number",
            min: 1,
          },
          {
            key: "title",
            label: "Title",
            labelAr: "العنوان",
            type: "text",
            placeholder: "e.g. Arrival & city tour",
            placeholderAr: "مثال: الوصول وجولة في المدينة",
            required: true,
          },
          {
            key: "desc",
            label: "Description",
            labelAr: "الوصف",
            type: "textarea",
            placeholder: "What happens this day?",
            placeholderAr: "ماذا يحدث في هذا اليوم؟",
          },
          {
            key: "chapter",
            label: "Chapter / phase name (optional)",
            labelAr: "اسم المرحلة (اختياري)",
            type: "text",
            placeholder: "e.g. The Ancient Coast (Aurora / Voyage)",
            placeholderAr: "مثال: الساحل القديم (Aurora / Voyage)",
          },
          {
            key: "alt",
            label: "Altitude at end of day (m) (optional)",
            labelAr: "الارتفاع في نهاية اليوم (م) — اختياري",
            type: "number",
            min: 0,
          },
          {
            key: "km",
            label: "Distance walked today (km) (optional)",
            labelAr: "المسافة المقطوعة اليوم (كم) — اختياري",
            type: "number",
            min: 0,
          },
        ],
      },
    ],
    defaultData: {
      days: [
        { day: 1, title: "", desc: "", chapter: "", alt: 0, km: 0 },
        { day: 2, title: "", desc: "", chapter: "", alt: 0, km: 0 },
        { day: 3, title: "", desc: "", chapter: "", alt: 0, km: 0 },
      ],
    },
    summaryText: (data, lang) => {
      const count = arr(data.days).length;
      return lang === "ar"
        ? `${count} أيام`
        : `${count} day${count !== 1 ? "s" : ""}`;
    },
  },

  {
    type: "highlights" as const,
    label: "Highlights",
    labelAr: "أبرز المميزات",
    icon: "sparkle",
    description: "Key selling points shown near the top of the page",
    descriptionAr: "نقاط البيع الرئيسية تُعرض قرب أعلى الصفحة",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "items",
        label: "Highlights",
        labelAr: "المميزات",
        type: "tagList",
        placeholder: "e.g. 5-star hotel included",
        placeholderAr: "مثال: فندق ٥ نجوم مشمول",
        helpText: "Press Enter or click Add after each item",
        helpTextAr: "اضغط Enter أو انقر إضافة بعد كل عنصر",
      },
    ],
    defaultData: { items: [] },
    summaryText: (data, lang) => {
      const count = arr(data.items).length;
      return lang === "ar"
        ? `${count} ميزة`
        : `${count} highlight${count !== 1 ? "s" : ""}`;
    },
  },

  {
    type: "hotel" as const,
    label: "Hotel & Accommodation",
    labelAr: "الفندق والإقامة",
    icon: "home",
    description: "Hotel name, star rating, and what to expect",
    descriptionAr: "اسم الفندق وتصنيفه النجمي وما يمكن توقعه",
    category: "content",
    multiple: true,
    fields: [
      {
        key: "description",
        label: "Description",
        labelAr: "الوصف",
        type: "textarea",
        placeholder:
          "Describe the hotel: name, location, facilities, star rating…",
        placeholderAr: "صف الفندق: الاسم والموقع والمرافق والتصنيف النجمي…",
      },
    ],
    defaultData: { description: "" },
    summaryText: (data, lang) => {
      const d = str(data.description);
      if (!d) return lang === "ar" ? "لا يوجد وصف بعد" : "No description yet";
      return d.length > 60 ? d.slice(0, 60) + "…" : d;
    },
  },

  {
    type: "inclusions" as const,
    label: "Inclusions & Exclusions",
    labelAr: "ما يشمل وما لا يشمل",
    icon: "check",
    description: "What's in the package and what travellers pay separately",
    descriptionAr: "ما تشمله الباقة وما يدفعه المسافرون بشكل منفصل",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "includes",
        label: "What's included",
        labelAr: "ما يشمله",
        type: "tagList",
        placeholder: "e.g. Hotel accommodation",
        placeholderAr: "مثال: إقامة في الفندق",
        helpText: "Press Enter or click Add after each item",
        helpTextAr: "اضغط Enter أو انقر إضافة بعد كل عنصر",
      },
      {
        key: "excludes",
        label: "What's NOT included",
        labelAr: "ما لا يشمله",
        type: "tagList",
        placeholder: "e.g. International flights",
        placeholderAr: "مثال: تذاكر الطيران الدولي",
        helpText: "Press Enter or click Add after each item",
        helpTextAr: "اضغط Enter أو انقر إضافة بعد كل عنصر",
      },
    ],
    defaultData: { includes: [], excludes: [] },
    summaryText: (data, lang) => {
      const inc = arr(data.includes).length;
      const exc = arr(data.excludes).length;
      return lang === "ar"
        ? `${inc} مشمول · ${exc} غير مشمول`
        : `${inc} included · ${exc} excluded`;
    },
  },

  {
    type: "faq" as const,
    label: "FAQ",
    labelAr: "الأسئلة الشائعة",
    icon: "archive",
    description: "Common questions answered before travellers need to ask",
    descriptionAr: "إجابات على الأسئلة الشائعة قبل أن يحتاج المسافرون للسؤال",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "items",
        label: "Questions",
        labelAr: "الأسئلة",
        type: "repeater",
        itemLabel: "Question",
        itemLabelAr: "سؤال",
        itemFields: [
          {
            key: "question",
            label: "Question",
            labelAr: "السؤال",
            type: "text",
            placeholder: "e.g. Is visa included?",
            placeholderAr: "مثال: هل التأشيرة مشمولة؟",
            required: true,
          },
          {
            key: "answer",
            label: "Answer",
            labelAr: "الإجابة",
            type: "textarea",
            placeholder: "Give a clear, helpful answer…",
            placeholderAr: "أعط إجابة واضحة ومفيدة…",
          },
        ],
      },
    ],
    defaultData: { items: [] },
    summaryText: (data, lang) => {
      const count = arr(data.items).length;
      return lang === "ar"
        ? `${count} سؤال`
        : `${count} question${count !== 1 ? "s" : ""}`;
    },
  },

  {
    type: "custom" as const,
    label: "Custom Section",
    labelAr: "قسم مخصص",
    icon: "edit",
    description: "A freeform section with your own heading and content",
    descriptionAr: "قسم مرن بعنوانك ومحتواك الخاص",
    category: "content",
    multiple: true,
    fields: [
      {
        key: "heading",
        label: "Heading",
        labelAr: "العنوان",
        type: "text",
        placeholder: "Section title",
        placeholderAr: "عنوان القسم",
        required: true,
      },
      {
        key: "content",
        label: "Content",
        labelAr: "المحتوى",
        type: "textarea",
        placeholder: "Write your content here…",
        placeholderAr: "اكتب محتواك هنا…",
      },
      {
        key: "image",
        label: "Optional image",
        labelAr: "صورة اختيارية",
        type: "image",
      },
    ],
    defaultData: { heading: "", content: "", image: "" },
    summaryText: (data, lang) => {
      const h = str(data.heading);
      return h || (lang === "ar" ? "قسم مخصص" : "Custom section");
    },
  },

  {
    type: "extras" as const,
    label: "Optional Extras",
    labelAr: "الإضافات الاختيارية",
    icon: "sparkle",
    description: "Optional add-ons and upgrades travellers can book",
    descriptionAr: "إضافات وترقيات اختيارية يمكن للمسافرين حجزها",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "items",
        label: "Add-ons",
        labelAr: "الإضافات",
        type: "repeater",
        itemLabel: "Extra",
        itemLabelAr: "إضافة",
        itemFields: [
          {
            key: "name",
            label: "Name",
            labelAr: "الاسم",
            type: "text",
            placeholder: "e.g. Private room upgrade",
            placeholderAr: "مثال: ترقية لغرفة خاصة",
            required: true,
          },
          {
            key: "description",
            label: "Description",
            labelAr: "الوصف",
            type: "textarea",
            placeholder: "What does this include?",
            placeholderAr: "ماذا يشمل هذا؟",
          },
          {
            key: "price",
            label: "Price",
            labelAr: "السعر",
            type: "text",
            placeholder: "e.g. +€150",
            placeholderAr: "مثال: +١٥٠ يورو",
          },
        ],
      },
    ],
    defaultData: { items: [] },
    summaryText: (data, lang) => {
      const count = arr(data.items).length;
      return lang === "ar"
        ? `${count} إضافة`
        : `${count} extra${count !== 1 ? "s" : ""}`;
    },
  },

  {
    type: "meals" as const,
    label: "Meal Plan",
    labelAr: "خطة الوجبات",
    icon: "package",
    description: "Meal plan included in the package",
    descriptionAr: "خطة الوجبات المشمولة في الباقة",
    category: "content",
    multiple: false,
    templateAffiliation: { full: ["aurora", "pulse", "smart", "family"], partial: [] },
    fields: [
      {
        key: "plan",
        label: "Meal plan",
        labelAr: "خطة الوجبات",
        type: "select",
        options: [
          { value: "none",          label: "No meals",       labelAr: "بدون وجبات" },
          { value: "breakfast",     label: "Breakfast only", labelAr: "إفطار فقط" },
          { value: "half_board",    label: "Half board",     labelAr: "نصف إقامة" },
          { value: "full_board",    label: "Full board",     labelAr: "إقامة كاملة" },
          { value: "all_inclusive", label: "All inclusive",  labelAr: "شامل بالكامل" },
        ],
      },
      {
        key: "notes",
        label: "Additional notes",
        labelAr: "ملاحظات إضافية",
        type: "textarea",
        placeholder: "Any dietary requirements, special arrangements…",
        placeholderAr: "أي متطلبات غذائية أو ترتيبات خاصة…",
      },
    ],
    defaultData: { plan: "breakfast", notes: "" },
    summaryText: (data, lang) => {
      const planMap: Record<string, { en: string; ar: string }> = {
        none:          { en: "No meals",       ar: "بدون وجبات" },
        breakfast:     { en: "Breakfast only", ar: "إفطار فقط" },
        half_board:    { en: "Half board",     ar: "نصف إقامة" },
        full_board:    { en: "Full board",     ar: "إقامة كاملة" },
        all_inclusive: { en: "All inclusive",  ar: "شامل بالكامل" },
      };
      const p = str(data.plan);
      return planMap[p]?.[lang] ?? (lang === "ar" ? "لا توجد وجبات" : "No meals");
    },
  },

  {
    type: "guide" as const,
    legacy: true,
    label: "Tour Guide",
    labelAr: "المرشد السياحي",
    icon: "users",
    description: "Tour guide name, bio, languages, and photo",
    descriptionAr: "اسم المرشد السياحي وسيرته ولغاته وصورته",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "name",
        label: "Guide name",
        labelAr: "اسم المرشد",
        type: "text",
        placeholder: "e.g. Ahmed Al-Rashidi",
        placeholderAr: "مثال: أحمد الراشدي",
        required: true,
      },
      {
        key: "bio",
        label: "Bio",
        labelAr: "نبذة",
        type: "textarea",
        placeholder: "A short introduction to your guide…",
        placeholderAr: "مقدمة قصيرة عن مرشدكم…",
      },
      {
        key: "photo",
        label: "Guide photo",
        labelAr: "صورة المرشد",
        type: "image",
      },
      {
        key: "languages",
        label: "Languages spoken",
        labelAr: "اللغات المتحدث بها",
        type: "tagList",
        placeholder: "e.g. Arabic",
        placeholderAr: "مثال: العربية",
        helpText: "Press Enter or click Add after each language",
        helpTextAr: "اضغط Enter أو انقر إضافة بعد كل لغة",
      },
    ],
    defaultData: { name: "", bio: "", photo: "", languages: [] },
    summaryText: (data, lang) => {
      const n = str(data.name);
      return n || (lang === "ar" ? "لا يوجد اسم بعد" : "No name yet");
    },
  },

  {
    type: "important_notes" as const,
    label: "Important Notes",
    labelAr: "ملاحظات مهمة",
    icon: "archive",
    description: "Notices, warnings, or requirements travellers must know",
    descriptionAr: "إشعارات وتحذيرات ومتطلبات يجب على المسافرين معرفتها",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "items",
        label: "Notes",
        labelAr: "الملاحظات",
        type: "repeater",
        itemLabel: "Note",
        itemLabelAr: "ملاحظة",
        itemFields: [
          {
            key: "text",
            label: "Note",
            labelAr: "الملاحظة",
            type: "textarea",
            placeholder: "e.g. Passport must be valid for at least 6 months",
            placeholderAr: "مثال: يجب أن يكون جواز السفر ساري المفعول لمدة ٦ أشهر على الأقل",
            required: true,
          },
        ],
      },
    ],
    defaultData: { items: [] },
    summaryText: (data, lang) => {
      const count = arr(data.items).length;
      return lang === "ar"
        ? `${count} ملاحظة`
        : `${count} note${count !== 1 ? "s" : ""}`;
    },
  },

  {
    type: "about_agency" as const,
    label: "About the Agency",
    labelAr: "عن الوكالة",
    icon: "users",
    description: "Your story, credentials, and why travellers trust you",
    descriptionAr: "قصتك ومؤهلاتك وسبب ثقة المسافرين بك",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "content",
        label: "About us",
        labelAr: "من نحن",
        type: "textarea",
        placeholder: "Tell travellers about your agency, experience, and values…",
        placeholderAr: "أخبر المسافرين عن وكالتك وخبرتك وقيمك…",
      },
      {
        key: "image",
        label: "Team photo",
        labelAr: "صورة الفريق",
        type: "image",
      },
    ],
    defaultData: { content: "", image: "" },
    summaryText: (data, lang) => {
      const d = str(data.content);
      if (!d) return lang === "ar" ? "لا يوجد محتوى بعد" : "No content yet";
      return d.length > 60 ? d.slice(0, 60) + "…" : d;
    },
  },

  {
    type: "schedule" as const,
    legacy: true,
    label: "Daily Schedule",
    labelAr: "الجدول اليومي",
    icon: "calendar",
    description: "Hour-by-hour schedule of activities",
    descriptionAr: "جدول الأنشطة بالساعة",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "items",
        label: "Activities",
        labelAr: "الأنشطة",
        type: "repeater",
        itemLabel: "Activity",
        itemLabelAr: "نشاط",
        itemFields: [
          {
            key: "time",
            label: "Time",
            labelAr: "الوقت",
            type: "text",
            placeholder: "e.g. 09:00",
            placeholderAr: "مثال: ٠٩:٠٠",
          },
          {
            key: "activity",
            label: "Activity",
            labelAr: "النشاط",
            type: "text",
            placeholder: "e.g. City tour by bus",
            placeholderAr: "مثال: جولة في المدينة بالحافلة",
            required: true,
          },
          {
            key: "location",
            label: "Location",
            labelAr: "الموقع",
            type: "text",
            placeholder: "e.g. Old Town",
            placeholderAr: "مثال: المدينة القديمة",
          },
        ],
      },
    ],
    defaultData: { items: [] },
    summaryText: (data, lang) => {
      const count = arr(data.items).length;
      return lang === "ar"
        ? `${count} نشاط`
        : `${count} activit${count !== 1 ? "ies" : "y"}`;
    },
  },

  // ─── Logistics ────────────────────────────────────────────────────────────

  {
    type: "flights" as const,
    legacy: true,
    label: "Flights & Departures",
    labelAr: "الرحلات الجوية والمغادرة",
    icon: "globe",
    description: "Departure airports, dates, flight times, and per-city prices",
    descriptionAr: "مطارات المغادرة والتواريخ وأوقات الرحلات وأسعار كل مدينة",
    category: "logistics",
    multiple: false,
    fields: [
      {
        key: "departures",
        label: "Departures",
        labelAr: "رحلات المغادرة",
        type: "repeater",
        itemLabel: "Departure",
        itemLabelAr: "رحلة مغادرة",
        itemFields: [
          {
            key: "name",
            label: "Departure airport / city",
            labelAr: "مطار أو مدينة المغادرة",
            type: "text",
            placeholder: "e.g. Amsterdam (AMS)",
            placeholderAr: "مثال: أمستردام (AMS)",
            required: true,
          },
          {
            key: "arrivingAirport",
            label: "Arrival airport / city",
            labelAr: "مطار أو مدينة الوصول",
            type: "text",
            placeholder: "e.g. Jeddah (JED)",
            placeholderAr: "مثال: جدة (JED)",
          },
          {
            key: "price",
            label: "Price from this airport",
            labelAr: "السعر من هذا المطار",
            type: "text",
            placeholder: "e.g. €899",
            placeholderAr: "مثال: ٨٩٩ يورو",
          },
          {
            key: "date",
            label: "Departure date",
            labelAr: "تاريخ المغادرة",
            type: "text",
            placeholder: "e.g. 15 March 2026",
            placeholderAr: "مثال: ١٥ مارس ٢٠٢٦",
          },
          {
            key: "flyingTime",
            label: "Departure time",
            labelAr: "وقت الإقلاع",
            type: "text",
            placeholder: "e.g. 08:30",
            placeholderAr: "مثال: ٠٨:٣٠",
          },
          {
            key: "arrivingTime",
            label: "Arrival time",
            labelAr: "وقت الوصول",
            type: "text",
            placeholder: "e.g. 14:45",
            placeholderAr: "مثال: ١٤:٤٥",
          },
        ],
      },
    ],
    defaultData: {
      departures: [
        {
          name: "",
          arrivingAirport: "",
          price: "",
          date: "",
          flyingTime: "",
          arrivingTime: "",
        },
      ],
    },
    summaryText: (data, lang) => {
      const deps = arr(data.departures) as Array<Record<string, unknown>>;
      const named = deps.filter((d) => str(d.name));
      if (!named.length)
        return lang === "ar" ? "لا توجد رحلات بعد" : "No flights yet";
      return named.map((d) => str(d.name)).join(", ");
    },
  },

  {
    type: "pricing" as const,
    label: "Pricing",
    labelAr: "الأسعار",
    icon: "credit_card",
    description: "Price tiers per traveller type and cancellation policy",
    descriptionAr: "مستويات الأسعار حسب نوع المسافر وسياسة الإلغاء",
    category: "logistics",
    multiple: false,
    fields: [
      {
        key: "tiers",
        label: "Price tiers",
        labelAr: "مستويات الأسعار",
        type: "repeater",
        itemLabel: "Tier",
        itemLabelAr: "مستوى",
        itemFields: [
          {
            key: "label",
            label: "Label",
            labelAr: "التسمية",
            type: "text",
            placeholder: "e.g. Per person (2 pax)",
            placeholderAr: "مثال: للشخص الواحد (٢ أشخاص)",
          },
          {
            key: "price",
            label: "Price",
            labelAr: "السعر",
            type: "text",
            placeholder: "e.g. €1,299",
            placeholderAr: "مثال: ١٢٩٩ يورو",
          },
        ],
      },
      {
        key: "cancellation",
        label: "Cancellation policy",
        labelAr: "سياسة الإلغاء",
        type: "textarea",
        placeholder: "e.g. Free cancellation up to 30 days before departure",
        placeholderAr: "مثال: إلغاء مجاني حتى ٣٠ يوماً قبل المغادرة",
      },
      {
        key: "paymentContent",
        label: "Payment overview (optional)",
        labelAr: "نظرة عامة على الدفع (اختياري)",
        type: "textarea",
        placeholder: "e.g. 30% deposit on booking, remainder 30 days before departure…",
        placeholderAr: "مثال: ٣٠٪ عربون عند الحجز، والباقي ٣٠ يوماً قبل المغادرة…",
      },
      {
        key: "paymentSteps",
        label: "Payment steps (optional)",
        labelAr: "خطوات الدفع (اختياري)",
        type: "repeater",
        itemLabel: "Step",
        itemLabelAr: "خطوة",
        itemFields: [
          {
            key: "label",
            label: "Label",
            labelAr: "التسمية",
            type: "text",
            placeholder: "e.g. Deposit",
            placeholderAr: "مثال: العربون",
            required: true,
          },
          {
            key: "amount",
            label: "Amount",
            labelAr: "المبلغ",
            type: "text",
            placeholder: "e.g. 30% or €300",
            placeholderAr: "مثال: ٣٠٪ أو ٣٠٠ يورو",
          },
          {
            key: "dueDate",
            label: "Due date",
            labelAr: "تاريخ الاستحقاق",
            type: "text",
            placeholder: "e.g. At booking",
            placeholderAr: "مثال: عند الحجز",
          },
        ],
      },
      {
        key: "termsContent",
        label: "Booking terms & conditions (optional)",
        labelAr: "شروط وأحكام الحجز (اختياري)",
        type: "textarea",
        placeholder: "Full terms and conditions, legal notices, conduct requirements…",
        placeholderAr: "الشروط والأحكام الكاملة والإشعارات القانونية ومتطلبات السلوك…",
      },
    ],
    defaultData: {
      tiers: [
        { label: "Per person (2 pax)", price: "" },
        { label: "Solo traveller", price: "" },
        { label: "Child (2–11 years)", price: "" },
        { label: "Infant (under 2 years)", price: "" },
      ],
      cancellation: "Free cancellation up to 30 days before departure",
      paymentContent: "",
      paymentSteps: [],
      termsContent: "",
    },
    summaryText: (data, lang) => {
      const tiers = arr(data.tiers) as Array<Record<string, unknown>>;
      const first = tiers.find((t) => str(t.price));
      if (!first) return lang === "ar" ? "لا توجد أسعار بعد" : "No prices yet";
      return str(first.price);
    },
  },

  {
    type: "booking_terms" as const,
    legacy: true,
    label: "Booking Terms",
    labelAr: "شروط الحجز",
    icon: "lock",
    description: "Payment schedule, policies, and conditions",
    descriptionAr: "جدول الدفع والسياسات والشروط",
    category: "legal",
    multiple: false,
    fields: [
      {
        key: "content",
        label: "Terms & conditions",
        labelAr: "الشروط والأحكام",
        type: "textarea",
        placeholder:
          "Enter your booking terms, payment policy, cancellation policy…",
        placeholderAr:
          "أدخل شروط الحجز وسياسة الدفع وسياسة الإلغاء…",
      },
    ],
    defaultData: { content: "" },
    summaryText: (data, lang) => {
      const d = str(data.content);
      if (!d) return lang === "ar" ? "لا توجد شروط بعد" : "No terms yet";
      return d.length > 60 ? d.slice(0, 60) + "…" : d;
    },
  },

  {
    type: "transfers" as const,
    label: "Transfers",
    labelAr: "التنقلات",
    icon: "globe",
    description: "Airport pickups, drop-offs, and ground transport details",
    descriptionAr: "تفاصيل الاستقبال والتوصيل والنقل البري",
    category: "logistics",
    multiple: false,
    fields: [
      {
        key: "description",
        label: "Transfer details",
        labelAr: "تفاصيل التنقل",
        type: "textarea",
        placeholder: "Describe what transfers are included and how they work…",
        placeholderAr: "صف خدمات التنقل المشمولة وكيفية عملها…",
      },
      {
        key: "items",
        label: "Transfer services",
        labelAr: "خدمات النقل",
        type: "tagList",
        placeholder: "e.g. Airport pickup",
        placeholderAr: "مثال: استقبال من المطار",
        helpText: "Press Enter or click Add after each item",
        helpTextAr: "اضغط Enter أو انقر إضافة بعد كل عنصر",
      },
    ],
    defaultData: { description: "", items: [] },
    summaryText: (data, lang) => {
      const count = arr(data.items).length;
      if (count)
        return lang === "ar" ? `${count} خدمة` : `${count} service${count !== 1 ? "s" : ""}`;
      const d = str(data.description);
      return d.length > 60 ? d.slice(0, 60) + "…" : d || (lang === "ar" ? "لا توجد تفاصيل بعد" : "No details yet");
    },
  },

  {
    type: "visa" as const,
    label: "Visa Information",
    labelAr: "معلومات التأشيرة",
    icon: "lock",
    description: "Visa requirements and assistance provided",
    descriptionAr: "متطلبات التأشيرة والمساعدة المقدمة",
    category: "logistics",
    multiple: false,
    templateAffiliation: { full: ["aurora", "pulse", "smart", "family"], partial: [] },
    fields: [
      {
        key: "included",
        label: "Visa status",
        labelAr: "حالة التأشيرة",
        type: "select",
        options: [
          { value: "included",   label: "Visa included",         labelAr: "التأشيرة مشمولة" },
          { value: "assistance", label: "Visa assistance",       labelAr: "مساعدة في التأشيرة" },
          { value: "required",   label: "Visa required (self)",  labelAr: "التأشيرة مطلوبة (ذاتي)" },
          { value: "free",       label: "Visa-free destination", labelAr: "وجهة بدون تأشيرة" },
        ],
      },
      {
        key: "content",
        label: "Details",
        labelAr: "التفاصيل",
        type: "textarea",
        placeholder: "Countries covered, requirements, processing time…",
        placeholderAr: "الدول المشمولة والمتطلبات ووقت المعالجة…",
      },
    ],
    defaultData: { included: "included", content: "" },
    summaryText: (data, lang) => {
      const statusMap: Record<string, { en: string; ar: string }> = {
        included:   { en: "Visa included",         ar: "التأشيرة مشمولة" },
        assistance: { en: "Visa assistance",       ar: "مساعدة في التأشيرة" },
        required:   { en: "Visa required (self)",  ar: "التأشيرة مطلوبة (ذاتي)" },
        free:       { en: "Visa-free destination", ar: "وجهة بدون تأشيرة" },
      };
      const s = str(data.included);
      return statusMap[s]?.[lang] ?? (lang === "ar" ? "غير محدد" : "Not specified");
    },
  },

  {
    type: "departure_dates" as const,
    legacy: true,
    label: "Departure Dates",
    labelAr: "مواعيد المغادرة",
    icon: "calendar",
    description: "Available departure dates with prices and availability",
    descriptionAr: "مواعيد المغادرة المتاحة مع الأسعار والأماكن",
    category: "logistics",
    multiple: false,
    fields: [
      {
        key: "dates",
        label: "Departures",
        labelAr: "مواعيد الرحلات",
        type: "repeater",
        itemLabel: "Departure",
        itemLabelAr: "موعد رحلة",
        itemFields: [
          {
            key: "date",
            label: "Departure date",
            labelAr: "تاريخ المغادرة",
            type: "text",
            placeholder: "e.g. 15 March 2026",
            placeholderAr: "مثال: ١٥ مارس ٢٠٢٦",
            required: true,
          },
          {
            key: "returnDate",
            label: "Return date",
            labelAr: "تاريخ العودة",
            type: "text",
            placeholder: "e.g. 22 March 2026",
            placeholderAr: "مثال: ٢٢ مارس ٢٠٢٦",
          },
          {
            key: "price",
            label: "Price from",
            labelAr: "السعر من",
            type: "text",
            placeholder: "e.g. €899",
            placeholderAr: "مثال: ٨٩٩ يورو",
          },
          {
            key: "spots",
            label: "Spots remaining",
            labelAr: "الأماكن المتبقية",
            type: "text",
            placeholder: "e.g. 4 spots left",
            placeholderAr: "مثال: ٤ أماكن متبقية",
          },
        ],
      },
    ],
    defaultData: { dates: [] },
    summaryText: (data, lang) => {
      const count = arr(data.dates).length;
      return lang === "ar"
        ? `${count} موعد`
        : `${count} departure${count !== 1 ? "s" : ""}`;
    },
  },

  {
    type: "payment_plan" as const,
    legacy: true,
    label: "Payment Plan",
    labelAr: "خطة الدفع",
    icon: "credit_card",
    description: "Deposit, instalments, and payment schedule",
    descriptionAr: "العربون والأقساط وجدول الدفع",
    category: "logistics",
    multiple: false,
    fields: [
      {
        key: "content",
        label: "Payment overview",
        labelAr: "نظرة عامة على الدفع",
        type: "textarea",
        placeholder: "e.g. 30% deposit on booking, remainder 30 days before departure…",
        placeholderAr: "مثال: ٣٠٪ عربون عند الحجز، والباقي ٣٠ يوماً قبل المغادرة…",
      },
      {
        key: "steps",
        label: "Payment steps",
        labelAr: "خطوات الدفع",
        type: "repeater",
        itemLabel: "Step",
        itemLabelAr: "خطوة",
        itemFields: [
          {
            key: "label",
            label: "Label",
            labelAr: "التسمية",
            type: "text",
            placeholder: "e.g. Deposit",
            placeholderAr: "مثال: العربون",
            required: true,
          },
          {
            key: "amount",
            label: "Amount",
            labelAr: "المبلغ",
            type: "text",
            placeholder: "e.g. 30% or €300",
            placeholderAr: "مثال: ٣٠٪ أو ٣٠٠ يورو",
          },
          {
            key: "dueDate",
            label: "Due date",
            labelAr: "تاريخ الاستحقاق",
            type: "text",
            placeholder: "e.g. At booking",
            placeholderAr: "مثال: عند الحجز",
          },
        ],
      },
    ],
    defaultData: { content: "", steps: [] },
    summaryText: (data, lang) => {
      const steps = arr(data.steps).length;
      if (steps)
        return lang === "ar" ? `${steps} خطوة` : `${steps} step${steps !== 1 ? "s" : ""}`;
      const d = str(data.content);
      return d.length > 60 ? d.slice(0, 60) + "…" : d || (lang === "ar" ? "لا توجد خطة بعد" : "No plan yet");
    },
  },

  // ─── Media ────────────────────────────────────────────────────────────────

  {
    type: "gallery" as const,
    legacy: true,
    label: "Photo Gallery",
    labelAr: "معرض الصور",
    icon: "image",
    description: "Photos of the destination, hotel, or activities",
    descriptionAr: "صور الوجهة أو الفندق أو الأنشطة",
    category: "media",
    multiple: false,
    fields: [
      {
        key: "images",
        label: "Photos",
        labelAr: "الصور",
        type: "imageList",
        helpText: "Upload or search Pexels. Drag to reorder.",
        helpTextAr: "ارفع أو ابحث في Pexels. اسحب لإعادة الترتيب.",
      },
    ],
    defaultData: { images: [] },
    summaryText: (data, lang) => {
      const count = arr(data.images).length;
      return lang === "ar"
        ? `${count} صورة`
        : `${count} photo${count !== 1 ? "s" : ""}`;
    },
  },

  {
    type: "video" as const,
    legacy: true,
    label: "Video",
    labelAr: "فيديو",
    icon: "video",
    description: "A highlight reel or destination video",
    descriptionAr: "مقطع مميز أو فيديو عن الوجهة",
    category: "media",
    multiple: false,
    fields: [
      {
        key: "videoUrl",
        label: "Video",
        labelAr: "الفيديو",
        type: "video",
        helpText: "Upload a video file or search Pexels videos",
        helpTextAr: "ارفع ملف فيديو أو ابحث في Pexels",
      },
    ],
    defaultData: { videoUrl: "" },
    summaryText: (data, lang) => {
      return str(data.videoUrl)
        ? lang === "ar"
          ? "تم تعيين الفيديو"
          : "Video set"
        : lang === "ar"
        ? "لا يوجد فيديو بعد"
        : "No video yet";
    },
  },

  {
    type: "map" as const,
    legacy: true,
    label: "Map / Route",
    labelAr: "الخريطة / المسار",
    icon: "map",
    description: "A route map or destination overview image",
    descriptionAr: "خريطة المسار أو صورة نظرة عامة على الوجهة",
    category: "media",
    multiple: false,
    fields: [
      {
        key: "image",
        label: "Map image",
        labelAr: "صورة الخريطة",
        type: "image",
        helpText: "Upload a map, route overview, or area image",
        helpTextAr: "ارفع خريطة أو صورة نظرة عامة على المسار أو المنطقة",
      },
      {
        key: "caption",
        label: "Caption",
        labelAr: "التسمية التوضيحية",
        type: "text",
        placeholder: "e.g. Your route through Morocco",
        placeholderAr: "مثال: مسارك عبر المغرب",
      },
    ],
    defaultData: { image: "", caption: "" },
    summaryText: (data, lang) => {
      return str(data.image)
        ? lang === "ar" ? "تم تعيين الخريطة" : "Map set"
        : lang === "ar" ? "لا توجد خريطة بعد" : "No map yet";
    },
  },

  // ─── Social proof ─────────────────────────────────────────────────────────

  {
    type: "reviews" as const,
    label: "Customer Reviews",
    labelAr: "تقييمات العملاء",
    icon: "star",
    description: "Star ratings and testimonials from past travellers",
    descriptionAr: "تقييمات نجمية وشهادات من مسافرين سابقين",
    category: "social",
    multiple: false,
    fields: [
      {
        key: "reviews",
        label: "Reviews",
        labelAr: "التقييمات",
        type: "repeater",
        itemLabel: "Review",
        itemLabelAr: "تقييم",
        itemFields: [
          {
            key: "name",
            label: "Reviewer name",
            labelAr: "اسم المقيِّم",
            type: "text",
            placeholder: "e.g. Sara M.",
            placeholderAr: "مثال: سارة م.",
            required: true,
          },
          {
            key: "rating",
            label: "Rating (1–5)",
            labelAr: "التقييم (١–٥)",
            type: "number",
            min: 1,
            max: 5,
          },
          {
            key: "text",
            label: "Review text",
            labelAr: "نص التقييم",
            type: "textarea",
            placeholder: "What did they say about the trip?",
            placeholderAr: "ماذا قالوا عن الرحلة؟",
          },
          {
            key: "avatarUrl",
            label: "Reviewer photo (optional)",
            labelAr: "صورة المقيِّم (اختياري)",
            type: "image",
          },
        ],
      },
    ],
    defaultData: { reviews: [] },
    summaryText: (data, lang) => {
      const count = arr(data.reviews).length;
      return lang === "ar"
        ? `${count} تقييم`
        : `${count} review${count !== 1 ? "s" : ""}`;
    },
  },

  // ─── v2 section types ─────────────────────────────────────────────────────

  {
    type: "people" as const,
    label: "People",
    labelAr: "الأشخاص",
    icon: "users",
    description: "Travel designer, guide, mutawif, or trip lead — the person behind this package",
    descriptionAr: "مصمم الرحلة أو المرشد أو المطوف — الشخص الذي يقف وراء هذه الباقة",
    category: "content",
    multiple: false,
    fields: [
      {
        key: "people",
        label: "People",
        labelAr: "الأشخاص",
        type: "repeater",
        itemLabel: "Person",
        itemLabelAr: "شخص",
        itemFields: [
          {
            key: "role",
            label: "Role",
            labelAr: "الدور",
            type: "select",
            options: [
              { value: "agent",     label: "Travel designer / agent", labelAr: "مصمم رحلات / وكيل" },
              { value: "guide",     label: "Tour guide",              labelAr: "مرشد سياحي" },
              { value: "mutawif",   label: "Mutawif",                 labelAr: "مطوف" },
              { value: "curator",   label: "Curator",                 labelAr: "منسق" },
              { value: "trip_lead", label: "Trip lead",               labelAr: "قائد الرحلة" },
            ],
          },
          {
            key: "name",
            label: "Name",
            labelAr: "الاسم",
            type: "text",
            placeholder: "e.g. Khalid Al-Omri",
            placeholderAr: "مثال: خالد العمري",
            required: true,
          },
          {
            key: "bio",
            label: "Bio",
            labelAr: "نبذة",
            type: "textarea",
            placeholder: "Short introduction…",
            placeholderAr: "مقدمة قصيرة…",
          },
          {
            key: "photo",
            label: "Photo",
            labelAr: "الصورة",
            type: "image",
          },
          {
            key: "languages",
            label: "Languages spoken",
            labelAr: "اللغات المتحدث بها",
            type: "tagList",
            placeholder: "e.g. Arabic",
            placeholderAr: "مثال: العربية",
            helpText: "Press Enter after each language",
            helpTextAr: "اضغط Enter بعد كل لغة",
          },
          {
            key: "years",
            label: "Years of experience",
            labelAr: "سنوات الخبرة",
            type: "number",
            min: 0,
          },
          {
            key: "repliesIn",
            label: "Replies in (e.g. \"30 min\")",
            labelAr: "يرد في (مثال: \"30 دقيقة\")",
            type: "text",
            placeholder: "e.g. 30 min",
            placeholderAr: "مثال: ٣٠ دقيقة",
          },
        ],
      },
    ],
    defaultData: {
      people: [
        { id: "", role: "agent", name: "", bio: "", photo: "", languages: [], years: 0, repliesIn: "" },
      ],
    },
    summaryText: (data, lang) => {
      const people = Array.isArray(data.people) ? data.people as Array<Record<string, unknown>> : [];
      const first = people[0];
      if (!first) return lang === "ar" ? "لا يوجد بعد" : "None yet";
      const name = typeof first.name === "string" ? first.name : "";
      return name || (lang === "ar" ? "شخص" : "Person");
    },
  },

  {
    type: "trek_profile" as const,
    label: "Trek Profile",
    labelAr: "ملف الرحلة الجبلية",
    icon: "map",
    description: "Difficulty, altitude, distance — foregrounded by Compass template",
    descriptionAr: "الصعوبة والارتفاع والمسافة — مميَّز في قالب Compass",
    category: "content",
    multiple: false,
    templateAffiliation: { full: ["compass"], partial: [] },
    fields: [
      {
        key: "difficulty",
        label: "Difficulty",
        labelAr: "مستوى الصعوبة",
        type: "select",
        options: [
          { value: "",           label: "— Not set —",  labelAr: "— غير محدد —" },
          { value: "easy",       label: "Easy",          labelAr: "سهل" },
          { value: "moderate",   label: "Moderate",      labelAr: "متوسط" },
          { value: "strenuous",  label: "Strenuous",     labelAr: "شاق" },
          { value: "extreme",    label: "Extreme",       labelAr: "متطرف" },
        ],
      },
      {
        key: "maxAltitude",
        label: "Max altitude (m)",
        labelAr: "أقصى ارتفاع (م)",
        type: "number",
        min: 0,
      },
      {
        key: "distanceKm",
        label: "Total distance (km)",
        labelAr: "المسافة الكلية (كم)",
        type: "number",
        min: 0,
      },
      {
        key: "fitnessNote",
        label: "Fitness note",
        labelAr: "ملاحظة اللياقة",
        type: "textarea",
        placeholder: "e.g. Good fitness required — 6–8 hours walking per day",
        placeholderAr: "مثال: لياقة جيدة مطلوبة — ٦–٨ ساعات مشي يومياً",
      },
    ],
    defaultData: { difficulty: "", maxAltitude: 0, distanceKm: 0, fitnessNote: "" },
    summaryText: (data, lang) => {
      const d = str(data.difficulty);
      if (!d) return lang === "ar" ? "لم يُحدد بعد" : "Not set yet";
      const map: Record<string, { en: string; ar: string }> = {
        easy:      { en: "Easy",      ar: "سهل" },
        moderate:  { en: "Moderate",  ar: "متوسط" },
        strenuous: { en: "Strenuous", ar: "شاق" },
        extreme:   { en: "Extreme",   ar: "متطرف" },
      };
      return map[d]?.[lang] ?? d;
    },
  },

  {
    type: "scarcity" as const,
    label: "Scarcity & Urgency",
    labelAr: "الندرة والإلحاح",
    icon: "sparkle",
    description: "Was-price, spots remaining, departure date — foregrounded by Pulse",
    descriptionAr: "السعر الأصلي، الأماكن المتبقية، تاريخ المغادرة — مميَّز في قالب Pulse",
    category: "logistics",
    multiple: false,
    templateAffiliation: { full: ["pulse"], partial: ["aurora", "voyage"] },
    fields: [
      {
        key: "wasPrice",
        label: "Was price (original)",
        labelAr: "السعر الأصلي",
        type: "text",
        placeholder: "e.g. €1,499",
        placeholderAr: "مثال: ١٤٩٩ يورو",
        helpText: "The saving amount is auto-calculated at render — do not store it separately.",
        helpTextAr: "مبلغ التوفير يُحسب تلقائياً عند العرض — لا تخزّنه بشكل منفصل.",
      },
      {
        key: "spotsRemaining",
        label: "Spots remaining",
        labelAr: "الأماكن المتبقية",
        type: "number",
        min: 0,
      },
      {
        key: "totalSpots",
        label: "Total spots (capacity)",
        labelAr: "إجمالي الأماكن (السعة)",
        type: "number",
        min: 0,
      },
      {
        key: "firstDepartureDate",
        label: "First departure date (for countdown)",
        labelAr: "تاريخ أول رحلة (للعداد التنازلي)",
        type: "text",
        placeholder: "e.g. 2026-06-15",
        placeholderAr: "مثال: ٢٠٢٦-٠٦-١٥",
      },
    ],
    defaultData: { wasPrice: "", spotsRemaining: 0, totalSpots: 0, firstDepartureDate: "" },
    summaryText: (data, lang) => {
      const spots = typeof data.spotsRemaining === "number" ? data.spotsRemaining : 0;
      const was = str(data.wasPrice);
      if (spots > 0) return lang === "ar" ? `${spots} أماكن متبقية` : `${spots} spot${spots !== 1 ? "s" : ""} left`;
      if (was) return lang === "ar" ? `كان ${was}` : `Was ${was}`;
      return lang === "ar" ? "لم يُحدد بعد" : "Not set yet";
    },
  },

  {
    type: "media" as const,
    label: "Media",
    labelAr: "الوسائط",
    icon: "image",
    description: "Photos, video, and map — all media in one place",
    descriptionAr: "الصور والفيديو والخريطة — كل الوسائط في مكان واحد",
    category: "media",
    multiple: false,
    fields: [
      {
        key: "images",
        label: "Photos",
        labelAr: "الصور",
        type: "imageList",
        helpText: "Upload or search Pexels. Drag to reorder.",
        helpTextAr: "ارفع أو ابحث في Pexels. اسحب لإعادة الترتيب.",
      },
      {
        key: "videoUrl",
        label: "Video",
        labelAr: "الفيديو",
        type: "video",
        helpText: "Upload a video file or search Pexels videos",
        helpTextAr: "ارفع ملف فيديو أو ابحث في Pexels",
      },
      {
        key: "mapImage",
        label: "Map / route image",
        labelAr: "صورة الخريطة / المسار",
        type: "image",
        helpText: "Upload a map, route overview, or area image",
        helpTextAr: "ارفع خريطة أو صورة نظرة عامة على المسار",
      },
      {
        key: "mapCaption",
        label: "Map caption",
        labelAr: "وصف الخريطة",
        type: "text",
        placeholder: "e.g. Your route through Morocco",
        placeholderAr: "مثال: مسارك عبر المغرب",
      },
    ],
    defaultData: { images: [], videoUrl: "", mapImage: "", mapCaption: "" },
    summaryText: (data, lang) => {
      const imgCount = arr(data.images).length;
      const hasVideo = !!str(data.videoUrl);
      const hasMap = !!str(data.mapImage);
      const parts: string[] = [];
      if (imgCount > 0) parts.push(lang === "ar" ? `${imgCount} صورة` : `${imgCount} photo${imgCount !== 1 ? "s" : ""}`);
      if (hasVideo) parts.push(lang === "ar" ? "فيديو" : "video");
      if (hasMap) parts.push(lang === "ar" ? "خريطة" : "map");
      return parts.length > 0 ? parts.join(" · ") : (lang === "ar" ? "لا يوجد محتوى بعد" : "No media yet");
    },
  },

  {
    type: "other_packages" as const,
    label: "Other Packages",
    labelAr: "باقات أخرى",
    icon: "package",
    description: "Auto-shows your other active packages with a link to your storefront",
    descriptionAr: "يعرض تلقائياً باقاتك الأخرى النشطة مع رابط لمتجرك",
    category: "social",
    multiple: false,
    skipInviteState: true,
    fields: [
      {
        key: "heading",
        label: "Section heading (optional)",
        labelAr: "عنوان القسم (اختياري)",
        type: "text",
        placeholder: "e.g. More trips you'll love",
        placeholderAr: "مثال: رحلات أخرى ستحبها",
      },
    ],
    defaultData: { heading: "" },
    summaryText: (_data, lang) =>
      lang === "ar"
        ? "يُعبَّأ تلقائياً من باقاتك"
        : "Auto-populated from your packages",
  },

  {
    type: "departures" as const,
    label: "Departures",
    labelAr: "مواعيد المغادرة",
    icon: "globe",
    description: "Departure dates, airports, availability, and per-departure pricing",
    descriptionAr: "تواريخ المغادرة والمطارات والتوفر والأسعار لكل رحلة",
    category: "logistics",
    multiple: false,
    fields: [
      {
        key: "entries",
        label: "Departures",
        labelAr: "رحلات المغادرة",
        type: "repeater",
        itemLabel: "Departure",
        itemLabelAr: "رحلة",
        itemFields: [
          {
            key: "date",
            label: "Departure date",
            labelAr: "تاريخ المغادرة",
            type: "text",
            placeholder: "e.g. 15 March 2026",
            placeholderAr: "مثال: ١٥ مارس ٢٠٢٦",
            required: true,
          },
          {
            key: "returnDate",
            label: "Return date",
            labelAr: "تاريخ العودة",
            type: "text",
            placeholder: "e.g. 22 March 2026",
            placeholderAr: "مثال: ٢٢ مارس ٢٠٢٦",
          },
          {
            key: "spots",
            label: "Spots available",
            labelAr: "الأماكن المتاحة",
            type: "number",
            min: 0,
          },
          {
            key: "price",
            label: "Price (optional override)",
            labelAr: "السعر (تجاوز اختياري)",
            type: "text",
            placeholder: "e.g. €899",
            placeholderAr: "مثال: ٨٩٩ يورو",
          },
          {
            key: "origin",
            label: "Departure airport / city",
            labelAr: "مطار أو مدينة المغادرة",
            type: "text",
            placeholder: "e.g. Amsterdam (AMS)",
            placeholderAr: "مثال: أمستردام (AMS)",
          },
          {
            key: "arrivingAirport",
            label: "Arrival airport / city",
            labelAr: "مطار أو مدينة الوصول",
            type: "text",
            placeholder: "e.g. Jeddah (JED)",
            placeholderAr: "مثال: جدة (JED)",
          },
          {
            key: "flyingTime",
            label: "Departure time",
            labelAr: "وقت الإقلاع",
            type: "text",
            placeholder: "e.g. 08:30",
            placeholderAr: "مثال: ٠٨:٣٠",
          },
          {
            key: "arrivingTime",
            label: "Arrival time",
            labelAr: "وقت الوصول",
            type: "text",
            placeholder: "e.g. 14:45",
            placeholderAr: "مثال: ١٤:٤٥",
          },
          {
            key: "deal",
            label: "Special deal",
            labelAr: "عرض خاص",
            type: "select",
            options: [
              { value: "false", label: "No",                               labelAr: "لا" },
              { value: "true",  label: "Yes — charter under-sell / deal",  labelAr: "نعم — عرض خاص" },
            ],
          },
        ],
      },
    ],
    defaultData: { entries: [] },
    summaryText: (data, lang) => {
      const count = arr(data.entries).length;
      return lang === "ar"
        ? `${count} موعد`
        : `${count} departure${count !== 1 ? "s" : ""}`;
    },
  },

] satisfies SectionTypeDef[];

export type SectionTypeKey = (typeof REGISTRY)[number]["type"];
export const SECTION_TYPE_KEYS = REGISTRY.map((r) => r.type);

export const SECTION_REGISTRY: Record<SectionTypeKey, SectionTypeDef> =
  Object.fromEntries(REGISTRY.map((def) => [def.type, def])) as unknown as Record<
    SectionTypeKey,
    SectionTypeDef
  >;

/** Ordered list of all section types, grouped by category */
export const SECTION_REGISTRY_LIST = REGISTRY;

export const SECTION_CATEGORIES: Array<{
  id: SectionCategory;
  label: string;
  labelAr: string;
}> = [
  { id: "content",   label: "Content",    labelAr: "المحتوى" },
  { id: "logistics", label: "Logistics",  labelAr: "اللوجستيات" },
  { id: "media",     label: "Media",      labelAr: "الوسائط" },
  { id: "social",    label: "Social proof", labelAr: "الدليل الاجتماعي" },
  { id: "legal",     label: "Legal",      labelAr: "قانوني" },
];
