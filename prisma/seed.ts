process.env.LOG_LEVELS = 'error';
import { db } from '../src/lib/db';

// ============================================================
// CATEGORY STRUCTURE
// ============================================================

interface CatDef {
  name: string;
  slug: string;
  order: number;
  parentId?: number;
  children?: CatDef[];
}

const categoryTree: CatDef[] = [
  {
    name: 'اندودانتیکس',
    slug: 'endodontics',
    order: 1,
    children: [
      {
        name: 'دستگاه',
        slug: 'endodontics-devices',
        order: 1,
        children: [
          {
            name: 'اندوموتور',
            slug: 'endomotor',
            order: 1,
          },
          {
            name: 'آپکس فایندر',
            slug: 'apex-finder',
            order: 2,
          },
          {
            name: 'آبچوراتور',
            slug: 'obturator',
            order: 3,
          },
          {
            name: 'ایریگیشن',
            slug: 'irrigation',
            order: 4,
          },
          {
            name: 'گوتاکاتر',
            slug: 'gutta-cutter',
            order: 5,
          },
          {
            name: 'آنگل روتاری',
            slug: 'rotary-angle',
            order: 6,
          },
          {
            name: 'اندولیفت',
            slug: 'endo-lift',
            order: 7,
          }
        ],
      },
      {
        name: 'ابزار',
        slug: 'endodontics-tools',
        order: 2,
        children: [
          {
            name: 'فایل روتاری',
            slug: 'rotary-files',
            order: 1,
          },
          {
            name: 'فایل دستی',
            slug: 'hand-files',
            order: 2,
          },
          {
            name: 'سرسوزن شست و شو',
            slug: 'irrigation-needles',
            order: 3,
          },
          {
            name: 'اسپریدر و پلاگر',
            slug: 'spreader-plugger',
            order: 4,
          },
          {
            name: 'خارج سازی فایل',
            slug: 'file-removal',
            order: 5,
          },
          {
            name: 'گیتس و پیزو',
            slug: 'gates-pisso',
            order: 6,
          },
          {
            name: 'اندومتر و استندفایل',
            slug: 'endometer-stand-file',
            order: 7,
          }
        ],
      },
      {
        name: 'مواد',
        slug: 'endodontics-materials',
        order: 3,
        children: [
          {
            name: 'سیلر',
            slug: 'sealer',
            order: 1,
          },
          {
            name: 'MTA',
            slug: 'mta',
            order: 2,
          },
          {
            name: 'گوتاپرکا',
            slug: 'gutta-percha',
            order: 3,
          },
          {
            name: 'کن کاغذی',
            slug: 'paper-points',
            order: 4,
          },
          {
            name: 'زینک اکساید',
            slug: 'zinc-oxide',
            order: 5,
          },
          {
            name: 'کلروفرم',
            slug: 'chloroform',
            order: 6,
          },
          {
            name: 'کلسیم هیدروکساید',
            slug: 'calcium-hydroxide',
            order: 7,
          },
          {
            name: 'اوژنول',
            slug: 'eugenol',
            order: 8,
          },
          {
            name: 'لوبریکانت و شست و شو کانال',
            slug: 'lubricant-canal-wash',
            order: 9,
          }
        ],
      },
      {
        name: 'رابردم و متعلقات',
        slug: 'rubber-dam-accessories',
        order: 4,
        children: [
          {
            name: 'ست رابردم',
            slug: 'rubber-dam-set',
            order: 1,
          },
          {
            name: 'لاستیک رابردم',
            slug: 'rubber-dam-sheet',
            order: 2,
          },
          {
            name: 'کلمپ رابردم',
            slug: 'rubber-dam-clamp',
            order: 3,
          },
          {
            name: 'فورسپس رابردم',
            slug: 'rubber-dam-forceps',
            order: 4,
          },
          {
            name: 'فریم و الگو',
            slug: 'rubber-dam-frame-template',
            order: 5,
          }
        ],
      }
    ],
  },
  {
    name: 'ترمیمی و زیبایی',
    slug: 'restorative-cosmetic',
    order: 2,
    children: [
      {
        name: 'مواد',
        slug: 'restorative-materials',
        order: 1,
        children: [
          {
            name: 'آمالگام',
            slug: 'amalgam',
            order: 1,
          },
          {
            name: 'کامپوزیت',
            slug: 'composite',
            order: 2,
          },
          {
            name: 'بلیچینگ',
            slug: 'bleaching',
            order: 3,
          },
          {
            name: 'باندینگ',
            slug: 'bonding',
            order: 4,
          },
          {
            name: 'اسید اچ',
            slug: 'acid-etch',
            order: 5,
          },
          {
            name: 'بیس و لاینر',
            slug: 'base-liner',
            order: 6,
          },
          {
            name: 'نشانگر پوسیدگی',
            slug: 'caries-detector',
            order: 7,
          }
        ],
      },
      {
        name: 'ابزار',
        slug: 'restorative-tools',
        order: 2,
        children: [
          {
            name: 'ترمیم آمالگام',
            slug: 'amalgam-restoration',
            order: 1,
          },
          {
            name: 'قلم کامپوزیت',
            slug: 'composite-instrument',
            order: 2,
          },
          {
            name: 'نوار و ماتریکس',
            slug: 'matrix-band',
            order: 3,
          },
          {
            name: 'آمالگام کریر',
            slug: 'amalgam-carrier',
            order: 4,
          },
          {
            name: 'پین',
            slug: 'pin',
            order: 5,
          },
          {
            name: 'گوده',
            slug: 'carver',
            order: 6,
          },
          {
            name: 'وج',
            slug: 'wedge',
            order: 7,
          }
        ],
      },
      {
        name: 'دستگاه',
        slug: 'restorative-devices',
        order: 3,
        children: [
          {
            name: 'لایت کیور',
            slug: 'light-cure',
            order: 1,
          },
          {
            name: 'آمالگاماتور',
            slug: 'amalgamator',
            order: 2,
          },
          {
            name: 'دستگاه بلیچینگ',
            slug: 'bleaching-device',
            order: 3,
          },
          {
            name: 'کامپوزیت وارمر و لایت‌متر',
            slug: 'composite-warmer-lightmeter',
            order: 4,
          }
        ],
      }
    ],
  },
  {
    name: 'هندپیس‌ها',
    slug: 'handpieces',
    order: 3,
    children: [
      {
        name: 'توربین',
        slug: 'turbines',
        order: 1,
        children: [
          {
            name: 'توربین دوسوراخه',
            slug: 'two-hole-turbine',
            order: 1,
          },
          {
            name: 'توربین چهارسوراخه',
            slug: 'four-hole-turbine',
            order: 2,
          },
          {
            name: 'توربین نوری',
            slug: 'optic-turbine',
            order: 3,
          },
          {
            name: 'توربین جراحی',
            slug: 'surgical-turbine',
            order: 4,
          }
        ],
      },
      {
        name: 'آنگل',
        slug: 'angles',
        order: 2,
        children: [
          {
            name: 'آنگل ناخنکی',
            slug: 'mini-head-angle',
            order: 1,
          },
          {
            name: 'آنگل پوش باتن',
            slug: 'push-button-angle',
            order: 2,
          },
          {
            name: 'آنگل ایمپلنت',
            slug: 'implant-angle',
            order: 3,
          },
          {
            name: 'آنگل روتاری',
            slug: 'rotary-angle-handpiece',
            order: 4,
          },
          {
            name: 'اندولیفت',
            slug: 'endo-lift-handpiece',
            order: 5,
          }
        ],
      },
      {
        name: 'ایرموتور',
        slug: 'air-motors',
        order: 3,
        children: [
          {
            name: 'ایرموتور دو سوراخه',
            slug: 'two-hole-air-motor',
            order: 1,
          },
          {
            name: 'ایرموتور چهارسوراخه',
            slug: 'four-hole-air-motor',
            order: 2,
          }
        ],
      },
      {
        name: 'هندپیس جراحی',
        slug: 'surgical-handpiece',
        order: 4,
      }
    ],
  },
  {
    name: 'تجهیزات دندانپزشکی بزرگ',
    slug: 'large-dental-equipment',
    order: 4,
    children: [
      {
        name: 'یونیت دندانپزشکی',
        slug: 'dental-units',
        order: 1,
        children: [
          {
            name: 'دنتوس',
            slug: 'dentus',
            order: 1,
          },
          {
            name: 'فخرسینا',
            slug: 'fakhresina',
            order: 2,
          },
          {
            name: 'زیگر',
            slug: 'zigr',
            order: 3,
          },
          {
            name: 'پارس دنتال',
            slug: 'pars-dental',
            order: 4,
          },
          {
            name: 'وصال گستر',
            slug: 'vesal-gostar',
            order: 5,
          },
          {
            name: 'پارس طب',
            slug: 'pars-tob',
            order: 6,
          },
          {
            name: 'اکباتان',
            slug: 'ekbatan',
            order: 7,
          },
          {
            name: 'کارن',
            slug: 'karen-unit',
            order: 8,
          },
          {
            name: 'زیمر',
            slug: 'zimmer-unit',
            order: 9,
          },
          {
            name: 'شیک طب',
            slug: 'sheik-tob',
            order: 10,
          }
        ],
      },
      {
        name: 'تجهیزات استریل‌کننده',
        slug: 'sterilization-equipment',
        order: 2,
        children: [
          {
            name: 'اتوکلاو',
            slug: 'autoclave',
            order: 1,
          },
          {
            name: 'اولتراسونیک کلینر و پک اتوکلاو',
            slug: 'ultrasonic-cleaner-autoclave-pack',
            order: 2,
          }
        ],
      },
      {
        name: 'سرویتور و روتور',
        slug: 'servitor-rotor',
        order: 3,
        children: [
          {
            name: 'سرویتور',
            slug: 'servitor',
            order: 1,
          },
          {
            name: 'روتور',
            slug: 'rotor',
            order: 2,
          }
        ],
      },
      {
        name: 'کمپرسور',
        slug: 'compressor',
        order: 4,
      },
      {
        name: 'ساکشن',
        slug: 'suction',
        order: 5,
      },
      {
        name: 'تابوره',
        slug: 'dental-stool',
        order: 6,
      }
    ],
  },
  {
    name: 'جراحی',
    slug: 'surgery',
    order: 5,
    children: [
      {
        name: 'ابزار',
        slug: 'surgery-tools',
        order: 1,
        children: [
          {
            name: 'تزریق بی‌حسی',
            slug: 'anesthesia-injection',
            order: 1,
          },
          {
            name: 'ظروف',
            slug: 'surgery-containers',
            order: 2,
          },
          {
            name: 'رترکتور',
            slug: 'retractor',
            order: 3,
          },
          {
            name: 'بیستوری',
            slug: 'osteotome',
            order: 4,
          },
          {
            name: 'قیچی و پنس',
            slug: 'scissors-forceps',
            order: 5,
          },
          {
            name: 'هموستات و سوزنگیر',
            slug: 'hemostat-needle-holder',
            order: 6,
          },
          {
            name: 'سایر ابزار جراحی',
            slug: 'other-surgery-tools',
            order: 7,
          }
        ],
      },
      {
        name: 'فورسپس',
        slug: 'surgery-forceps',
        order: 2,
        children: [
          {
            name: 'قدامی',
            slug: 'anterior-forceps',
            order: 1,
          },
          {
            name: 'پرمولر',
            slug: 'premolar-forceps',
            order: 2,
          },
          {
            name: 'مولر و عقل',
            slug: 'molar-wisdom-forceps',
            order: 3,
          },
          {
            name: 'ریشه‌کش',
            slug: 'root-elevator-forceps',
            order: 4,
          },
          {
            name: 'کاهورن',
            slug: 'cowhorn-forceps',
            order: 5,
          },
          {
            name: 'فورسپس اطفال',
            slug: 'pediatric-forceps',
            order: 6,
          },
          {
            name: 'ست فورسپس',
            slug: 'forceps-set',
            order: 7,
          }
        ],
      },
      {
        name: 'الواتور',
        slug: 'elevators',
        order: 3,
        children: [
          {
            name: 'مستقیم',
            slug: 'straight-elevator',
            order: 1,
          },
          {
            name: 'کرایر',
            slug: 'cryer-elevator',
            order: 2,
          },
          {
            name: 'کوپلن',
            slug: 'coupland-elevator',
            order: 3,
          },
          {
            name: 'سایر الواتورها',
            slug: 'other-elevators',
            order: 4,
          },
          {
            name: 'ست الواتور',
            slug: 'elevator-set',
            order: 5,
          }
        ],
      },
      {
        name: 'دستگاه',
        slug: 'surgery-devices',
        order: 4,
        children: [
          {
            name: 'موتور ایمپلنت',
            slug: 'implant-motor',
            order: 1,
          },
          {
            name: 'آنگل ایمپلنت',
            slug: 'implant-angle-surgery',
            order: 2,
          },
          {
            name: 'پیزو و الکتروسرجری',
            slug: 'piezo-electrosurgery',
            order: 3,
          },
          {
            name: 'میکروموتور جراحی',
            slug: 'surgical-micromotor',
            order: 4,
          }
        ],
      },
      {
        name: 'ایمپلنت و متعلقات',
        slug: 'implants-accessories',
        order: 5,
      },
      {
        name: 'مواد جراحی',
        slug: 'surgery-materials',
        order: 6,
      }
    ],
  },
  {
    name: 'رادیولوژی',
    slug: 'radiology',
    order: 6,
    children: [
      {
        name: 'دستگاه',
        slug: 'radiology-devices',
        order: 1,
        children: [
          {
            name: 'RVG',
            slug: 'rvg',
            order: 1,
          },
          {
            name: 'فسفرپلیت',
            slug: 'psp-plate',
            order: 2,
          },
          {
            name: 'رادیوگرافی',
            slug: 'radiography',
            order: 3,
          },
          {
            name: 'نگاتوسکوپ',
            slug: 'negatoscope',
            order: 4,
          },
          {
            name: 'تاریکخانه',
            slug: 'darkroom',
            order: 5,
          }
        ],
      },
      {
        name: 'ابزار و مواد',
        slug: 'radiology-tools-materials',
        order: 2,
        children: [
          {
            name: 'گیره، هولدر و کاور',
            slug: 'holder-clamp-cover',
            order: 1,
          },
          {
            name: 'ظهور و ثبوت و گرافی',
            slug: 'film-developer-fixer',
            order: 2,
          },
          {
            name: 'روپوش و پاراوان سربی',
            slug: 'lead-apron-shield',
            order: 3,
          }
        ],
      }
    ],
  },
  {
    name: 'پریودنتیکس',
    slug: 'periodontics',
    order: 7,
    children: [
      {
        name: 'دستگاه',
        slug: 'periodontics-devices',
        order: 1,
        children: [
          {
            name: 'دستگاه جرمگیری',
            slug: 'scaler-device',
            order: 1,
          },
          {
            name: 'ایرفلو و لیزر',
            slug: 'airflow-laser',
            order: 2,
          }
        ],
      },
      {
        name: 'ابزار',
        slug: 'periodontics-tools',
        order: 2,
        children: [
          {
            name: 'سینوس‌لیفت',
            slug: 'sinus-lift',
            order: 1,
          },
          {
            name: 'پروب',
            slug: 'probe',
            order: 2,
          },
          {
            name: 'سایر',
            slug: 'other-perio-tools',
            order: 3,
          }
        ],
      },
      {
        name: 'مواد',
        slug: 'periodontics-materials',
        order: 3,
        children: [
          {
            name: 'انعقاد خون',
            slug: 'hemostatic',
            order: 1,
          },
          {
            name: 'خمیرجرمگیری',
            slug: 'scaling-paste',
            order: 2,
          }
        ],
      }
    ],
  },
  {
    name: 'پروتز',
    slug: 'prosthodontics',
    order: 8,
    children: [
      {
        name: 'مواد',
        slug: 'prostho-materials',
        order: 1,
        children: [
          {
            name: 'مواد قالبگیری',
            slug: 'impression-materials',
            order: 1,
          },
          {
            name: 'اسیداچ پرسلن',
            slug: 'acid-etch-porcelain',
            order: 2,
          },
          {
            name: 'سمان',
            slug: 'cement',
            order: 3,
          },
          {
            name: 'آلژینات',
            slug: 'alginate',
            order: 4,
          },
          {
            name: 'موم',
            slug: 'wax',
            order: 5,
          }
        ],
      },
      {
        name: 'ابزار',
        slug: 'prostho-tools',
        order: 2,
        children: [
          {
            name: 'ابزار فلزی',
            slug: 'metal-tools',
            order: 1,
          },
          {
            name: 'نخ زیرلثه',
            slug: 'subgingival-floss',
            order: 2,
          },
          {
            name: 'لابراتواری',
            slug: 'laboratory-tools',
            order: 3,
          },
          {
            name: 'تری',
            slug: 'dental-tray',
            order: 4,
          }
        ],
      },
      {
        name: 'دستگاه',
        slug: 'prostho-devices',
        order: 3,
        children: [
          {
            name: 'سندبلاستر',
            slug: 'sandblaster',
            order: 1,
          },
          {
            name: 'ایرفلو',
            slug: 'airflow-prostho',
            order: 2,
          },
          {
            name: 'میکروموتور',
            slug: 'micromotor-prostho',
            order: 3,
          }
        ],
      }
    ],
  },
  {
    name: 'اطفال و ارتودنسی',
    slug: 'pediatric-orthodontics',
    order: 9,
    children: [
      {
        name: 'اطفال',
        slug: 'pediatric',
        order: 1,
        children: [
          {
            name: 'مواد',
            slug: 'pediatric-materials',
            order: 1,
          },
          {
            name: 'ابزار و تجهیزات',
            slug: 'pediatric-tools-equipment',
            order: 2,
          }
        ],
      },
      {
        name: 'ارتودنسی',
        slug: 'orthodontics',
        order: 2,
        children: [
          {
            name: 'پلایر',
            slug: 'plier',
            order: 1,
          },
          {
            name: 'کاتر',
            slug: 'cutter',
            order: 2,
          },
          {
            name: 'براکت و وایر',
            slug: 'bracket-wire',
            order: 3,
          },
          {
            name: 'سایر ابزار و مواد',
            slug: 'other-ortho-tools-materials',
            order: 4,
          }
        ],
      }
    ],
  },
  {
    name: 'مواد و تجهیزات عمومی',
    slug: 'general-materials-equipment',
    order: 10,
    children: [
      {
        name: 'کتاب و مدل آموزشی',
        slug: 'educational-books-models',
        order: 1,
        children: [
          {
            name: 'دنتیک',
            slug: 'dentic',
            order: 1,
          },
          {
            name: 'کست',
            slug: 'cast',
            order: 2,
          },
          {
            name: 'کتاب',
            slug: 'dental-books',
            order: 3,
          },
          {
            name: 'بلوک اندو',
            slug: 'endo-blocks',
            order: 4,
          },
          {
            name: 'هدفانتوم و کیت بخیه',
            slug: 'phantom-suture-kit',
            order: 5,
          },
          {
            name: 'گچ و موم مورفولوژی',
            slug: 'plaster-wax-morphology',
            order: 6,
          }
        ],
      },
      {
        name: 'ابزار',
        slug: 'general-tools',
        order: 2,
        children: [
          {
            name: 'وسایل معاینه',
            slug: 'examination-tools',
            order: 1,
          },
          {
            name: 'ظروف دندانپزشکی',
            slug: 'dental-containers',
            order: 2,
          },
          {
            name: 'دهان‌بازکن و فتوگرافی',
            slug: 'mouth-opener-photography',
            order: 3,
          },
          {
            name: 'مولت و دیسک',
            slug: 'mandrel-disc',
            order: 4,
          },
          {
            name: 'ماسک و دستکش',
            slug: 'mask-gloves',
            order: 5,
          },
          {
            name: 'شیلد و گان',
            slug: 'shield-gown',
            order: 6,
          },
          {
            name: 'سرسوزن و بخیه',
            slug: 'needle-suture',
            order: 7,
          }
        ],
      },
      {
        name: 'مواد',
        slug: 'general-materials',
        order: 3,
        children: [
          {
            name: 'یکبارمصرف',
            slug: 'disposables',
            order: 1,
          },
          {
            name: 'ضدعفونی کننده',
            slug: 'disinfectant',
            order: 2,
          },
          {
            name: 'بیحسی',
            slug: 'anesthetic',
            order: 3,
          }
        ],
      },
      {
        name: 'لوپ و میکروسکوپ',
        slug: 'loupe-microscope',
        order: 4,
      },
      {
        name: 'اکسسوری',
        slug: 'accessories',
        order: 5,
      }
    ],
  }
];

