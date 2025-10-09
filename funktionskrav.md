# Kravinsamling – AI-transkriberingstjänst  

(Innovia Hub)

## Datakälla – Uppladdad ljudfil (Testläge)

## Syfte

Under prototypfasen ska AI-transkriberingen kunna testas med **uppladdade ljudfiler** istället för liveinspelning.  
Detta gör att systemet kan bearbeta verkliga ljudklipp och generera transkriberingar utan att mötesrummen behöver vara fullt implementerade.

---

## Funktionellt flöde

1. **Uppladdning**
   - Användare (mötesledare eller admin) kan ladda upp en ljudfil i format `.wav` eller `.mp3`.
   - Filen kopplas till ett fiktivt mötes-ID.
   - Filen lagras temporärt i servern eller i ett test-blob-storage.

2. **Bearbetning**
   - Filen skickas till AI-transkriberingsmodell (t.ex. OpenAI Whisper API).
   - Textresultatet sparas i databasen tillsammans med metadata:
     - Filnamn  
     - Tidsstämpel  
     - Användare som laddade upp filen  

3. **Generering av resultat**
   - AI-modellen skapar:
     - Transkriberad text  
     - Sammanfattning  
     - Identifierade åtgärdspunkter  

4. **Presentation**
   - Resultatet visas i gränssnittet på samma sätt som vid simulerad data.
   - Deltagare ser sammanfattning, mötesledare ser full transkribering.

---

## Begränsningar i testläge

- Ingen realtidsinspelning via mikrofon.  
- Samtyckeslogik hanteras som UI-flöde (ej faktiska personer).  
- Uppladdade filer tas bort automatiskt efter bearbetning.  

---

## Fördel

- Ger realistiska testdata.  
- Möjliggör utveckling av full AI-pipeline (uppladdning → transkribering → sammanfattning) innan live-möten implementeras.

Version av Open AI: Whisper till en kostnad på 0.006 $ per minut.
