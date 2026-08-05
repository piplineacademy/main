/* Pipline Forex Academy — shared app JS */
(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const store = {
    get(k, d) {
      try { const v = localStorage.getItem("pfa:" + k); return v === null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem("pfa:" + k, JSON.stringify(v)); } catch (e) {} }
  };
  window.PFA = { $, $$, store };

  /* ---------- toasts ---------- */
  function toast(msg, bad) {
    let host = $("#toasts");
    if (!host) { host = document.createElement("div"); host.id = "toasts"; document.body.appendChild(host); }
    const el = document.createElement("div");
    el.className = "toast" + (bad ? " bad" : "");
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateX(30px)"; el.style.transition = ".3s"; }, 3000);
    setTimeout(() => el.remove(), 3400);
  }
  window.PFA.toast = toast;

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const savedTheme = store.get("theme", "dark");
  if (savedTheme === "light") root.setAttribute("data-theme", "light");
  function paintThemeBtn() {
    const light = root.getAttribute("data-theme") === "light";
    $$("[data-theme-toggle]").forEach(b => { b.textContent = light ? "☀" : "☾"; b.title = light ? "Switch to dark" : "Switch to light"; });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-theme-toggle]");
    if (!b) return;
    const light = root.getAttribute("data-theme") === "light";
    if (light) root.removeAttribute("data-theme"); else root.setAttribute("data-theme", "light");
    store.set("theme", light ? "dark" : "light");
    paintThemeBtn();
  });

  /* ---------- nav: active link, drawer, dropdown ---------- */
  function currentPage() {
    const f = location.pathname.split("/").pop();
    return !f || f === "" ? "index.html" : f;
  }
  function markActive() {
    const page = currentPage();
    $$("a[href]").forEach(a => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      if (href.split("#")[0] === page && (a.closest(".nav-links") || a.closest(".drawer") || a.closest(".dropdown"))) {
        a.classList.add("active");
        const dd = a.closest(".dropdown");
        if (dd) dd.previousElementSibling && dd.previousElementSibling.classList.add("active");
      }
    });
  }

  function wireNav() {
    const drawer = $("#drawer"), scrim = $("#scrim"), burger = $("#burger");
    function close() { drawer && drawer.classList.remove("open"); scrim && scrim.classList.remove("open"); }
    burger && burger.addEventListener("click", () => {
      drawer.classList.toggle("open"); scrim.classList.toggle("open");
    });
    scrim && scrim.addEventListener("click", close);
    drawer && $$("a", drawer).forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") { close(); $$(".dropdown.open").forEach(d => d.classList.remove("open")); } });

    document.addEventListener("click", e => {
      const btn = e.target.closest(".nav-more > button");
      $$(".dropdown.open").forEach(d => { if (!btn || d !== btn.nextElementSibling) d.classList.remove("open"); });
      if (btn) { btn.nextElementSibling.classList.toggle("open"); e.stopPropagation(); }
    });
  }

  /* ---------- reading progress + back to top ---------- */
  function wireScroll() {
    const bar = $("#readbar"), top = $("#totop");
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (window.scrollY / h) * 100 : 0;
      if (bar) bar.style.width = p + "%";
      if (top) top.classList.toggle("show", window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    top && top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- scroll reveal ---------- */
  function wireReveal() {
    const els = $$(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en, i) => {
        if (en.isIntersecting) {
          const idx = Number(en.target.dataset.delay || 0);
          setTimeout(() => en.target.classList.add("in"), idx * 70);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    els.forEach((el, i) => { if (!el.dataset.delay) el.dataset.delay = String(i % 6); io.observe(el); });
  }

  /* ---------- counters ---------- */
  function wireCounters() {
    const els = $$("[data-count]");
    if (!els.length) return;
    const run = el => {
      const target = parseFloat(el.dataset.count);
      const dec = (el.dataset.count.split(".")[1] || "").length;
      const suffix = el.dataset.suffix || "";
      const dur = 1400; const t0 = performance.now();
      const step = t => {
        const p = Math.min((t - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * e).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } }), { threshold: .4 });
    els.forEach(e => io.observe(e));
  }

  /* ---------- accordions ---------- */
  function wireAccordions() {
    $$(".acc > button").forEach(btn => {
      btn.addEventListener("click", () => {
        const acc = btn.parentElement, body = $(".body", acc), open = acc.classList.contains("open");
        const group = acc.closest("[data-accordion-group]");
        if (group && !open) {
          $$(".acc.open", group).forEach(o => { o.classList.remove("open"); $(".body", o).style.maxHeight = null; });
        }
        acc.classList.toggle("open", !open);
        body.style.maxHeight = open ? null : body.scrollHeight + "px";
      });
    });
  }

  /* ---------- table sort + filter ---------- */
  function wireTables() {
    $$("table[data-sortable]").forEach(tb => {
      $$("th[data-sort]", tb).forEach((th, idx) => {
        th.addEventListener("click", () => {
          const body = $("tbody", tb);
          const rows = $$("tr", body);
          const type = th.dataset.sort;
          const dir = th.dataset.dir === "asc" ? -1 : 1;
          $$("th[data-sort]", tb).forEach(o => { o.removeAttribute("data-dir"); o.textContent = o.textContent.replace(/[▲▼]\s*$/, "").trim(); });
          th.dataset.dir = dir === 1 ? "asc" : "desc";
          th.textContent = th.textContent.trim() + (dir === 1 ? " ▲" : " ▼");
          rows.sort((a, b) => {
            const x = a.children[idx].dataset.v ?? a.children[idx].textContent.trim();
            const y = b.children[idx].dataset.v ?? b.children[idx].textContent.trim();
            return type === "num" ? (parseFloat(x) - parseFloat(y)) * dir : String(x).localeCompare(String(y)) * dir;
          });
          rows.forEach(r => body.appendChild(r));
        });
      });
    });
    $$("[data-filter-input]").forEach(inp => {
      const target = $(inp.dataset.filterInput);
      if (!target) return;
      inp.addEventListener("input", () => {
        const q = inp.value.trim().toLowerCase();
        let n = 0;
        $$("tbody tr", target).forEach(tr => {
          const hit = tr.textContent.toLowerCase().includes(q);
          tr.style.display = hit ? "" : "none"; if (hit) n++;
        });
        const cnt = $(inp.dataset.filterCount || "#nope");
        if (cnt) cnt.textContent = n;
      });
    });
  }

  /* ---------- bookmarks (saved lessons) ---------- */
  function wireBookmarks() {
    const marks = store.get("bookmarks", []);
    $$("[data-bookmark]").forEach(btn => {
      const id = btn.dataset.bookmark;
      const paint = () => {
        const on = store.get("bookmarks", []).includes(id);
        btn.textContent = on ? "★ Saved" : "☆ Save";
        btn.classList.toggle("active", on);
      };
      btn.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation();
        const list = store.get("bookmarks", []);
        const i = list.indexOf(id);
        if (i > -1) { list.splice(i, 1); toast("Removed from your saved list"); }
        else { list.push(id); toast("Saved to your list"); }
        store.set("bookmarks", list); paint();
        renderSavedCount();
      });
      paint();
    });
    renderSavedCount();
  }
  function renderSavedCount() {
    const n = store.get("bookmarks", []).length;
    $$("[data-saved-count]").forEach(el => el.textContent = n);
  }

  /* ---------- lesson progress ---------- */
  function wireProgress() {
    $$("[data-lesson-done]").forEach(btn => {
      const id = btn.dataset.lessonDone;
      const paint = () => {
        const done = store.get("done", []).includes(id);
        btn.textContent = done ? "✓ Completed" : "Mark as complete";
        btn.className = "btn btn-sm " + (done ? "btn-primary" : "btn-ghost");
      };
      btn.addEventListener("click", () => {
        const list = store.get("done", []);
        const i = list.indexOf(id);
        if (i > -1) list.splice(i, 1); else { list.push(id); toast("Nice — lesson marked complete"); }
        store.set("done", list); paint(); paintCourseProgress();
      });
      paint();
    });
    paintCourseProgress();
  }
  function paintCourseProgress() {
    const host = $("[data-progress-total]");
    if (!host) return;
    const total = Number(host.dataset.progressTotal);
    const done = store.get("done", []).length;
    const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
    const bar = $("[data-progress-bar] > i");
    if (bar) bar.style.width = pct + "%";
    $$("[data-progress-text]").forEach(e => e.textContent = done + " / " + total + " lessons (" + pct + "%)");
  }
  window.PFA.paintCourseProgress = paintCourseProgress;

  /* ---------- table of contents scroll spy ---------- */
  function wireToc() {
    const toc = $(".toc");
    if (!toc) return;
    const links = $$("a[href^='#']", toc);
    const secs = links.map(a => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
    if (!secs.length) return;
    const onScroll = () => {
      let cur = secs[0];
      secs.forEach(s => { if (s.getBoundingClientRect().top <= 120) cur = s; });
      links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + cur.id));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- forms ---------- */
  function wireForms() {
    $$("form[data-validate]").forEach(form => {
      form.addEventListener("submit", e => {
        e.preventDefault();
        let ok = true;
        $$(".field", form).forEach(f => {
          const inp = $("input,textarea,select", f);
          if (!inp || !inp.required) return;
          let bad = !inp.value.trim();
          if (!bad && inp.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());
          if (!bad && inp.minLength > 0) bad = inp.value.trim().length < inp.minLength;
          f.classList.toggle("invalid", bad);
          if (bad) ok = false;
        });
        if (!ok) { toast("Please fix the highlighted fields", true); return; }
        const data = Object.fromEntries(new FormData(form).entries());
        const key = form.dataset.store || "submissions";
        const list = store.get(key, []);
        list.push(Object.assign({ at: new Date().toISOString() }, data));
        store.set(key, list);
        form.reset();
        toast(form.dataset.success || "Thanks — we received your message.");
      });
      $$("input,textarea", form).forEach(i => i.addEventListener("input", () => i.closest(".field")?.classList.remove("invalid")));
    });
  }

  /* ---------- newsletter ---------- */
  function wireNewsletter() {
    $$("[data-newsletter]").forEach(form => {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const inp = $("input", form);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim())) { toast("Enter a valid email address", true); return; }
        const list = store.get("subscribers", []);
        list.push({ email: inp.value.trim(), at: new Date().toISOString() });
        store.set("subscribers", list);
        inp.value = "";
        toast("You're on the list — welcome aboard!");
      });
    });
  }

  /* ---------- year ---------- */
  function wireYear() { $$("[data-year]").forEach(e => e.textContent = new Date().getFullYear()); }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    paintThemeBtn(); markActive(); wireNav(); wireScroll(); wireReveal(); wireCounters();
    wireAccordions(); wireTables(); wireBookmarks(); wireProgress(); wireToc();
    wireForms(); wireNewsletter(); wireYear();
    document.dispatchEvent(new CustomEvent("pfa:ready"));
  });
})();
