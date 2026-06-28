const productsGrid = document.querySelector("#productsGrid");
const productsState = document.querySelector("#productsState");
const productTabs = document.querySelectorAll(".products-tab");
const productSearch = document.querySelector("#productSearch");
const productsSort = document.querySelector("#productsSort");
const productsCount = document.querySelector("#productsCount");
const productCountFormatter = new Intl.NumberFormat("fa-IR");

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

function setProductsCount(count) {
  if (!productsCount) return;
  productsCount.textContent = `${productCountFormatter.format(count)} محصول`;
}

function renderProductSkeletons() {
  if (!productsGrid) return;

  productsGrid.innerHTML = Array.from({ length: 6 })
    .map(
      () => `
        <article class="catalog-card catalog-card--skeleton" aria-hidden="true">
          <div class="catalog-card__image"></div>
          <div class="catalog-card__body">
            <small></small>
            <h2></h2>
            <p></p>
            <ul><li></li><li></li><li></li></ul>
            <div class="catalog-card__bottom"><strong></strong><span></span></div>
          </div>
        </article>
      `
    )
    .join("");
}

function sortProducts(items) {
  const sortValue = productsSort?.value || "featured";
  const collator = new Intl.Collator("fa");
  const sorted = [...items];

  if (sortValue === "newest") {
    return sorted.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }

  if (sortValue === "title") {
    return sorted.sort((a, b) => collator.compare(a.title || "", b.title || ""));
  }

  if (sortValue === "category") {
    return sorted.sort((a, b) =>
      collator.compare(categoryNames[a.category] || a.category || "", categoryNames[b.category] || b.category || "")
    );
  }

  return sorted.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || Number(b.id || 0) - Number(a.id || 0));
}

function renderProducts() {
  if (!productsGrid) return;

  const searchValue = productSearch ? productSearch.value.trim().toLowerCase() : "";

  const filtered = sortProducts(products.filter((product) => {
    const categoryMatch = activeCategory === "all" || product.category === activeCategory;
    const searchText = `${product.title || ""} ${product.shortDescription || ""} ${product.description || ""}`.toLowerCase();
    return categoryMatch && searchText.includes(searchValue);
  }));

  setProductsCount(filtered.length);

  if (!filtered.length) {
    productsGrid.innerHTML = "";
    setProductsState(products.length ? "محصولی با این مشخصات پیدا نشد." : "هنوز محصولی در کاتالوگ ثبت نشده است.", false);
    return;
  }

  setProductsState("");

  productsGrid.innerHTML = filtered
    .map((product) => {
      const detailUrl = `product-detail.html?slug=${encodeURIComponent(product.slug)}`;
      const features = (product.features || []).slice(0, 3);
      const price = formatPrice(product.priceText);

      const featureMarkup = features.length
        ? features.map((feature) => `<li>${escapeProductHtml(feature)}</li>`).join("")
        : "<li>امکان مشاوره و استعلام سریع</li>";

      return `
        <a class="catalog-card" data-category="${escapeProductHtml(product.category)}"
          data-name="${escapeProductHtml(product.title)}" href="${detailUrl}" aria-label="مشاهده جزئیات ${escapeProductHtml(product.title)}">
          <div class="catalog-card__image">
            <img src="${escapeProductHtml(productImageUrl(product.image))}" alt="${escapeProductHtml(product.title)}" loading="lazy">
            <span>${escapeProductHtml(product.statusBadge || "فعال")}</span>
          </div>

          <div class="catalog-card__body">
            <small>${escapeProductHtml(categoryNames[product.category] || product.category)}</small>
            <h2>${escapeProductHtml(product.title)}</h2>
            <p>${escapeProductHtml(product.shortDescription)}</p>

            <ul>
              ${featureMarkup}
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
  setProductsCount(0);
  renderProductSkeletons();

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
    setProductsCount(0);
    setProductsState(error.message, true);
  }
}

productTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    productTabs.forEach((item) => item.classList.remove("is-active"));
    productTabs.forEach((item) => item.setAttribute("aria-selected", "false"));
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    activeCategory = tab.dataset.category;
    renderProducts();
  });
});

if (productSearch) {
  productSearch.addEventListener("input", renderProducts);
}

if (productsSort) {
  productsSort.addEventListener("change", renderProducts);
}

productTabs.forEach((tab) => {
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-selected", tab.classList.contains("is-active") ? "true" : "false");
});

loadProducts();
