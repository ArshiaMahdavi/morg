const detailShell = document.querySelector("#productDetail");
const detailState = document.querySelector("#productDetailState");

const detailCategoryNames = {
  waterer: "آبخوری",
  feeder: "دانخوری",
  transfer: "انتقال دان",
  heating: "گرمایشی",
  basket: "سبد و شانه",
};

function escapeDetailHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function detailImageUrl(image) {
  if (!image) return "image/06F3B098-D47A-4B50-91FF-455BA45AA354.png";
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return image;
}

function setDetailState(message, isError = false) {
  if (!detailState) return;
  detailState.textContent = message;
  detailState.classList.toggle("is-error", isError);
  detailState.hidden = !message;
}

function renderProduct(product) {
  document.title = `${product.title} | صنایع مرغداری پاکروح`;
  setDetailState("");

  detailShell.innerHTML = `
    <div class="product-detail__media">
      <img src="${escapeDetailHtml(detailImageUrl(product.image))}" alt="${escapeDetailHtml(product.title)}" />
      <span>${escapeDetailHtml(product.statusBadge || "فعال")}</span>
    </div>

    <div class="product-detail__content">
      <a class="product-detail__back" href="products.html">
        <i class="fa-solid fa-arrow-right"></i>
        بازگشت به محصولات
      </a>
      <small>${escapeDetailHtml(detailCategoryNames[product.category] || product.category)}</small>
      <h1>${escapeDetailHtml(product.title)}</h1>
      <p class="product-detail__lead">${escapeDetailHtml(product.shortDescription)}</p>
      <p>${escapeDetailHtml(product.description)}</p>

      <div class="product-detail__price">
        <span>قیمت</span>
        <strong>${escapeDetailHtml(product.priceText || "استعلام قیمت")}</strong>
      </div>

      <ul class="product-detail__features">
        ${(product.features || []).map((feature) => `<li>${escapeDetailHtml(feature)}</li>`).join("")}
      </ul>

      <a class="product-detail__cta" href="tel:09125152625">
        <i class="fa-solid fa-phone"></i>
        تماس برای استعلام
      </a>
    </div>
  `;
}

async function loadProductDetail() {
  if (!detailShell) return;

  const slug = new URLSearchParams(window.location.search).get("slug");

  if (!slug) {
    detailShell.innerHTML = "";
    setDetailState("آدرس محصول کامل نیست. لطفاً از صفحه محصولات وارد شوید.", true);
    return;
  }

  setDetailState("در حال دریافت اطلاعات محصول...");

  try {
    const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "محصول مورد نظر پیدا نشد.");
    }

    renderProduct(data.product);
  } catch (error) {
    detailShell.innerHTML = "";
    setDetailState(error.message, true);
  }
}

loadProductDetail();
