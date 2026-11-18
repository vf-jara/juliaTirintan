/* =========================================================
   Júlia Tirintan · Arquitetura & Interiores
   ========================================================= */

/**
 * CONFIGURAÇÃO
 * whatsapp: número com DDI + DDD, só dígitos (ex.: "5567999999999").
 * Enquanto estiver vazio, o formulário e o botão flutuante levam ao Linktree.
 */
const CONFIG = {
  whatsapp: "",
  instagram: "https://www.instagram.com/arq.juliatirintan/",
  linktree: "https://linktr.ee/juliatirintan",
};

document.documentElement.classList.add("js");

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- header + FAB ao rolar ---------- */
(() => {
  const header = $("[data-header]");
  const fab = $("[data-fab]");
  const hero = $("#inicio");
  const contato = $("#contato");
  let contatoVisible = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    const pastHero = y > (hero?.offsetHeight ?? 600) * 0.7;
    fab.classList.toggle("is-visible", pastHero && !contatoVisible);
  };

  if (contato && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      contatoVisible = entry.isIntersecting;
      onScroll();
    }, { threshold: 0.15 }).observe(contato);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

/* ---------- menu mobile ---------- */
(() => {
  const header = $("[data-header]");
  const toggle = $("[data-nav-toggle]");
  const list = $("[data-nav-list]");
  if (!toggle) return;

  const setOpen = (open) => {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    $(".sr-only", toggle).textContent = open ? "Fechar menu" : "Abrir menu";
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  list.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
})();

/* ---------- reveal on scroll ---------- */
(() => {
  const items = $$("[data-reveal]");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // pequeno escalonamento entre irmãos
      const siblings = $$("[data-reveal]", el.parentElement).filter((s) => s.parentElement === el.parentElement);
      const idx = Math.max(0, siblings.indexOf(el));
      el.style.transitionDelay = `${Math.min(idx, 5) * 80}ms`;
      el.classList.add("is-visible");
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach((el) => io.observe(el));
})();

/* ---------- filtro do portfólio ---------- */
(() => {
  const wrap = $("[data-filters]");
  const items = $$("[data-gallery] .g-item");
  if (!wrap) return;

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    const filter = btn.dataset.filter;

    $$("[data-filter]", wrap).forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    items.forEach((item) => {
      const show = filter === "todos" || item.dataset.cat === filter;
      item.classList.toggle("is-hidden", !show);
      item.classList.remove("is-entering");
      if (show && !prefersReducedMotion) {
        void item.offsetWidth; // reinicia a animação
        item.classList.add("is-entering");
      }
    });
  });
})();

/* ---------- lightbox ---------- */
(() => {
  const dialog = $("[data-lightbox-dialog]");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const img = $("[data-lb-img]", dialog);
  const cap = $("[data-lb-cap]", dialog);
  const triggers = $$("[data-lightbox]");
  let current = 0;
  let lastFocus = null;

  const visibleTriggers = () => triggers.filter((t) => !t.closest(".is-hidden"));

  const show = (trigger) => {
    const source = $("img", trigger);
    const caption = $(".g-cap", trigger);
    img.src = source.currentSrc || source.src;
    img.alt = source.alt;
    cap.textContent = caption ? [...caption.childNodes].map((n) => n.textContent.trim()).filter(Boolean).reverse().join(" · ") : "";
  };

  const step = (dir) => {
    const list = visibleTriggers();
    const idx = list.indexOf(triggers[current]);
    const next = list[(idx + dir + list.length) % list.length];
    current = triggers.indexOf(next);
    show(next);
  };

  triggers.forEach((t, i) => t.addEventListener("click", () => {
    lastFocus = t;
    current = i;
    show(t);
    dialog.showModal();
  }));

  $("[data-lb-close]", dialog).addEventListener("click", () => dialog.close());
  $("[data-lb-prev]", dialog).addEventListener("click", () => step(-1));
  $("[data-lb-next]", dialog).addEventListener("click", () => step(1));
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  dialog.addEventListener("close", () => lastFocus?.focus());

  // swipe no celular
  let startX = null;
  dialog.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    startX = null;
  });
})();

/* ---------- comparador antes & depois ---------- */
(() => {
  const compare = $("[data-compare]");
  if (!compare) return;

  const range = $("[data-range]", compare);
  const antesImg = $("[data-antes]", compare);
  const depoisImg = $("[data-depois]", compare);
  const antesWrap = antesImg.parentElement;
  const cases = JSON.parse(compare.dataset.cases);

  const setPos = (v) => compare.style.setProperty("--pos", `${v}%`);
  range.addEventListener("input", () => setPos(range.value));

  // espaço reservado enquanto a foto do "antes" não existe
  const markMissing = () => antesWrap.classList.add("is-missing");
  const markLoaded = () => antesWrap.classList.remove("is-missing");
  antesImg.addEventListener("error", markMissing);
  antesImg.addEventListener("load", markLoaded);
  if (antesImg.complete && antesImg.naturalWidth === 0) markMissing();

  const loadCase = (key) => {
    const c = cases[key];
    if (!c) return;
    antesWrap.classList.remove("is-missing");
    antesImg.src = c.antes;
    antesImg.alt = `Antes: ${c.alt}`;
    depoisImg.src = c.depois;
    depoisImg.alt = `Depois: ${c.alt}`;
    range.value = 50;
    setPos(50);
  };

  const tabs = $$(".ad-tab");
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    const key = tab.dataset.case;
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    $$("[data-case-text]").forEach((el) => {
      const active = el.dataset.caseText === key;
      el.hidden = !active;
      if (active) el.classList.add("is-visible");
    });
    loadCase(key);
  }));
})();

/* ---------- formulário de contato ---------- */
(() => {
  const form = $("[data-contact-form]");
  if (!form) return;
  const error = $("[data-form-error]", form);

  // clicar em um serviço já deixa o tipo de projeto selecionado
  $$("[data-servico]").forEach((link) => link.addEventListener("click", () => {
    form.elements.tipo.value = link.dataset.servico;
    form.elements.tipo.setAttribute("aria-invalid", "false");
  }));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const required = ["nome", "cidade", "tipo"];
    let valid = true;

    required.forEach((name) => {
      const field = form.elements[name];
      const ok = Boolean(String(data[name] ?? "").trim());
      field.setAttribute("aria-invalid", String(!ok));
      if (!ok) valid = false;
    });

    error.hidden = valid;
    if (!valid) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const msg = [
      `Olá, Júlia! Me chamo ${data.nome.trim()}, sou de ${data.cidade.trim()}.`,
      `Tenho interesse em: ${data.tipo}.`,
      data.mensagem?.trim() ? `\n${data.mensagem.trim()}` : "",
    ].join("\n").trim();

    const url = CONFIG.whatsapp
      ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`
      : CONFIG.linktree;

    window.open(url, "_blank", "noopener");
  });

  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true" && e.target.value.trim()) {
      e.target.setAttribute("aria-invalid", "false");
    }
  });
})();

/* ---------- FAB → WhatsApp quando configurado ---------- */
(() => {
  const fab = $("[data-fab]");
  if (fab && CONFIG.whatsapp) {
    fab.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Olá, Júlia! Vim pelo site e gostaria de conversar sobre um projeto.")}`;
    fab.target = "_blank";
    fab.rel = "noopener";
  }
})();

/* ---------- ano no rodapé ---------- */
$$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
