import sys
P='app/admin/tabs/QueueTab.tsx'
s=open(P,encoding='utf-8').read()
if 'DosjaLigjore' in s:
    print('tashme e lidhur'); sys.exit(0)

def zev(o,n):
    global s
    if s.count(o)<1: sys.exit('NUK U GJET: %r' % o[:70])
    s=s.replace(o,n,1)

zev("import { supabase } from '../../../lib/supabase'",
    "import { supabase } from '../../../lib/supabase'\nimport { DosjaLigjore } from './DosjaLigjore'")

zev("  const [arsyetimi, setArsyetimi] = useState('')",
    "  const [arsyetimi, setArsyetimi] = useState('')\n  const [dosja, setDosja] = useState('')")

# butoni ne rreshtat e radhes qe jane ligjore dhe kane shpallje
zev("""                    <button type="button" className="edit-btn"
                      onClick={() => { setHap(hap === r.id ? '' : r.id); setArsyetimi(''); setErr('') }}>
                      {hap === r.id ? 'Mbyll' : 'Vendos'}
                    </button>""",
    """                    <button type="button" className="edit-btn"
                      onClick={() => { setHap(hap === r.id ? '' : r.id); setArsyetimi(''); setErr('') }}>
                      {hap === r.id ? 'Mbyll' : 'Vendos'}
                    </button>
                    {ligjore && (() => {
                      const nj = njoftime.find((n: any) => n.shpallja?.id === l?.id) || null
                      return nj ? (
                        <button type="button" className="edit-btn"
                          style={{ borderColor: '#C9A227', color: '#8A6D1F' }}
                          onClick={() => setDosja(nj.id)}>
                          Dosja ligjore
                        </button>
                      ) : null
                    })()}""")

# butoni te njoftimet pa shpallje
zev("""                <button type="button" className="edit-btn"
                  onClick={() => { setHap(hap === n.id ? '' : n.id); setArsyetimi(''); setErr('') }}>
                  {hap === n.id ? 'Mbyll' : 'Vendos'}
                </button>""",
    """                <button type="button" className="edit-btn"
                  onClick={() => { setHap(hap === n.id ? '' : n.id); setArsyetimi(''); setErr('') }}>
                  {hap === n.id ? 'Mbyll' : 'Vendos'}
                </button>
                <button type="button" className="edit-btn"
                  style={{ borderColor: '#C9A227', color: '#8A6D1F', marginLeft: 6 }}
                  onClick={() => setDosja(n.id)}>Dosja ligjore</button>""")

# modali
zev("""      <div className="card">
        <div className="ct">Si funksionon</div>""",
    """      {dosja && <DosjaLigjore id={dosja} onClose={() => { setDosja(''); load() }} />}

      <div className="card">
        <div className="ct">Si funksionon</div>""")

for o,c in (('{','}'),('(',')'),('[',']')):
    if s.count(o)!=s.count(c): sys.exit('kllapa %s: %d vs %d' % (o,s.count(o),s.count(c)))
if 'ngarko(' in s: sys.exit('referenca e gabuar ngarko()')
open(P,'w',encoding='utf-8').write(s)
print('OK —', len(s.encode()), 'bajt')
