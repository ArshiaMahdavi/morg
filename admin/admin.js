const persianNumber = new Intl.NumberFormat("fa-IR");

const categoryLabels = {
  waterer: "آبخوری",
  feeder: "دانخوری",
  transfer: "انتقال دان",
  heating: "گرمایشی",
  basket: "سبد و شانه",
};

let adminProducts = [];
let editingProductId = null;
let currentPage = 1;
const pageSize = 6;
const uploadLimit = 3 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
let previewObjectUrl = "";

function imageUrl(image) {
  if (!image) return "/image/06F3B098-D47A-4B50-91FF-455BA45AA354.png";
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return `/${image}`;
}

function slugifyAdmin(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.add("is-visible");
  element.classList.toggle("is-error", isError);
}

function clearMessage(element) {
  if (!element) return;
  element.textContent = "";
  element.classList.remove("is-visible", "is-error");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "در ارتباط با سرور خطایی رخ داد.");
  }

  return data;
}

function initLoginPage() {
  const form = document.querySelector("#loginForm");
  const message = document.querySelector("#loginMessage");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(message);

    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (!username || !password) {
      showMessage(message, "نام کاربری و رمز عبور را وارد کنید.", true);
      return;
    }

    try {
      await requestJson("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      window.location.href = "/admin/dashboard.html";
    } catch (error) {
      showMessage(message, error.message, true);
    }
  });
}

function updatePreview(src) {
  const preview = document.querySelector("#imagePreview");
  if (!preview) return;

  if (!src) {
    preview.innerHTML = '<i class="fa-regular fa-image"></i><span>پیش‌نمایش عکس</span>';
    return;
  }

  preview.innerHTML = `<img src="${escapeHtml(src)}" alt="پیش‌نمایش عکس محصول" />`;
}

function clearPreviewObjectUrl() {
  if (!previewObjectUrl) return;
  URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = "";
}

function refreshCounters() {
  ["shortDescription", "description"].forEach((id) => {
    document.querySelector(`#${id}`)?.dispatchEvent(new Event("input"));
  });
}

function getFeatureInputs() {
  return [
    document.querySelector("#featureOne"),
    document.querySelector("#featureTwo"),
    document.querySelector("#featureThree"),
  ].filter(Boolean);
}

