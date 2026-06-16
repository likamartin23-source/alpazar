import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Referral Program — Fito me ALPAZAR',
  description: 'Fto miqtë dhe fito shpërblime! Për çdo mik që regjistrohet nëpërmjet linkut tënd, ti fiton pikë dhe mund të marrësh Premium FALAS.',
  openGraph: {
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'Referral Program — Fito me ALPAZAR',
    description: 'Fto miqtë dhe fito shpërblime! Merr Premium FALAS me 50 referalë.',
  },
}

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
