const productsGrid = document.querySelector("#productsGrid");
const productsState = document.querySelector("#productsState");
const productTabs = document.querySelectorAll(".products-tab");
const productSearch = document.querySelector("#productSearch");

const categoryNames = {
  waterer: "آبخوری",
  feeder: "دانخوری",
  transfer: "انتقال دان",
  heating: "گرمایشی",
  basket: "سبد و شانه",
};

let products = [];
let activeCategory = "all";

function escapeProductHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(priceText) {
  if (!priceText) return "استعلام قیمت";

  const normalized = String(priceText)
    .replace(/[,\s]/g, "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

  if (/^\d+$/.test(normalized)) {
    return Number(normalized).toLocaleString("fa-IR") + " تومان";
  }

  return priceText;
}

function productImageUrl(image) {
  if (!image) return "image/06F3B098-D47A-4B50-91FF-455BA45AA354.png";
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return image;
}

function setProductsState(message, isError = false) {
  if (!productsState) return;
  productsState.textContent = message;
  productsState.classList.toggle("is-error", isError);
  productsState.hidden = !message;
}

function renderProducts() {
  if (!productsGrid) return;

  const searchValue = productSearch ? productSearch.value.trim().toLowerCase() : "";

  const filtered = products.filter((product) => {
    const categoryMatch = activeCategory === "all" || product.category === activeCategory;
    const searchText = `${product.title} ${product.shortDescription} ${product.description}`.toLowerCase();
    return categoryMatch && searchText.includes(searchValue);
  });

  if (!filtered.length) {
    productsGrid.innerHTML = "";
    setProductsState("محصولی با این مشخصات پیدا نشد.", false);
    return;
  }

  setProductsState("");

  productsGrid.innerHTML = filtered
    .map((product) => {
      const detailUrl = `product-detail.html?slug=${encodeURIComponent(product.slug)}`;
      const features = (product.features || []).slice(0, 3);
      const price = formatPrice(product.priceText);

      return `
        <a class="catalog-card" data-category="${escapeProductHtml(product.category)}"
          data-name="${escapeProductHtml(product.title)}" href="${detailUrl}">
          <div class="catalog-card__image">
            <img src="${escapeProductHtml(productImageUrl(product.image))}" alt="${escapeProductHtml(product.title)}">
            <span>${escapeProductHtml(product.statusBadge || "فعال")}</span>
          </div>

          <div class="catalog-card__body">
            <small>${escapeProductHtml(categoryNames[product.category] || product.category)}</small>
            <h2>${escapeProductHtml(product.title)}</h2>
            <p>${escapeProductHtml(product.shortDescription)}</p>

            <ul>
              ${features.map((feature) => `<li>${escapeProductHtml(feature)}</li>`).join("")}
            </ul>

            <div class="catalog-card__bottom">
              <strong>${escapeProductHtml(price)}</strong>
              <span>مشاهده جزئیات</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
}

async function loadProducts() {
  setProductsState("در حال دریافت محصولات...");

  try {
    const response = await fetch("/api/products");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "دریافت محصولات با خطا روبه‌رو شد.");
    }

    products = data.products || [];
    renderProducts();
  } catch (error) {
    productsGrid.innerHTML = "";
    setProductsState(error.message, true);
  }
}

productTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    productTabs.forEach((item) => item.classList.remove("is-active"));
    tab.classList.add("is-active");
    activeCategory = tab.dataset.category;
    renderProducts();
  });
});

if (productSearch) {
  productSearch.addEventListener("input", renderProducts);
}

loadProducts();