# OrganizationTreeV2 - Kontrolka PCF Hierarchii Organizacyjnej z Integracją Ankiet

## Opis

Zaawansowana kontrolka PCF wyświetlająca interaktywną hierarchię organizacyjną z pełną integracją systemu ankiet. Wykorzystuje ReactFlow, Dagre i @codaworks/react-glow do tworzenia profesjonalnego interfejsu z wizualnymi wskaźnikami statusu ankiet.

## Funkcjonalności

### 🌳 **Wizualizacja Hierarchii**
- Interaktywny wykres organizacyjny w układzie drzewiastym
- Automatyczny layout z wykorzystaniem algorytmu Dagre
- Responsywne węzły z informacjami o pracownikach
- Zoom, panning i kontrolki nawigacyjne ReactFlow

### 👤 **Inteligentne Węzły Pracowników**
- **Wizualne wskaźniki statusu ankiet:**
  - 🟢 **Zielony wskaźnik z efektem glow** - pracownik odpowiedział na ankietę
  - 🔴 **Czerwony wskaźnik z efektem glow** - pracownik nie odpowiedział na ankietę
  - ⚪ **Standardowa ikona osoby** - pracownik spoza zespołu użytkownika
- Wyświetlanie nazwy, stanowiska i emaila
- **Inteligentne przyciski akcji:**
  - "Otwórz ankietę" - dla osób bez odpowiedzi
  - "Wyświetl odpowiedzi" - dla osób z zapisanymi odpowiedziami
- Tooltips z informacjami o statusie ankiety

### 🔍 **Filtrowanie i Zarządzanie Zespołem**
- Widok pełnej hierarchii organizacyjnej
- Widok "Tylko mój zespół" dla managerów z automatyczną detekcją
- Dynamiczne przełączanie między widokami
- Wskaźniki i przyciski ankiet tylko dla członków zespołu

### � **Podwójna Integracja Dataset**
- **Dataset organizacyjny**: Struktura hierarchii pracowników
- **Dataset odpowiedzi**: Zapisane odpowiedzi z ankiet
- Automatyczne łączenie danych na podstawie survey_id i person_id
- Real-time aktualizacja statusów po wypełnieniu ankiet

### ✨ **Efekty Wizualne**
- Profesjonalne efekty glow z biblioteki @codaworks/react-glow
- Fluent UI 9 design system dla spójnego wyglądu
- Responsywne animacje i przejścia
- Overridy CSS dla pełnej kontroli nad wyglądem

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

interface SurveyResponse {
  id: string;
  person_id: string;
  survey_id: string;
  responseUrl: string;
  submittedDate?: Date;
}

interface PersonNodeData {
  person: OrganizationPerson;
  surveyUrl: string;
  onSurveyClick: (personId: string) => void;
  onResponseClick?: (responseUrl: string) => void;
  surveyResponse?: SurveyResponse;
  userId?: string;
  fullHierarchy: OrganizationPerson[];
  allPeople?: OrganizationPerson[];
  showSurveyButton?: boolean;
}
```

## Konfiguracja

### Manifest (ControlManifest.Input.xml)

```xml
<!-- Właściwości -->
<property name="surveyUrl" display-name-key="Survey_URL" 
          description-key="URL for the survey" of-type="SingleLine.Text" 
          usage="input" required="true" />

<property name="surveyId" display-name-key="Survey_ID" 
          description-key="Unique identifier for the survey" of-type="SingleLine.Text" 
          usage="input" required="true" />

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

<!-- Dataset dla odpowiedzi z ankiet -->
<data-set name="surveyResponsesDataSet" display-name-key="Survey_Responses_Dataset">
  <property-set name="id" display-name-key="Response_ID" 
                description-key="Unique identifier for response" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="person_id" display-name-key="Person_ID" 
                description-key="ID of person who responded" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="survey_id" display-name-key="Survey_ID_Field" 
                description-key="Survey identifier" of-type="SingleLine.Text" 
                usage="bound" required="true" />
  <property-set name="responseUrl" display-name-key="Response_URL" 
                description-key="URL to view the response" of-type="SingleLine.Text" 
                usage="bound" required="true" />
