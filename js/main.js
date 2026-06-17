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
  const categoryImages = document.querySelectorAll(".category-card__media img");

  categoryImages.forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        const media = image.closest(".category-card__media");
        if (media) media.classList.add("is-missing");
        image.remove();
      },
      { once: true }
    );
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
});
