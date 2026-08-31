// Përputhës LOKAL i kategorisë nga titulli/përshkrimi — pa AI, i menjëhershëm, falas.
// Arsyeja: sugjerimi i kategorisë nuk duhet të varet nga një ofrues i jashtëm AI (kredit/çelës);
// klasifikimi i një titulli të shkurtër në një grup fiks kategorish është më i sigurt me fjalë-çelësa
// se me LLM. Ky është "garanci" — funksionon gjithmonë; AI mbetet vetëm rafinim opsional.
//
// Fjalët-çelësa lidhen me EMRAT realë të kategorive në bazë (jo ID të koduara). Përputhja bëhet
// me emër; ID-ja merret nga lista live e kategorive që vjen nga baza.

export type Cat = { id: string; name: string }

// Emri i kategorisë (si në bazë) → fjalë-çelësa. Emrat normalizohen (pa theks) para krahasimit.
const KEYWORDS: Record<string, string[]> = {
  Automjete: ['makin', 'makine', 'veture', 'automjet', 'mercedes', 'benz', 'bmw', 'audi', 'golf',
    'opel', 'ford', 'fiat', 'volkswagen', 'toyota', 'hyundai', 'peugeot', 'renault', 'skoda',
    'motociklet', 'motor', 'skuter', 'vespa', 'biciklet', 'kamion', 'furgon', 'autobus',
    'gome', 'goma', 'targ', 'karburant', 'dizel', 'benzin', 'rimorkio', 'traktor'],
  Elektronike: ['telefon', 'iphone', 'samsung', 'xiaomi', 'huawei', 'oppo', 'realme', 'nokia',
    'laptop', 'kompjuter', 'tablet', 'televizor', 'monitor', 'kamera', 'aparat', 'kufje',
    'tastier', 'karikues', 'powerbank', 'smartwatch', 'dron', 'printer', 'router', 'elektronik',
    'ssd', 'hard disk', 'skined', 'projektor', 'altoparlant', 'smart tv'],
  Gaming: ['playstation', 'ps4', 'ps5', 'xbox', 'nintendo', 'konsol', 'gaming', 'gamer',
    'joystick', 'kontroller', 'lojra', 'videolojra'],
  Veshje: ['veshje', 'bluze', 'kemish', 'pantallon', 'xhins', 'fustan', 'xhaket', 'pallto',
    'kepuc', 'atlete', 'cizme', 'canta', 'canten', 'rrip', 'kapel', 'syze', 'aksesor',
    'nike', 'adidas', 'zara', 'triko', 'geze', 'palltua'],
  Mobilje: ['mobilje', 'tavolin', 'karrig', 'divan', 'kanape', 'dollap', 'komodin', 'krevat',
    'shtrat', 'raft', 'bibliotek', 'pasqyr', 'tapet', 'gardrob', 'bufe'],
  Prona: ['apartament', 'shtepi', 'vil', 'garsonjer', 'truall', 'toke', 'toka', 'dyqan', 'zyre',
    'magazin', 'garazh', 'lokal', 'banese', 'prone', 'qira', 'ambient'],
  Kafshe: ['qen', 'mace', 'macen', 'kotel', 'kelysh', 'zog', 'papagall', 'peshk', 'lepur',
    'kal', 'kali', 'kale', 'kafsh', 'pul', 'dele', 'dhi', 'lop', 'derr', 'mjalt bletar'],
  Sport: ['sport', 'futboll', 'basketboll', 'fitnes', 'palester', 'pesha', 'dumbell', 'ski',
    'tenis', 'kamping', 'cadra', 'top futbolli', 'stervitje', 'trajner'],
  Ushqim: ['ushqim', 'mjalt', 'vaj ulliri', 'ver', 'raki', 'djath', 'mish', 'fruta', 'perime',
    'organik', 'embelsir', 'bllok'],
  Shendet: ['shendet', 'ilac', 'suplement', 'vitamin', 'protein', 'kozmetik', 'krem', 'parfum',
    'makeup', 'grim', 'bukuri', 'flok'],
  Arsim: ['liber', 'libra', 'kurs', 'mesim', 'arsim', 'universitet', 'shkoll', 'fletore', 'laps',
    'tekst', 'dispens', 'mesues', 'kopesht'],
  Turizem: ['hotel', 'pushime', 'udhetim', 'turizem', 'bilet', 'fluturim', 'plazh', 'resort',
    'ekskursion'],
  Sherbime: ['sherbim', 'riparim', 'montim', 'transport', 'pastrim', 'hidraulik', 'elektricist',
    'avokat', 'kontabilist', 'perkthim', 'fotograf', 'mjeshter', 'lyerje', 'instalim'],
  Pune: ['pune', 'punesim', 'vend pune', 'kerkoj pune', 'ofroj pune', 'kamarier', 'shofer',
    'sekretare', 'staf', 'punonjes', 'vakance'],
  Biznese: ['biznes', 'aktivitet', 'kompani', 'frenchize', 'franchise'],
}

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/ë/g, 'e')
    .replace(/ç/g, 'c')
    .replace(/[àáâãä]/g, 'a')
    .replace(/[èéêe̋]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .trim()
}

/**
 * Kthen emrin e kategorisë më të përshtatshme nga fjalë-çelësat, ose null nëse asnjë s'përputhet
 * me siguri. Përdor përputhje me kufi fjale (prefiks për fleksionin shqip; përputhje e plotë për
 * çelësat shumë të shkurtër) që të mos ngatërrojë p.sh. "top" me "laptop".
 */
export function matchCategoryName(title: string, description = ''): string | null {
  const text = normalize(`${title} ${description}`)
  if (!text) return null
  const words = text.split(/[^a-z0-9]+/).filter(Boolean)

  let bestName: string | null = null
  let bestScore = 0
  for (const [name, keys] of Object.entries(KEYWORDS)) {
    let score = 0
    for (const kRaw of keys) {
      const k = normalize(kRaw)
      if (k.includes(' ')) {
        if (text.includes(k)) score += 2 // frazat janë sinjal më i fortë
      } else if (k.length <= 3) {
        if (words.includes(k)) score += 1
      } else {
        if (words.some(w => w === k || w.startsWith(k))) score += 1
      }
    }
    if (score > bestScore) { bestScore = score; bestName = name }
  }
  return bestScore > 0 ? bestName : null
}

/**
 * Zgjedh kategorinë nga lista LIVE (id+name nga baza) duke përputhur emrin e gjetur lokalisht.
 * Kthen kategorinë ose null. Toleron ndryshime të vogla theksi mes emrit të koduar dhe atij në bazë.
 */
export function matchCategoryLocal(title: string, description: string, categories: Cat[]): Cat | null {
  const name = matchCategoryName(title, description)
  if (!name) return null
  const target = normalize(name)
  return categories.find(c => normalize(c.name) === target)
      ?? categories.find(c => normalize(c.name).startsWith(target) || target.startsWith(normalize(c.name)))
      ?? null
}