// ============================================================
// BRANDS
// ============================================================

const brandDefs: { name: string; slug: string; logo: string | null; visible: boolean }[] = [
  { name: 'NSK', slug: 'nsk', logo: null, visible: true },
  { name: 'W&H', slug: 'wh', logo: null, visible: true },
  { name: 'Kavo', slug: 'kavo', logo: null, visible: true },
  { name: 'Siemens', slug: 'siemens', logo: null, visible: true },
  { name: 'Dentsply', slug: 'dentsply', logo: null, visible: true },
  { name: 'Maillefer', slug: 'maillefer', logo: null, visible: true },
  { name: 'VDW', slug: 'vdw', logo: null, visible: true },
  { name: 'Meta Biomed', slug: 'meta-biomed', logo: null, visible: true },
  { name: 'Coltene', slug: 'coltene', logo: null, visible: true },
  { name: 'Ultradent', slug: 'ultradent', logo: null, visible: true },
  { name: '3M ESPE', slug: '3m-espe', logo: null, visible: true },
  { name: 'Ivoclar Vivadent', slug: 'ivoclar-vivadent', logo: null, visible: true },
  { name: 'GC', slug: 'gc', logo: null, visible: true },
  { name: 'Kerr', slug: 'kerr', logo: null, visible: true },
  { name: 'Shofu', slug: 'shofu', logo: null, visible: true },
  { name: 'Tokuyama', slug: 'tokuyama', logo: null, visible: true },
  { name: 'Voco', slug: 'voco', logo: null, visible: true },
  { name: 'Septodont', slug: 'septodont', logo: null, visible: true },
  { name: 'Dentsply Sirona', slug: 'dentsply-sirona', logo: null, visible: true },
  { name: 'Mani', slug: 'mani', logo: null, visible: true },
  { name: 'Edenta', slug: 'edenta', logo: null, visible: true },
  { name: 'Anthogyr', slug: 'anthogyr', logo: null, visible: true },
  { name: 'Straumann', slug: 'straumann', logo: null, visible: true },
  { name: 'Nobel Biocare', slug: 'nobel-biocare', logo: null, visible: true },
  { name: 'Osstem', slug: 'osstem', logo: null, visible: true },
  { name: 'Dio', slug: 'dio', logo: null, visible: true },
  { name: 'MIS', slug: 'mis', logo: null, visible: true },
  { name: 'Biohorizons', slug: 'biohorizons', logo: null, visible: true },
  { name: 'Zimmer', slug: 'zimmer', logo: null, visible: true },
  { name: 'Neobiotech', slug: 'neobiotech', logo: null, visible: true },
  { name: 'Dentium', slug: 'dentium', logo: null, visible: true },
  { name: 'Megagen', slug: 'megagen', logo: null, visible: true },
  { name: 'frasaco', slug: 'frasaco', logo: null, visible: true },
  { name: 'Nakanishi', slug: 'nakanishi', logo: null, visible: true },
  { name: 'Satelec', slug: 'satelec', logo: null, visible: true },
  { name: 'Acteon', slug: 'acteon', logo: null, visible: true },
  { name: 'Woodpecker', slug: 'woodpecker', logo: null, visible: true },
  { name: 'Being Foshan', slug: 'being-foshan', logo: null, visible: true },
  { name: 'Coxo', slug: 'coxo', logo: null, visible: true },
  { name: 'Sinol', slug: 'sinol', logo: null, visible: true },
  { name: 'Faraz Mehr', slug: 'faraz-mehr', logo: null, visible: true },
  { name: 'Pars Dantal', slug: 'pars-dantal-brand', logo: null, visible: true },
  { name: 'Dentus', slug: 'dentus-brand', logo: null, visible: true },
  { name: 'Fakhre Sina', slug: 'fakhre-sina-brand', logo: null, visible: true },
  { name: 'Vesal Gostar', slug: 'vesal-gostar-brand', logo: null, visible: true }
];

