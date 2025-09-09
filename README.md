# OrganizationTreeV2 - Kontrolka PCF Hierarchii Organizacyjnej

## Opis

Kontrolka PCF wyświetlająca interaktywną hierarchię organizacyjną z wykorzystaniem ReactFlow i Dagre. Umożliwia przeglądanie struktury organizacyjnej od CEO do pracowników produkcyjnych z możliwością otwierania ankiet dla każdego węzła.

## Funkcjonalności

### 🌳 **Wizualizacja Hierarchii**
- Interaktywny wykres organizacyjny w układzie drzewiastym
- Automatyczny layout z wykorzystaniem algorytmu Dagre
- Responsywne węzły z informacjami o pracownikach
- Zoom, panning i kontrolki nawigacyjne

### 👤 **Węzły Pracowników**
- Wyświetlanie nazwy, stanowiska i emaila
- Przycisk do otwierania ankiety dla każdej osoby
- Elegancki design z wykorzystaniem Fluent UI
- Różne stany wizualne (hover, aktywny)

### 🔍 **Filtrowanie**
- Widok pełnej hierarchii organizacyjnej
- Widok "Tylko mój zespół" dla managerów
- Dynamiczne przełączanie między widokami
- Informacje o aktualnym filtrze

### 🔗 **Integracja z Ankietami**
- Automatyczne łączenie URL ankiety z GUID pracownika
- Otwieranie ankiet w nowym oknie/zakładce
- Customizowalne URL ankiety przez właściwość kontrolki

## Architektura

### Komponenty

#### **OrganizationTree** (Główny komponent)
- Zarządza stanem całej hierarchii
- Obsługuje filtrowanie i layoutowanie
- Integruje ReactFlow z Fluent UI

#### **PersonNode** (Komponent węzła)
- Reprezentuje pojedynczą osobę w hierarchii
- Wyświetla kartę z danymi pracownika
- Obsługuje akcje (otwieranie ankiety)

### Serwisy

#### **OrganizationService**
- Budowanie struktury hierarchicznej z płaskich danych
- Filtrowanie danych według ról użytkownika
- Zarządzanie relacjami manager-podwładny

#### **LayoutService**
- Tworzenie layoutu z wykorzystaniem Dagre
- Pozycjonowanie węzłów i krawędzi
- Centrowanie i skalowanie widoku

### Typy i Interfejsy

```typescript
interface OrganizationPerson {
  id: string;
  name: string;
  position?: string;
  managerId?: string;
  email?: string;
  level?: number;
  children?: OrganizationPerson[];
}
```

## Konfiguracja

### Manifest (ControlManifest.Input.xml)

```xml
<!-- Właściwości -->
<property name="surveyUrl" display-name-key="Survey_URL" 
          description-key="URL for the survey" of-type="SingleLine.Text" 
          usage="input" required="true" />

<property name="currentUserId" display-name-key="Current_User_ID" 
          description-key="Current user ID for filtering" of-type="SingleLine.Text" 
          usage="input" required="false" />

<!-- Dataset dla danych organizacyjnych -->
<data-set name="organizationDataSet" display-name-key="Organization_Dataset">
  <property-set name="id" display-name-key="Record_ID" 
                description-key="Unique identifier" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="name" display-name-key="Person_Name" 
                description-key="Person's name" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="position" display-name-key="Position_Title" 
                description-key="Job position" of-type="SingleLine.Text" 
                usage="bound" required="false" />
  <property-set name="managerId" display-name-key="Manager_ID" 
                description-key="Manager's ID" of-type="SingleLine.Text" 
                usage="bound" required="false" />
  <property-set name="email" display-name-key="Email" 
                description-key="Email address" of-type="SingleLine.Text" 
                usage="bound" required="false" />
</data-set>
```

### Mapowanie Kolumn w Power Apps