function collectFeatureValues() {
  return getFeatureInputs()
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function setFeatureInputs(features = []) {
  getFeatureInputs().forEach((input, index) => {
    input.value = features[index] || "";
  });

  const hiddenFeatures = document.querySelector("#features");
  if (hiddenFeatures) hiddenFeatures.value = JSON.stringify(features.filter(Boolean).slice(0, 3));
}

function resetProductForm() {
  const form = document.querySelector("#productForm");
  const formTitle = document.querySelector("#formTitle");
  const saveButton = document.querySelector("#saveButton");
  const message = document.querySelector("#formMessage");

  if (!form) return;

  editingProductId = null;
  form.reset();
  document.querySelector("#productId").value = "";
  document.querySelector("#currentImage").value = "";
  document.querySelector("#priceText").value = "استعلام قیمت";
  document.querySelector("#statusBadge").value = "فعال";
  setFeatureInputs([]);
  formTitle.textContent = "افزودن محصول جدید";
  saveButton.innerHTML = 'ذخیره محصول <i class="fa-solid fa-floppy-disk"></i>';
  clearMessage(message);
  clearPreviewObjectUrl();
  updatePreview("");
  refreshCounters();
}

function fillProductForm(product) {
  const fields = [
    "title",
    "slug",
    "category",
    "shortDescription",
    "description",
    "priceText",
    "statusBadge",
  ];

  editingProductId = product.id;
  document.querySelector("#productId").value = product.id;
  document.querySelector("#currentImage").value = product.image || "";

  fields.forEach((field) => {
    const input = document.querySelector(`#${field}`);
    if (input) input.value = product[field] || "";
  });

  setFeatureInputs(product.features || []);
  document.querySelector("#isFeatured").checked = Boolean(product.isFeatured);
  document.querySelector("#formTitle").textContent = "ویرایش محصول";
  document.querySelector("#saveButton").innerHTML = 'ذخیره تغییرات <i class="fa-solid fa-floppy-disk"></i>';
  clearPreviewObjectUrl();
  updatePreview(imageUrl(product.image));
  refreshCounters();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getFilteredAdminProducts() {
  const search = String(document.querySelector("#adminProductSearch")?.value || "").trim().toLowerCase();
  const category = document.querySelector("#adminCategoryFilter")?.value || "all";
  const sortValue = document.querySelector("#adminSortProducts")?.value || "newest";
  const collator = new Intl.Collator("fa");

  const filtered = adminProducts.filter((product) => {
    const categoryMatch = category === "all" || product.category === category;
    const searchText = `${product.title || ""} ${product.slug || ""} ${product.shortDescription || ""} ${product.description || ""}`.toLowerCase();
    return categoryMatch && searchText.includes(search);
  });

  return filtered.sort((a, b) => {
    if (sortValue === "title") return collator.compare(a.title || "", b.title || "");
    if (sortValue === "category") {
      return collator.compare(categoryLabels[a.category] || a.category || "", categoryLabels[b.category] || b.category || "");
    }
    if (sortValue === "featured") {
      return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || Number(b.id || 0) - Number(a.id || 0);
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function renderProducts() {
  const table = document.querySelector("#productsTable");
  const totalProducts = document.querySelector("#totalProducts");
  const featuredProducts = document.querySelector("#featuredProducts");
  const lastUpdated = document.querySelector("#lastUpdated");
  const paginationInfo = document.querySelector("#paginationInfo");
  const prevPage = document.querySelector("#prevPage");
  const nextPage = document.querySelector("#nextPage");

  if (!table) return;

  if (totalProducts) totalProducts.textContent = persianNumber.format(adminProducts.length);
  if (featuredProducts) featuredProducts.textContent = persianNumber.format(
    adminProducts.filter((product) => product.isFeatured).length
  );

  const latest = adminProducts
    .map((product) => product.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  if (lastUpdated) lastUpdated.textContent = latest ? new Date(`${latest}Z`).toLocaleDateString("fa-IR") : "-";

  const filteredProducts = getFilteredAdminProducts();
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const visibleProducts = filteredProducts.slice(start, start + pageSize);

  if (paginationInfo) {
    paginationInfo.textContent = `صفحه ${persianNumber.format(currentPage)} از ${persianNumber.format(totalPages)} | ${persianNumber.format(filteredProducts.length)} نتیجه`;
  }

  if (prevPage) prevPage.disabled = currentPage <= 1;
  if (nextPage) nextPage.disabled = currentPage >= totalPages;

  if (!visibleProducts.length) {
    table.innerHTML = `<tr><td colspan="5">${adminProducts.length ? "محصولی با این فیلتر پیدا نشد." : "هنوز محصولی ثبت نشده است."}</td></tr>`;
    return;
  }

  table.innerHTML = visibleProducts
    .map(
      (product) => `
        <tr>
          <td>
            <div class="product-cell">
              <img src="${escapeHtml(imageUrl(product.image))}" alt="${escapeHtml(product.title)}" loading="lazy" />
              <div>
                <strong>${escapeHtml(product.title)}</strong>
                <small>${escapeHtml(product.slug || product.shortDescription)}</small>
              </div>
            </div>
          </td>
          <td>${escapeHtml(categoryLabels[product.category] || product.category)}</td>
          <td>${escapeHtml(product.priceText)}</td>
          <td><span class="status-pill">${escapeHtml(product.statusBadge || "فعال")}</span></td>
          <td>
            <div class="table-actions">
              <button class="admin-btn admin-btn--ghost" type="button" data-edit="${product.id}">
                ویرایش
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="admin-btn admin-btn--danger" type="button" data-delete="${product.id}">
                حذف
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

async function loadProducts() {
  const table = document.querySelector("#productsTable");
  if (table) {
    table.innerHTML = '<tr><td colspan="5">در حال دریافت محصولات...</td></tr>';
  }

  const data = await requestJson("/api/admin/products");
  adminProducts = data.products || [];
  renderProducts();
}

function validateProductForm(form) {
  const required = [
    ["title", "عنوان محصول را وارد کنید."],
    ["category", "دسته‌بندی محصول را انتخاب کنید."],
    ["shortDescription", "توضیح کوتاه را وارد کنید."],
    ["description", "توضیح کامل را وارد کنید."],
    ["priceText", "متن قیمت را وارد کنید."],
  ];

  for (const [field, message] of required) {
    const value = String(new FormData(form).get(field) || "").trim();
    if (!value) return message;
  }

  return "";
}

function validateImageFile(file) {
  if (!file || file.size === 0) return "";

  if (!allowedImageTypes.includes(file.type)) {
    return "فرمت تصویر باید JPG، PNG، WEBP یا GIF باشد.";
  }

  if (file.size > uploadLimit) {
    return "حجم تصویر نباید بیشتر از ۳ مگابایت باشد.";
  }

  return "";
}

function previewSelectedFile(file) {
  clearPreviewObjectUrl();

  if (!file) {
    updatePreview(imageUrl(document.querySelector("#currentImage")?.value || ""));
    return;
  }

  previewObjectUrl = URL.createObjectURL(file);
  updatePreview(previewObjectUrl);
}

function initCharacterCounters() {
  document.querySelectorAll("[data-counter-for]").forEach((counter) => {
    const input = document.querySelector(`#${counter.dataset.counterFor}`);
    if (!input) return;

    const updateCounter = () => {
      const max = Number(input.getAttribute("maxlength") || 0);
      counter.textContent = `${persianNumber.format(input.value.length)} / ${persianNumber.format(max)}`;
    };

    input.addEventListener("input", updateCounter);
    updateCounter();
  });
}

function initSlugAssist() {
  const title = document.querySelector("#title");
  const slug = document.querySelector("#slug");

  if (!title || !slug) return;

  title.addEventListener("blur", () => {
    if (slug.value.trim()) return;
    slug.value = slugifyAdmin(title.value);
  });
}

function initUploadDropZone(imageInput, message) {
  const uploadBox = document.querySelector("#uploadBox");
  const dropZone = document.querySelector(".drop-zone");

  if (!uploadBox || !dropZone || !imageInput) return;

  const applyFile = (file) => {
    const validationError = validateImageFile(file);

    if (validationError) {
      imageInput.value = "";
      showMessage(message, validationError, true);
      return;
    }

    clearMessage(message);
    const transfer = new DataTransfer();
    transfer.items.add(file);
    imageInput.files = transfer.files;
    previewSelectedFile(file);
  };

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadBox.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadBox.classList.remove("is-dragging");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) applyFile(file);
  });
}

function initDashboard() {
  const form = document.querySelector("#productForm");
  if (!form) return;

  const message = document.querySelector("#formMessage");
  const imageInput = document.querySelector("#image");
  const filterControls = [
    document.querySelector("#adminProductSearch"),
    document.querySelector("#adminCategoryFilter"),
    document.querySelector("#adminSortProducts"),
  ].filter(Boolean);

  initCharacterCounters();
  initSlugAssist();
  initUploadDropZone(imageInput, message);

  requestJson("/api/admin/me")
    .then((data) => {
      document.querySelector("#adminUser").textContent = data.admin?.username || "admin";
    })
    .catch(() => {
      window.location.href = "/admin/login.html";
    });

  loadProducts().catch((error) => {
    showMessage(message, error.message, true);
  });

  document.querySelector("#refreshProducts").addEventListener("click", () => {
    loadProducts().catch((error) => showMessage(message, error.message, true));
  });

  document.querySelector("#resetFormButton").addEventListener("click", resetProductForm);

  filterControls.forEach((control) => {
    control.addEventListener("input", () => {
      currentPage = 1;
      renderProducts();
    });
    control.addEventListener("change", () => {
      currentPage = 1;
      renderProducts();
    });
  });

  document.querySelector("#prevPage")?.addEventListener("click", () => {
    currentPage -= 1;
    renderProducts();
  });

  document.querySelector("#nextPage")?.addEventListener("click", () => {
    currentPage += 1;
    renderProducts();
  });

  document.querySelector("#logoutButton").addEventListener("click", async () => {
    await requestJson("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login.html";
  });

  imageInput.addEventListener("change", () => {
    const file = imageInput.files?.[0];
    if (!file) {
      clearPreviewObjectUrl();
      updatePreview(imageUrl(document.querySelector("#currentImage").value));
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      imageInput.value = "";
      showMessage(message, validationError, true);
      updatePreview(imageUrl(document.querySelector("#currentImage").value));
      return;
    }

    clearMessage(message);
    previewSelectedFile(file);
  });

  document.querySelector("#productsTable").addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) {
      const product = adminProducts.find((item) => item.id === Number(editButton.dataset.edit));
      if (product) fillProductForm(product);
      return;
    }

    if (deleteButton) {
      const id = Number(deleteButton.dataset.delete);
      const product = adminProducts.find((item) => item.id === id);
      const ok = window.confirm(`محصول «${product?.title || ""}» حذف شود؟`);

      if (!ok) return;

      try {
        await requestJson(`/api/admin/products/${id}`, { method: "DELETE" });
        showMessage(message, "محصول حذف شد.");
        resetProductForm();
        await loadProducts();
      } catch (error) {
        showMessage(message, error.message, true);
      }
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(message);

    const validationError = validateProductForm(form);
    if (validationError) {
      showMessage(message, validationError, true);
      return;
    }

    const formData = new FormData(form);
    const features = collectFeatureValues();
    formData.set("features", JSON.stringify(features));
    formData.delete("featureOne");
    formData.delete("featureTwo");
    formData.delete("featureThree");

    const imageFile = formData.get("image");
    if (imageFile && imageFile.size === 0) {
      formData.delete("image");
    } else {
      const imageValidationError = validateImageFile(imageFile);
      if (imageValidationError) {
        showMessage(message, imageValidationError, true);
        return;
      }
    }

    try {
      const url = editingProductId
        ? `/api/admin/products/${editingProductId}`
        : "/api/admin/products";
      const method = editingProductId ? "PUT" : "POST";

      await requestJson(url, {
        method,
        body: formData,
      });

      showMessage(message, editingProductId ? "تغییرات محصول ذخیره شد." : "محصول جدید اضافه شد.");
      resetProductForm();
      await loadProducts();
    } catch (error) {
      showMessage(message, error.message, true);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginPage();
  initDashboard();
});
