# Konnektoren (Datenquellen)

Konnektoren verbinden Claude mit deinen Diensten (z. B. E-Mail oder Kalender).
Verwaltet werden sie auf claude.ai unter **Einstellungen → Konnektoren**.

## Stand der Prüfung (05.11.2026)

Geprüft wurde nur, **welche** Konnektoren vorhanden sind – es wurden **keine**
persönlichen Daten gelesen.

| Konnektor | Status | Abgedeckt | Hinweis |
|-----------|--------|-----------|---------|
| Gmail | ✅ verbunden und in Claude nutzbar | E-Mails | Hat auch Schreib-Funktionen (Senden, Löschen …) – laut CLAUDE.md nur lesend verwenden |
| Microsoft 365 | ⚠️ installiert, Verbindung **nicht abgeschlossen** | Outlook-Mails, Outlook-Kalender, Teams, OneDrive, SharePoint | Anmeldung auf claude.ai unter Einstellungen → Konnektoren abschließen |
| GitHub | ✅ verbunden | dieses Repository | Für Projektdateien, nicht für Alltagsdaten |

## Was fehlt noch für die Tagesplanung?

- **Microsoft Teams** und **Outlook-Kalender** → Microsoft-365-Verbindung abschließen
- **Aufgaben** → z. B. über Microsoft 365 (To Do / Planner, je nach Konnektor-Umfang)
  oder einen weiteren Konnektor (z. B. Todoist, Google Tasks)
- **Google Kalender** (falls du diesen statt Outlook nutzt) → separat verbinden

## Tipp
Wenn du in den Konnektor-Einstellungen einzelne Werkzeuge erlauben/sperren kannst,
setze Schreib-Aktionen wie „Senden“ oder „Löschen“ auf **„Immer fragen“**.
Das ist eine zusätzliche Sicherung neben den Regeln in `CLAUDE.md`.
