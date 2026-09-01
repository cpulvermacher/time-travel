Ersetzt Datum, Uhrzeit und Zeitzone in JavaScript Date, Intl.DateTimeFormat oder Temporal mit beliebigen Werten.

Features:
- Fälscht Datum und Uhrzeit für alle Methoden von `Date`- und `Intl.DateTimeFormat`-Objekten sowie für `Temporal.Now`, sofern vom Browser unterstützt.
- Die Zeitzone kann geändert werden, mit voller Unterstützung für Sommerzeit-Umstellungen.
- Die Zeit kann angehalten und fortgesetzt werden.
- Option, die Seite nach dem Ändern des Datums automatisch neu zu laden.
- Betrifft nur den aktuellen Tab, nach einem Klick auf das Symbol der Erweiterung.

Einschränkungen:
- Die Erweiterung wirkt sich nur auf JavaScript aus.
- Manche Funktionen oder Animationen verhalten sich möglicherweise seltsam, wenn die Uhr angehalten ist.
- Die Erweiterung funktioniert nicht in iframes mit `sandbox`-Attribut.

Verwendung:
- Den Tab öffnen, in dem die Zeit geändert werden soll.
- In der Symbolleiste auf das Erweiterungen-Symbol und dann auf Time Travel klicken.
- Ein Datum im Kalender auswählen und die Uhrzeit bei Bedarf anpassen, oder Datum und Uhrzeit direkt eingeben (siehe Beispiele unten).
- Mit `Enter` oder per Klick auf die Schaltfläche zum Übernehmen bestätigen, die eine Vorschau der anzuwendenden Änderung anzeigt (z. B. "Ändern zu 27. Apr. 2025, 12:40").
- Jedes JavaScript-`Date`-, `Intl.DateTimeFormat`- oder `Temporal.Now`-Objekt im aktuellen Tab liefert nun das gesetzte falsche Datum bzw. die falsche Uhrzeit. Andere Tabs und Origins sind nicht betroffen.

Um die Systemzeit wiederherzustellen, auf das Symbol der Erweiterung klicken und den Schalter "JavaScript-Datum fälschen" ausschalten, oder das Eingabefeld leeren und `Enter` drücken.

Wenn das falsche Datum aktiviert ist, läuft die Uhr ab der eingestellten Zeit weiter. Die aktuelle Zeit der Seite wird unter "Seite sieht:" angezeigt, wo auch die echte Zeit zu sehen ist, solange die Erweiterung ausgeschaltet ist.
Über den Schalter "Uhr anhalten" lässt sich die Uhr stoppen. Das falsche Datum wird dabei auf den zuletzt gesetzten Wert zurückgesetzt.

Um die Zeitzone zu ändern, "Zeitzone ändern" aktivieren und eine Zeitzone aus der Auswahlliste wählen.
Wenn aktiviert, verwenden `Date`-Objekte, `Intl.DateTimeFormat` und `Temporal.Now` diese Zeitzone anstelle der System-Zeitzone.
Datums- und Uhrzeiteingaben werden dann ebenfalls als lokale Zeit in der ausgewählten Zeitzone interpretiert (die Beschriftung des Eingabefelds zeigt z. B. "Datum und Uhrzeit festlegen (London)").
Beim Wechsel in eine andere Zeitzone bleiben das eingegebene *lokale* Datum und die Uhrzeit erhalten, wodurch sich der Zeitpunkt ändern kann (sofern das Eingabefeld keinen UTC-Zeitpunkt enthält).

Ein Badge neben der effektiven Zeit der Seite zeigt den verwendeten UTC-Offset an, mit einem Symbol, das kennzeichnet, ob das Datum in die Sommerzeit oder die Normalzeit fällt.
Beim Überfahren des Badges mit der Maus werden weitere Details angezeigt.

Datums-Beispiele und -Formate:
- `2025-04-27 12:40` - Lokale Zeit
- `2025-03-30 00:59:55` - Angenommen, die System-Zeitzone ist Europe/London (GMT): 5 Sekunden vor dem Sprung um eine Stunde auf 2 Uhr (Sommerzeit)
- `2025-04-27T12:40Z` - Setzt die lokale Entsprechung einer gegebenen UTC-Zeit
- `2025-04-27T12:40+1130` - Setzt die lokale Entsprechung einer Zeit mit dem Zeitzonen-Offset +11:30. Hinweis: Die tatsächliche Zeitzone wird dabei nicht geändert
- `2025-03-25T12:40:00.120` - Lokale Zeit mit Millisekunden
- `1731493140025` - UNIX-Zeitstempel

Diese Erweiterung ist Open-Source-Software unter der MIT-Lizenz.

Für Ideen, Fehlerberichte oder Beiträge zur Verbesserung von Time Travel bitte ein Issue auf [GitHub](https://github.com/cpulvermacher/time-travel) öffnen.