1. **id** → GUID rekordu z tabeli 'Organization View'
2. **name** → Imię i nazwisko pracownika
3. **position** → Stanowisko
4. **managerId** → GUID managera (relacja do tego samego widoku)
5. **email** → Adres email

## Instalacja i Użycie

### 1. Kompilacja i Pakowanie

```bash
npm run build
pac pcf push --publisher-prefix yourprefix
```

### 2. Dodanie do Rozwiązania

1. Dodaj kontrolkę do rozwiązania Power Platform
2. Opublikuj rozwiązanie

### 3. Konfiguracja w Power Apps

#### W Formularzu 'Survey to populate':

1. Dodaj kontrolkę OrganizationTreeV2
2. Skonfiguruj właściwości:
   - **Survey URL**: URL bazowy ankiety (np. `https://forms.office.com/your-form`)
   - **Current User ID**: GUID aktualnego użytkownika
   - **Organization Dataset**: Widok 'Organization View'

3. Mapuj kolumny datasetu:
   - id → Unique Identifier
   - name → Full Name  
   - position → Job Title
   - managerId → Manager (Lookup)
   - email → Email

### 4. Struktura Tabeli 'Organization View'

```sql
CREATE VIEW [Organization View] AS
SELECT 
    employeeid as id,
    fullname as name,
    jobtitle as position,
    managerid as managerId,
    emailaddress as email
FROM employees
WHERE statuscode = 1  -- aktywni pracownicy
```

## Funkcje Zaawansowane

### Filtrowanie Hierarchii

Kontrolka automatycznie filtruje widok na podstawie `currentUserId`:

- **Brak currentUserId**: Pełna hierarchia
- **Z currentUserId**: Opcja "Tylko mój zespół" pokazuje hierarchię od tego użytkownika w dół

### Customowe URL Ankiet

URL ankiety jest automatycznie rozszerzany o parametr `personId`:

```
Oryginalny URL: https://forms.office.com/form123
Finalny URL: https://forms.office.com/form123?personId={GUID}
```

### Responsywność

- Automatyczne skalowanie dla różnych rozmiarów ekranu
- Minimalna szerokość węzła: 220px
- Minimalna wysokość węzła: 140px
- Responsywne odstępy i marginesy

## Zależności

### NPM Packages
```json
{
  "@fluentui/react-components": "9.46.2",
  "@fluentui/react-icons": "^2.0.239",
  "dagre": "^0.8.5",
  "@types/dagre": "^0.7.53",
  "reactflow": "^11.11.4",
  "react": "^17.0.2",
  "react-dom": "^17.0.2"
}
```

### Platform Libraries
- React 16.14.0
- Fluent UI 9.46.2

## Rozwiązywanie Problemów

### Problem: Brak danych w hierarchii
**Rozwiązanie**: Sprawdź mapowanie kolumn i upewnij się, że widok 'Organization View' zwraca dane

### Problem: Błędne relacje manager-podwładny
**Rozwiązanie**: Zweryfikuj poprawność wartości w kolumnie `managerId`

### Problem: Nie otwierają się ankiety
**Rozwiązanie**: Sprawdź konfigurację `surveyUrl` i upewnij się, że URL jest dostępny

### Problem: Kontrolka nie ładuje się
**Rozwiązanie**: Sprawdź czy wszystkie wymagane właściwości są skonfigurowane

## Roadmap

### Wersja przyszła może zawierać:
- [ ] Export hierarchii do PDF/Excel
- [ ] Wyszukiwanie pracowników
- [ ] Różne layouty (poziomy, kołowy)
- [ ] Animacje przejść
- [ ] Grupowanie według działów
- [ ] Statystyki zespołów

## Wsparcie

W przypadku problemów z kontrolką:
1. Sprawdź logi w Developer Tools przeglądarki
2. Zweryfikuj konfigurację datasetu
3. Upewnij się, że wszystkie zależności są poprawnie zainstalowane

---

*Stworzone z wykorzystaniem Power Platform PCF Framework, ReactFlow i Fluent UI*
