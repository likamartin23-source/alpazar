# Adapting the extraction to the source stack

`x.stack()` tells you what the site was built with. That determines where the system is
stored and therefore which extraction strategy is worth the effort. Read only the section
matching the result.

---

## Webflow

Best case possible. First check whether the site uses Finsweet's **Client-First**
convention, the most common one in agency work. The signature is semantically named
utility classes:

```
container-large / container-medium / container-small
padding-global
padding-section-small / -medium / -large
heading-style-h1 ... h6
text-size-tiny / small / regular / medium / large
text-color-* / background-color-*
```

If those classes exist, the whole system is already named and translating it to Tailwind is
close to mechanical. Extract the definitions directly:

```js
x.comp(/^\.(container-|padding-|heading-style-|text-size-|text-color-|background-color-)/)
```

Webflow breakpoints are always 991, 767 and 479.

Watch out for one detail: Webflow generates a lot of combo classes (`.button.is-secondary`)
and the resulting CSS has high specificity. When reimplementing, solve that with component
variants rather than replicating the chaining.

---

## Tailwind

The utilities in the HTML already **are** the system, but the customizations live in a
`tailwind.config` or in an `@theme` block you cannot see directly.

Strategy: extract by computed frequency, then recognize Tailwind's default scale in the
values. Whatever **departs** from the default is customization, and that is exactly what
matters.

Tailwind default values, so you know what to ignore:

- Spacing: multiples of 0.25rem (4px)
- Font size: 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96, 128px
- Radius: 2, 4, 6, 8, 12, 16, 24px and `9999px`
- Breakpoints: 640, 768, 1024, 1280, 1536

A color that does not belong to Tailwind's default palette is a brand color. An 80px radius
is a design decision. A breakpoint at 991 means this is not pure Tailwind.

It is also worth scraping the most-used classes to infer the composition patterns:

```js
const c = {};
document.querySelectorAll('[class]').forEach(e =>
  String(e.className).split(/\s+/).filter(Boolean).forEach(k => c[k] = (c[k]||0)+1));
Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,40).map(([k,v])=>`${k} (${v})`).join('\n')
```

---

## CSS-in-JS: styled-components, Emotion, vanilla-extract

Hashed selectors help with nothing. Go a hundred percent by computed frequency with
`x.colors()`, `x.shape()` and `x.layout()`.

For components, visually identify one specimen on screen, grab its reference, and read the
computed styles of it and its children:

```js
const el = document.querySelector('SPECIMEN_SELECTOR');
[el, ...el.querySelectorAll('*')].map(n => {
  const c = getComputedStyle(n);
  return `${n.tagName}.${String(n.className).slice(0,30)} | ${c.fontSize} w${c.fontWeight} | ${c.color} | bg ${c.backgroundColor} | pad ${c.padding} | r ${c.borderRadius}`;
}).join('\n')
```

Accept that the extraction will be less precise. Say that to the user instead of delivering
false confidence.

---

## WordPress with a block theme

Before any script, look for `theme.json`:

```
/wp-content/themes/THEME-NAME/theme.json
```

It frequently contains the palette, type scale and spacing scale in structured form.
Sometimes it is the entire extraction in a single file, and you skip straight to
interpretation.

If the theme is classic, with no `theme.json`, treat it as a hand-rolled site.

---

## Shopify

Look for the theme settings in `window.Shopify` and in the `settings_data` files. Most
commercial themes expose colors and fonts as CSS variables on `:root`, so `x.tokens()`
usually does well.

Careful: much of what shows up on screen comes from third-party apps with their own CSS
that is not part of the system. Filter by what appears across several pages.

---

## Hand-rolled site, older CSS

There probably is no system. `x.tokens()` comes back empty and `x.colors()` shows dozens of
near-identical values with no grouping.

Here the work changes in kind: you are not extracting a system, you are **proposing** one
out of a mess. Group the measured values by proximity, round to a clean scale, and present
the regularization as part of the work.

Make explicit in the output document which values are extracted and which ones you
proposed. That distinction matters when someone questions a decision later.
