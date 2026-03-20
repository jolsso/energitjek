# Backlog

Items discovered during development and UX review. Ordered roughly by priority within each section.

---

## UX / UI

- **Mobile results title wraps awkwardly** — "Potentiale for Rådhuspladsen\n1" breaks the street number onto its own line. Fix: truncate the heading or show only the street name part.

- **Geocode requires a manual "Søg" click** — users filling the address field may not realise they need to press a separate button before calculating. Fix: trigger geocoding on Enter key press (already wired) _and_ consider adding a search icon to the button to make it more discoverable. Alternatively, auto-geocode after a debounce delay.

- **Payback chart opens with a negative message on first load** — with the 60k default investment and ~2362 kr/year savings the subtitle reads "betaler anlægget sig ikke tilbage inden for 25 år" immediately. Consider surfacing a softer framing ("Tilbagebetalingstid ca. X år") or a prompt to adjust the investment amount.

- **"Er du sunshine?" callout may leak into KPI grid on mobile** — the 6th slot in the results grid appears to show the verdict callout instead of a metric label at 390 px. Investigate and isolate the callout outside the KPI grid.

---

## Features

*(none yet)*

---

## Tech debt / Polish

*(none yet)*
