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

function imageUrl(image) {
  if (!image) return "";
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return `/${image}`;
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
  updatePreview("");
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
  updatePreview(imageUrl(product.image));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProducts() {
  const table = document.querySelector("#productsTable");
  const totalProducts = document.querySelector("#totalProducts");
  const featuredProducts = document.querySelector("#featuredProducts");
  const lastUpdated = document.querySelector("#lastUpdated");

  if (!table) return;

  totalProducts.textContent = persianNumber.format(adminProducts.length);
  featuredProducts.textContent = persianNumber.format(
    adminProducts.filter((product) => product.isFeatured).length
  );

  const latest = adminProducts
    .map((product) => product.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  lastUpdated.textContent = latest ? new Date(`${latest}Z`).toLocaleDateString("fa-IR") : "-";

  if (!adminProducts.length) {
    table.innerHTML = '<tr><td colspan="5">هنوز محصولی ثبت نشده است.</td></tr>';
    return;
  }

  table.innerHTML = adminProducts
    .map(
      (product) => `
        <tr>
          <td>
            <div class="product-cell">
              <img src="${escapeHtml(imageUrl(product.image))}" alt="${escapeHtml(product.title)}" />
              <div>
                <strong>${escapeHtml(product.title)}</strong>
                <small>${escapeHtml(product.shortDescription)}</small>
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

function initDashboard() {
  const form = document.querySelector("#productForm");
  if (!form) return;

  const message = document.querySelector("#formMessage");
  const imageInput = document.querySelector("#image");

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

  document.querySelector("#logoutButton").addEventListener("click", async () => {
    await requestJson("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login.html";
  });

  imageInput.addEventListener("change", () => {
    const file = imageInput.files?.[0];
    if (!file) {
      updatePreview(imageUrl(document.querySelector("#currentImage").value));
      return;
    }

    updatePreview(URL.createObjectURL(file));
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
