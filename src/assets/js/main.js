(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* ——— „viacinfo“ pás ———
     Na mobile je tvar presne z Figmy. Na širších obrazovkách by sa zväčšený pás roztiahol do obrovskej výšky,
     preto tvar opakujeme (striedavo zrkadlovo, aby na seba nadväzoval) a výška ostane rozumná. */
  const BAND_W = 405.48;
  const BAND_H = 170.5;
  const BAND_TOP = [[0, 0], [96.71, 20.5], [156.65, 60], [209.54, 77.5], [308.27, 56.5], [405.48, 20.5]];
  const BAND_BOTTOM = [[0, 81.5], [96.71, 103.5], [156.65, 151.5], [209.54, 170.5], [312.3, 148], [405.48, 111.5]];

  function tileBand(points, segments) {
    const out = [];
    for (let k = 0; k < segments; k++) {
      const seg = k % 2 === 0 ? points : [...points].reverse().map(([x, y]) => [BAND_W - x, y]);
      seg.forEach(([x, y], i) => {
        if (k > 0 && i === 0) return; // spoločný bod s predchádzajúcim segmentom
        out.push([x + k * BAND_W, y]);
      });
    }
    return out;
  }

  function layoutBand(svg) {
    const width = svg.clientWidth || BAND_W;
    const scale = Math.min(width / BAND_W, 1.3); // max. výška pásu ≈ 222 px
    const viewW = width / scale;
    if (viewW <= BAND_W + 1) return; // mobil: nechaj pôvodný tvar z Figmy

    const segments = Math.ceil(viewW / BAND_W);
    const top = tileBand(BAND_TOP, segments);
    const bottom = tileBand(BAND_BOTTOM, segments);
    const mid = top.map(([x, y], i) => [x, (y + bottom[i][1]) / 2 - 6]);
    const pt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

    svg.setAttribute("viewBox", `0 0 ${viewW.toFixed(1)} ${BAND_H}`);
    svg.querySelector("[data-band-shape]").setAttribute("d", `M${top.map(pt).join("L")}L${[...bottom].reverse().map(pt).join("L")}Z`);
    svg.querySelector("#marquee-path").setAttribute("d", `M-40 ${mid[0][1]}L${mid.map(pt).join("L")}L${viewW + 60} ${mid.at(-1)[1]}`);
  }

  function initViacinfo() {
    const svg = document.querySelector("[data-band]");
    const textPath = document.getElementById("marquee-text");
    if (!svg || !textPath) return;

    const WORD = "viacinfo";
    const EVERY = 5; // každé 5. slovo je biele
    let period = 0;

    function fill() {
      layoutBand(svg);
      const pathLength = svg.querySelector("#marquee-path").getTotalLength();
      textPath.textContent = "";
      let patterns = 1;
      const addPattern = () => {
        for (let w = 0; w < EVERY; w++) {
          const tspan = document.createElementNS(SVG_NS, "tspan");
          tspan.textContent = WORD;
          if (w === EVERY - 1) tspan.setAttribute("fill", "#fff");
          textPath.appendChild(tspan);
        }
      };
      addPattern();
      // posun o celý vzor (5 slov) → po preskočení je text identický, takže nič neskáče
      period = textPath.getComputedTextLength();
      patterns = Math.ceil(pathLength / period) + 2;
      for (let i = 1; i < patterns; i++) addPattern();
    }

    fill();
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

    let t;
    let lastWidth = svg.clientWidth;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (svg.clientWidth === lastWidth) return;
        lastWidth = svg.clientWidth;
        fill();
        textPath.setAttribute("startOffset", String(-period + offset));
      }, 150);
    });
  }

  /* ——— Karty so záložkami: ak je karta vyššia ako voľné miesto, nech sa prilepí až jej spodok ——— */
  function initStack() {
    const cards = [...document.querySelectorAll("[data-stack-card]")];
    if (!cards.length) return;

    function update() {
      cards.forEach((card) => {
        card.style.top = "";
        if (getComputedStyle(card).position !== "sticky") return; // desktop: mriežka, nič sa nelepí
        const top = parseFloat(getComputedStyle(card).top) || 0;
        const overflow = card.offsetHeight - (window.innerHeight - top);
        if (overflow > 0) card.style.top = `${top - overflow}px`;
      });
    }

    update();
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(update, 100);
    });
    document.fonts?.ready.then(update);
  }

  /* ——— Pohyblivé fotky v kartách: zduplikujeme obsah, aby animácia išla dookola bez medzery ——— */
  function initPhotoMarquees() {
    const addClones = (track, items) =>
      items.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.dataset.clone = "";
        clone.querySelectorAll("button").forEach((b) => (b.tabIndex = -1));
        track.appendChild(clone);
      });

    document.querySelectorAll("[data-marquee] .marquee__track").forEach((track) => {
      const originals = [...track.children];
      // Animácia posúva o presne polovicu pásu. Párne/nepárne fotky majú iný sklon a odsadenie,
      // takže polovica musí mať párny počet fotiek – inak by sa pri opakovaní „preklopili“ a pás by poskočil.
      if (originals.length % 2) addClones(track, originals);
      addClones(track, [...track.children]);
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

    const hint = document.querySelector("[data-quote-hint]");
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => {
        select(tab);
        if (tab.id === "tab-riso") hint?.classList.add("is-done");
      });
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

  /* ——— Lightbox (spoločný pre všetky galérie na stránke) ——— */
  function initLightbox() {
    const dialog = document.querySelector("[data-lightbox]");
    if (!dialog || typeof dialog.showModal !== "function") return;

    const img = dialog.querySelector("[data-lb-img]");
    const counter = dialog.querySelector("[data-lb-counter]");
    let photos = [];
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
      counter.textContent = `${current + 1} / ${photos.length}`;
    }

    document.querySelectorAll("[data-gallery]").forEach((gallery) => {
      // originály (bez klonov z marquee); hlavná galéria má vlastné poradie v data-index
      let originals = [...gallery.querySelectorAll("[data-lb]")].filter((b) => !b.closest("[data-clone]"));
      if (gallery.hasAttribute("data-gallery-ordered")) originals.sort((a, b) => a.dataset.index - b.dataset.index);
      const list = originals.map((b) => {
        const im = b.querySelector("img");
        return { src: im.currentSrc || im.src, alt: im.alt };
      });

      gallery.querySelectorAll("[data-lb]").forEach((b) => {
        const src = b.querySelector("img").getAttribute("src");
        const index = list.findIndex((p) => p.src.endsWith(src));
        b.setAttribute("aria-haspopup", "dialog");
        b.setAttribute("aria-label", `Otvoriť fotku ${index + 1} z ${list.length}: ${list[index].alt}`);
        b.addEventListener("click", () => {
          opener = b.closest("[data-clone]") ? originals[index] : b;
          photos = list;
          show(index);
          dialog.showModal();
          document.documentElement.style.overflow = "hidden";
        });
      });
    });

    dialog.querySelector("[data-lb-prev]").addEventListener("click", () => show(current - 1));
    dialog.querySelector("[data-lb-next]").addEventListener("click", () => show(current + 1));
    dialog.querySelector("[data-lb-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
      opener?.focus({ preventScroll: true });
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
    dialog.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      { passive: true },
    );
    dialog.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) dialog.close();
    });
  }

  initPhotoMarquees();
  initStack();
  initVideo();
  initQuotes();
  initLightbox();
  // dĺžka textu v páse závisí od fontu – počkáme, kým sa načíta
  (document.fonts?.ready ?? Promise.resolve()).then(initViacinfo);
})();
