# Output document template

Copy this structure. It is built to become context for a coding-agent session, not to be
read by a human from start to finish.

Sections 12 and 13 pay off the most, and they are the ones people writing this kind of
document usually skip. Anti-patterns prevent drift during generation. The checklist gives
the agent an objective definition of "done" instead of letting it declare success on its
own.

---

```markdown
# Build guide: [PROJECT NAME]

Extracted from [URLs]. Values come from the real CSS, not from visual estimation.

## 0. How to use this document
Read it in full before the first line of code. Sections 3, 5 and 6 are normative.

## 1. Context and goal
What the site is, who it is for, and the single action it needs to provoke.
One sentence on the defining trait of the reference visual system.
One sentence on what we are NOT copying: logo, images, copy, name.

## 2. Stack and fixed decisions
Table of framework, language, styling, components, fonts, icons, forms,
theming and animation. One line justifying each non-obvious choice.

## 3. Design tokens
### 3.1 Colors
Primitives, semantics, and the light/dark map. Contrast ratios precomputed in the table.
### 3.2 Typography
Desktop scale and mobile scale in separate tables. Families and weights in use.
### 3.3 Spacing
Base scale, values in use, vertical section padding, global side padding.
### 3.4 Radius, border and shadow
Include the absences you found, explicitly.
### 3.5 Motion
Durations, curves, hover pattern, reveal pattern, reduced-motion.

## 4. Styling framework setup
The config block, ready to paste. Do not describe it, ship the code.

## 5. Layout system
Container, breakpoints with name and value, grids in use and how they collapse.

## 6. Components
One block per component, with variants in a table and every state.
Where there is a limitation (contrast, usage context), say it right there.

## 7. Page structure
One section per page, listing the blocks in order.

## 8. Folder structure
Annotated tree.

## 9. Code conventions
Verifiable rules. "No any" is verifiable. "Clean code" is not.

## 10. Accessibility
Declared target. The computed contrast ratios. The rules derived from them.
If the original violates something, record it and state that we are not reproducing it.

## 11. Performance
Numeric targets. Without a number it is not a target.

## 12. Anti-patterns
List of what breaks the system. Derive it from the absences in section 3.4 and
the constraints in section 3. Write them as "if this shows up, it is wrong".

## 13. Acceptance checklist
Verifiable boxes, grouped by build, visual, responsive, theming,
accessibility and content. Every item needs an objective answer.
```

---

## Notes on each hard part

**Section 3.1.** If the extraction found semantic tokens in the original, copy their
structure. If it did not, you need to invent the semantic layer, and it is what makes dark
mode work. Do not skip it.

**Section 6.** The temptation is to list props. What helps more is listing variants with the
rest value, the hover value and the resulting contrast ratio. And recording usage limitations
where they exist, like "this variant disappears on gray backgrounds, use the other one there".

**Section 12.** Write in the form "if X shows up in the result, it is wrong". Negative,
verifiable phrasing works better than positive principles.

**Section 13.** Every item needs an objective answer. "Layout looks good" does not work. "No
horizontal scroll at 375, 768, 992 and 1440px" does.
