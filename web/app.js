// KI-Alltagszentrale – zeigt einen Tagesplan (JSON) übersichtlich an.
// Die App liest nur. Es wird nichts an einen Server geschickt.

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const SPEICHER = "ki-zentrale:erledigt";

  // Merkt sich abgehakte Punkte im Browser (nur auf diesem Gerät).
  function ladeErledigt() {
    try { return JSON.parse(localStorage.getItem(SPEICHER)) || {}; }
    catch (e) { return {}; }
  }
  function speichereErledigt(daten) {
    try { localStorage.setItem(SPEICHER, JSON.stringify(daten)); } catch (e) { /* egal */ }
  }

  function el(tag, klasse, text) {
    const e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text != null) e.textContent = text;
    return e;
  }

  function formatDatum(iso) {
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso || "–";
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function sichererLink(url) {
    try {
      const u = new URL(url);
      return u.protocol === "https:" ? u.href : null;
    } catch (e) { return null; }
  }

  function zeigeAufgaben(plan) {
    const erledigt = ladeErledigt();
    const schluessel = (a, i) => plan.datum + ":" + (a.id || i);
    const listen = { hoch: $("liste-hoch"), mittel: $("liste-mittel"), niedrig: $("liste-niedrig") };
    Object.values(listen).forEach((l) => l.replaceChildren());

    (plan.aufgaben || []).forEach((a, i) => {
      const ziel = listen[a.prioritaet] || listen.niedrig;
      const li = el("li");
      const key = schluessel(a, i);
      const box = el("input");
      box.type = "checkbox";
      box.checked = !!erledigt[key];
      box.setAttribute("aria-label", "Erledigt: " + a.titel);
      if (box.checked) li.classList.add("erledigt");
      box.addEventListener("change", () => {
        const d = ladeErledigt();
        if (box.checked) d[key] = true; else delete d[key];
        speichereErledigt(d);
        li.classList.toggle("erledigt", box.checked);
      });

      const inhalt = el("div");
      inhalt.append(el("div", "titel", a.titel));
      if (a.grund) inhalt.append(el("div", "grund", a.grund));
      const meta = el("div", "meta", [a.quelle, a.von].filter(Boolean).join(" · "));
      const link = a.link && sichererLink(a.link);
      if (link) {
        const aEl = el("a", null, "öffnen");
        aEl.href = link; aEl.target = "_blank"; aEl.rel = "noopener noreferrer";
        if (meta.textContent) meta.append(" · ");
        meta.append(aEl);
      }
      if (meta.textContent) inhalt.append(meta);

      li.append(box, inhalt);
      ziel.append(li);
    });

    Object.values(listen).forEach((l) => {
      if (!l.children.length) l.append(el("li", "leer", "Nichts offen."));
    });
  }

  function zeigeTermine(plan) {
    const liste = $("termine");
    liste.replaceChildren();
    (plan.termine || []).forEach((t) => {
      const li = el("li");
      li.append(el("span", "zeit", t.zeit || "–"));
      const inhalt = el("div");
      inhalt.append(el("div", "titel", t.titel));
      const meta = [t.ort, t.vorbereitung && "Vorbereitung: " + t.vorbereitung].filter(Boolean).join(" · ");
      if (meta) inhalt.append(el("div", "meta", meta));
      li.append(inhalt);
      liste.append(li);
    });
    if (!liste.children.length) liste.append(el("li", "leer", "Keine Termine gefunden."));
  }

  function zeigeQuellen(plan) {
    const liste = $("quellen");
    liste.replaceChildren();
    (plan.quellen || []).forEach((q) => {
      const li = el("li", q.status === "ok" ? "ok" : "fehlt", q.name);
      if (q.hinweis) li.title = q.hinweis;
      liste.append(li);
    });
  }

  function zeigeStatistik(plan) {
    const dl = $("statistik");
    dl.replaceChildren();
    const s = plan.statistik || {};
    [
      ["E-Mails", s.emails],
      ["Werbung / Newsletter", s.newsletter],
      ["Teams-Nachrichten", s.teams],
      ["Offene Aufgaben", s.aufgaben],
    ].forEach(([name, wert]) => {
      const box = el("div");
      box.append(el("dt", null, name), el("dd", null, wert == null ? "–" : String(wert)));
      dl.append(box);
    });
  }

  function zeige(plan, herkunft) {
    $("datum").textContent = formatDatum(plan.datum) + (plan.stand ? " · Stand " + plan.stand : "");
    $("vorschlag").textContent = plan.vorschlag || "–";
    zeigeQuellen(plan);
    zeigeTermine(plan);
    zeigeAufgaben(plan);
    zeigeStatistik(plan);
    const h = $("hinweis");
    h.hidden = herkunft !== "beispiel";
    h.textContent = "Du siehst Beispieldaten. Lade über „Tagesplan laden“ deine eigene Datei aus dem Ordner tagesplaene/.";
  }

  function fehler(text) {
    const h = $("hinweis");
    h.hidden = false;
    h.textContent = text;
  }

  function ladeBeispiel() {
    fetch("daten/beispiel.json")
      .then((r) => r.json())
      .then((p) => zeige(p, "beispiel"))
      .catch(() => fehler("Beispiel konnte nicht geladen werden. Starte die App über einen lokalen Server (siehe web/README.md) oder lade eine Datei."));
  }

  $("datei").addEventListener("change", (ev) => {
    const datei = ev.target.files && ev.target.files[0];
    if (!datei) return;
    const leser = new FileReader();
    leser.onload = () => {
      try { zeige(JSON.parse(leser.result), "datei"); }
      catch (e) { fehler("Die Datei ist kein gültiger Tagesplan (JSON)."); }
    };
    leser.readAsText(datei);
  });
  $("beispiel").addEventListener("click", ladeBeispiel);

  ladeBeispiel();
})();
