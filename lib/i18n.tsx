'use client'
/**
 * Alpazar i18n — motor i lehtë me React Context (pa router, pa varësi).
 * Gjuha ruhet në localStorage + cookie `alpazar_lang`; zbulohet nga navigator.
 * Zgjerimi: shto gjuhë te LANGS + çelësa te MESSAGES. Fallback gjithmonë 'sq'.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

export type Lang =
  | 'sq' | 'en' | 'it' | 'de' | 'fr' | 'es' | 'el' | 'tr'
  | 'sr' | 'hr' | 'bs' | 'mk' | 'bg' | 'ro' | 'sl'
  | 'pl' | 'cs' | 'sk' | 'hu' | 'nl' | 'pt' | 'uk' | 'ru'
  | 'sv' | 'da' | 'fi' | 'no' | 'et' | 'lv' | 'lt'

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'sq', label: 'Shqip',       flag: '🇦🇱' },
  { code: 'en', label: 'English',     flag: '🇬🇧' },
  { code: 'it', label: 'Italiano',    flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch',     flag: '🇩🇪' },
  { code: 'fr', label: 'Français',    flag: '🇫🇷' },
  { code: 'es', label: 'Español',     flag: '🇪🇸' },
  { code: 'el', label: 'Ελληνικά',    flag: '🇬🇷' },
  { code: 'tr', label: 'Türkçe',      flag: '🇹🇷' },
  { code: 'sr', label: 'Српски',      flag: '🇷🇸' },
  { code: 'hr', label: 'Hrvatski',    flag: '🇭🇷' },
  { code: 'bs', label: 'Bosanski',    flag: '🇧🇦' },
  { code: 'mk', label: 'Македонски',  flag: '🇲🇰' },
  { code: 'bg', label: 'Български',   flag: '🇧🇬' },
  { code: 'ro', label: 'Română',      flag: '🇷🇴' },
  { code: 'sl', label: 'Slovenščina', flag: '🇸🇮' },
  { code: 'pl', label: 'Polski',      flag: '🇵🇱' },
  { code: 'cs', label: 'Čeština',     flag: '🇨🇿' },
  { code: 'sk', label: 'Slovenčina',  flag: '🇸🇰' },
  { code: 'hu', label: 'Magyar',      flag: '🇭🇺' },
  { code: 'nl', label: 'Nederlands',  flag: '🇳🇱' },
  { code: 'pt', label: 'Português',   flag: '🇵🇹' },
  { code: 'uk', label: 'Українська',  flag: '🇺🇦' },
  { code: 'ru', label: 'Русский',     flag: '🇷🇺' },
  { code: 'sv', label: 'Svenska',     flag: '🇸🇪' },
  { code: 'da', label: 'Dansk',       flag: '🇩🇰' },
  { code: 'fi', label: 'Suomi',       flag: '🇫🇮' },
  { code: 'no', label: 'Norsk',       flag: '🇳🇴' },
  { code: 'et', label: 'Eesti',       flag: '🇪🇪' },
  { code: 'lv', label: 'Latviešu',    flag: '🇱🇻' },
  { code: 'lt', label: 'Lietuvių',    flag: '🇱🇹' },
]

type Dict = Partial<Record<Lang, string>>
export const MESSAGES: Record<string, Dict> = {
  nav_categories: { sq:'Kategoritë', en:'Categories', it:'Categorie', de:'Kategorien', fr:'Catégories', es:'Categorías', el:'Κατηγορίες', tr:'Kategoriler', sr:'Категорије', hr:'Kategorije', bs:'Kategorije', mk:'Категории', bg:'Категории', ro:'Categorii', sl:'Kategorije', pl:'Kategorie', cs:'Kategorie', sk:'Kategórie', hu:'Kategóriák', nl:'Categorieën', pt:'Categorias', uk:'Категорії', ru:'Категории', sv:'Kategorier', da:'Kategorier', fi:'Kategoriat', no:'Kategorier', et:'Kategooriad', lv:'Kategorijas', lt:'Kategorijos' },
  nav_businesses:{ sq:'Bizneset', en:'Businesses', it:'Aziende', de:'Unternehmen', fr:'Entreprises', es:'Empresas', el:'Επιχειρήσεις', tr:'İşletmeler', sr:'Предузећа', hr:'Tvrtke', bs:'Firme', mk:'Бизниси', bg:'Бизнеси', ro:'Afaceri', sl:'Podjetja', pl:'Firmy', cs:'Firmy', sk:'Firmy', hu:'Vállalkozások', nl:'Bedrijven', pt:'Empresas', uk:'Бізнеси', ru:'Компании', sv:'Företag', da:'Virksomheder', fi:'Yritykset', no:'Bedrifter', et:'Ettevõtted', lv:'Uzņēmumi', lt:'Įmonės' },
  nav_search:    { sq:'Kërko', en:'Search', it:'Cerca', de:'Suchen', fr:'Rechercher', es:'Buscar', el:'Αναζήτηση', tr:'Ara', sr:'Претрага', hr:'Pretraži', bs:'Pretraga', mk:'Пребарај', bg:'Търсене', ro:'Căutare', sl:'Iskanje', pl:'Szukaj', cs:'Hledat', sk:'Hľadať', hu:'Keresés', nl:'Zoeken', pt:'Pesquisar', uk:'Пошук', ru:'Поиск', sv:'Sök', da:'Søg', fi:'Haku', no:'Søk', et:'Otsi', lv:'Meklēt', lt:'Paieška' },
  nav_terms:     { sq:'Kushtet e Përdorimit', en:'Terms of Use', it:'Termini d’uso', de:'Nutzungsbedingungen', fr:'Conditions d’utilisation', es:'Términos de uso', el:'Όροι χρήσης', tr:'Kullanım Şartları', sr:'Услови коришћења', hr:'Uvjeti korištenja', bs:'Uvjeti korištenja', mk:'Услови на користење', bg:'Условия за ползване', ro:'Termeni de utilizare', sl:'Pogoji uporabe', pl:'Warunki korzystania', cs:'Podmínky použití', sk:'Podmienky používania', hu:'Felhasználási feltételek', nl:'Gebruiksvoorwaarden', pt:'Termos de uso', uk:'Умови використання', ru:'Условия использования', sv:'Användarvillkor', da:'Brugsvilkår', fi:'Käyttöehdot', no:'Bruksvilkår', et:'Kasutustingimused', lv:'Lietošanas noteikumi', lt:'Naudojimo sąlygos' },
  nav_privacy:   { sq:'Privatësia', en:'Privacy', it:'Privacy', de:'Datenschutz', fr:'Confidentialité', es:'Privacidad', el:'Απόρρητο', tr:'Gizlilik', sr:'Приватност', hr:'Privatnost', bs:'Privatnost', mk:'Приватност', bg:'Поверителност', ro:'Confidențialitate', sl:'Zasebnost', pl:'Prywatność', cs:'Soukromí', sk:'Súkromie', hu:'Adatvédelem', nl:'Privacy', pt:'Privacidade', uk:'Конфіденційність', ru:'Конфиденциальность', sv:'Integritet', da:'Privatliv', fi:'Tietosuoja', no:'Personvern', et:'Privaatsus', lv:'Privātums', lt:'Privatumas' },
  nav_cookies:   { sq:'Cookie-t', en:'Cookies', it:'Cookie', de:'Cookies', fr:'Cookies', es:'Cookies', el:'Cookies', tr:'Çerezler', sr:'Колачићи', hr:'Kolačići', bs:'Kolačići', mk:'Колачиња', bg:'Бисквитки', ro:'Cookie-uri', sl:'Piškotki', pl:'Pliki cookie', cs:'Cookies', sk:'Cookies', hu:'Sütik', nl:'Cookies', pt:'Cookies', uk:'Файли cookie', ru:'Файлы cookie', sv:'Cookies', da:'Cookies', fi:'Evästeet', no:'Informasjonskapsler', et:'Küpsised', lv:'Sīkdatnes', lt:'Slapukai' },
  nav_about:     { sq:'Rreth Nesh', en:'About Us', it:'Chi siamo', de:'Über uns', fr:'À propos', es:'Sobre nosotros', el:'Σχετικά', tr:'Hakkımızda', sr:'О нама', hr:'O nama', bs:'O nama', mk:'За нас', bg:'За нас', ro:'Despre noi', sl:'O nas', pl:'O nas', cs:'O nás', sk:'O nás', hu:'Rólunk', nl:'Over ons', pt:'Sobre nós', uk:'Про нас', ru:'О нас', sv:'Om oss', da:'Om os', fi:'Tietoa meistä', no:'Om oss', et:'Meist', lv:'Par mums', lt:'Apie mus' },
  nav_contact:   { sq:'Kontakt', en:'Contact', it:'Contatto', de:'Kontakt', fr:'Contact', es:'Contacto', el:'Επικοινωνία', tr:'İletişim', sr:'Контакт', hr:'Kontakt', bs:'Kontakt', mk:'Контакт', bg:'Контакт', ro:'Contact', sl:'Kontakt', pl:'Kontakt', cs:'Kontakt', sk:'Kontakt', hu:'Kapcsolat', nl:'Contact', pt:'Contacto', uk:'Контакти', ru:'Контакты', sv:'Kontakt', da:'Kontakt', fi:'Yhteystiedot', no:'Kontakt', et:'Kontakt', lv:'Kontakti', lt:'Kontaktai' },
  nav_security:  { sq:'Siguria', en:'Security', it:'Sicurezza', de:'Sicherheit', fr:'Sécurité', es:'Seguridad', el:'Ασφάλεια', tr:'Güvenlik', sr:'Безбедност', hr:'Sigurnost', bs:'Sigurnost', mk:'Безбедност', bg:'Сигурност', ro:'Securitate', sl:'Varnost', pl:'Bezpieczeństwo', cs:'Bezpečnost', sk:'Bezpečnosť', hu:'Biztonság', nl:'Beveiliging', pt:'Segurança', uk:'Безпека', ru:'Безопасность', sv:'Säkerhet', da:'Sikkerhed', fi:'Turvallisuus', no:'Sikkerhet', et:'Turvalisus', lv:'Drošība', lt:'Saugumas' },
  nav_mydata:    { sq:'Të dhënat e mia', en:'My Data', it:'I miei dati', de:'Meine Daten', fr:'Mes données', es:'Mis datos', el:'Τα δεδομένα μου', tr:'Verilerim', sr:'Моји подаци', hr:'Moji podaci', bs:'Moji podaci', mk:'Мои податоци', bg:'Моите данни', ro:'Datele mele', sl:'Moji podatki', pl:'Moje dane', cs:'Moje údaje', sk:'Moje údaje', hu:'Adataim', nl:'Mijn gegevens', pt:'Os meus dados', uk:'Мої дані', ru:'Мои данные', sv:'Mina uppgifter', da:'Mine data', fi:'Omat tiedot', no:'Mine data', et:'Minu andmed', lv:'Mani dati', lt:'Mano duomenys' },
  nav_takedown:  { sq:'IP / Takedown', en:'IP / Takedown', it:'IP / Rimozione', de:'IP / Entfernung', fr:'IP / Retrait', es:'IP / Retirada', el:'IP / Αφαίρεση', tr:'IP / Kaldırma', sr:'IP / Уклањање', hr:'IP / Uklanjanje', bs:'IP / Uklanjanje', mk:'IP / Отстранување', bg:'IP / Премахване', ro:'IP / Retragere', sl:'IP / Odstranitev', pl:'IP / Usunięcie', cs:'IP / Odstranění', sk:'IP / Odstránenie', hu:'IP / Eltávolítás', nl:'IP / Verwijdering', pt:'IP / Remoção', uk:'IP / Видалення', ru:'IP / Удаление', sv:'IP / Borttagning', da:'IP / Fjernelse', fi:'IP / Poisto', no:'IP / Fjerning', et:'IP / Eemaldamine', lv:'IP / Noņemšana', lt:'IP / Pašalinimas' },
  nav_referral:  { sq:'Referral', en:'Referral', it:'Referral', de:'Empfehlung', fr:'Parrainage', es:'Referidos', el:'Παραπομπή', tr:'Davet', sr:'Препорука', hr:'Preporuka', bs:'Preporuka', mk:'Препорака', bg:'Препоръка', ro:'Recomandare', sl:'Priporočilo', pl:'Polecenie', cs:'Doporučení', sk:'Odporúčanie', hu:'Ajánlás', nl:'Verwijzing', pt:'Indicação', uk:'Реферал', ru:'Реферал', sv:'Värvning', da:'Henvisning', fi:'Suosittelu', no:'Verving', et:'Soovitus', lv:'Ieteikums', lt:'Rekomendacija' },
  skip_link:     { sq:'Kalo tek përmbajtja kryesore', en:'Skip to main content', it:'Vai al contenuto principale', de:'Zum Hauptinhalt springen', fr:'Aller au contenu principal', es:'Saltar al contenido principal', el:'Μετάβαση στο κύριο περιεχόμενο', tr:'Ana içeriğe geç', sr:'Пређи на главни садржај', hr:'Prijeđi na glavni sadržaj', bs:'Pređi na glavni sadržaj', mk:'Оди на главната содржина', bg:'Към основното съдържание', ro:'Sari la conținutul principal', sl:'Preskoči na glavno vsebino', pl:'Przejdź do treści głównej', cs:'Přejít na hlavní obsah', sk:'Prejsť na hlavný obsah', hu:'Ugrás a fő tartalomra', nl:'Ga naar hoofdinhoud', pt:'Ir para o conteúdo principal', uk:'Перейти до основного вмісту', ru:'Перейти к основному содержимому', sv:'Hoppa till huvudinnehåll', da:'Gå til hovedindhold', fi:'Siirry pääsisältöön', no:'Hopp til hovedinnhold', et:'Liigu põhisisu juurde', lv:'Pāriet uz galveno saturu', lt:'Pereiti prie pagrindinio turinio' },
  rights:        { sq:'Të gjitha të drejtat e rezervuara', en:'All rights reserved', it:'Tutti i diritti riservati', de:'Alle Rechte vorbehalten', fr:'Tous droits réservés', es:'Todos los derechos reservados', el:'Με επιφύλαξη παντός δικαιώματος', tr:'Tüm hakları saklıdır', sr:'Сва права задржана', hr:'Sva prava pridržana', bs:'Sva prava zadržana', mk:'Сите права задржани', bg:'Всички права запазени', ro:'Toate drepturile rezervate', sl:'Vse pravice pridržane', pl:'Wszelkie prawa zastrzeżone', cs:'Všechna práva vyhrazena', sk:'Všetky práva vyhradené', hu:'Minden jog fenntartva', nl:'Alle rechten voorbehouden', pt:'Todos os direitos reservados', uk:'Усі права захищені', ru:'Все права защищены', sv:'Alla rättigheter förbehållna', da:'Alle rettigheder forbeholdes', fi:'Kaikki oikeudet pidätetään', no:'Alle rettigheter forbeholdt', et:'Kõik õigused kaitstud', lv:'Visas tiesības aizsargātas', lt:'Visos teisės saugomos' },
  lang_label:    { sq:'Gjuha', en:'Language', it:'Lingua', de:'Sprache', fr:'Langue', es:'Idioma', el:'Γλώσσα', tr:'Dil', sr:'Језик', hr:'Jezik', bs:'Jezik', mk:'Јазик', bg:'Език', ro:'Limbă', sl:'Jezik', pl:'Język', cs:'Jazyk', sk:'Jazyk', hu:'Nyelv', nl:'Taal', pt:'Idioma', uk:'Мова', ru:'Язык', sv:'Språk', da:'Sprog', fi:'Kieli', no:'Språk', et:'Keel', lv:'Valoda', lt:'Kalba' },
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
