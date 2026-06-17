CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  shortDescription TEXT NOT NULL,
  description TEXT NOT NULL,
  priceText TEXT NOT NULL DEFAULT 'استعلام قیمت',
  statusBadge TEXT NOT NULL DEFAULT 'فعال',
  image TEXT,
  features TEXT NOT NULL DEFAULT '[]',
  isFeatured INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(isFeatured);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
