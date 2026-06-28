const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const toPersianNumber = (value) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(value);

function initNavbar() {
  const header = document.querySelector("#siteHeader");
  if (!header) return;

  const setHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });
}

function initMobileMenu() {
  const body = document.body;
  const header = document.querySelector("#siteHeader");
  const headerActions = document.querySelector(".header-actions");
  const navLinks = document.querySelectorAll(".main-nav a");

  if (header && headerActions && !document.querySelector(".menu-toggle")) {
    const toggleButton = document.createElement("button");
    toggleButton.className = "menu-toggle";
    toggleButton.type = "button";
    toggleButton.setAttribute("aria-label", "باز کردن منو");
    toggleButton.setAttribute("aria-controls", "mobileMenu");
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.innerHTML = "<span></span><span></span><span></span>";
    headerActions.appendChild(toggleButton);
  }

  if (header && navLinks.length && !document.querySelector("#mobileMenu")) {
    const overlay = document.createElement("div");
    overlay.className = "menu-overlay";
    overlay.dataset.menuClose = "";

    const menu = document.createElement("aside");
    menu.className = "mobile-menu";
    menu.id = "mobileMenu";
    menu.setAttribute("aria-label", "منوی موبایل");
    menu.setAttribute("aria-hidden", "true");

    const brand = document.querySelector(".brand")?.cloneNode(true);
    const links = Array.from(navLinks)
      .map((link) => `<a href="${link.getAttribute("href") || "#"}" data-menu-close>${link.textContent.trim()}</a>`)
      .join("");

    menu.innerHTML = `
      <div class="mobile-menu__head">
        ${brand ? brand.outerHTML : '<strong>صنایع مرغداری تات پاکروح</strong>'}
        <button class="mobile-menu__close" type="button" aria-label="بستن منو" data-menu-close>
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
      <nav class="mobile-menu__nav" aria-label="ناوبری موبایل">${links}</nav>
      <a class="btn btn--primary mobile-menu__cta" href="tel:09125152625" data-menu-close>
        <span>تماس مستقیم</span>
        <i class="fa-solid fa-phone" aria-hidden="true"></i>
      </a>
    `;

    document.querySelector(".page-shell")?.append(overlay, menu);
  }

  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#mobileMenu");
  const closeTargets = document.querySelectorAll("[data-menu-close]");

  if (!toggle || !menu) return;

  const openMenu = () => {
    body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "بستن منو");
    menu.setAttribute("aria-hidden", "false");
  };

  const closeMenu = () => {
    body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "باز کردن منو");
    menu.setAttribute("aria-hidden", "true");
  };

  toggle.addEventListener("click", () => {
    if (body.classList.contains("menu-open")) {
      closeMenu();
      return;
    }

    openMenu();
  });

  closeTargets.forEach((target) => {
    target.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) closeMenu();
  });
}

function initRevealAnimations() {
  const revealItems = document.querySelectorAll("[data-reveal]");

  if (!revealItems.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.16,
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");

  if (!counters.length) return;

  const animateCounter = (counter) => {
    const target = Number(counter.dataset.count || 0);
    const duration = 1450;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      counter.textContent = toPersianNumber(Math.round(target * easedProgress));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    counters.forEach((counter) => {
      counter.textContent = toPersianNumber(Number(counter.dataset.count || 0));
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.55 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function initTiltCards() {
  const cards = document.querySelectorAll("[data-tilt]");

  if (!cards.length || prefersReducedMotion) return;

  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;

      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = (y * -7).toFixed(2);
      const rotateY = (x * 7).toFixed(2);

      card.style.setProperty("--tilt-x", `${rotateX}deg`);
      card.style.setProperty("--tilt-y", `${rotateY}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

function initHeroParallax() {
  const hero = document.querySelector(".hero");
  const heroBg = document.querySelector(".hero__bg");

  if (!hero || !heroBg || prefersReducedMotion) return;

  let mouseX = 0;
  let mouseY = 0;
  let scrollOffset = 0;
  let ticking = false;

  const applyParallax = () => {
    hero.style.setProperty("--hero-x", `${mouseX}px`);
    hero.style.setProperty("--hero-y", `${mouseY + scrollOffset}px`);
    hero.style.setProperty("--hero-scroll", `${scrollOffset * 0.45}px`);
    ticking = false;
  };

  const requestParallax = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(applyParallax);
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch" || window.innerWidth < 760) return;

      const rect = hero.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX = (event.clientX - centerX) * -0.012;
      mouseY = (event.clientY - centerY) * -0.012;
      requestParallax();
    },
    { passive: true }
  );

  window.addEventListener(
    "scroll",
    () => {
      const rect = hero.getBoundingClientRect();

      if (rect.bottom < 0) return;

      scrollOffset = Math.max(rect.top * -0.08, 0);
      requestParallax();
    },
    { passive: true }
  );
}

function initButtonRipples() {
  const buttons = document.querySelectorAll(".btn");

  if (!buttons.length || prefersReducedMotion) return;

  buttons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.appendChild(ripple);

      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    });
  });
}

function initImageFallbacks() {
  const images = document.querySelectorAll("img");
  const fallback = "image/06F3B098-D47A-4B50-91FF-455BA45AA354.png";

  images.forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        const media = image.closest("[class*='image'], [class*='media'], [class*='banner']");
        if (media) media.classList.add("is-missing");

        if (image.dataset.fallbackApplied === "true") {
          image.remove();
          return;
        }

        image.dataset.fallbackApplied = "true";
        image.src = image.dataset.fallback || fallback;
      },
      { once: true }
    );
  });
}

function initHeaderSearch() {
  const searchButton = document.querySelector(".icon-btn[aria-label='جستجو']");
  if (!searchButton) return;

  searchButton.addEventListener("click", () => {
    const searchInput = document.querySelector("#productSearch");

    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    window.location.href = "products.html#productsCatalog";
  });
}

function initContactForms() {
  const form = document.querySelector("#contactRequestForm");
  const message = document.querySelector("#contactFormMessage");

  if (!form) return;

  const showFormMessage = (text, isError = false) => {
    if (!message) return;
    message.textContent = text;
    message.classList.add("is-visible");
    message.classList.toggle("is-error", isError);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const topic = String(formData.get("topic") || "").trim();
    const requestMessage = String(formData.get("message") || "").trim();

    if (!name || !phone || !topic || !requestMessage) {
      showFormMessage("لطفاً همه فیلدهای فرم را کامل کنید.", true);
      return;
    }

    const smsBody = encodeURIComponent(
      `سلام، من ${name} هستم.\nشماره تماس: ${phone}\nموضوع: ${topic}\nتوضیحات: ${requestMessage}`
    );

    showFormMessage("درخواست آماده شد. برنامه پیامک دستگاه برای ارسال باز می‌شود.");
    window.location.href = `sms:09125152625?&body=${smsBody}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMobileMenu();
  initRevealAnimations();
  initCounters();
  initTiltCards();
  initHeroParallax();
  initButtonRipples();
  initImageFallbacks();
  initHeaderSearch();
  initContactForms();
});
