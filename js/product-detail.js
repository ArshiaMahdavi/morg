const detailShell = document.querySelector("#productDetail");
const detailState = document.querySelector("#productDetailState");

const detailCategoryNames = {
  waterer: "آبخوری",
  feeder: "دانخوری",
  transfer: "انتقال دان",
  heating: "گرمایشی",
  basket: "سبد و شانه",
};

const detailCategoryImages = {
  waterer: ["image/آبخوری-نیپل.png", "image/آبخوری-آویز.png", "image/آبخوری-دستی.png"],
  feeder: ["image/دانحوری-بشقابی.png", "image/دانخوری-زنجیری.png", "image/انواع-دانخوری-دستی.png"],
  transfer: ["image/سیستم-انتقال-دان.png"],
  heating: ["image/06F3B098-D47A-4B50-91FF-455BA45AA354.png"],
  basket: ["image/سبد-و-شانه.png"],
};

let relatedProducts = [];

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

function formatDetailPrice(priceText) {
  if (!priceText) return "استعلام قیمت";

  const normalized = String(priceText)
    .replace(/[,\s]/g, "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

  if (/^\d+$/.test(normalized)) {
    return `${Number(normalized).toLocaleString("fa-IR")} تومان`;
  }

  return priceText;
}

function setDetailState(message, isError = false) {
  if (!detailState) return;
  detailState.textContent = message;
  detailState.classList.toggle("is-error", isError);
  detailState.hidden = !message;
}

function renderProduct(product) {
  document.title = `${product.title} | صنایع مرغداری تات پاکروح`;
  setDetailState("");

  const primaryImage = detailImageUrl(product.image);
  const gallery = Array.from(
    new Set([primaryImage, ...(detailCategoryImages[product.category] || [])].filter(Boolean))
  ).slice(0, 4);
  const features = product.features?.length
    ? product.features
    : ["مشاوره قبل از خرید", "امکان ارسال به سراسر کشور", "مناسب سالن‌های مرغداری"];
  const related = relatedProducts
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, 3);
  const price = formatDetailPrice(product.priceText);

  detailShell.innerHTML = `
    <nav class="product-breadcrumb" aria-label="مسیر صفحه">
      <a href="index.html">خانه</a>
      <i class="fa-solid fa-angle-left" aria-hidden="true"></i>
      <a href="products.html">محصولات</a>
      <i class="fa-solid fa-angle-left" aria-hidden="true"></i>
      <span>${escapeDetailHtml(product.title)}</span>
    </nav>

    <div class="product-detail__layout">
      <div class="product-detail__gallery">
        <div class="product-detail__media product-detail__stage">
          <img src="${escapeDetailHtml(primaryImage)}" alt="${escapeDetailHtml(product.title)}" id="detailMainImage" />
          <span>${escapeDetailHtml(product.statusBadge || "فعال")}</span>
        </div>

        <div class="product-detail__thumbs" aria-label="گالری محصول">
          ${gallery
            .map(
              (image, index) => `
                <button class="${index === 0 ? "is-active" : ""}" type="button" data-detail-image="${escapeDetailHtml(image)}" aria-label="نمایش تصویر ${index + 1}">
                  <img src="${escapeDetailHtml(image)}" alt="" loading="lazy" />
                </button>
              `
            )
            .join("")}
        </div>
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

        <div class="product-spec-grid">
          <div>
            <span>دسته‌بندی</span>
            <strong>${escapeDetailHtml(detailCategoryNames[product.category] || product.category)}</strong>
          </div>
          <div>
            <span>وضعیت</span>
            <strong>${escapeDetailHtml(product.statusBadge || "فعال")}</strong>
          </div>
          <div>
            <span>مشاوره</span>
            <strong>رایگان</strong>
          </div>
        </div>

        <ul class="product-detail__features">
          ${features.map((feature) => `<li>${escapeDetailHtml(feature)}</li>`).join("")}
        </ul>
      </div>

      <aside class="product-purchase-card" aria-label="استعلام و خرید">
        <span>قیمت محصول</span>
        <strong>${escapeDetailHtml(price)}</strong>
        <p>برای دریافت قیمت روز، موجودی و پیشنهاد مناسب سالن خود با کارشناسان فروش تماس بگیرید.</p>
        <a class="product-detail__cta" href="tel:09125152625">
          <i class="fa-solid fa-phone"></i>
          تماس برای استعلام
        </a>
        <a class="product-detail__cta product-detail__cta--ghost" href="contact.html">
          <i class="fa-solid fa-message"></i>
          ثبت درخواست مشاوره
        </a>
      </aside>
    </div>

    ${
      related.length
        ? `
          <section class="related-products" aria-labelledby="relatedProductsTitle">
            <div class="related-products__head">
              <span>محصولات مشابه</span>
              <h2 id="relatedProductsTitle">گزینه‌های مرتبط با این دسته</h2>
            </div>
            <div class="related-products__grid">
              ${related
                .map(
                  (item) => `
                    <a class="related-product-card" href="product-detail.html?slug=${encodeURIComponent(item.slug)}">
                      <img src="${escapeDetailHtml(detailImageUrl(item.image))}" alt="${escapeDetailHtml(item.title)}" loading="lazy" />
                      <span>${escapeDetailHtml(detailCategoryNames[item.category] || item.category)}</span>
                      <strong>${escapeDetailHtml(item.title)}</strong>
                    </a>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
  `;

  initProductGallery();
}

function initProductGallery() {
  const mainImage = document.querySelector("#detailMainImage");
  const thumbButtons = document.querySelectorAll("[data-detail-image]");

  if (!mainImage || !thumbButtons.length) return;

  thumbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      thumbButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      mainImage.src = button.dataset.detailImage;
    });
  });
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
    const [productResponse, productsResponse] = await Promise.all([
      fetch(`/api/products/${encodeURIComponent(slug)}`),
      fetch("/api/products"),
    ]);
    const data = await productResponse.json();

    if (!productResponse.ok) {
      throw new Error(data.message || "محصول مورد نظر پیدا نشد.");
    }

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      relatedProducts = productsData.products || [];
    }

    renderProduct(data.product);
  } catch (error) {
    detailShell.innerHTML = "";
    setDetailState(error.message, true);
  }
}

loadProductDetail();
