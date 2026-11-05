# Web-App: KI-Alltagszentrale

Eine einfache Web-Seite, die deinen Tagesplan übersichtlich anzeigt:
Quellen, Termine, Aufgaben nach Priorität (🔴 hoch, 🟡 mittel, 🟢 niedrig),
Kurz-Statistik und einen Vorschlag für den Tag. Punkte kannst du abhaken.

Die App **liest nur** die Datei, die du ihr gibst. Sie schickt nichts ins
Internet. Abgehakte Punkte merkt sich nur dein Browser.

## So startest du sie

**Variante A – ohne Installation:**
`web/index.html` im Browser öffnen und oben auf **„Tagesplan laden“** klicken.
Dann eine Datei aus `tagesplaene/` auswählen (z. B. `2026-11-05.json`).

**Variante B – mit Beispieldaten (lokaler Server):**
```bash
cd Meine-ki-Zentrale
python3 -m http.server 8000
```
Dann im Browser `http://localhost:8000/web/` öffnen.

## Woher kommt der Tagesplan?

Sag in Claude Code: „Mach mir meine Tagesplanung“. Der Skill `tagesplanung`
erstellt die Übersicht und speichert sie auf Wunsch als
`tagesplaene/JJJJ-MM-TT.json`. Dieser Ordner wird **nicht** zu GitHub
hochgeladen – deine Daten bleiben privat.

## Dateiformat

Siehe `daten/beispiel.json`. Die wichtigsten Felder:

| Feld | Inhalt |
|------|--------|
| `datum` | Datum im Format `JJJJ-MM-TT` |
| `quellen` | Liste mit `name` und `status` (`ok` oder `fehlt`) |
| `termine` | Liste mit `zeit`, `titel`, `ort`, `vorbereitung` |
| `aufgaben` | Liste mit `id`, `prioritaet` (`hoch`/`mittel`/`niedrig`), `titel`, `quelle`, `von`, `grund`, optional `link` |
| `statistik` | `emails`, `newsletter`, `teams`, `aufgaben` |
| `vorschlag` | kurzer Text |
