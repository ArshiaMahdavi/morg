const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const db = require("../db/database");
const {
  slugify,
  parseFeatures,
  normalizeProduct,
  normalizeProducts,
} = require("../db/product-utils");
const {
  authMiddleware,
  createAdminToken,
  setAuthCookie,
  clearAuthCookie,
} = require("../middleware/auth");

const router = express.Router();
const projectRoot = path.join(__dirname, "..");
const uploadDir = path.join(projectRoot, "uploads", "products");
const allowedImageTypes = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
  ["image/gif", [".gif"]],
]);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const basename = slugify(path.basename(file.originalname, extension)) || "product";
    callback(null, `${Date.now()}-${basename}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = allowedImageTypes.get(file.mimetype);

    if (!allowedExtensions || !allowedExtensions.includes(extension)) {
      return callback(new Error("فقط تصاویر JPG، PNG، WEBP یا GIF قابل آپلود هستند."));
    }

    return callback(null, true);
  },
});

function toBoolean(value) {
  return value === true || value === "true" || value === "1" || value === 1 || value === "on";
}

function getImagePath(file) {
  if (!file) return undefined;
  return `/uploads/products/${file.filename}`;
}

function getExistingProduct(id) {
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
}

function ensureUniqueSlug(slug, currentId) {
  const existing = db.prepare("SELECT id FROM products WHERE slug = ?").get(slug);

  if (existing && Number(existing.id) !== Number(currentId)) {
    return false;
  }

  return true;
}

function validateProductPayload(body, isUpdate = false) {
  const requiredFields = [
    ["title", "عنوان محصول را وارد کنید."],
    ["category", "دسته‌بندی محصول را وارد کنید."],
    ["shortDescription", "توضیح کوتاه محصول را وارد کنید."],
    ["description", "توضیح کامل محصول را وارد کنید."],
    ["priceText", "متن قیمت محصول را وارد کنید."],
  ];

  for (const [field, message] of requiredFields) {
    if (!isUpdate || Object.prototype.hasOwnProperty.call(body, field)) {
      if (!String(body[field] || "").trim()) {
        return message;
      }
    }
  }

  return null;
}

function deleteUploadedFile(imagePath) {
  if (!imagePath || !imagePath.startsWith("/uploads/products/")) return;

  const fullPath = path.join(projectRoot, imagePath);
  fs.unlink(fullPath, () => {});
}

router.post("/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!username || !password) {
    return res.status(400).json({ message: "نام کاربری و رمز عبور الزامی است." });
  }

  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);

  if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
    return res.status(401).json({ message: "نام کاربری یا رمز عبور اشتباه است." });
  }

  const token = createAdminToken(admin);
  setAuthCookie(res, token);

  return res.json({
    message: "ورود با موفقیت انجام شد.",
    admin: {
      id: admin.id,
      username: admin.username,
    },
  });
});

router.post("/logout", authMiddleware, (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "با موفقیت خارج شدید." });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ admin: req.admin });
});

router.get("/products", authMiddleware, (req, res) => {
  const products = db.prepare("SELECT * FROM products ORDER BY id DESC").all();
  res.json({ products: normalizeProducts(products) });
});

router.post("/products", authMiddleware, upload.single("image"), (req, res) => {
  const validationError = validateProductPayload(req.body);

  if (validationError) {
    if (req.file) deleteUploadedFile(getImagePath(req.file));
    return res.status(400).json({ message: validationError });
  }

  const slug = slugify(req.body.slug || req.body.title);

  if (!slug) {
    return res.status(400).json({ message: "اسلاگ محصول معتبر نیست." });
  }

  if (!ensureUniqueSlug(slug)) {
    return res.status(409).json({ message: "این اسلاگ قبلاً برای محصول دیگری استفاده شده است." });
  }

  const image = getImagePath(req.file) || String(req.body.currentImage || "").trim();
  const features = parseFeatures(req.body.features);

  const result = db
    .prepare(
      `
      INSERT INTO products (
        title, slug, category, shortDescription, description, priceText,
        statusBadge, image, features, isFeatured, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    )
    .run(
      req.body.title.trim(),
      slug,
      req.body.category.trim(),
      req.body.shortDescription.trim(),
      req.body.description.trim(),
      req.body.priceText.trim(),
      String(req.body.statusBadge || "فعال").trim(),
      image,
      JSON.stringify(features),
      toBoolean(req.body.isFeatured) ? 1 : 0
    );

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);

  return res.status(201).json({
    message: "محصول با موفقیت اضافه شد.",
    product: normalizeProduct(product),
  });
});

router.put("/products/:id", authMiddleware, upload.single("image"), (req, res) => {
  const existing = getExistingProduct(req.params.id);

  if (!existing) {
    if (req.file) deleteUploadedFile(getImagePath(req.file));
    return res.status(404).json({ message: "محصول مورد نظر پیدا نشد." });
  }

  const validationError = validateProductPayload(req.body, true);

  if (validationError) {
    if (req.file) deleteUploadedFile(getImagePath(req.file));
    return res.status(400).json({ message: validationError });
  }

  const nextSlug = slugify(req.body.slug || existing.slug || req.body.title);

  if (!nextSlug || !ensureUniqueSlug(nextSlug, existing.id)) {
    if (req.file) deleteUploadedFile(getImagePath(req.file));
    return res.status(409).json({ message: "اسلاگ وارد شده معتبر یا یکتا نیست." });
  }

  const nextImage = getImagePath(req.file) || String(req.body.currentImage || existing.image || "").trim();
  const features = parseFeatures(req.body.features ?? existing.features);
  const nextIsFeatured = Object.prototype.hasOwnProperty.call(req.body, "isFeatured")
    ? toBoolean(req.body.isFeatured)
    : Boolean(existing.isFeatured);

  db.prepare(
    `
    UPDATE products SET
      title = ?,
      slug = ?,
      category = ?,
      shortDescription = ?,
      description = ?,
      priceText = ?,
      statusBadge = ?,
      image = ?,
      features = ?,
      isFeatured = ?,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  ).run(
    String(req.body.title || existing.title).trim(),
    nextSlug,
    String(req.body.category || existing.category).trim(),
    String(req.body.shortDescription || existing.shortDescription).trim(),
    String(req.body.description || existing.description).trim(),
    String(req.body.priceText || existing.priceText).trim(),
    String(req.body.statusBadge || existing.statusBadge || "فعال").trim(),
    nextImage,
    JSON.stringify(features),
    nextIsFeatured ? 1 : 0,
    existing.id
  );

  if (req.file && existing.image !== nextImage) {
    deleteUploadedFile(existing.image);
  }

  const product = getExistingProduct(existing.id);

  return res.json({
    message: "محصول با موفقیت به‌روزرسانی شد.",
    product: normalizeProduct(product),
  });
});

router.delete("/products/:id", authMiddleware, (req, res) => {
  const existing = getExistingProduct(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: "محصول مورد نظر پیدا نشد." });
  }

  db.prepare("DELETE FROM products WHERE id = ?").run(existing.id);
  deleteUploadedFile(existing.image);

  return res.json({ message: "محصول با موفقیت حذف شد." });
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: "فایل تصویر معتبر نیست یا حجم آن بیش از حد مجاز است." });
  }

  if (error) {
    return res.status(400).json({ message: error.message || "در پردازش درخواست خطایی رخ داد." });
  }

  return next();
});

module.exports = router;
