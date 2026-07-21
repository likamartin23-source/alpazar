import { useState } from 'react'

export function useListingAI(form: any, categories: any[], set: (k: string, v: string) => void, setMsg: (m: string) => void) {
  const [priceSuggestion, setPriceSuggestion] = useState('')
  const [priceLoading, setPriceLoading] = useState(false)
  const [descLoading, setDescLoading] = useState(false)
  const [catLoading, setCatLoading] = useState(false)
  const [catSuggested, setCatSuggested] = useState('')

  async function generateDescription() {
    if (!form.title.trim()) { setMsg('err:Shkruaj titullin para se të gjenerosh përshkrimin.'); return }
    setDescLoading(true)
    const catName = categories.find(c => c.id === form.category_id)?.name || ''
    const userMsg = `Shkruaj një përshkrim të shkurtër (max 150 fjalë) për një shpallje me titull: "${form.title}"${catName ? ` në kategorinë "${catName}"` : ''}${form.condition === 'i_ri' ? ', gjendje: i ri' : form.condition === 'i_perdorur' ? ', gjendje: i përdorur' : ''}. Shkruaj në gjuhën shqipe. Trego veçoritë kryesore dhe arsyet pse dikush duhet ta blejë. Vetëm teksti i përshkrimit, pa titull e pa shpjegime shtesë.`
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }], stream: false }),
      })
      if (!res.ok) throw new Error('api_error')
      const json = await res.json()
      if (json.reply) {
        set('description', json.reply.trim())
      } else {
        const catLabel = catName || 'produkt'
        const condLabel = form.condition === 'i_ri' ? 'i ri, kurrë i përdorur' : form.condition === 'i_perdorur' ? 'i përdorur, në gjendje të mirë' : ''
        set('description', `${form.title} — ${catLabel} ${condLabel ? `${condLabel}, ` : ''}në gjendje të shkëlqyer. Çmim i arsyeshëm dhe i negociueshëm. Kontaktoni për më shumë informacion.`.trim())
      }
    } catch {
      const catLabel = catName || 'produkt'
      set('description', `${form.title} — ${catLabel} në gjendje të mirë. Çmim i negociueshëm. Kontaktoni për detaje.`)
    }
    setDescLoading(false)
  }

  async function suggestPrice() {
    if (!form.title.trim()) { setPriceSuggestion('err:Shkruaj titullin para se të sugjerosh çmimin.'); return }
    setPriceLoading(true); setPriceSuggestion('')
    const catName = categories.find(c => c.id === form.category_id)?.name || ''
    const userMsg = `Duhet të vendos çmim për shpalljen time: "${form.title}"${catName ? ` (kategoria: ${catName})` : ''}${form.description ? `. Përshkrimi: ${form.description.slice(0, 200)}` : ''}. Cili është çmimi real i tregut shqiptar? Jep vetëm një range konkrete çmimi (p.sh. "15,000–25,000 L" ose "150–200 €").`
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }], stream: false }),
      })
      if (!res.ok) throw new Error('api_error')
      const json = await res.json()
      setPriceSuggestion(json.reply || 'err:Nuk mund të sugjeroj çmim tani.')
    } catch {
      setPriceSuggestion('err:Gabim në lidhje. Provo sërisht.')
    }
    setPriceLoading(false)
  }

  async function suggestCategory() {
    if (!form.title.trim()) { setMsg('err:Shkruaj titullin para se te sugjerosh kategorine.'); return }
    if (categories.length === 0) return
    setCatLoading(true); setCatSuggested('')
    const names = categories.map((c: any) => c.name).join(', ')
    const userMsg = `Kam nje shpallje me titull: "${form.title}"${form.description ? `. Pershkrimi: ${form.description.slice(0, 200)}` : ''}. Zgjidh SAKTESISHT nje kategori nga kjo liste qe i pershtatet me se miri: ${names}. Kthe VETEM emrin e sakte te kategorise nga lista, asgje tjeter.`
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }], stream: false }),
      })
      if (!res.ok) throw new Error('api_error')
      const json = await res.json()
      const reply = String(json.reply || '').toLowerCase().trim()
      const match = categories.find((c: any) => reply.includes(c.name.toLowerCase())) || categories.find((c: any) => c.name.toLowerCase().includes(reply))
      if (match && reply) { set('category_id', match.id); setCatSuggested(match.name); setMsg('') }
      else { setMsg('err:Nuk munda ta gjej kategorine automatikisht — zgjidhe manualisht.') }
    } catch {
      setMsg('err:Gabim ne lidhje. Zgjidh kategorine manualisht.')
    }
    setCatLoading(false)
  }

  return { descLoading, catLoading, catSuggested, priceLoading, priceSuggestion, generateDescription, suggestPrice, suggestCategory }
}
