# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Glamouröse Red-Carpet-Optik: tiefes Mitternacht als Bühne, Champagner-Gold als Akzent, elegante Serifen-Typografie und sanfte Übergänge – hochwertig wie eine Gala-Einladung, aber klar und ruhig genug für den täglichen Gebrauch.

## Colors

- `--color-bg`: **#0E0B10**
- `--color-surface`: **#17131B**
- `--color-surface_alt`: **#1E1923**
- `--color-fg`: **#F5EEDC**
- `--color-muted`: **#8A8194**
- `--color-accent`: **#C9A24B**
- `--color-accent_hover`: **#DDB96B**
- `--color-accent_active`: **#B08D3E**
- `--color-border`: **#3A3340**
- `--color-danger`: **#C25450**
- `--color-success`: **#7BA05B**
- `--color-overlay`: **rgba(14, 11, 16, 0.72)**

## Typography

- `font_family`: Didot, 'Bodoni MT', 'Playfair Display', Georgia, 'Times New Roman', serif
- `body_font_family`: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif
- `heading_weight`: 600
- `body_weight`: 400
- `size_scale`: 12px, 14px, 16px, 20px, 28px, 40px

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px
- `--space-7`: 64px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 16px
- `--radius-pill`: 999px

## Components

### Button

Primär: Hintergrund = accent (#C9A24B), Text = bg (#0E0B10), padding 12px/24px, radius md, min-height 48px (Touch-Ziel ≥44px), font-weight 600, letter-spacing 0.04em, transition 160ms ease; Hover = accent_hover; Active = accent_active; Disabled = opacity 0.45, kein Pointer-Event. Sekundär/Ghost: transparenter Hintergrund, 1px border in accent, Text accent, Hover = surface_alt. Danger: Hintergrund danger, Text #F5EEDC.

### Card

Hintergrund surface (#17131B), 1px border in border (#3A3340), radius lg, padding 24px, sanfter Schatten rgba(0,0,0,0.35); bei Hover border auf accent anheben, transition 160ms ease.

### Input

Hintergrund surface_alt (#1E1923), 1px border in border, radius md, padding 12px/16px, min-height 48px, Text fg; Fokus: border accent + dezenter Ring rgba(201,162,75,0.35); Fehlerzustand: border danger, darunter verständliche Fehlermeldung in danger, 14px.

### Navbar

Sticky oben, Hintergrund rgba(14,11,16,0.85) mit backdrop-filter blur(12px), 1px untere Border in border, Höhe 64px; Logo in Serifen-Schrift, Links 14px in muted, aktiver Link in accent.

### BildKachel

Quadratische Karte für Kleidungsstücke: Bild füllt Fläche (object-fit: cover), radius md, 1px border, 1:1-Seitenverhältnis; Name/Caption als Overlay am unteren Rand mit Verlauf von rgba(14,11,16,0) zu rgba(14,11,16,0.85), Text 14px fg.

### Badge/Kategorie

Pill-förmig, radius pill, padding 4px/12px, Hintergrund surface_alt, 1px border, Text 12px in muted; aktiver Filter: Hintergrund accent, Text bg, border accent.

### Modal

Overlay rgba(14,11,16,0.72), zentriert; Dialog Hintergrund surface, radius lg, padding 24px, max-width 520px, 1px border, Schatten; Schließen-Button oben rechts, min-target 44px.

### Footer

Hintergrund bg, obere 1px Border in border, padding 24px/0, Text 14px muted; Links zu Impressum und Datenschutz nebeneinander, hover in accent.

## Layout Principles

- Inhalte maximal 1200px breit, horizontal zentriert; auf Mobilgeräten 16px Seitenabstand, ab 768px 24px.
- Breakpoints: 640px (Mobil), 1024px (Tablet/Desktop); Navigation kollabiert unter 768px.
- Galerie-Grid: auto-fill mit minmax(180px, 1fr), Abstand 16px; Formulare max-width 480px.
- Abschnitte mit 48px vertikalem Abstand, innerhalb von Karten 16px Abstand zwischen Feldern.
- Visuelle Hierarchie: Serifen-Headlines, System-Sans für Fließtext und Bedienelemente; dezente Übergänge von 160ms für Hover- und Fokus-Zustände.
