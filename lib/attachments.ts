import { supabase } from './supabase'

/*  BASHKËNGJITJET E BISEDAVE — nga lidhje publike te lidhje të firmosura.
 *
 *  GJENDJA E MATUR (1 shtator 2026): bucket-i `message-attachments` është
 *  PUBLIK, dhe `messages.attachment_url` ruan lidhjen e plotë publike. Pra një
 *  foto ose një zë i dërguar në një bisedë private hapet nga kushdo që e ka
 *  lidhjen, përgjithmonë, pa asnjë sesion. Politika e leximit u ngushtua te
 *  palët e bisedës — kjo e mbylli LISTIMIN — por rruga e lidhjes mbeti.
 *
 *  RENDI KA RËNDËSI, PËRNDRYSHE PRISHET PRODHIMI:
 *    1. Klienti mëson të firmosë (ky skedar). Ndërkohë bucket-i mbetet publik
 *       dhe TË DYJA rrugët punojnë — pa asnjë ndërprerje.
 *    2. Vetëm PASI kjo është live dhe e verifikuar, bucket-i bëhet privat
 *       (`supabase/migrations/20260901_bashkengjitjet_private.sql`, i pa-aplikuar
 *       me qëllim).
 *  Po ta bënim të kundërtën, çdo bashkëngjitje ekzistuese do të kthente 404 për
 *  përdoruesit që ende kanë klientin e vjetër.
 */

const BUCKET = 'message-attachments'
const SHENJA = `/object/public/${BUCKET}/`

/** Nxjerr rrugën brenda bucket-it nga një lidhje e ruajtur. Null nëse s'është e jona. */
export function rrugaNgaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const i = url.indexOf(SHENJA)
  if (i === -1) return null
  const rruga = url.slice(i + SHENJA.length).split('?')[0]
  return rruga || null
}

const kesh = new Map<string, { url: string; skadon: number }>()

/**
 * Kthen një lidhje të firmosur për një bashkëngjitje, ose `null` kur s'arrihet.
 * Thirrësi bie te lidhja e ruajtur në rastin `null` — ajo punon derisa bucket-i
 * të bëhet privat, dhe pas kësaj mungesa e së drejtës është vetë përgjigjja.
 */
export async function lidhjaEFirmosur(url: string, sekonda = 3600): Promise<string | null> {
  const rruga = rrugaNgaUrl(url)
  if (!rruga) return null

  const e = kesh.get(rruga)
  // 60s marzh: një lidhje që skadon gjatë shikimit është defekt i vështirë për t'u parë.
  if (e && e.skadon > Date.now() + 60_000) return e.url

  try {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(rruga, sekonda)
    const nenshkruar = data?.signedUrl
    if (!nenshkruar) return null
    kesh.set(rruga, { url: nenshkruar, skadon: Date.now() + sekonda * 1000 })
    return nenshkruar
  } catch {
    return null
  }
}
