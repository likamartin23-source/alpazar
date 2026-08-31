import { ImageResponse } from 'next/og'

// Kartela sociale 1200x630 (Facebook/LinkedIn/X kerkojne raport te gjere;
// me pare perdorej ikona katrore 512x512 qe pritej/letterbox-ohej).
// Gjenerohet nga kodi me `next/og` — i integruar ne Next 14, PA dep te ri
// dhe PA aset binar ne repo.
export const runtime = 'edge'

const RED = '#E63312'
const GOLD = '#F5C842'
const INK = '#111111'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundImage: 'linear-gradient(135deg, #FFFBEA 0%, #FFF7DC 52%, #FDEBE6 100%)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 84px' }}>
          {/* Pill-i i markes */}
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              background: INK,
              color: GOLD,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 4,
              padding: '14px 30px',
              borderRadius: 9999,
            }}
          >
            ALPAZAR
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 34,
              fontSize: 92,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <div style={{ display: 'flex' }}>Marketplace-i #1</div>
            <div style={{ display: 'flex', color: RED }}>shqiptar</div>
          </div>

          <div style={{ display: 'flex', marginTop: 26, fontSize: 34, color: '#4A4A4A' }}>
            Shpallje falas · pa komision · pa reklama
          </div>
        </div>

        {/* Shiriti i flamurit */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 16, display: 'flex' }}>
          <div style={{ flex: 1, background: RED, display: 'flex' }} />
          <div style={{ flex: 1, background: GOLD, display: 'flex' }} />
          <div style={{ flex: 1, background: INK, display: 'flex' }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=31536000, immutable',
      },
    }
  )
}
