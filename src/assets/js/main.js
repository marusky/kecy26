(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ——— „viacinfo“ pás: text beží po lomenej čiare ——— */
  function initMarquee() {
    const textPath = document.getElementById("marquee-text");
    if (!textPath) return;
    const repeats = textPath.textContent.split("viacinfo").length - 1;
    const period = textPath.getComputedTextLength() / repeats;
    if (!period) return;

    let offset = 0;
    let last = performance.now();
    const speed = 22; // px za sekundu

    function frame(now) {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      offset = (offset + speed * dt) % period;
      textPath.setAttribute("startOffset", String(-period + offset));
      if (!reduceMotion.matches) requestAnimationFrame(frame);
    }

    textPath.setAttribute("startOffset", String(-period));
    if (!reduceMotion.matches) requestAnimationFrame(frame);
    reduceMotion.addEventListener("change", () => {
      if (!reduceMotion.matches) {
        last = performance.now();
        requestAnimationFrame(frame);
      }
    });
  }

  /* ——— Video: YouTube sa načíta až po kliknutí (súkromie + rýchlosť) ——— */
  function initVideo() {
    document.querySelectorAll("[data-video]").forEach((wrap) => {
      const button = wrap.querySelector("button");
      button?.addEventListener("click", () => {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${wrap.dataset.video}?autoplay=1&rel=0`;
        iframe.title = "KECY 2022 | Žilina – video na YouTube";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.className = "absolute inset-0 size-full border-0";
        button.replaceWith(iframe);
        iframe.focus();
      });
    });
  }

  /* ——— „Come to KECY“: prepínanie citátov (ARIA tabs) ——— */
  function initQuotes() {
    const tablist = document.querySelector("[data-quote-tabs]");
    const card = document.querySelector("[data-quote-card]");
    if (!tablist || !card) return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];

    function select(tab, { focus = false } = {}) {
      if (tab.getAttribute("aria-selected") === "true") return;
      const oldPanel = document.getElementById(tabs.find((t) => t.getAttribute("aria-selected") === "true").getAttribute("aria-controls"));
      const newPanel = document.getElementById(tab.getAttribute("aria-controls"));

      // plynulá zmena výšky karty
      const from = card.offsetHeight;
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      oldPanel.hidden = true;
      newPanel.hidden = false;
      newPanel.style.opacity = "0";
      card.style.backgroundColor = tab.dataset.color;
      card.style.height = "auto";
      const to = card.offsetHeight;
      card.style.height = `${from}px`;
      card.offsetHeight; // reflow
      card.style.height = `${to}px`;
      requestAnimationFrame(() => (newPanel.style.opacity = "1"));
      const done = () => (card.style.height = "auto");
      if (reduceMotion.matches) done();
      else card.addEventListener("transitionend", (e) => e.propertyName === "height" && done(), { once: true });

      if (focus) tab.focus();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next, { focus: true });
        }
      });
    });
  }

  /* ——— Lightbox ——— */
  function initLightbox() {
    const dialog = document.querySelector("[data-lightbox]");
    const gallery = document.querySelector("[data-gallery]");
    if (!dialog || !gallery || typeof dialog.showModal !== "function") return;

    const buttons = [...gallery.querySelectorAll("[data-index]")].sort((a, b) => a.dataset.index - b.dataset.index);
    const photos = buttons.map((b) => {
      const img = b.querySelector("img");
      return { src: img.currentSrc || img.src, alt: img.alt };
    });
    const img = dialog.querySelector("[data-lb-img]");
    const caption = dialog.querySelector("[data-lb-caption]");
    const counter = dialog.querySelector("[data-lb-counter]");
    let current = 0;
    let opener = null;

    function show(i) {
      current = (i + photos.length) % photos.length;
      const p = photos[current];
      img.style.opacity = "0";
      const pre = new Image();
      pre.onload = pre.onerror = () => {
        img.src = p.src;
        img.alt = p.alt;
        img.style.opacity = "1";
      };
      pre.src = p.src;
      caption.textContent = p.alt;
      counter.textContent = `${current + 1} / ${photos.length}`;
    }

    buttons.forEach((b) => {
      b.setAttribute("aria-haspopup", "dialog");
      b.setAttribute("aria-label", `Otvoriť fotku ${Number(b.dataset.index) + 1} z ${photos.length}: ${b.querySelector("img").alt}`);
      b.addEventListener("click", () => {
        opener = b;
        show(Number(b.dataset.index));
        dialog.showModal();
        document.documentElement.style.overflow = "hidden";
      });
    });

    dialog.querySelector("[data-lb-prev]").addEventListener("click", () => show(current - 1));
    dialog.querySelector("[data-lb-next]").addEventListener("click", () => show(current + 1));
    dialog.querySelector("[data-lb-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
      opener?.focus();
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") show(current + 1);
      else if (e.key === "ArrowLeft") show(current - 1);
    });
    // klik mimo fotky zavrie
    dialog.querySelector("[data-lb-stage]").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) dialog.close();
    });

    // swipe na mobile
    let startX = 0;
    let startY = 0;
    dialog.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    dialog.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) dialog.close();
    });
  }

  initVideo();
  initQuotes();
  initLightbox();
  // dĺžka textu v páse závisí od fontu – počkáme, kým sa načíta
  (document.fonts?.ready ?? Promise.resolve()).then(initMarquee);
})();
