# Refaktoryzacja stylów PersonNode - Separacja CSS-in-JS

## Cel refaktoryzacji
Przeniesienie definicji stylów CSS-in-JS z komponentu `PersonNode.tsx` do oddzielnego pliku stylów, zgodnie z wzorcem używanym w `OrganizationTree.tsx`.

## Zmiany

### 1. Utworzenie pliku PersonNode.styles.ts
Utworzono nowy plik `PersonNode.styles.ts` w folderze `components/nodes/` zawierający:
- Eksportowaną funkcję `usePersonNodeStyles()` z definicjami wszystkich stylów
- Import niezbędnych utilities z Fluent UI (`makeStyles`, `shorthands`, `tokens`)
- Wszystkie style przeniesione z komponentu głównego

### 2. Aktualizacja PersonNode.tsx
Wykonano następujące zmiany w komponencie:

**Usunięto importy CSS-in-JS utilities:**
```typescript
// PRZED
import {
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";

// PO
// Usunięto - nie są już potrzebne w komponencie
```

**Dodano import zewnętrznych stylów:**
```typescript
import { usePersonNodeStyles } from "./PersonNode.styles";
```

**Zmieniono wywołanie hook'a stylów:**
```typescript
// PRZED
const styles = useStyles();

// PO
const styles = usePersonNodeStyles();
```

**Usunięto wewnętrzną definicję stylów:**
Cała sekcja `const useStyles = makeStyles({...})` została usunięta z komponentu.

### 3. Optymalizacja inline styles
Zastąpiono duże inline styles CSS custom properties (CSS variables):

**PRZED:**
```tsx
style={{
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: indicatorConfig.style.backgroundColor,
  border: "none",
  display: "block",
  flexShrink: 0,
  boxSizing: "border-box",
  // ... więcej właściwości
}}
```

**PO:**
```tsx
style={{
  "--survey-indicator-bg": indicatorConfig.style.backgroundColor,
} as React.CSSProperties}
```

Z odpowiadającym CSS w pliku stylów:
```typescript
surveyIndicator: {
  backgroundColor: "var(--survey-indicator-bg, #EF4444)",
  // ... pozostałe właściwości przeniesione do CSS-in-JS
}
```

## Korzyści refaktoryzacji

### 1. **Separation of Concerns**
- Logika komponentu oddzielona od definicji stylów
- Lepsza organizacja kodu i czytelność
- Łatwiejsze zarządzanie stylami

### 2. **Konsystencja z wzorcem projektowym**
- Zgodność z podejściem używanym w `OrganizationTree`
- Jednolita struktura plików w projekcie
- Standaryzacja organizacji komponentów

### 3. **Lepsze performance**
- Redukcja rozmiaru komponentu głównego
- Stylowanie oddzielone od logiki renderowania
- Mniejsze inline styles - tylko dynamiczne właściwości

### 4. **Łatwiejsza konserwacja**
- Wszystkie style w jednym miejscu
- Łatwiejsze wprowadzanie zmian w wyglądzie
- Możliwość reużycia stylów w innych komponentach

### 5. **ESLint compliance**
- Eliminacja większości inline styles
- Zgodność z regułami czystego kodu
- Zmniejszenie ostrzeżeń o inline CSS

## Struktura plików po refaktoryzacji

```
components/nodes/
├── PersonNode.tsx           # Komponent główny (logika + JSX)
├── PersonNode.styles.ts     # Definicje stylów CSS-in-JS
└── PersonNode.logic.ts      # Funkcje pomocnicze
```

## Walidacja
- ✅ **Build przechodzi pomyślnie** - `npm run build` bez błędów
- ✅ **Brak błędów ESLint** - wszystkie style poprawnie przeniesione
- ✅ **Funkcjonalność zachowana** - wszystkie style działają jak wcześniej
- ✅ **Inline styles zminimalizowane** - tylko dynamiczne CSS variables

## Best Practices zastosowane
1. **Naming consistency** - `usePersonNodeStyles` vs `useOrganizationTreeStyles`
2. **File organization** - style obok komponentu w tym samym folderze
3. **Import structure** - style importowane bezpośrednio po React/UI libraries
4. **CSS Variables** - dla dynamicznych właściwości zamiast dużych inline objects
5. **TypeScript safety** - proper typing dla CSS custom properties

## Następne kroki
Ta refaktoryzacja stanowi wzorzec do zastosowania w innych komponentach projektu, które mogą mieć podobne problemy z organizacją stylów CSS-in-JS.