// ============================================================
// PRODUCTS
// ============================================================

interface ProductDef {
  name: string;
  slug: string;
  sku: string | null;
  model: string | null;
  price: number | null;
  priceType: string;
  availability: string;
  specs: string | null;
  discountPercent: number;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  country: string | null;
  warranty: string | null;
  weight: string | null;
  productType: string | null;
  typeFields: string | null;
  customSpecs: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  categorySlug: string;
  brandName: string;
  order: number;
  featured: boolean;
  visible: boolean;
  productImages?: { url: string; alt: string | null; order: number }[];
}

const productDefs: ProductDef[] = [
     {
      name: 'اندوموتور OLED V2',
      slug: 'endomotor-oled-v2',
      sku: 'END-MOT-V2',
      model: 'OLED V2',
      price: 18500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'اندوموتور پیشرفته با نمایشگر OLED و آپکس فایندر داخلی',
      strengths: null,
      weaknesses: null,
      country: 'چین',
      warranty: '۱ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'endomotor',
      brandName: 'Woodpecker',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'اندوموتور OLED V2', order: 0 }
      ]
    },
    {
      name: 'فایل روتاری ProTaper Gold',
      slug: 'rotary-file-protaper-gold',
      sku: 'FIL-PTG-25',
      model: 'F2',
      price: 350000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'مجموعه فایل روتاری ProTaper Gold با انعطاف‌پذیری بالا',
      strengths: null,
      weaknesses: null,
      country: 'سوئیس',
      warranty: 'اصالت کالا',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'rotary-files',
      brandName: 'Dentsply',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'فایل روتاری ProTaper Gold', order: 0 }
      ]
    },
    {
      name: 'سیلر AH Plus',
      slug: 'sealer-ah-plus',
      sku: 'SLR-AHP',
      model: 'AH Plus',
      price: 1850000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'سیلر رزینی دو جزئی با زمان کارکرد مناسب',
      strengths: null,
      weaknesses: null,
      country: 'آلمان',
      warranty: 'اصالت کالا',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'sealer',
      brandName: 'Dentsply',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'سیلر AH Plus', order: 0 }
      ]
    },
    {
      name: 'لایت کیور VALO Grand',
      slug: 'light-cure-valo-grand',
      sku: 'LC-VALO-GR',
      model: 'Grand',
      price: 32000000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'لایت کیور LED با شدت نور بالا و طیف وسیع',
      strengths: null,
      weaknesses: null,
      country: 'آمریکا',
      warranty: '۲ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'light-cure',
      brandName: 'Ultradent',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'لایت کیور VALO Grand', order: 0 }
      ]
    },
    {
      name: 'کامپوزیت Filtek Z250',
      slug: 'composite-filtek-z250',
      sku: 'CMP-Z250-A2',
      model: 'A2',
      price: 1250000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'کامپوزیت میکروهیبرید با استحکام بالا',
      strengths: null,
      weaknesses: null,
      country: 'آمریکا',
      warranty: 'اصالت کالا',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'composite',
      brandName: '3M ESPE',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'کامپوزیت Filtek Z250', order: 0 }
      ]
    },
    {
      name: 'باندینگ Single Bond 2',
      slug: 'bonding-single-bond-2',
      sku: 'BND-SB2',
      model: 'Universal',
      price: 2350000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'عامل باندینگ یونیورسال با قدرت چسبندگی بالا',
      strengths: null,
      weaknesses: null,
      country: 'آمریکا',
      warranty: 'اصالت کالا',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'bonding',
      brandName: '3M ESPE',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'باندینگ Single Bond 2', order: 0 }
      ]
    },
    {
      name: 'آمالگاماتور Silver Mix',
      slug: 'amalgamator-silver-mix',
      sku: 'AML-SLV-MIX',
      model: 'S2',
      price: 8500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'آمالگاماتور دیجیتال با کنترل زمان و سرعت',
      strengths: null,
      weaknesses: null,
      country: 'چین',
      warranty: '۱ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'amalgamator',
      brandName: 'Being Foshan',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'آمالگاماتور Silver Mix', order: 0 }
      ]
    },
    {
      name: 'توربین دوسوراخه Push Button',
      slug: 'turbine-2hole-pushbtn',
      sku: 'TB-2H-PB',
      model: 'PB-2H',
      price: 6500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'توربین دوسوراخه با سیستم Push Button و سرعت بالا',
      strengths: null,
      weaknesses: null,
      country: 'ژاپن',
      warranty: '۱ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'two-hole-turbine',
      brandName: 'NSK',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'توربین دوسوراخه Push Button', order: 0 }
      ]
    },
    {
      name: 'توربین چهارسوراخه نوری',
      slug: 'turbine-4hole-optic',
      sku: 'TB-4H-OP',
      model: 'OPT-4H',
      price: 12500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'توربین چهارسوراخه نوری با نور LED داخلی',
      strengths: null,
      weaknesses: null,
      country: 'ژاپن',
      warranty: '۱ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'four-hole-turbine',
      brandName: 'NSK',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'توربین چهارسوراخه نوری', order: 0 }
      ]
    },
    {
      name: 'آنگل پوش باتن CA 1:1',
      slug: 'angle-pushbtn-1to1',
      sku: 'AG-PB-11',
      model: 'CA 1:1',
      price: 4500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'آنگل پوش باتن با نسبت ۱:۱ و طراحی سبک',
      strengths: null,
      weaknesses: null,
      country: 'ژاپن',
      warranty: '۱ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'push-button-angle',
      brandName: 'NSK',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'آنگل پوش باتن CA 1:1', order: 0 }
      ]
    },
    {
      name: 'ایرموتور چهارسوراخه',
      slug: 'air-motor-4hole',
      sku: 'AM-4H',
      model: 'M4',
      price: 7200000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'ایرموتور چهارسوراخه با قدرت و دوام بالا',
      strengths: null,
      weaknesses: null,
      country: 'ژاپن',
      warranty: '۱ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'four-hole-air-motor',
      brandName: 'NSK',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'ایرموتور چهارسوراخه', order: 0 }
      ]
    },
    {
      name: 'یونیت دندانپزشکی دنتوس مدل D1',
      slug: 'dental-unit-dentus-d1',
      sku: 'UNIT-DEN-D1',
      model: 'D1',
      price: 185000000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'یونیت دندانپزشکی دنتوس با امکانات کامل و طراحی ارگونومیک',
      strengths: null,
      weaknesses: null,
      country: 'ایران',
      warranty: '۲ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'dentus',
      brandName: 'Dentus',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'یونیت دندانپزشکی دنتوس مدل D1', order: 0 }
      ]
    },
    {
      name: 'اتوکلاو کلاس B 23 لیتری',
      slug: 'autoclave-classb-23l',
      sku: 'ACL-B23',
      model: 'B23',
      price: 95000000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'اتوکلاو کلاس B با ظرفیت 23 لیتر و چرخه‌های استریل کامل',
      strengths: null,
      weaknesses: null,
      country: 'چین',
      warranty: '۲ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'autoclave',
      brandName: 'Sinol',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'اتوکلاو کلاس B 23 لیتری', order: 0 }
      ]
    },
    {
      name: 'کمپرسور بی‌صدا دندانپزشکی',
      slug: 'silent-compressor-dental',
      sku: 'CMP-SIL',
      model: 'S1',
      price: 38500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'کمپرسور بی‌صدا با روغن برای استفاده دندانپزشکی',
      strengths: null,
      weaknesses: null,
      country: 'ایران',
      warranty: '۱ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'compressor',
      brandName: 'Faraz Mehr',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'کمپرسور بی‌صدا دندانپزشکی', order: 0 }
      ]
    },
    {
      name: 'تابوره دندانپزشکی ارگونومیک',
      slug: 'dental-stool-ergonomic',
      sku: 'STL-ERG',
      model: 'E1',
      price: 6500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'تابوره ارگونومیک با تنظیم ارتفاع و حمایت کمر',
      strengths: null,
      weaknesses: null,
      country: 'ایران',
      warranty: '۶ ماه گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'dental-stool',
      brandName: 'Pars Dantal',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'تابوره دندانپزشکی ارگونومیک', order: 0 }
      ]
    },
    {
      name: 'بسته ۱۰ عددی ایمپلنت Simple',
      slug: 'implant-simple-10pack',
      sku: 'IMP-SIM-10',
      model: 'Simple',
      price: 28000000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'بسته ۱۰ عددی ایمپلنت Simple با فیکسچر و اباتمنت',
      strengths: null,
      weaknesses: null,
      country: 'کره جنوبی',
      warranty: 'اصالت کالا',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'implants-accessories',
      brandName: 'Dentium',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'بسته ۱۰ عددی ایمپلنت Simple', order: 0 }
      ]
    },
    {
      name: 'RVG دیجیتال اندازگر',
      slug: 'rvg-digital-sensor',
      sku: 'RVG-DS',
      model: 'S1',
      price: 95000000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'سنسور RVG دیجیتال با کیفیت تصویر بالا و سرعت نمایش',
      strengths: null,
      weaknesses: null,
      country: 'فرانسه',
      warranty: '۲ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'rvg',
      brandName: 'Acteon',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'RVG دیجیتال اندازگر', order: 0 }
      ]
    },
    {
      name: 'دستگاه جرمگیری Ultrasonic',
      slug: 'scaler-ultrasonic',
      sku: 'SCL-ULT',
      model: 'U1',
      price: 18500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'دستگاه جرمگیری التراسونیک با کنترل توان و حالت‌های مختلف',
      strengths: null,
      weaknesses: null,
      country: 'چین',
      warranty: '۱ سال گارانتی',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'scaler-device',
      brandName: 'Woodpecker',
      order: 0,
      featured: true,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'دستگاه جرمگیری Ultrasonic', order: 0 }
      ]
    },
    {
      name: 'آلژینات Chromatic',
      slug: 'alginate-chromatic',
      sku: 'ALG-CHR',
      model: 'Chromatic',
      price: 285000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'پودر آلژینات رنگی با زمان ستینگ مناسب',
      strengths: null,
      weaknesses: null,
      country: 'آمریکا',
      warranty: 'اصالت کالا',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'alginate',
      brandName: 'GC',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'آلژینات Chromatic', order: 0 }
      ]
    },
    {
      name: 'بسته ۱۰۰ عددی ماسک ۳ لایه',
      slug: 'mask-3ply-100pack',
      sku: 'MSK-3P-100',
      model: '3P',
      price: 185000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'بسته ۱۰۰ عددی ماسک ۳ لایه با رنگ آبی',
      strengths: null,
      weaknesses: null,
      country: 'چین',
      warranty: 'اصالت کالا',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'mask-gloves',
      brandName: 'Coxo',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'بسته ۱۰۰ عددی ماسک ۳ لایه', order: 0 }
      ]
    },
    {
      name: 'هدفانتوم مدل DENTO-1',
      slug: 'phantom-dento-1',
      sku: 'PHN-D1',
      model: 'DENTO-1',
      price: 12500000,
      priceType: 'fixed',
      availability: 'in_stock',
      specs: null,
      discountPercent: 0,
      description: 'هدفانتوم آموزشی برای تمرین دستی دندانپزشکی',
      strengths: null,
      weaknesses: null,
      country: 'آلمان',
      warranty: 'اصالت کالا',
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'phantom-suture-kit',
      brandName: 'frasaco',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'هدفانتوم مدل DENTO-1', order: 0 }
      ]
    },
    {
      name: 'یونیت دندانپزشکی فخرسینا مدل F2',
      slug: 'dental-unit-fakhresina-f2',
      sku: 'UNIT-FKH-F2',
      model: 'F2',
      price: 0,
      priceType: 'call',
      availability: 'call',
      specs: null,
      discountPercent: 0,
      description: 'یونیت دندانپزشکی فخرسینا با کیفیت ساخت ایرانی - برای قیمت تماس بگیرید',
      strengths: null,
      weaknesses: null,
      country: 'ایران',
      warranty: null,
      weight: null,
      productType: null,
      typeFields: null,
      customSpecs: null,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      categorySlug: 'fakhresina',
      brandName: 'Fakhre Sina',
      order: 0,
      featured: false,
      visible: true,
      productImages: [
        { url: '/logo.svg', alt: 'یونیت دندانپزشکی فخرسینا مدل F2', order: 0 }
      ]
    }
];