</data-set>
``` 
                description-key="Email address" of-type="SingleLine.Text" 
                usage="bound" required="false" />
</data-set>
```

### Mapowanie Kolumn w Power Apps

#### Dataset Organizacyjny (organizationDataSet)
1. **id** → GUID rekordu z tabeli pracowników
2. **name** → Imię i nazwisko pracownika
3. **position** → Stanowisko
4. **managerId** → GUID managera (relacja do tego samego widoku)
5. **email** → Adres email

#### Dataset Odpowiedzi (surveyResponsesDataSet)
1. **id** → GUID rekordu odpowiedzi
2. **person_id** → GUID osoby (foreign key do organizationDataSet)
3. **survey_id** → Identyfikator ankiety (musi pasować do właściwości surveyId)
4. **responseUrl** → URL do przeglądania odpowiedzi

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

#### W Formularzu z kontrolką OrganizationTreeV2:

1. Dodaj kontrolkę OrganizationTreeV2
2. Skonfiguruj właściwości:
   - **Survey URL**: URL bazowy ankiety (np. `https://forms.office.com/your-form`)
   - **Survey ID**: Unikalny identyfikator ankiety
   - **Organization Dataset**: Widok pracowników organizacji
   - **Survey Responses Dataset**: Widok odpowiedzi z ankiet

3. Mapuj kolumny datasetów zgodnie z sekcją "Mapowanie Kolumn"

### 4. Struktura Tabel

#### Tabela Pracowników (Organization)
```sql
CREATE VIEW [Organization_View] AS
SELECT 
    employeeid as id,
    fullname as name,
    jobtitle as position,
    managerid as managerId,
    emailaddress as email
FROM employees
WHERE statuscode = 1  -- aktywni pracownicy
```

#### Tabela Odpowiedzi Ankiet (Survey_Responses)
```sql
CREATE VIEW [Survey_Responses_View] AS
SELECT 
    responseid as id,
    person_id,
    survey_id,
    response_url as responseUrl
FROM survey_responses
WHERE statuscode = 1  -- aktywne odpowiedzi
```

## Funkcje Zaawansowane

### Filtrowanie Hierarchii

Kontrolka automatycznie wykrywa zespół użytkownika na podstawie `context.userSettings.userId`:

- **Widok "Wszyscy"**: Pełna hierarchia organizacyjna
- **Widok "Tylko mój zespół"**: Hierarchia od aktualnego użytkownika w dół (jego podwładni)
- **Wskaźniki ankiet**: Wyświetlane tylko dla członków zespołu użytkownika
- **Przyciski akcji**: Dostępne tylko dla członków zespołu

### Integracja z Systemem Ankiet

#### Automatyczne Łączenie Danych
- System automatycznie łączy dane z organizationDataSet i surveyResponsesDataSet
- Łączenie odbywa się przez person_id w odpowiedziach i id w danych organizacyjnych
- Filtrowanie po survey_id zapewnia wyświetlanie odpowiedzi dla właściwej ankiety

#### URL Ankiety
URL ankiety jest automatycznie rozszerzany o parametr `personId`:

```
Oryginalny URL: https://forms.office.com/form123
Finalny URL: https://forms.office.com/form123?personId={GUID}
```

#### Statusy Wizualne
- **Zielony wskaźnik**: Znaleziono odpowiedź dla osoby w surveyResponsesDataSet
- **Czerwony wskaźnik**: Brak odpowiedzi dla osoby w surveyResponsesDataSet
- **Brak wskaźnika**: Osoba spoza zespołu aktualnego użytkownika

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
  "@codaworks/react-glow": "^1.0.6",
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
**Rozwiązanie**: Sprawdź mapowanie kolumn i upewnij się, że widok organizacyjny zwraca dane

### Problem: Błędne relacje manager-podwładny
**Rozwiązanie**: Zweryfikuj poprawność wartości w kolumnie `managerId`

