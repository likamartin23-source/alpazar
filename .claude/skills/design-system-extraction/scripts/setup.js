/* ============================================================================
 * Design system extractor. Paste this whole file into the console once.
 * Then call each step by name: x.stack(), x.tokens(), x.type() ...
 *
 * Every function takes (n = 0) as a pagination argument. If the output comes
 * back truncated, call it again with n = 1, then n = 2, and so on.
 * ========================================================================= */

window.x = (() => {

  const PAGE = 24;

  /* --- base ------------------------------------------------------------- */

  // Cross-origin sheets throw SecurityError on .cssRules. Without the
  // try/catch a single third-party sheet takes down the whole extraction.
  const rules = () => [...document.styleSheets].flatMap(s => {
    try { return [...s.cssRules] } catch { return [] }
  });

  // Flattens media queries while preserving each rule's condition
  const flat = () => rules().flatMap(r =>
    r.media ? [...r.cssRules].map(ir => ({ rule: ir, mq: r.conditionText }))
            : [{ rule: r, mq: null }]
  );

  // offsetParent null drops display:none and out-of-flow elements
  const vis = () => [...document.querySelectorAll('body *')]
    .filter(e => e.offsetParent !== null);

  const tally = (fn, limit = 12) => {
    const m = {};
    vis().forEach(e => { const v = fn(getComputedStyle(e), e); if (v) m[v] = (m[v] || 0) + 1 });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, limit);
  };

  const hex = s => {
    const m = String(s).match(/\d+/g);
    if (!m || /,\s*0\)$/.test(s)) return null;
    return '#' + m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
  };

  const fmt = pairs => pairs.map(([k, v]) => `${k}  (${v}x)`).join('\n');
  const page = (arr, n) => {
    const total = Math.ceil(arr.length / PAGE);
    const head = total > 1 ? `[page ${n + 1}/${total}, call with ${n + 1} for the next]\n` : '';
    return head + arr.slice(n * PAGE, (n + 1) * PAGE).join('\n');
  };

  /* --- 1. stack and libraries ------------------------------------------- */

  const stack = () => {
    const sig = {
      Webflow:     !!document.querySelector('[data-wf-page], .w-container'),
      Next:        !!window.__NEXT_DATA__ || !!document.querySelector('script[src*="/_next/"]'),
      Nuxt:        !!document.querySelector('#__nuxt'),
      Astro:       !!document.querySelector('astro-island'),
      SvelteKit:   !!document.querySelector('[data-sveltekit-preload-data]'),
      WordPress:   !!document.querySelector('link[href*="wp-content"]'),
      Shopify:     !!window.Shopify,
      Squarespace: !!window.Squarespace,
      Wix:         !!window.wixPerformanceMeasurements,
      CSSinJS:     !!document.querySelector('style[data-styled], style[data-emotion]'),
      Tailwind:    [...document.querySelectorAll('[class]')].some(e =>
        /(^|\s)(flex|grid|px-\d|py-\d|text-(xs|sm|base|lg|xl)|bg-\w+-\d{2,3})(\s|$)/
          .test(e.className.toString?.() || ''))
    };
    const libs = ['gsap','ScrollTrigger','Lenis','Swiper','Splide','AOS','barba',
                  'Alpine','jQuery','lottie','anime','motion','Webflow','htmx']
      .filter(k => window[k]);
    return JSON.stringify({
      stack: Object.entries(sig).filter(([, v]) => v).map(([k]) => k),
      libs,
      generator: [...document.querySelectorAll('meta[name="generator"]')].map(m => m.content),
      sheets: document.styleSheets.length,
      blocked: [...document.styleSheets].filter(s => { try { s.cssRules; return false } catch { return true } }).length
    }, null, 1);
  };

  /* --- 2. declared tokens ----------------------------------------------- */

  const tokens = (n = 0) => {
    const t = {};
    flat().filter(o => o.rule.style).forEach(o =>
      [...o.rule.style].filter(p => p.startsWith('--'))
        .forEach(p => { t[p] = o.rule.style.getPropertyValue(p).trim() })
    );
    const lines = Object.entries(t).map(([k, v]) => k.replace(/^--/, '') + ' = ' + v);
    return `${lines.length} declared tokens\n` + page(lines, n);
  };

  /* --- 3. typography ----------------------------------------------------- */

  const type = (n = 0) => {
    const base = [...new Set(flat()
      .filter(o => !o.mq && o.rule.selectorText && o.rule.style?.fontSize)
      .filter(o => /^(h[1-6]|body|p)$|^\.(heading-style-h[1-6]|text-size-[\w-]+|text-style-[\w-]+)$/
        .test(o.rule.selectorText.trim()))
      .map(o => `${o.rule.selectorText}  ${o.rule.style.fontSize} / lh ${o.rule.style.lineHeight || '-'} / w${o.rule.style.fontWeight || '-'}`))];

    const resp = [...new Set(flat()
      .filter(o => o.mq && o.rule.selectorText && o.rule.style?.fontSize)
      .filter(o => /^(h[1-6]|body)$/.test(o.rule.selectorText.trim()))
      .map(o => `@${o.mq}  ${o.rule.selectorText}  ${o.rule.style.fontSize}`))];

    const fam = [...new Set([...document.fonts].map(f => `${f.family} ${f.weight}`))];

    return page([
      '--- DECLARED SCALE ---', ...base,
      '', '--- RESPONSIVE OVERRIDES ---', ...resp,
      '', '--- LOADED FAMILIES ---', ...fam
    ], n);
  };

  /* --- 4. layout and spacing -------------------------------------------- */

  const layout = () => [
    '--- CONTAINER (look for the max-width repeated amid the 100% values) ---',
    fmt(tally(c => c.maxWidth !== 'none' ? c.maxWidth : null, 10)),
    '', '--- GRID ---',
    fmt(tally(c => c.display === 'grid'
      ? c.gridTemplateColumns.split(' ').length + ' cols, gap ' + c.gap : null, 10)),
    '', '--- FLEX GAP (reveals the base scale) ---',
    fmt(tally(c => c.display === 'flex' && c.gap !== 'normal' ? c.gap : null, 10)),
    '', '--- VERTICAL SECTION PADDING ---',
    fmt(tally((c, e) => e.tagName === 'SECTION' ? c.paddingTop + ' / ' + c.paddingBottom : null, 8)),
    '', '--- BREAKPOINTS ---',
    [...new Set(flat().map(o => o.mq).filter(Boolean))].join('\n')
  ].join('\n');

  /* --- 5. shape: radius, shadow, border, gradient ------------------------ */

  const shape = () => [
    '--- RADIUS ---',  fmt(tally(c => c.borderRadius !== '0px' ? c.borderRadius : null, 8)) || '(none)',
    '', '--- SHADOW ---', fmt(tally(c => c.boxShadow !== 'none' ? c.boxShadow : null, 6)) || '(NONE. Read references/interpretation.md, section "absence")',
    '', '--- GRADIENT ---', fmt(tally(c => c.backgroundImage.includes('gradient') ? c.backgroundImage.slice(0, 70) : null, 5)) || '(none)',
    '', '--- BORDER ---', fmt(tally(c => c.borderTopWidth !== '0px' ? c.borderTopWidth + ' ' + c.borderTopStyle : null, 5)) || '(none)',
    '', '--- UPPERCASE ---', fmt(tally(c => c.textTransform !== 'none' ? c.textTransform : null, 4)) || '(none)'
  ].join('\n');

  /* --- 6. computed color audit ------------------------------------------ */

  const colors = () => JSON.stringify({
    text: tally(c => hex(c.color), 10).map(([k, v]) => `${k} (${v})`),
    background: tally(c => hex(c.backgroundColor), 10).map(([k, v]) => `${k} (${v})`),
    border: tally(c => c.borderTopWidth !== '0px' ? hex(c.borderTopColor) : null, 6).map(([k, v]) => `${k} (${v})`)
  }, null, 1);

  /* --- 7. components ---------------------------------------------------- */

  // Looks up the class DEFINITION, not a sample from one element. Sampling
  // returns that instance with every contextual override already applied.
  const comp = (pattern = /\.(button|btn|card|chip|badge|input|tag|pill)/, n = 0) => {
    const lines = [...new Set(flat()
      .filter(o => !o.mq && o.rule.selectorText && pattern.test(o.rule.selectorText) && o.rule.style?.length)
      .map(o => `${o.rule.selectorText}\n    ${o.rule.style.cssText.slice(0, 200)}`))];
    return page(lines, n);
  };

  // States are half the personality of the system
  const states = (n = 0) => comp(/:hover|:focus|:active|:disabled|\[aria-|\[data-state/, n);

  /* --- 8. motion --------------------------------------------------------- */

  const motion = () => [
    '--- TRANSITIONS ---',
    [...new Set(vis().map(e => getComputedStyle(e).transition).filter(t => t && t !== 'all 0s ease 0s'))].slice(0, 10).join('\n') || '(none)',
    '', '--- ANIMATIONS ---',
    [...new Set(vis().map(e => getComputedStyle(e).animationName).filter(a => a && a !== 'none'))].slice(0, 8).join('\n') || '(none)',
    '', 'respects prefers-reduced-motion: ' +
      [...new Set(flat().map(o => o.mq).filter(Boolean))].some(m => m.includes('prefers-reduced-motion'))
  ].join('\n');

  /* --- 9. page structure ------------------------------------------------- */

  const map = () => 'HEIGHT ' + document.body.scrollHeight + 'px\n' +
    [...document.querySelectorAll('section, header, footer, main > div')]
      .filter(e => e.offsetHeight > 100)
      .map(e => `${e.tagName}.${(e.className || '').toString().slice(0, 38)} | top ${Math.round(e.getBoundingClientRect().top + scrollY)} | h ${e.offsetHeight} | bg ${getComputedStyle(e).backgroundColor}`)
      .join('\n');

  const heads = (n = 0) => page([...document.querySelectorAll('h1,h2,h3')]
    .map(h => h.tagName + ': ' + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 64)), n);

  // Instant scroll. With smooth behavior the screenshot lands mid-animation.
  const go = top => { window.scrollTo({ top, behavior: 'instant' }); return 'at ' + top };

  return { stack, tokens, type, layout, shape, colors, comp, states, motion, map, heads, go,
           _: { rules, flat, vis, tally, hex } };
})();

'ready. call x.stack() to begin'
