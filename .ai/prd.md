# Dokument wymagań produktu (PRD) – 10x-cards

## 1. Przegląd produktu
Projekt 10x-cards ma na celu umożliwienie użytkownikom szybkiego tworzenia i zarządzania zestawami fiszek edukacyjnych. Aplikacja wykorzystuje modele LLM (poprzez API) do generowania sugestii fiszek na podstawie dostarczonego tekstu.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek wymaga dużych nakładów czasu i wysiłku, co zniechęca do korzystania z efektywnej metody nauki, jaką jest spaced repetition. Celem rozwiązania jest skrócenie czasu potrzebnego na tworzenie odpowiednich pytań i odpowiedzi oraz uproszczenie procesu zarządzania materiałem do nauki.

## 3. Wymagania funkcjonalne
1. Automatyczne generowanie fiszek:
   - Użytkownik wkleja dowolny tekst (np. fragment podręcznika).
   - Aplikacja wysyła tekst do modelu LLM za pośrednictwem API.
   - Model LLM proponuje zestaw fiszek (pytania i odpowiedzi).
   - Fiszki są przedstawiane użytkownikowi w formie listy z możliwością akceptacji, edycji lub odrzucenia.

2. Ręczne tworzenie i zarządzanie fiszkami:
   - Formularz do ręcznego tworzenia fiszek (przód i tył fiszki).
   - Opcje edycji i usuwania istniejących fiszek.
   - Ręczne tworzenie i wyświetlanie w ramach widoku listy "Moje fiszki"

3. Podstawowy system uwierzytelniania i kont użytkowników:
   - Rejestracja i logowanie.
   - Możliwość usunięcia konta i powiązanych fiszek na życzenie.

4. Integracja z algorytmem powtórek:
   - Zapewnienie mechanizmu przypisywania fiszek do harmonogramu powtórek (korzystanie z gotowego algorytmu).
   - Brak dodatkowych metadanych i zaawansowanych funkcji powiadomień w MVP.

5. Przechowywanie i skalowalność:
   - Dane o fiszkach i użytkownikach przechowywane w sposób zapewniający skalowalność i bezpieczeństwo.

6. Statystyki generowania fiszek:
   - Zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.

7. Wymagania prawne i ograniczenia:
   - Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO.
   - Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) na wniosek użytkownika.

## 4. Granice produktu
1. Poza zakresem MVP:
   - Zaawansowany, własny algorytm powtórek (korzystamy z gotowego rozwiązania, biblioteki open-source).
   - Mechanizmy gamifikacji.
   - Aplikacje mobilne (obecnie tylko wersja web).
   - Import wielu formatów dokumentów (PDF, DOCX itp.).
   - Publicznie dostępne API.
   - Współdzielenie fiszek między użytkownikami.
   - Rozbudowany system powiadomień.
   - Zaawansowane wyszukiwanie fiszek po słowach kluczowych.

## 5. Historyjki użytkowników

ID: US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę się zarejestrować, aby mieć dostęp do własnych fiszek i móc korzystać z generowania fiszek przez AI.
Kryteria akceptacji:
- Formularz rejestracyjny zawiera pola na adres e-mail i hasło.
- Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane.
- Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany.

ID: US-002
Tytuł: Logowanie do aplikacji
Opis: Jako zarejestrowany użytkownik chcę móc się zalogować, aby mieć dostęp do moich fiszek i historii generowania.
Kryteria akceptacji:
- Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany do widoku generowania fiszek.
- Błędne dane logowania wyświetlają komunikat o nieprawidłowych danych.
- Dane dotyczące logowania przechowywane są w bezpieczny sposób.

ID: US-003
Tytuł: Generowanie fiszek przy użyciu AI
Opis: Jako zalogowany użytkownik chcę wkleić kawałek tekstu i za pomocą przycisku wygenerować propozycje fiszek, aby zaoszczędzić czas na ręcznym tworzeniu pytań i odpowiedzi.
Kryteria akceptacji:
- W widoku generowania fiszek znajduje się pole tekstowe, w którym użytkownik może wkleić swój tekst.
- Pole tekstowe oczekuje od 1000 do 10 000 znaków.
- Po kliknięciu przycisku generowania aplikacja komunikuje się z API modelu LLM i wyświetla listę wygenerowanych propozycji fiszek do akceptacji przez użytkownika.
- W przypadku problemów z API lub braku odpowiedzi modelu użytkownik zobaczy stosowny komunikat o błędzie.

