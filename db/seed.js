require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./database");
const { slugify } = require("./product-utils");

const adminUsername = "admin";
const adminPassword = "admin123";
const passwordHash = bcrypt.hashSync(adminPassword, 12);

db.prepare(
  `
  INSERT INTO admins (username, passwordHash)
  VALUES (?, ?)
  ON CONFLICT(username) DO UPDATE SET passwordHash = excluded.passwordHash
  `
).run(adminUsername, passwordHash);

const products = [
  {
    title: "دانخوری بشقابی",
    slug: "dankhori-boshghabi",
    category: "feeder",
    shortDescription: "دانخوری بشقابی مناسب توزیع یکنواخت خوراک در سالن‌های پرورش طیور.",
    description:
      "دانخوری بشقابی برای سالن‌های گوشتی و تخم‌گذار طراحی شده و کمک می‌کند خوراک با نظم بیشتری در دسترس طیور قرار بگیرد. این محصول برای کاهش هدررفت دان، سهولت شست‌وشو و استفاده روزمره در سالن‌های صنعتی گزینه‌ای کاربردی است.",
    priceText: "استعلام قیمت",
    statusBadge: "پرفروش",
    image: "image/دانحوری-بشقابی.png",
    features: ["پخش یکنواخت دان", "کاهش هدررفت خوراک", "مناسب سالن‌های صنعتی"],
    isFeatured: true,
  },
  {
    title: "آبخوری نیپل",
    slug: "abkhori-nipple",
    category: "waterer",
    shortDescription: "سیستم آبخوری نیپل برای تأمین آب سالم و کاهش آلودگی سالن.",
    description:
      "آبخوری نیپل با کنترل خروج آب، مصرف آب را بهینه می‌کند و از تماس مستقیم آب با بستر جلوگیری می‌کند. این محصول برای سالن‌های مدرن پرورش طیور انتخابی بهداشتی، کم‌مصرف و قابل اعتماد است.",
    priceText: "استعلام قیمت",
    statusBadge: "کاربردی",
    image: "image/آبخوری-نیپل.png",
    features: ["مصرف بهینه آب", "کاهش آلودگی بستر", "نصب و نگهداری آسان"],
    isFeatured: true,
  },
  {
    title: "سیستم انتقال دان",
    slug: "system-enteghal-dan",
    category: "transfer",
    shortDescription: "راهکار انتقال منظم خوراک از انباردان به خطوط تغذیه سالن.",
    description:
      "سیستم انتقال دان برای سالن‌هایی مناسب است که به توزیع سریع، منظم و کم‌هزینه خوراک نیاز دارند. این سیستم باعث کاهش نیروی انسانی، افزایش سرعت تغذیه و مدیریت بهتر خوراک در سالن‌های بزرگ می‌شود.",
    priceText: "استعلام قیمت",
    statusBadge: "تخصصی",
    image: "image/سیستم-انتقال-دان.png",
    features: ["مناسب سالن‌های بزرگ", "کاهش نیروی انسانی", "افزایش سرعت توزیع دان"],
    isFeatured: true,
  },
  {
    title: "دانخوری زنجیری",
    slug: "dankhori-zanjiri",
    category: "feeder",
    shortDescription: "دانخوری زنجیری برای توزیع خوراک در سالن‌های وسیع مرغداری.",
    description:
      "دانخوری زنجیری یک گزینه صنعتی برای سالن‌های بزرگ است که خوراک را در مسیر مشخص و با نظم مناسب حرکت می‌دهد. این محصول برای مدیریت تغذیه گله و استفاده مداوم در شرایط کاری سنگین کاربرد دارد.",
    priceText: "استعلام قیمت",
    statusBadge: "صنعتی",
    image: "image/دانخوری-زنجیری.png",
    features: ["پخش منظم خوراک", "قابل استفاده در سالن‌های وسیع", "مناسب کارکرد مداوم"],
    isFeatured: true,
  },
  {
    title: "سبد و شانه",
    slug: "sabad-va-shane",
    category: "basket",
    shortDescription: "سبد و شانه مقاوم برای حمل، نگهداری و جابه‌جایی تخم‌مرغ.",
    description:
      "سبد و شانه برای استفاده روزانه در مرغداری، مراکز بسته‌بندی و مسیرهای حمل محصول طراحی شده است. مقاومت مناسب، چینش منظم و کاربرد آسان باعث می‌شود جابه‌جایی تخم‌مرغ با آسیب کمتر انجام شود.",
    priceText: "استعلام قیمت",
    statusBadge: "مقاوم",
    image: "image/سبد-و-شانه.png",
    features: ["مقاومت مناسب", "چینش منظم تخم‌مرغ", "کاربردی برای حمل و نگهداری"],
    isFeatured: false,
  },
  {
    title: "هیتر جت گرمایشی",
    slug: "heater-jet-garmayeshi",
    category: "heating",
    shortDescription: "تجهیز گرمایشی برای کمک به تأمین دمای مناسب سالن پرورش طیور.",
    description:
      "هیتر جت گرمایشی برای ایجاد گرمای سریع و پایدار در سالن‌های مرغداری استفاده می‌شود. این محصول در فصل سرد و دوره‌های حساس پرورش به حفظ دمای مطلوب سالن و کاهش تنش دمایی کمک می‌کند.",
    priceText: "استعلام قیمت",
    statusBadge: "گرمایشی",
    image: "image/06F3B098-D47A-4B50-91FF-455BA45AA354.png",
    features: ["گرمایش سریع سالن", "مناسب فصل سرد", "کمک به پایداری دمای محیط"],
    isFeatured: false,
  },
  {
    title: "دانخوری دستی",
    slug: "dankhori-dasti",
    category: "feeder",
    shortDescription: "دانخوری دستی ساده و اقتصادی برای استفاده در سالن‌ها و واحدهای کوچک‌تر.",
    description:
      "دانخوری دستی برای واحدهایی مناسب است که به راهکاری ساده، اقتصادی و قابل جابه‌جایی نیاز دارند. این محصول نگهداری آسانی دارد و برای استفاده روزمره در بخش‌های مختلف مرغداری کاربردی است.",
    priceText: "استعلام قیمت",
    statusBadge: "اقتصادی",
    image: "image/انواع-دانخوری-دستی.png",
    features: ["اقتصادی و ساده", "قابل جابه‌جایی", "مناسب واحدهای کوچک‌تر"],
    isFeatured: false,
  },
];

const upsertProduct = db.prepare(`
  INSERT INTO products (
    title, slug, category, shortDescription, description, priceText,
    statusBadge, image, features, isFeatured, createdAt, updatedAt
  )
  VALUES (
    @title, @slug, @category, @shortDescription, @description, @priceText,
    @statusBadge, @image, @features, @isFeatured, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  ON CONFLICT(slug) DO UPDATE SET
    title = excluded.title,
    category = excluded.category,
    shortDescription = excluded.shortDescription,
    description = excluded.description,
    priceText = excluded.priceText,
    statusBadge = excluded.statusBadge,
    image = excluded.image,
    features = excluded.features,
    isFeatured = excluded.isFeatured,
    updatedAt = CURRENT_TIMESTAMP
`);

function insertMany(items) {
  db.exec("BEGIN");

  try {
    for (const product of items) {
      upsertProduct.run({
        ...product,
        slug: product.slug || slugify(product.title),
        features: JSON.stringify(product.features),
        isFeatured: product.isFeatured ? 1 : 0,
      });
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

insertMany(products);

console.log("Database seeded successfully.");
console.log("Admin username: admin");
console.log("Admin password: admin123");
