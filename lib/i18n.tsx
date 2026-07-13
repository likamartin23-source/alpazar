'use client'
/**
 * Alpazar i18n — motor i lehtë me React Context (pa router, pa varësi).
 * Konventat e projektit: CSS inline, importe relative, 'use client'.
 * Gjuha ruhet në localStorage + cookie `alpazar_lang`; zbulohet nga navigator.
 * Zgjerimi: shto gjuhë te LANGS + çelësa te MESSAGES. Fallback gjithmonë 'sq'.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

export type Lang =
  | 'sq' | 'en' | 'it' | 'de' | 'fr' | 'es' | 'el' | 'tr'
  | 'sr' | 'hr' | 'bs' | 'mk' | 'bg'

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'sq', label: 'Shqip',      flag: '🇦🇱' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'el', label: 'Ελληνικά',   flag: '🇬🇷' },
  { code: 'tr', label: 'Türkçe',     flag: '🇹🇷' },
  { code: 'sr', label: 'Српски',     flag: '🇷🇸' },
  { code: 'hr', label: 'Hrvatski',   flag: '🇭🇷' },
  { code: 'bs', label: 'Bosanski',   flag: '🇧🇦' },
  { code: 'mk', label: 'Македонски', flag: '🇲🇰' },
  { code: 'bg', label: 'Български',   flag: '🇧🇬' },
]

type Dict = Partial<Record<Lang, string>>
export const MESSAGES: Record<string, Dict> = {
  nav_categories: { sq:'Kategoritë', en:'Categories', it:'Categorie', de:'Kategorien', fr:'Catégories', es:'Categorías', el:'Κατηγορίες', tr:'Kategoriler', sr:'Категорије', hr:'Kategorije', bs:'Kategorije', mk:'Категории', bg:'Категории' },
  nav_businesses:{ sq:'Bizneset', en:'Businesses', it:'Aziende', de:'Unternehmen', fr:'Entreprises', es:'Empresas', el:'Επιχειρήσεις', tr:'İşletmeler', sr:'Предузећа', hr:'Tvrtke', bs:'Firme', mk:'Бизниси', bg:'Бизнеси' },
  nav_search:    { sq:'Kërko', en:'Search', it:'Cerca', de:'Suchen', fr:'Rechercher', es:'Buscar', el:'Αναζήτηση', tr:'Ara', sr:'Претрага', hr:'Pretraži', bs:'Pretraga', mk:'Пребарај', bg:'Търсене' },
  nav_terms:     { sq:'Kushtet e Përdorimit', en:'Terms of Use', it:'Termini d’uso', de:'Nutzungsbedingungen', fr:'Conditions d’utilisation', es:'Términos de uso', el:'Όροι χρήσης', tr:'Kullanım Şartları', sr:'Услови коришћења', hr:'Uvjeti korištenja', bs:'Uvjeti korištenja', mk:'Услови на користење', bg:'Условия за ползване' },
  nav_privacy:   { sq:'Privatësia', en:'Privacy', it:'Privacy', de:'Datenschutz', fr:'Confidentialité', es:'Privacidad', el:'Απόρρητο', tr:'Gizlilik', sr:'Приватност', hr:'Privatnost', bs:'Privatnost', mk:'Приватност', bg:'Поверителност' },
  nav_cookies:   { sq:'Cookie-t', en:'Cookies', it:'Cookie', de:'Cookies', fr:'Cookies', es:'Cookies', el:'Cookies', tr:'Çerezler', sr:'Колачићи', hr:'Kolačići', bs:'Kolačići', mk:'Колачиња', bg:'Бисквитки' },
  nav_about:     { sq:'Rreth Nesh', en:'About Us', it:'Chi siamo', de:'Über uns', fr:'À propos', es:'Sobre nosotros', el:'Σχετικά', tr:'Hakkımızda', sr:'О нама', hr:'O nama', bs:'O nama', mk:'За нас', bg:'За нас' },
  nav_contact:   { sq:'Kontakt', en:'Contact', it:'Contatto', de:'Kontakt', fr:'Contact', es:'Contacto', el:'Επικοινωνία', tr:'İletişim', sr:'Контакт', hr:'Kontakt', bs:'Kontakt', mk:'Контакт', bg:'Контакт' },
  nav_security:  { sq:'Siguria', en:'Security', it:'Sicurezza', de:'Sicherheit', fr:'Sécurité', es:'Seguridad', el:'Ασφάλεια', tr:'Güvenlik', sr:'Безбедност', hr:'Sigurnost', bs:'Sigurnost', mk:'Безбедност', bg:'Сигурност' },
  nav_mydata:    { sq:'Të dhënat e mia', en:'My Data', it:'I miei dati', de:'Meine Daten', fr:'Mes données', es:'Mis datos', el:'Τα δεδομένα μου', tr:'Verilerim', sr:'Моји подаци', hr:'Moji podaci', bs:'Moji podaci', mk:'Мои податоци', bg:'Моите данни' },
  nav_takedown:  { sq:'IP / Takedown', en:'IP / Takedown', it:'IP / Rimozione', de:'IP / Entfernung', fr:'IP / Retrait', es:'IP / Retirada', el:'IP / Αφαίρεση', tr:'IP / Kaldırma', sr:'IP / Уклањање', hr:'IP / Uklanjanje', bs:'IP / Uklanjanje', mk:'IP / Отстранување', bg:'IP / Премахване' },
  nav_referral:  { sq:'Referral', en:'Referral', it:'Referral', de:'Empfehlung', fr:'Parrainage', es:'Referidos', el:'Παραπομπή', tr:'Davet', sr:'Препорука', hr:'Preporuka', bs:'Preporuka', mk:'Препорака', bg:'Препоръка' },
  skip_link:     { sq:'Kalo tek përmbajtja kryesore', en:'Skip to main content', it:'Vai al contenuto principale', de:'Zum Hauptinhalt springen', fr:'Aller au contenu principal', es:'Saltar al contenido principal', el:'Μετάβαση στο κύριο περιεχόμενο', tr:'Ana içeriğe geç', sr:'Пређи на главни садржај', hr:'Prijeđi na glavni sadržaj', bs:'Pređi na glavni sadržaj', mk:'Оди на главната содржина', bg:'Към основното съдържание' },
  rights:        { sq:'Të gjitha të drejtat e rezervuara', en:'All rights reserved', it:'Tutti i diritti riservati', de:'Alle Rechte vorbehalten', fr:'Tous droits réservés', es:'Todos los derechos reservados', el:'Με επιφύλαξη παντός δικαιώματος', tr:'Tüm hakları saklıdır', sr:'Сва права задржана', hr:'Sva prava pridržana', bs:'Sva prava zadržana', mk:'Сите права задржани', bg:'Всички права запазени' },
  lang_label:    { sq:'Gjuha', en:'Language', it:'Lingua', de:'Sprache', fr:'Langue', es:'Idioma', el:'Γλώσσα', tr:'Dil', sr:'Језик', hr:'Jezik', bs:'Jezik', mk:'Јазик', bg:'Език' },
}

interface I18nCtx { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }
const Ctx = createContext<I18nCtx>({ lang: 'sq', setLang: () => {}, t: (k) => k })

function detect(): Lang {
  if (typeof document === 'undefined') return 'sq'
  const m = document.cookie.match(/(?:^|; )alpazar_lang=([a-z]{2})/)
  if (m && LANGS.some(l => l.code === m[1])) return m[1] as Lang
  try { const s = localStorage.getItem('alpazar_lang'); if (s && LANGS.some(l => l.code === s)) return s as Lang } catch {}
  const nav = (navigator.language || 'sq').slice(0, 2).toLowerCase()
  return (LANGS.some(l => l.code === nav) ? nav : 'sq') as Lang
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('sq')
  useEffect(() => {
    const d = detect()
    setLangState(d)
    try { document.documentElement.lang = d } catch {}
  }, [])
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('alpazar_lang', l)
      document.cookie = `alpazar_lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      document.documentElement.lang = l
    } catch {}
  }, [])
  const t = useCallback((key: string) => {
    const row = MESSAGES[key]
    if (!row) return key
    return row[lang] ?? row.sq ?? key
  }, [lang])
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useT() { return useContext(Ctx) }
