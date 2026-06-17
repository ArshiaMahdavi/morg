const express = require("express");
const db = require("../db/database");
const { normalizeProduct, normalizeProducts } = require("../db/product-utils");

const router = express.Router();

router.get("/", (req, res) => {
  const products = db
    .prepare("SELECT * FROM products ORDER BY id ASC")
    .all();

  res.json({ products: normalizeProducts(products) });
});

router.get("/featured", (req, res) => {
  const products = db
    .prepare("SELECT * FROM products WHERE isFeatured = 1 ORDER BY id DESC")
    .all();

  res.json({ products: normalizeProducts(products) });
});

router.get("/:slug", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE slug = ?").get(req.params.slug);

  if (!product) {
    return res.status(404).json({ message: "محصول مورد نظر پیدا نشد." });
  }

  return res.json({ product: normalizeProduct(product) });
});

module.exports = router;