async function seedCategories() {
  console.log('🌱 شروع seeding دسته‌بندی‌ها...');

  await db.productImage.deleteMany({});
  await db.product.deleteMany({});
  await db.category.deleteMany({});
  console.log('✓ دسته‌بندی‌های قبلی پاک شدند');

  const level1Data = categoryTree.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    order: cat.order,
  }));

  await db.category.createMany({ data: level1Data });
  console.log(`✓ ${level1Data.length} دسته اصلی ساخته شد`);

  const dbLevel1 = await db.category.findMany({ where: { parentId: null } });
  const level1Map = new Map(dbLevel1.map((c) => [c.slug, c.id]));

  const level2Data: any[] = [];
  for (const l1 of categoryTree) {
    const parentId = level1Map.get(l1.slug);
    if (parentId && l1.children) {
      for (const l2 of l1.children) {
        level2Data.push({
          name: l2.name,
          slug: l2.slug,
          order: l2.order,
          parentId,
        });
      }
    }
  }

  if (level2Data.length > 0) {
    await db.category.createMany({ data: level2Data });
    console.log(`✓ ${level2Data.length} زیردسته سطح اول ساخته شد`);
  }

  const dbLevel2 = await db.category.findMany({ where: { parentId: { not: null } } });
  const level2Map = new Map(dbLevel2.map((c) => [c.slug, c.id]));

  const level3Data: any[] = [];
  for (const l1 of categoryTree) {
    if (l1.children) {
      for (const l2 of l1.children) {
        const parentId = level2Map.get(l2.slug);
        if (parentId && l2.children) {
          for (const l3 of l2.children) {
            level3Data.push({
              name: l3.name,
              slug: l3.slug,
              order: l3.order,
              parentId,
            });
          }
        }
      }
    }
  }

  if (level3Data.length > 0) {
    await db.category.createMany({ data: level3Data });
    console.log(`✓ ${level3Data.length} زیردسته سطح دوم ساخته شد`);
  }

  const total = level1Data.length + level2Data.length + level3Data.length;
  console.log(`✅ در مجموع ${total} دسته‌بندی با موفقیت و در ۳ کوئری ایجاد شد!`);
}

