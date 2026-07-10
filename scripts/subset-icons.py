import re, subprocess, os, glob

import os
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS=REPO+'/node_modules/@tabler/icons-webfont/dist/tabler-icons.min.css'
FONT=REPO+'/node_modules/@tabler/icons-webfont/dist/fonts/tabler-icons.woff2'
OUT_DIR=REPO+'/public/fonts'
os.makedirs(OUT_DIR, exist_ok=True)

# 1) Ikonat e perdorura realisht ne app/
used=set()
for f in glob.glob(REPO+'/app/**/*.tsx', recursive=True):
    for m in re.findall(r'ti ti-([a-z0-9-]+)', open(f, encoding='utf-8').read()):
        used.add(m)
print("Ikona te perdorura:", len(used))

# 2) Nga CSS: map ikon-name -> codepoint. Tabler CSS: .ti-photo:before{content:"\eb...";}
css=open(CSS, encoding='utf-8').read()
mapping={}
for name, hexcp in re.findall(r'\.ti-([a-z0-9-]+):before\{content:"\\([0-9a-fA-F]+)"', css):
    mapping[name]=hexcp
print("Mapime ne CSS:", len(mapping))

codepoints=[]
minimal_css_rules=[]
missing=[]
for name in sorted(used):
    cp=mapping.get(name)
    if cp:
        codepoints.append('U+'+cp)
        minimal_css_rules.append('.ti-%s::before{content:"\\%s"}' % (name, cp))
    else:
        missing.append(name)
print("Gjetur:", len(codepoints), "| Mungojne (jo-tabler ose alias):", missing[:10], "..." if len(missing)>10 else "")

# 3) Subset fontin
subset_font=OUT_DIR+'/tabler-subset.woff2'
subprocess.run(['pyftsubset', FONT,
  '--unicodes='+','.join(cp[2:] for cp in codepoints),
  '--flavor=woff2', '--output-file='+subset_font], check=True)
print("Font subset:", os.path.getsize(subset_font)//1024, "KB (nga", os.path.getsize(FONT)//1024, "KB)")

# 4) CSS minimal me @font-face qe pikon te fonti self-hosted
base_css='''@font-face{font-family:"tabler-icons";font-style:normal;font-weight:400;font-display:block;src:url("/fonts/tabler-subset.woff2") format("woff2")}
.ti{font-family:"tabler-icons"!important;font-weight:400;font-style:normal;font-variant:normal;text-transform:none;line-height:1;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;display:inline-block;speak:never}
'''
open(REPO+'/app/tabler-icons-subset.css','w',encoding='utf-8').write(base_css + '\n'.join(minimal_css_rules) + '\n')
print("CSS minimal:", (len(base_css)+sum(len(r) for r in minimal_css_rules))//1024, "KB (nga 205 KB)")
print("MISSING_FULL:", missing)
