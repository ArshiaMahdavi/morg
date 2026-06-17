function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFeatures(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch (error) {
    // Fall back to line/comma separated values for admin form convenience.
  }

  return trimmed
    .split(/\r?\n|،|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProduct(row) {
  if (!row) return null;

  let features = [];
  try {
    features = JSON.parse(row.features || "[]");
  } catch (error) {
    features = [];
  }

  return {
    ...row,
    features,
    isFeatured: Boolean(row.isFeatured),
  };
}

function normalizeProducts(rows) {
  return rows.map(normalizeProduct);
}

module.exports = {
  slugify,
  parseFeatures,
  normalizeProduct,
  normalizeProducts,
};
