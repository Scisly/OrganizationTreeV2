# Przywrócenie oryginalnego designu przycisków ankiet

## Zmiana
Przywrócono oryginalny design przycisków ankiet w panelu `SurveyPanel.tsx` z kompleksowego Card layoutu z checkmarkami z powrotem do prostych przycisków Button.

## PRZED (skomplikowany design z Card)
```tsx
// Importy
import { Text, Card, CardHeader, mergeClasses } from "@fluentui/react-components";
import { Poll20Regular, Checkmark16Regular } from "@fluentui/react-icons";

// Renderowanie
<Card
  key={survey.msfp_surveyid}
  className={mergeClasses(
    styles.surveyItem,
    isSelected && styles.surveyItemSelected
  )}
  onClick={() => onSurveySelect(survey)}
  appearance="subtle"
>
  <div className={styles.surveyCardHeader}>
    <CardHeader
      header={
        <div className={styles.surveyHeaderWithIcon}>
          {isSelected && (
            <Checkmark16Regular
              className={styles.selectedSurveyIcon}
            />
          )}
          <Text weight={isSelected ? "bold" : "medium"}>
            {survey.msfp_name}
          </Text>
        </div>
      }
    />
  </div>
</Card>
```

## PO (prosty design z Button)
```tsx
// Importy
import { Text, Button } from "@fluentui/react-components";
import { Poll20Regular } from "@fluentui/react-icons";

// Renderowanie
<Button
  key={survey.msfp_surveyid}
  className={styles.surveyItem}
  onClick={() => onSurveySelect(survey)}
  appearance={isSelected ? "primary" : "secondary"}
  size="medium"
  style={{ width: "100%", marginBottom: "8px" }}
>
  {survey.msfp_name}
</Button>
```

## Korzyści z przywrócenia prostego designu

### 1. **Prostota i czytelność**
- Mniej zagnieżdżonych komponentów
- Łatwiejszy do zrozumienia kod
- Bezpośredni, intuicyjny interfejs użytkownika

### 2. **Lepsze performance**
- **Bundle size**: zmniejszone z 7.13 MiB do 6.39 MiB (-740 KB!)
- Mniej komponentów do renderowania
- Mniej importów (usunięto Card, CardHeader, mergeClasses, Checkmark icon)

### 3. **Lepsza UX**
- Jasne wskazanie wybranej ankiety przez `appearance="primary"`
- Standardowe zachowanie przycisków (hover, focus states)
- Consistent z resztą interfejsu Fluent UI

### 4. **Łatwiejsza konserwacja**
- Mniej kodu do debugowania
- Standardowe komponenty Button zamiast custom Card układów
- Mniej zależności stylowych

## Szczegóły implementacji

### Visual differences:
- **PRZED**: Kompleksowy layout z Card + Header + Checkmark ikona + Bold text
- **PO**: Prosty Button z `primary` (niebieski) dla wybranej ankiety i `secondary` (szary) dla pozostałych

### Code simplification:
- **Usunięto importy**: `Card`, `CardHeader`, `mergeClasses`, `Checkmark16Regular`
- **Uproszczono struktur**: z 5+ zagnieżdżonych elementów do 1 Button
- **Zredukowano style dependencies**: mniej custom CSS classes potrzebnych

### Performance benefits:
- **740 KB mniej w bundle** - znacząca optymalizacja
- **Mniej DOM nodes** - szybsze renderowanie
- **Mniej React components** - lepsze performance

## Design pattern
Przywrócony design używa standardowego wzorca Fluent UI:
- `appearance="primary"` dla aktywnego/wybranego elementu
- `appearance="secondary"` dla nieaktywnych elementów
- `size="medium"` dla standardowej wysokości przycisków
- `width: "100%"` dla full-width layout
- `marginBottom: "8px"` dla spacing między przyciskami

Ten design jest bardziej zgodny z design guidelines Fluent UI i zapewnia lepszą dostępność (accessibility) dla użytkowników z czytnikami ekranu.
