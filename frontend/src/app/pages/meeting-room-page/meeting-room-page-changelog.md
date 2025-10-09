# Ändringslogg: Mötestranskribering

Denna fil dokumenterar de viktigaste ändringarna och förbättringarna för mötestranskriberingsfunktionen i InnoviaHub.

## Funktionella förbättringar

- **Kostnadsberäkning:**
  - Kostnaden för transkribering beräknas nu baserat på faktisk ljudlängd (sekunder) från inspelad eller uppladdad fil.
  - Om ingen giltig ljudlängd finns visas "-" istället för ett värde.

- **Stöd för uppladdade filer:**
  - Ljudlängd extraheras automatiskt från uppladdade filer (webm, wav, mp3).
  - Kostnadsberäkningen fungerar nu för både inspelade och uppladdade ljudfiler.

- **UI och användarupplevelse:**
  - Resultatsektionen visar beräknad kostnad, sammanfattning, att-göra-lista och råtext.
  - "Ladda ner text"-knapp för att spara transkriberingen som textfil.

## Teknisk implementation

- Duration för uppladdade filer hämtas via HTMLAudioElement och lagras i `uploadedFileDuration`.
- Kostnadsberäkningen använder `recordedAudio.duration` eller `uploadedFileDuration` beroende på typ av ljudkälla.
- Kod för filval, inspelning och uppladdning är separerad och tydligt kommenterad.

## Syfte med ändringarna

- Ge användaren en transparent och korrekt kostnadsuppskattning för varje transkribering.
- Förbättra användarupplevelsen och minska risken för missvisande information.
- Säkerställa att koden är enkel att underhålla och vidareutveckla.

---

Senast uppdaterad: 2025-10-09
