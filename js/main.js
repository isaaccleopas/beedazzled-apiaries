const ITEM = ".bd-card, .bd-tile, .bd-step, .bd-photo-card";

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealTargets(root) {
  const out = [];
  root.querySelectorAll("section:not(.bd-page-hero)").forEach((section) => {
    const items = [...section.querySelectorAll(ITEM)];
    if (items.length) {
      out.push(...items);
      return;
    }
    out.push(section);
  });
  return out;
}

function itemDelay(el) {
  if (el.matches("section")) return "0ms";
  const section = el.closest("section");
  if (!section) return "0ms";
  const group = [...section.querySelectorAll(ITEM)];
  const index = Math.max(0, group.indexOf(el));
  return `${Math.min(index, 7) * 55}ms`;
}

function bindReveal(root) {
  if (reducedMotion()) return () => {};

  const nodes = revealTargets(root);
  nodes.forEach((el) => {
    el.classList.add("bd-reveal");
    el.style.setProperty("--bd-delay", itemDelay(el));
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  requestAnimationFrame(() => requestAnimationFrame(() => nodes.forEach((el) => io.observe(el))));
  return () => io.disconnect();
}

function bindHeroScrub(root) {
  const heroes = [...root.querySelectorAll(".bd-page-hero")];
  if (!heroes.length) return () => {};

  let ticking = false;
  const update = () => {
    ticking = false;
    if (reducedMotion()) {
      heroes.forEach((el) => el.style.setProperty("--bd-hero-p", "0"));
      return;
    }
    heroes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const height = Math.max(el.offsetHeight, 1);
      const progress = Math.min(1, Math.max(0, -rect.top / height));
      el.style.setProperty("--bd-hero-p", progress.toFixed(4));
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
  return () => window.removeEventListener("scroll", onScroll);
}

function splitHeadings(root) {
  root.querySelectorAll("[data-split]").forEach((el) => {
    if (el.dataset.splitDone) return;
    const text = el.textContent.trim();
    el.dataset.splitDone = "1";
    el.classList.add("bd-split");
    el.textContent = "";
    text.split(/\s+/).forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "bd-split-word";
      span.style.setProperty("--i", String(i));
      span.textContent = word;
      el.appendChild(span);
    });
  });

  if (reducedMotion()) {
    root.querySelectorAll(".bd-split-word").forEach((word) => word.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".bd-split-word").forEach((word) => word.classList.add("is-in"));
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.35 },
  );

  root.querySelectorAll(".bd-split").forEach((el) => io.observe(el));
}

function bindNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!nav || !toggle || !links) return;

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function bindHeroPointer(root) {
  const visual = root.querySelector(".bd-hero-visual");
  const hero = root.querySelector(".bd-page-hero");
  if (!visual || !hero || reducedMotion() || window.matchMedia("(pointer: coarse)").matches) {
    return () => {};
  }

  const onMove = (event) => {
    const rect = visual.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
    const y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
    hero.style.setProperty("--bd-mx", x.toFixed(3));
    hero.style.setProperty("--bd-my", y.toFixed(3));
  };

  visual.addEventListener("pointermove", onMove);
  visual.addEventListener("pointerleave", () => {
    hero.style.setProperty("--bd-mx", "0");
    hero.style.setProperty("--bd-my", "0");
  });

  return () => visual.removeEventListener("pointermove", onMove);
}

function dismissLoader() {
  const loader = document.getElementById("loader");
  const hero = document.getElementById("hero");
  const reveal = () => {
    if (loader) {
      loader.classList.add("is-done");
      window.setTimeout(() => loader.remove(), 700);
    }
    document.body.classList.add("is-ready");
    if (hero) {
      hero.classList.add("is-live");
      hero.querySelectorAll(".bd-split-word").forEach((word) => word.classList.add("is-in"));
    }
  };
  if (reducedMotion()) {
    reveal();
    return;
  }
  window.setTimeout(reveal, 850);
}

document.getElementById("year").textContent = String(new Date().getFullYear());
bindNav();
bindReveal(document);
bindHeroScrub(document);
bindHeroPointer(document);
splitHeadings(document);
dismissLoader();