### Problem: Nie wyświetlają się wskaźniki ankiet
**Rozwiązanie**: 
- Sprawdź konfigurację `surveyResponsesDataSet`
- Upewnij się, że `survey_id` w odpowiedziach pasuje do właściwości `surveyId`
- Zweryfikuj mapowanie kolumn w datasecie odpowiedzi

### Problem: Wskaźniki są kwadratowe zamiast okrągłe
**Rozwiązanie**: Problem CSS - sprawdź czy style Fluent UI nie nadpisują `borderRadius`

### Problem: Nie działają efekty glow
**Rozwiązanie**: 
- Sprawdź czy biblioteka `@codaworks/react-glow` jest zainstalowana
- Upewnij się, że komponenty `GlowCapture` i `Glow` są poprawnie renderowane

### Problem: Nie otwierają się ankiety
**Rozwiązanie**: Sprawdź konfigurację `surveyUrl` i upewnij się, że URL jest dostępny

### Problem: "Wyświetl odpowiedzi" nie działa
**Rozwiązanie**: Sprawdź czy `responseUrl` w datasecie odpowiedzi zawiera poprawne URL-e

### Problem: Kontrolka nie ładuje się
**Rozwiązanie**: Sprawdź czy wszystkie wymagane właściwości są skonfigurowane (surveyUrl, surveyId, oba datasety)

## Roadmap

### Planowane funkcjonalności:
- [ ] Export hierarchii do PDF/Excel z danymi ankiet
- [ ] Wyszukiwanie pracowników z filtrowaniem po statusie ankiety
- [ ] Różne layouty (poziomy, kołowy, radialny)
- [ ] Animacje przejść między statusami ankiet
- [ ] Grupowanie według działów z agregatami odpowiedzi
- [ ] Statystyki zespołów i wskaźniki wypełnienia ankiet
- [ ] Powiadomienia push o nowych ankietach
- [ ] Integracja z Power BI dla dashboardów
- [ ] Bulk actions (masowe wysyłanie ankiet)
- [ ] Custom templates dla różnych typów ankiet

## Nowe Funkcjonalności v2.0

### ✅ **Zaimplementowane w aktualnej wersji:**
- **Podwójne datasety** - organizacja + odpowiedzi
- **Wizualne wskaźniki statusu** z efektami glow
- **Inteligentne przyciski akcji** (ankieta vs odpowiedzi)
- **Automatyczna detekcja zespołu** użytkownika
- **Real-time łączenie danych** między datasetami
- **Professional UI** z @codaworks/react-glow

### 🔄 **W trakcie optymalizacji:**
- **Performance** dla dużych organizacji (>500 osób)
- **CSS overrides** dla pełnej kompatybilności z Fluent UI
- **Error handling** dla niepoprawnych danych

## Wsparcie

W przypadku problemów z kontrolką:
1. Sprawdź logi w Developer Tools przeglądarki
2. Zweryfikuj konfigurację datasetu
3. Upewnij się, że wszystkie zależności są poprawnie zainstalowane

---

## Changelog

### v2.0.0 (2024-09-09)
- ✅ **MAJOR**: Dodano drugi dataset dla odpowiedzi z ankiet
- ✅ **FEATURE**: Wizualne wskaźniki statusu ankiet z efektami glow
- ✅ **FEATURE**: Inteligentne przyciski - "Otwórz ankietę" vs "Wyświetl odpowiedzi"
- ✅ **FEATURE**: Automatyczna detekcja zespołu użytkownika
- ✅ **IMPROVEMENT**: Zastąpiono ikony PersonCircle wskaźnikami ankiet
- ✅ **TECH**: Integracja z @codaworks/react-glow
- ✅ **TECH**: Rozszerzono TypeScript interfaces
- 🗑️ **CLEANUP**: Usunięto niepotrzebny plik HelloWorld.tsx

### v1.0.0 (2024-08-XX)
- ✅ Podstawowa hierarchia organizacyjna
- ✅ ReactFlow + Dagre layout
- ✅ Fluent UI design system
- ✅ Pojedynczy dataset organizacyjny
- ✅ Podstawowe przyciski ankiet

*Stworzone z wykorzystaniem Power Platform PCF Framework, ReactFlow, Fluent UI i @codaworks/react-glow*