async function seedBrands() {
  console.log('🌱 شروع seeding برندها...');
  await db.brand.deleteMany({});
  console.log('✓ برندهای قبلی پاک شدند');

  await db.brand.createMany({ data: brandDefs });
  console.log(`✓ ${brandDefs.length} برند ساخته شد`);
}

async function seedProducts() {
  console.log('🌱 شروع seeding محصولات...');
  await db.productImage.deleteMany({});
  await db.product.deleteMany({});
  console.log('✓ محصولات قبلی پاک شدند');

  const catSlugMap = new Map((await db.category.findMany()).map(c => [c.slug, c.id]));
  const brandNameMap = new Map((await db.brand.findMany()).map(b => [b.name, b.id]));

  for (const p of productDefs) {
    const { productImages, ...data } = p;
    const categoryId = catSlugMap.get(data.categorySlug);
    const brandId = brandNameMap.get(data.brandName);
    if (!categoryId) {
      console.warn(`⚠️ دسته‌بندی پیدا نشد: ${data.categorySlug} برای محصول ${data.name}`);
      continue;
    }
    if (!brandId) {
      console.warn(`⚠️ برند پیدا نشد: ${data.brandName} برای محصول ${data.name}`);
      continue;
    }
    const created = await db.product.create({
      data: { ...data, categoryId, brandId },
    });
    if (productImages && productImages.length > 0) {
      await db.productImage.createMany({
        data: productImages.map((img, idx) => ({
          ...img,
          productId: created.id,
          order: idx,
        })),
      });
    }
  }
  console.log(`✓ ${productDefs.length} محصول ساخته شد`);
}

seedCategories()
  .then(seedBrands)
  .then(seedProducts)
  .catch((e) => {
    console.error('❌ خطا در seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
