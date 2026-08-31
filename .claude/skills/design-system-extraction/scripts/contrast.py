#!/usr/bin/env python3
"""
WCAG 2.1 contrast validation for extracted tokens.

  python contrast.py "#fdaccd" "#000000"        one pair
  python contrast.py --ramp "#fdaccd"           full ramp from one color
  python contrast.py --audit tokens.json        matrix of every relevant pair

tokens.json format:
  {"ink": {"fg": "#111111", "muted": "#5e5e5e", "brand": "#b2245e"},
   "bg":  {"page": "#ffffff", "subtle": "#eeeeee", "inverse": "#111111"}}
"""
import sys, json, colorsys, argparse

AA_NORMAL, AA_LARGE, AA_NONTEXT = 4.5, 3.0, 3.0


def _lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def ratio(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def verdict(r):
    """Returns (label, ok_for_normal_text)."""
    if r >= 7.0:
        return "AAA", True
    if r >= AA_NORMAL:
        return "AA", True
    if r >= AA_LARGE:
        return "AA large / non-text", False
    return "FAIL", False


def to_hex(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360, l, s)
    return "#%02x%02x%02x" % (round(r * 255), round(g * 255), round(b * 255))


def to_hsl(hexstr):
    h = hexstr.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    return hh * 360, ss, ll


def cmd_pair(a, b):
    r = ratio(a, b)
    lab, _ = verdict(r)
    print(f"{a} on {b}: {r:.2f}:1  [{lab}]")
    print()
    for label, minimum in (("normal text", AA_NORMAL),
                           ("large text", AA_LARGE),
                           ("border and icon", AA_NONTEXT)):
        tag = f"{label} (min {minimum})"
        print(f"  {tag:<28}{'pass' if r >= minimum else 'FAIL'}")


def cmd_ramp(base):
    """Generates a 10-step ramp holding the hue, and measures each step."""
    h, s, l = to_hsl(base)
    print(f"anchor {base} -> HSL({h:.1f}, {s*100:.1f}%, {l*100:.1f}%)")
    print()
    steps = [(97, .90), (93, .92), (88, .94), (83, .95), (74, .88),
             (64, .78), (52, .70), (42, .66), (32, .62), (20, .55)]
    names = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]
    print(f"{'token':<10}{'hex':<10}{'vs #fff':>9}{'vs #000':>9}{'vs #111':>9}  suggested usage")
    for name, (L, S) in zip(names, steps):
        c = to_hex(h, S, L / 100)
        rw, rb, rd = ratio(c, "#ffffff"), ratio(c, "#000000"), ratio(c, "#111111")
        if rw >= AA_NORMAL:
            usage = "ink on light"
        elif rw >= AA_LARGE:
            usage = "border, icon on light"
        elif rb >= AA_NORMAL:
            usage = "background, with dark text on top"
        else:
            usage = "surface only"
        print(f"{name:<10}{c:<10}{rw:>8.2f}{rb:>9.2f}{rd:>9.2f}  {usage}")
    print()
    print("The lightest step reaching 4.5:1 against white is your 'brand-ink'.")


def cmd_audit(path):
    data = json.load(open(path))
    inks, bgs = data.get("ink", {}), data.get("bg", {})
    if not inks or not bgs:
        sys.exit("json needs the keys 'ink' and 'bg'")

    width = max(len(k) for k in inks) + 2
    print(" " * width + "".join(f"{k:>22}" for k in bgs))
    print(" " * width + "".join(f"{v:>22}" for v in bgs.values()))
    print("-" * (width + 22 * len(bgs)))

    failures = []
    for ink_name, ink_val in inks.items():
        line = f"{ink_name:<{width}}"
        for bg_name, bg_val in bgs.items():
            r = ratio(ink_val, bg_val)
            lab, ok = verdict(r)
            line += f"{f'{r:.2f} {lab}':>22}"
            if not ok:
                failures.append((ink_name, bg_name, r))
        print(line)

    print()
    if failures:
        print(f"{len(failures)} combinations fail for normal text:")
        for ink_name, bg_name, r in failures:
            print(f"  {ink_name} on {bg_name}: {r:.2f}:1")
        print()
        print("Fix: do not abandon the color, add a step. A color too light")
        print("for ink gets a darkened version and stays the color on backgrounds.")
        print("A color too mid for white text usually passes with black text.")
    else:
        print("Every combination passes AA for normal text.")


def main():
    p = argparse.ArgumentParser(add_help=True, description="WCAG 2.1 contrast")
    p.add_argument("colors", nargs="*", help="two hex values to compare")
    p.add_argument("--ramp", metavar="HEX", help="generates and measures a ramp")
    p.add_argument("--audit", metavar="JSON", help="ink x bg matrix")
    a = p.parse_args()

    if a.ramp:
        cmd_ramp(a.ramp)
    elif a.audit:
        cmd_audit(a.audit)
    elif len(a.colors) == 2:
        cmd_pair(*a.colors)
    else:
        p.print_help()


if __name__ == "__main__":
    main()