ID: US-004
Tytuł: Przegląd i zatwierdzanie propozycji fiszek
Opis: Jako zalogowany użytkownik chcę móc przeglądać wygenerowane fiszki i decydować, które z nich chcę dodać do mojego zestawu, aby zachować tylko przydatne pytania i odpowiedzi.
Kryteria akceptacji:
- Lista wygenerowanych fiszek jest wyświetlana pod formularzem generowania.
- Przy każdej fiszce znajduje się przycisk pozwalający na jej zatwierdzenie, edycję lub odrzucenie.
- Po zatwierdzeniu wybranych fiszek użytkownik może kliknąć przycisk zapisu i dodać je do bazy danych.

ID: US-005
Tytuł: Edycja fiszek utworzonych ręcznie i generowanych przez AI
Opis: Jako zalogowany użytkownik chcę edytować stworzone lub wygenerowane fiszki, aby poprawić ewentualne błędy lub dostosować pytania i odpowiedzi do własnych potrzeb.
Kryteria akceptacji:
- Istnieje lista zapisanych fiszek (zarówno ręcznie tworzonych, jak i zatwierdzonych wygenerowanych).
- Każdą fiszkę można kliknąć i wejść w tryb edycji.
- Zmiany są zapisywane w bazie danych po zatwierdzeniu.

ID: US-006
Tytuł: Usuwanie fiszek
Opis: Jako zalogowany użytkownik chcę usuwać zbędne fiszki, aby zachować porządek w moim zestawie.
Kryteria akceptacji:
- Przy każdej fiszce na liście (w widoku "Moje fiszki") widoczna jest opcja usunięcia.
- Po wybraniu usuwania użytkownik musi potwierdzić operację, zanim fiszka zostanie trwale usunięta.
- Fiszki zostają trwale usunięte z bazy danych po potwierdzeniu.

ID: US-007
Tytuł: Ręczne tworzenie fiszek
Opis: Jako zalogowany użytkownik chcę ręcznie stworzyć fiszkę (określając przód i tył fiszki), aby dodawać własny materiał, który nie pochodzi z automatycznie generowanych treści.
Kryteria akceptacji:
- W widoku "Moje fiszki" znajduje się przycisk dodania nowej fiszki.
- Naciśnięcie przycisku otwiera formularz z polami "Przód" i "Tył".
- Po zapisaniu nowa fiszka pojawia się na liście.

ID: US-008
Tytuł: Sesja nauki z algorytmem powtórek
Opis: Jako zalogowany użytkownik chcę, aby dodane fiszki były dostępne w widoku "Sesja nauki" opartym na zewnętrznym algorytmie, aby móc efektywnie się uczyć (spaced repetition).
Kryteria akceptacji:
- W widoku "Sesja nauki" algorytm przygotowuje dla mnie sesję nauki fiszek
- Na start wyświetlany jest przód fiszki, poprzez interakcję użytkownik wyświetla jej tył
- Użytkownik ocenia zgodnie z oczekiwaniami algorytmu na ile przyswoił fiszkę
- Następnie algorytm pokazuje kolejną fiszkę w ramach sesji nauki

ID: US-009
Tytuł: Bezpieczny dostęp i autoryzacja
Opis: Jako zalogowany użytkownik chcę mieć pewność, że moje fiszki nie są dostępne dla innych użytkowników, aby zachować prywatność i bezpieczeństwo danych.
Kryteria akceptacji:
- Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje fiszki.
- Nie ma dostępu do fiszek innych użytkowników ani możliwości współdzielenia.

## 6. Metryki sukcesu
1. Efektywność generowania fiszek:
   - 75% wygenerowanych przez AI fiszek jest akceptowanych przez użytkownika.
   - Użytkownicy tworzą co najmniej 75% fiszek z wykorzystaniem AI (w stosunku do wszystkich nowo dodanych fiszek).
3. Zaangażowanie:
   - Monitorowanie liczby wygenerowanych fiszek i porównanie z liczbą zatwierdzonych do analizy jakości i użyteczności.
