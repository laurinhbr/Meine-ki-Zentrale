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

  let echteDaten = false;

  function zeige(plan, herkunft) {
    if (herkunft !== "beispiel") echteDaten = true;
    $("datum").textContent = formatDatum(plan.datum) + (plan.stand ? " · Stand " + plan.stand : "");
    $("vorschlag").textContent = plan.vorschlag || "–";
    zeigeQuellen(plan);
    zeigeTermine(plan);
    zeigeAufgaben(plan);
    zeigeStatistik(plan);
    const h = $("hinweis");
    h.hidden = herkunft !== "beispiel";
    h.textContent = $("gmail").hidden
      ? "Du siehst Beispieldaten. Lade über „Tagesplan laden“ deine eigene Datei aus dem Ordner tagesplaene/."
      : "Du siehst Beispieldaten. Tippe auf „Gmail laden“, um deinen echten Posteingang anzuzeigen (nur lesend).";
  }

  function fehler(text) {
    const h = $("hinweis");
    h.hidden = false;
    h.textContent = text;
  }

  function ladeBeispiel(automatisch) {
    fetch("daten/beispiel.json")
      .then((r) => r.json())
      .then((p) => {
        // Beim Start nicht über bereits geladene echte Daten schreiben.
        if (automatisch === true && echteDaten) return;
        echteDaten = false;
        zeige(p, "beispiel");
      })
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
  $("beispiel").addEventListener("click", () => ladeBeispiel(false));

  // ---------------------------------------------------------------------
  // Gmail live (nur in claude.ai): liest den Posteingang über deine eigene
  // Gmail-Verbindung. Nur das Such-Werkzeug ist freigegeben – die Seite
  // kann nichts senden, löschen oder markieren. Mails werden nicht
  // gespeichert, sondern nur angezeigt.
  // ---------------------------------------------------------------------
  const GMAIL = "Gmail";
  const ABFRAGE = { query: "in:inbox newer_than:1d", pageSize: 50, view: "THREAD_VIEW_SUMMARY" };
  const WICHTIG_WOERTER = /sicherheit|security|sign-in|anmeldung|passwort|password|dringend|frist|mahnung|überfällig|urgent/i;
  const MITTEL_WOERTER = /rechnung|zahlung|invoice|buchung|booking|reservierung|reservation|bestätig|confirm|termin|receipt|quittung|rückerstattung|refund/i;
  const ANTWORT = /^\s*(re|aw|antw|fwd?|wg)\s*:/i;

  function absenderName(m) {
    const n = (m.addressDisplayNames || []).find((a) => a.emailAddress === m.sender);
    return (n && n.displayName) || m.sender || "Unbekannt";
  }

  function bewerte(m) {
    const l = m.labelIds || [];
    const text = (m.subject || "") + " " + (m.snippet || "");
    const werbung = l.includes("CATEGORY_PROMOTIONS") || l.includes("CATEGORY_SOCIAL") || l.includes("CATEGORY_FORUMS");
    if (WICHTIG_WOERTER.test(text)) return { p: "hoch", grund: "Sicherheit oder Frist – kurz prüfen.", werbung: werbung };
    if (werbung) return { p: "niedrig", grund: "Werbung, Newsletter oder soziales Netzwerk.", werbung: true };
    if (l.includes("IMPORTANT") && (ANTWORT.test(m.subject || "") || l.includes("CATEGORY_PERSONAL")))
      return { p: "hoch", grund: "Persönliche Nachricht, auf die jemand wartet.", werbung: false };
    if (l.includes("IMPORTANT") || l.includes("STARRED") || MITTEL_WOERTER.test(text))
      return { p: "mittel", grund: "Wichtig markiert, Rechnung oder Buchung.", werbung: false };
    return { p: "niedrig", grund: "Kein Handlungsbedarf erkennbar.", werbung: false };
  }

  function planAusGmail(payload) {
    const threads = (payload && payload.threads) || [];
    const reihen = { hoch: 0, mittel: 1, niedrig: 2 };
    let werbung = 0;
    const aufgaben = threads.map((t) => {
      const m = (t.messages || [])[0] || {};
      const b = bewerte(m);
      if (b.werbung) werbung++;
      return {
        id: "gmail-" + t.id,
        prioritaet: b.p,
        titel: m.subject || "(ohne Betreff)",
        quelle: "E-Mail",
        von: absenderName(m),
        grund: b.grund,
        link: t.viewUrl || m.viewUrl,
        datum: m.date || "",
      };
    }).sort((a, b) => reihen[a.prioritaet] - reihen[b.prioritaet] || (b.datum > a.datum ? 1 : -1));

    const hoch = aufgaben.filter((a) => a.prioritaet === "hoch");
    const jetzt = new Date();
    const iso = jetzt.getFullYear() + "-" + String(jetzt.getMonth() + 1).padStart(2, "0") + "-" + String(jetzt.getDate()).padStart(2, "0");
    return {
      datum: iso,
      stand: jetzt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      quellen: [
        { name: "Gmail (live)", status: "ok" },
        { name: "Microsoft Teams", status: "fehlt", hinweis: "Microsoft 365 auf claude.ai verbinden" },
        { name: "Kalender", status: "fehlt", hinweis: "Noch kein Kalender verbunden" },
        { name: "Aufgaben", status: "fehlt", hinweis: "Noch kein Aufgaben-Dienst verbunden" },
      ],
      termine: [],
      aufgaben: aufgaben,
      statistik: { emails: threads.length, newsletter: werbung, teams: null, aufgaben: null },
      vorschlag: hoch.length
        ? hoch.length + " Punkt(e) mit hoher Priorität. Fang an mit: „" + hoch[0].titel + "“. Die Einstufung ist automatisch geschätzt – bitte selbst kurz prüfen."
        : "Nichts Dringendes im Posteingang der letzten 24 Stunden. Die Einstufung ist automatisch geschätzt.",
    };
  }

  function gmailFehler(e) {
    const code = (e && e.code) || "upstream_error";
    const texte = {
      needs_reauth: "Die Gmail-Verbindung ist abgelaufen. Verbinde Gmail neu: claude.ai → Einstellungen → Konnektoren.",
      server_not_connected: "Gmail ist nicht verbunden. Füge Gmail hinzu: claude.ai → Einstellungen → Konnektoren.",
      selection_required: "Du hast mehrere Gmail-Verbindungen. Wähle in claude.ai aus, welche diese Seite nutzen soll.",
      not_in_manifest: "Der Zugriff auf Gmail ist für diese Seite nicht erlaubt. Du kannst ihn im Menü der Seite unter „Berechtigungen“ erlauben.",
      approval_required: "Der Zugriff auf Gmail braucht deine Zustimmung. Tippe erneut auf „Gmail laden“.",
      blocked_by_policy: "Gmail ist für dein Konto durch eine Richtlinie gesperrt.",
      server_unavailable: "Gmail antwortet gerade nicht. Versuch es in einer Minute noch einmal.",
    };
    fehler(texte[code] || "Gmail konnte nicht geladen werden (" + code + "). Versuch es gleich noch einmal.");
  }

  function starteGmail(mcp) {
    const knopf = $("gmail");
    knopf.hidden = false;

    function laden() {
      knopf.disabled = true;
      knopf.textContent = "Lädt …";
      // cache:false – Mails werden nirgends zwischengespeichert.
      mcp.callTool(GMAIL, "search_threads", ABFRAGE, { cache: false })
        .then((r) => zeige(planAusGmail(r.payload), "gmail"))
        .catch(gmailFehler)
        .finally(() => { knopf.disabled = false; knopf.textContent = "Gmail aktualisieren"; });
    }
    knopf.addEventListener("click", laden);

    // Wurde Gmail für diese Seite schon erlaubt, direkt laden.
    const claudeApi = window.claude;
    claudeApi.use("permissions")
      .then((perm) => perm ? perm.state("mcp:" + GMAIL) : "unavailable")
      .catch(() => "unavailable")
      .then((st) => { if (st === "granted") laden(); });
  }

  ladeBeispiel(true);

  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("mcp").then((mcp) => { if (mcp) starteGmail(mcp); }).catch(() => {});
  }
})();
