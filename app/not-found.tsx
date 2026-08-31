// Kjo faqe render-ohet BRENDA layout-it rrenje, ndaj nuk guxon te nxjerre
// etiketat e veta rrenje (html/body). Kete e ben VETEM `global-error.tsx`,
// qe zevendeson layout-in. Deri me 31 gusht 2026 kjo faqe (dhe `error.tsx`)
// nxirrnin nje cift te dyte; matur ne shfletues, cdo 404 jepte tri gabime:
//   'cannot contain a nested html'
//   'In HTML, main cannot be a child of html. This will cause a hydration error.'
//   'You are mounting a new html component when a previous one has not first unmounted.'
// Parsuesi i HTML-se i hidhte etiketat e brendshme, por pema e React-it i
// mbante — ndaj hidratimi deshtonte ne CDO faqe 404.
export default function NotFound() {
  return (
    <div style={{ background: '#FFFBEA' }}>
        <div style={{
          minHeight: '58vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16,
        }}>
          <div style={{
            background: '#fff', border: '1.5px solid #f0e0a8', borderRadius: 20,
            padding: '36px 28px', maxWidth: 380, width: '100%', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,.06)',
          }}>
            <div style={{
              background: '#111', color: '#F5C842', fontWeight: 800,
              letterSpacing: 3, fontSize: 18, padding: '6px 16px',
              borderRadius: 8, display: 'inline-block', marginBottom: 20,
            }}>
              ALPAZAR
            </div>
            <div style={{
              fontSize: 64, fontWeight: 900, color: '#C42B0F',
              lineHeight: 1, marginBottom: 8,
            }}>
              404
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              Faqja nuk u gjet
            </h2>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: '0 0 24px' }}>
              Faqja që kërkove nuk ekziston ose është zhvendosur.
              Mund të jetë fshirë ose të kesh shtypur adresën gabim.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href="/"
                style={{
                  display: 'block', background: '#E63312', color: '#fff',
                  borderRadius: 10, padding: '13px 0', fontSize: 14,
                  fontWeight: 700, textDecoration: 'none',
                }}
              >
                ← Kthehu në faqe kryesore
              </a>
              <a
                href="/search"
                style={{
                  display: 'block', background: '#F5C842', color: '#111',
                  borderRadius: 10, padding: '12px 0', fontSize: 13,
                  fontWeight: 700, textDecoration: 'none',
                }}
              >
                Kërko shpallje
              </a>
            </div>
          </div>
        </div>
    </div>
  )
}
