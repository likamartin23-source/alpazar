# design-system-extraction

Reverse-engineer a site's design system from its real CSS, not from a screenshot.

[![MIT License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Agent Skills compatible](https://img.shields.io/badge/agent%20skills-compatible-black)](https://github.com/vercel-labs/skills)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-skill-d97757)](https://code.claude.com/docs/en/skills)

An [agent skill](https://code.claude.com/docs/en/skills) for Claude Code, claude.ai and any
agent that reads `SKILL.md`.

It extracts the design system of an existing site by reading the CSS the browser actually
resolved, validates every contrast pair against WCAG, and returns an implementation guide
ready to drop into a coding-agent session.

Instead of squinting at a screenshot and guessing, you get the declared tokens, the type
scale with its responsive overrides, the container, the breakpoints, the radii, the
component states and the transitions. With the numbers that are in the CSS.

## Installation

**Via CLI, recommended.** Works with Claude Code, Cursor, opencode and the other agents
supported by [skills.sh](https://www.skills.sh).

```bash
npx skills add maiconlara/design-system-extraction
```

With no flag it installs into the current project only. With `-g` it applies across all of
your projects:

```bash
npx skills add -g maiconlara/design-system-extraction
```

To update later:

```bash
npx skills update design-system-extraction
```

**Via git, personal scope.** If you would rather version the skill yourself.

```bash
git clone https://github.com/maiconlara/design-system-extraction.git \
  ~/.claude/skills/design-system-extraction
```

Update with `git pull` inside the folder.

**Via git, project scope.** Useful when the whole team should have the skill.

```bash
git clone https://github.com/maiconlara/design-system-extraction.git \
  .claude/skills/design-system-extraction
```

In that case, commit the folder along with the project.

**claude.ai.** Zip the folder as `design-system-extraction.zip`, rename it to `.skill`, and
use the *Save skill* button when you open the file in a conversation.

## Usage

Nothing to invoke. Just write normally:

```
extract the design system from https://example.com and write me a guide
I want a site with the same visual feel as this one: example.com
what fonts and colors does this site use?
```

Portuguese prompts work the same way. To force it: `/design-system-extraction`.

## What you get

Eleven extractors run in the page console. `x.stack()` decides how everything else gets
read:

| Call | What it returns |
|---|---|
| `x.stack()` | Framework, libraries, how many stylesheets are blocked |
| `x.tokens()` | Declared custom properties. What the system *says* it is |
| `x.type()` | Type scale, responsive overrides, loaded families |
| `x.layout()` | Container, grids, gaps, section padding, breakpoints |
| `x.shape()` | Radius, shadow, gradient, border, uppercase |
| `x.colors()` | Computed color audit. What the system *is* |
| `x.comp()` / `x.states()` | Component definitions and their hover, focus, disabled states |
| `x.motion()` | Transitions, animations, whether reduced-motion is respected |

Then the contrast validator, standalone and usable outside the skill:

```bash
python scripts/contrast.py "#b2245e" "#ffffff"     # one pair
python scripts/contrast.py --ramp "#b2245e"        # 10-step ramp with suggested usage
python scripts/contrast.py --audit tokens.json     # ink x bg matrix with a failure report
```

The `--audit` mode takes a JSON shaped like this:

```json
{
  "ink": { "fg": "#111111", "muted": "#5e5e5e", "brand": "#b2245e" },
  "bg":  { "page": "#ffffff", "subtle": "#eeeeee", "inverse": "#111111" }
}
```

The output is a thirteen-section document, ordered for a coding agent rather than for
linear human reading. Two sections do the heavy lifting: **anti-patterns**, derived from
what the source system deliberately does *not* use, and an **acceptance checklist** with
objectively answerable items.

## Requirements

Browser access, through a Chrome extension or equivalent. Without it the skill still works,
but the agent will ask you to paste the scripts into DevTools yourself and hand back the
output.

`scripts/contrast.py` runs on Python 3 with no external dependencies.

## Structure

```
SKILL.md                      workflow, the only file always loaded
scripts/setup.js              extractors, pasted into the browser console
scripts/contrast.py           WCAG validator, three modes
references/by-stack.md        strategy per source stack
references/interpretation.md  how to read the results
assets/output-template.md     structure of the final document
```

Only `SKILL.md` enters the context window when the skill fires. The rest is read on demand.

## What this skill does not do

It does not copy sites. What gets extracted are measurements and composition patterns. So
images, proprietary icons, copy and product names stay out. If the result could be mistaken
for the original by someone on that team, it went too far.

## FAQ

**Why read the CSS instead of looking at a screenshot?**
A screenshot gives you an approximation of the rendered result. The CSS gives you the
system: the declared tokens, the responsive overrides hiding inside media queries, and the
component states you cannot see at rest. Roughly half of the typographic decisions on a
typical site live in a media query.

**Does it work on Webflow, Tailwind, WordPress, CSS-in-JS?**
Yes, with a different strategy for each, which is what `references/by-stack.md` is for.
Webflow is the best case because Client-First names the whole system. CSS-in-JS is the
worst because hashed selectors force everything through computed frequency, and the skill
tells you when precision drops instead of hiding it.

**What if the site has no design system?**
Then the work changes in kind: you are proposing one out of a mess rather than extracting
one. The skill handles that case and marks in the output which values were extracted and
which ones it proposed, because that distinction matters when someone questions a decision
later.

**Why does it flag contrast failures in the original?**
Because production systems violate WCAG more often than people expect, and reproducing a
site without checking means reproducing its accessibility defects. The fix is almost never
abandoning the color, it is adding a step to the ramp.

**Do I need the Chrome extension?**
No, but it is much faster. Without it, the agent hands you the scripts and you paste the
output back.

## License

[MIT](LICENSE) · Copyright (c) 2026 Maicon Lara
