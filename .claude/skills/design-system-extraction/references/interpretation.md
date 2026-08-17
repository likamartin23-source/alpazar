# Interpreting the results

Contents:
1. Absence is signal
2. The diff between declared and measured
3. From extraction to tokens
4. Contrast
5. Traps

---

## 1. Absence is signal

The most expensive mistake in this work is treating an empty result as a script failure.

When `x.shape()` returns `(NONE)` for shadow, that is not the extractor failing. It is the
most valuable finding it delivers. It means deliberate flat design, where separation
between surfaces comes from background color and border. Reimplementing that site with
subtle shadows "for depth" destroys the look, and it is the number one mistake people make
in this kind of work.

Record every absence you find explicitly in the output document:

| Absence | What it means for the reimplementation |
|---|---|
| Zero shadow | Flat design. Hierarchy through background color and border. Ban `box-shadow` |
| Zero gradient | Solid color. Ban gradients in backgrounds and buttons |
| Zero `text-transform` | Nothing uppercase. If there is an eyebrow, it stands out by size and weight |
| Zero `letter-spacing` | Typography at the font's natural tracking |
| A single brand color | Monochrome system over neutrals. A second color breaks it |
| Zero `prefers-reduced-motion` | The original is careless here. Do not copy it, add it |

These constraints go into the anti-patterns section of the output document. They are worth
more than the positive rules, because during code generation an agent tends to reintroduce
defaults the source system rejected on purpose.

---

## 2. The diff between declared and measured

Compare the output of `x.tokens()`, which is what the system **says** it is, against
`x.colors()`, which is what it **is**. They almost never match.

A real case, from a site declaring a clean nine-step neutral ramp:

| Declared | Measured in use |
|---|---|
| `#eeeeee` | `#f9f9f9`, `#ececec`, `#f6f5f8` |
| `#aaaaaa` | `#9a9a9a` |
| `#444444` | `#333333` |
| `#222222` | `#262626` |
| one brand color | three different oranges |

That is token drift: legacy code, a third-party component, a value hardcoded in a hurry.
It is invisible in use and it tells you two things.

**Build from the declared side, never from the measured side.** The declared side is the
designer's intent. The measured side includes the mistakes. Copying the measured side means
inheriting someone else's bug and then defending that bug in a code review.

**The amount of drift measures the system's maturity.** Little drift means good governance,
and the rest of the extraction is worth trusting. Heavy drift means the declared tokens may
be stale, and the most important values are worth checking against what is on screen.

If `x.tokens()` comes back with zero, you do not have the declared side. In that case group
the measured values by proximity and propose the ramp yourself, rounding to clean values.
Tell the user that this part is reconstruction, not extraction.

---

## 3. From extraction to tokens

A working order of operations:

1. **Primitives.** Color, font size, spacing unit. Raw values, no opinion about usage. They
   come almost directly from the extraction
2. **Semantics.** `bg-page`, `text-secondary`, `border-subtle`, `link`. This layer is what
   components consume, and it is what makes dark mode work without conditionals scattered
   through the code
3. **Components.** Defined entirely on top of the semantic layer

If a component needs a value that does not exist in the semantic layer, the right answer is
to add the token, not to hardcode the value in the component.

**On naming:** do not copy the source site's names. They carry another team's history and
vocabulary that is not yours. Rename to your own domain while keeping the step structure.

**On the spacing scale:** the gaps from `x.layout()` reveal the base. 4, 8, 12, 16, 24, 32
is a 4-scale. 5, 10, 20, 40 is a 5-scale. Odd values like `4.8px` are usually `em` rounding
and can be ignored.

**On the container:** it shows up as a `max-width` repeated ten or more times amid a lot of
`100%`. The repeated value is the one that matters.

**On breakpoints:** 991, 767 and 479 is a Webflow signature. 640, 768, 1024, 1280 is
Tailwind default. Idiosyncratic values indicate a hand-built system, and it is worth asking
why before copying.

---

## 4. Contrast

This is the step where extraction stops being copying and becomes engineering work.
Production systems violate contrast far more often than people assume, and reproducing that
without checking is reproducing a defect.

Run `scripts/contrast.py` in three modes:

```bash
python contrast.py "#fdaccd" "#ffffff"     # one pair
python contrast.py --ramp "#fdaccd"        # 10-step ramp, with suggested usage
python contrast.py --audit tokens.json     # ink x bg matrix, with a failure report
```

WCAG 2.1 AA minimums:

| Element | Minimum |
|---|---|
| Normal text, below 18.66px bold or 24px regular | 4.5:1 |
| Large text | 3:1 |
| Input border, informative icon, state indicator | 3:1 |
| Decorative or disabled text | no requirement |

Check at minimum: brand on white, brand on the darkest background, primary button text on
the primary button background, secondary text on every surface, and link on every surface.

**When something fails, the answer is almost never to abandon the color.** It is to add a
step:

- A brand color too light to serve as ink gets a darkened version for text, and stays the
  brand color on backgrounds
- A color too mid to carry white text often passes comfortably with black text, without
  touching the palette
- A color too light to carry any text is a **surface** color. That changes the system's
  architecture, and it is better discovered during extraction than during review

Tell the user when you find a violation in the original. It is information they probably do
not have, and it changes decisions.

---

## 5. Traps

**Sampling instead of counting.** `getComputedStyle` on an element gives you that element,
with every contextual override applied, not the system. Use `x.tally` or look up the class
definition with `x.comp()`.

**Extracting from desktop only.** Half the typographic decisions live inside media queries.
`x.type()` already brings the responsive overrides, but check that they showed up.

**Extracting from the home only.** The home is a showcase and usually has one-off components
that do not represent the system. Always run on at least two different pages.

**Trusting one representative element.** The first `h2` on the page may be a special case.
Compare against the class definition.

**Smooth scrolling before the screenshot.** Always `x.go(N)`, which uses `behavior:'instant'`,
and always with a two-second wait. Intersection Observer entrance animations need that time,
and without it you shoot the section at `opacity: 0`.

**Forgetting the states.** Hover, focus, disabled, error, loading and empty. The default
extraction only catches rest, and the other six are where the quality lives. Use
`x.states()`.

**Copying the naming along with it.** Structure yes, names no.

**Ignoring the blocked sheets.** `x.stack()` reports how many cross-origin sheets could not
be read. If that number is high, your token extraction is incomplete and you need to say so
rather than pretending the result is complete.
