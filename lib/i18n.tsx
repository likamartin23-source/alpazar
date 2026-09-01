'use client'
/**
 * Alpazar i18n — 3 shtresa: (1) katalogu t() për komponentët e rinj, (2) fjalori UI për
 * tekstet e gozhduara të homepage, (3) auto-përkthim AI për ÇDO tekst tjetër (shpalljet,
 * faqet dytësore) permes edge function 'translate' + cache në localStorage. Fallback 'sq'.
 */
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'

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

const UI_KEYS = [
  'Shit · Bli · Bëj Pazarin Tënd', 'Platforma #1 shqiptare', 'e tregtisë online',
  'Përdorues', 'Shpallje', 'Shitës', 'Të gjitha', 'Hyr / Regjistrohu',
  'Kreu', 'Kërko', 'Mesazhe', 'Profili', 'Shitës të verifikuar', 'Vlerësime ⭐',
  'Pa reklama — për të gjithë gjithmonë falas', 'Kërko çdo gjë në Shqipëri...',
  'I ri', 'I përdorur', 'Falas', 'Shiko të gjitha', 'Nuk ka shpallje aktualisht',
  'Bëhu i pari që shton!', 'Instalo', 'Ndaj',
]
const UI: Partial<Record<Lang, string[]>> = {
  en:['Sell · Buy · Make Your Deal','The #1 Albanian platform','for online commerce','Users','Listings','Sellers','All','Log in / Sign up','Home','Search','Messages','Profile','Verified sellers','Ratings ⭐','No ads — free for everyone, always','Search anything in Albania...','New','Used','Free','View all','No listings at the moment','Be the first to add one!','Install','Share'],
  it:['Vendi · Compra · Fai l’affare','La piattaforma albanese n.1','del commercio online','Utenti','Annunci','Venditori','Tutti','Accedi / Registrati','Home','Cerca','Messaggi','Profilo','Venditori verificati','Recensioni ⭐','Niente pubblicità — gratis per tutti, sempre','Cerca qualsiasi cosa in Albania...','Nuovo','Usato','Gratis','Vedi tutti','Nessun annuncio al momento','Sii il primo ad aggiungerne uno!','Installa','Condividi'],
  de:['Verkaufen · Kaufen · Mach dein Geschäft','Die #1 albanische Plattform','für Online-Handel','Nutzer','Anzeigen','Verkäufer','Alle','Anmelden / Registrieren','Start','Suche','Nachrichten','Profil','Verifizierte Verkäufer','Bewertungen ⭐','Keine Werbung — für alle, immer kostenlos','Suche alles in Albanien...','Neu','Gebraucht','Gratis','Alle ansehen','Derzeit keine Anzeigen','Sei der Erste, der eine hinzufügt!','Installieren','Teilen'],
  fr:['Vendez · Achetez · Faites votre affaire','La plateforme albanaise n°1','du commerce en ligne','Utilisateurs','Annonces','Vendeurs','Tout','Connexion / Inscription','Accueil','Recherche','Messages','Profil','Vendeurs vérifiés','Avis ⭐','Sans publicité — gratuit pour tous, toujours','Cherchez tout en Albanie...','Neuf','Occasion','Gratuit','Voir tout','Aucune annonce pour le moment','Soyez le premier à en ajouter !','Installer','Partager'],
  es:['Vende · Compra · Haz tu trato','La plataforma albanesa n.º 1','del comercio online','Usuarios','Anuncios','Vendedores','Todos','Entrar / Registrarse','Inicio','Buscar','Mensajes','Perfil','Vendedores verificados','Valoraciones ⭐','Sin anuncios — gratis para todos, siempre','Busca cualquier cosa en Albania...','Nuevo','Usado','Gratis','Ver todo','No hay anuncios por ahora','¡Sé el primero en añadir uno!','Instalar','Compartir'],
  el:['Πούλα · Αγόρασε · Κλείσε τη συμφωνία','Η #1 αλβανική πλατφόρμα','ηλεκτρονικού εμπορίου','Χρήστες','Αγγελίες','Πωλητές','Όλα','Σύνδεση / Εγγραφή','Αρχική','Αναζήτηση','Μηνύματα','Προφίλ','Επαληθευμένοι πωλητές','Αξιολογήσεις ⭐','Χωρίς διαφημίσεις — δωρεάν για όλους, πάντα','Αναζήτησε τα πάντα στην Αλβανία...','Καινούριο','Μεταχειρισμένο','Δωρεάν','Δες όλα','Δεν υπάρχουν αγγελίες αυτή τη στιγμή','Γίνε ο πρώτος που θα προσθέσει!','Εγκατάσταση','Κοινοποίηση'],
  tr:['Sat · Al · Pazarlığını Yap','1 numaralı Arnavut platformu','online ticaretin','Kullanıcılar','İlanlar','Satıcılar','Tümü','Giriş / Kayıt','Ana sayfa','Ara','Mesajlar','Profil','Doğrulanmış satıcılar','Değerlendirmeler ⭐','Reklamsız — herkes için her zaman ücretsiz','Arnavutluk’ta her şeyi ara...','Yeni','İkinci el','Ücretsiz','Tümünü gör','Şu anda ilan yok','İlk ekleyen sen ol!','Yükle','Paylaş'],
  sr:['Продај · Купи · Направи пазар','Албанска платформа #1','за онлајн трговину','Корисници','Огласи','Продавци','Све','Пријава / Регистрација','Почетна','Претрага','Поруке','Профил','Верификовани продавци','Оцене ⭐','Без реклама — бесплатно за све, увек','Претражи све у Албанији...','Ново','Половно','Бесплатно','Погледај све','Тренутно нема огласа','Буди први који ће додати!','Инсталирај','Подели'],
  hr:['Prodaj · Kupi · Sklopi posao','Albanska platforma #1','za online trgovinu','Korisnici','Oglasi','Prodavači','Sve','Prijava / Registracija','Početna','Pretraži','Poruke','Profil','Verificirani prodavači','Ocjene ⭐','Bez reklama — besplatno za sve, uvijek','Pretraži sve u Albaniji...','Novo','Rabljeno','Besplatno','Pogledaj sve','Trenutno nema oglasa','Budi prvi koji će dodati!','Instaliraj','Podijeli'],
  bs:['Prodaj · Kupi · Napravi pazar','Albanska platforma #1','za online trgovinu','Korisnici','Oglasi','Prodavci','Sve','Prijava / Registracija','Početna','Pretraga','Poruke','Profil','Verifikovani prodavci','Ocjene ⭐','Bez reklama — besplatno za sve, uvijek','Pretraži sve u Albaniji...','Novo','Korišteno','Besplatno','Pogledaj sve','Trenutno nema oglasa','Budi prvi koji dodaje!','Instaliraj','Podijeli'],
  mk:['Продај · Купи · Направи пазар','Албанска платформа #1','за онлајн трговија','Корисници','Огласи','Продавачи','Сите','Најава / Регистрација','Почетна','Пребарај','Пораки','Профил','Верификувани продавачи','Оценки ⭐','Без реклами — бесплатно за сите, секогаш','Пребарај сё во Албанија...','Ново','Половно','Бесплатно','Види ги сите','Моментално нема огласи','Биди прв што ќе додаде!','Инсталирај','Сподели'],
  bg:['Продай · Купи · Направи пазарлък','Албанската платформа #1','за онлайн търговия','Потребители','Обяви','Продавачи','Всички','Вход / Регистрация','Начало','Търсене','Съобщения','Профил','Верифицирани продавачи','Оценки ⭐','Без реклами — безплатно за всички, винаги','Търси всичко в Албания...','Ново','Употребявано','Безплатно','Виж всички','В момента няма обяви','Бъди първият, който добавя!','Инсталирай','Сподели'],
  ro:['Vinde · Cumpără · Fă-ți târgul','Platforma albaneză #1','a comerțului online','Utilizatori','Anunțuri','Vânzători','Toate','Autentificare / Înregistrare','Acasă','Caută','Mesaje','Profil','Vânzători verificați','Recenzii ⭐','Fără reclame — gratuit pentru toți, mereu','Caută orice în Albania...','Nou','Folosit','Gratuit','Vezi toate','Momentan nu există anunțuri','Fii primul care adaugă!','Instalează','Distribuie'],
  sl:['Prodaj · Kupi · Skleni posel','Albanska platforma št. 1','za spletno trgovino','Uporabniki','Oglasi','Prodajalci','Vse','Prijava / Registracija','Domov','Iskanje','Sporočila','Profil','Preverjeni prodajalci','Ocene ⭐','Brez oglasov — brezplačno za vse, vedno','Išči karkoli v Albaniji...','Novo','Rabljeno','Brezplačno','Poglej vse','Trenutno ni oglasov','Bodi prvi, ki doda!','Namesti','Deli'],
  pl:['Sprzedaj · Kup · Ubij interes','Albańska platforma nr 1','handlu online','Użytkownicy','Ogłoszenia','Sprzedawcy','Wszystkie','Zaloguj / Zarejestruj się','Start','Szukaj','Wiadomości','Profil','Zweryfikowani sprzedawcy','Oceny ⭐','Bez reklam — za darmo dla wszystkich, zawsze','Szukaj czegokolwiek w Albanii...','Nowe','Używane','Za darmo','Zobacz wszystkie','Obecnie brak ogłoszeń','Bądź pierwszy, który doda!','Zainstaluj','Udostępnij'],
  cs:['Prodej · Kup · Uzavři obchod','Albánská platforma č. 1','online obchodu','Uživatelé','Inzeráty','Prodejci','Vše','Přihlásit / Registrovat','Domů','Hledat','Zprávy','Profil','Ověření prodejci','Hodnocení ⭐','Bez reklam — zdarma pro všechny, navždy','Hledej cokoliv v Albánii...','Nové','Použité','Zdarma','Zobrazit vše','Momentálně žádné inzeráty','Buď první, kdo přidá!','Instalovat','Sdílet'],
  sk:['Predaj · Kúp · Uzavri obchod','Albánska platforma č. 1','online obchodu','Používatelia','Inzeráty','Predajcovia','Všetko','Prihlásiť / Registrovať','Domov','Hľadať','Správy','Profil','Overení predajcovia','Hodnotenia ⭐','Bez reklám — zadarmo pre všetkých, navždy','Hľadaj čokoľvek v Albánsku...','Nové','Použité','Zadarmo','Zobraziť všetko','Momentálne žiadne inzeráty','Buď prvý, kto pridá!','Inštalovať','Zdieľať'],
  hu:['Adj el · Vásárolj · Kösd meg az üzletet','Az #1 albán platform','az online kereskedelemben','Felhasználók','Hirdetések','Eladók','Összes','Belépés / Regisztráció','Kezdőlap','Keresés','Üzenetek','Profil','Ellenőrzött eladók','Értékelések ⭐','Reklámmentes — mindenkinek, mindig ingyen','Keress bármit Albániában...','Új','Használt','Ingyenes','Összes megtekintése','Jelenleg nincs hirdetés','Légy az első, aki hozzáad!','Telepítés','Megosztás'],
  nl:['Verkoop · Koop · Sluit je deal','Het #1 Albanese platform','voor online handel','Gebruikers','Advertenties','Verkopers','Alles','Inloggen / Registreren','Home','Zoeken','Berichten','Profiel','Geverifieerde verkopers','Beoordelingen ⭐','Geen advertenties — altijd gratis voor iedereen','Zoek alles in Albanië...','Nieuw','Gebruikt','Gratis','Bekijk alles','Momenteel geen advertenties','Wees de eerste die er een toevoegt!','Installeren','Delen'],
  pt:['Venda · Compre · Feche negócio','A plataforma albanesa n.º 1','do comércio online','Utilizadores','Anúncios','Vendedores','Todos','Entrar / Registar','Início','Pesquisar','Mensagens','Perfil','Vendedores verificados','Avaliações ⭐','Sem anúncios — grátis para todos, sempre','Pesquise qualquer coisa na Albânia...','Novo','Usado','Grátis','Ver tudo','Sem anúncios de momento','Seja o primeiro a adicionar!','Instalar','Partilhar'],
  uk:['Продавай · Купуй · Уклади угоду','Албанська платформа №1','онлайн-торгівлі','Користувачі','Оголошення','Продавці','Усі','Вхід / Реєстрація','Головна','Пошук','Повідомлення','Профіль','Перевірені продавці','Відгуки ⭐','Без реклами — безкоштовно для всіх, завжди','Шукай будь-що в Албанії...','Нове','Вживане','Безкоштовно','Переглянути всі','Наразі немає оголошень','Будь першим, хто додасть!','Встановити','Поділитися'],
  ru:['Продай · Купи · Заключи сделку','Албанская платформа №1','онлайн-торговли','Пользователи','Объявления','Продавцы','Все','Вход / Регистрация','Главная','Поиск','Сообщения','Профиль','Проверенные продавцы','Отзывы ⭐','Без рекламы — бесплатно для всех, всегда','Ищи что угодно в Албании...','Новое','Б/у','Бесплатно','Смотреть все','Пока нет объявлений','Будь первым, кто добавит!','Установить','Поделиться'],
  sv:['Sälj · Köp · Gör din affär','Albaniens plattform nr 1','för e-handel','Användare','Annonser','Säljare','Alla','Logga in / Registrera','Hem','Sök','Meddelanden','Profil','Verifierade säljare','Omdömen ⭐','Inga annonser — gratis för alla, alltid','Sök vad som helst i Albanien...','Ny','Begagnad','Gratis','Visa alla','Inga annonser just nu','Bli först med att lägga till!','Installera','Dela'],
  da:['Sælg · Køb · Gør din handel','Den albanske platform nr. 1','for onlinehandel','Brugere','Annoncer','Sælgere','Alle','Log ind / Tilmeld','Hjem','Søg','Beskeder','Profil','Verificerede sælgere','Anmeldelser ⭐','Ingen reklamer — gratis for alle, altid','Søg alt i Albanien...','Ny','Brugt','Gratis','Se alle','Ingen annoncer lige nu','Vær den første til at tilføje!','Installer','Del'],
  fi:['Myy · Osta · Tee kaupat','Albanian ykkösalusta','verkkokaupalle','Käyttäjät','Ilmoitukset','Myyjät','Kaikki','Kirjaudu / Rekisteröidy','Koti','Haku','Viestit','Profiili','Varmennetut myyjät','Arvostelut ⭐','Ei mainoksia — aina ilmainen kaikille','Etsi mitä tahansa Albaniasta...','Uusi','Käytetty','Ilmainen','Näytä kaikki','Ei ilmoituksia juuri nyt','Ole ensimmäinen, joka lisää!','Asenna','Jaa'],
  no:['Selg · Kjøp · Gjør din handel','Albanias plattform nr. 1','for netthandel','Brukere','Annonser','Selgere','Alle','Logg inn / Registrer','Hjem','Søk','Meldinger','Profil','Verifiserte selgere','Vurderinger ⭐','Ingen reklame — gratis for alle, alltid','Søk etter hva som helst i Albania...','Ny','Brukt','Gratis','Se alle','Ingen annonser akkurat nå','Bli den første som legger til!','Installer','Del'],
  et:['Müü · Osta · Tee tehing','Albaania platvorm nr 1','veebikaubanduses','Kasutajad','Kuulutused','Müüjad','Kõik','Logi sisse / Registreeru','Avaleht','Otsi','Sõnumid','Profiil','Kinnitatud müüjad','Hinnangud ⭐','Reklaamivaba — alati kõigile tasuta','Otsi Albaanias ükskõik mida...','Uus','Kasutatud','Tasuta','Vaata kõiki','Praegu kuulutusi pole','Ole esimene, kes lisab!','Paigalda','Jaga'],
  lv:['Pārdod · Pērc · Noslēdz darījumu','Albānijas platforma nr. 1','tiešsaistes tirdzniecībai','Lietotāji','Sludinājumi','Pārdevēji','Visi','Ieiet / Reģistrēties','Sākums','Meklēt','Ziņas','Profils','Verificēti pārdevēji','Atsauksmes ⭐','Bez reklāmām — vienmēr bez maksas visiem','Meklē jebko Albānijā...','Jauns','Lietots','Bez maksas','Skatīt visus','Šobrīd sludinājumu nav','Esi pirmais, kas pievieno!','Instalēt','Dalīties'],
  lt:['Parduok · Pirk · Sudaryk sandorį','Albanijos platforma nr. 1','internetinei prekybai','Vartotojai','Skelbimai','Pardavėjai','Visi','Prisijungti / Registruotis','Pradžia','Ieškoti','Žinutės','Profilis','Patvirtinti pardavėjai','Įvertinimai ⭐','Be reklamų — visada nemokama visiems','Ieškok bet ko Albanijoje...','Naujas','Naudotas','Nemokamai','Žiūrėti visus','Šiuo metu skelbimų nėra','Būk pirmas, kuris pridės!','Įdiegti','Dalintis'],
}

const TR_URL = 'https://sopafwfkrxpcdaljddoh.supabase.co/functions/v1/translate'
const SKIP_TAGS = new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','CODE','PRE'])
const hasLetters = (s: string) => /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/.test(s)
/* Kodet, shumat, emailet dhe URL-te nuk perkthehen kurre: nje fature 'ALP-2026-00001'
   ose '999.90 ALL' e perkthyer eshte gabim i rende, jo permiresim. */
const eshteKod = (s: string) => (
  (/\d/.test(s) && s.split(/\s+/).length <= 4) ||
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ||
  /^https?:\/\//i.test(s) ||
  /^#[0-9A-Fa-f]{3,8}$/.test(s) ||
  (s.length <= 6 && s === s.toUpperCase() && /[A-Z]/.test(s))
)
/* Atributet qe permbajne tekst per njeriun ose per lexuesin e ekranit. */
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt']

interface I18nCtx { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }
const Ctx = createContext<I18nCtx>({ lang: 'sq', setLang: () => {}, t: (k) => k })

function detect(): Lang {
  if (typeof document === 'undefined') return 'sq'
  // `document.cookie` HEDH përjashtim kur ruajtja bllokohet (modalitet privat strikt, sandbox,
  // politikë ndërmarrjeje). Pa këtë try/catch, i18n-i (provider global) rrëzonte ÇDO faqe,
  // përfshi /u — "Diçka shkoi gabim!" (gjetja O26). Fail-soft → gjuha e parazgjedhur.
  try {
    const m = document.cookie.match(/(?:^|; )alpazar_lang=([a-z]{2})/)
    if (m && LANGS.some(l => l.code === m[1])) return m[1] as Lang
  } catch {}
  try { const s = localStorage.getItem('alpazar_lang'); if (s && LANGS.some(l => l.code === s)) return s as Lang } catch {}
  // Paneli eshte mjet i brendshem shqip. Pa nje zgjedhje te shprehur te adminit
  // nuk perkthehet nga gjuha e shfletuesit — perndryshe hapet gjithmone anglisht.
  try { if (location.pathname.startsWith('/admin')) return 'sq' } catch {}
  const nav = (navigator.language || 'sq').slice(0, 2).toLowerCase()
  return (LANGS.some(l => l.code === nav) ? nav : 'sq') as Lang
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('sq')
  const store = useRef<Map<Text, string>>(new Map())
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

  /* Shtresa 2+3: fjalor UI + auto-përkthim AI i teksteve të panjohura (me cache). */
  useEffect(() => {
    if (typeof document === 'undefined') return
    const idx = new Map(UI_KEYS.map((k, i) => [k, i] as const))
    const tr = UI[lang]
    let cache: Record<string, string> = {}
    const cacheKey = `az_tr_${lang}`
    if (tr) { try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}') } catch {} }

    /* SHQIPJA ESHTE BURIMI — `UI` s'ka celes 'sq'. Pra kur lang='sq' dhe asgje
       s'eshte perkthyer ende, ky efekt e ecte gjithe DOM-in, u vinte cdo
       elementi nje `data-i18n-*` rezerve dhe i rishkruante tekstet me VETEN e
       tyre: zero perfitim, kosto reale. Kostoja u mat me 31 gusht 2026 ne
       shfletues: DOM-i mutohej PARA se segmenti i faqes te perfundonte
       hidratimin, ndaj React jepte
         "A tree hydrated but some attributes … didn't match … This won't be
          patched up"
       te /profile, /search, /search/results, /messages dhe /notifications —
       me diferencen pikerisht `data-i18n-aria-label` / `data-i18n-placeholder`.
       Pra perdoruesi shqiptar, qe eshte shumica, paguante nje hidratim te
       prishur per nje perkthim qe nuk i duhej.

       Dalja e hershme vlen VETEM per rastin e paster: pa fjalor (burim), pa
       tekste te ruajtura per t'u rikthyer dhe pa gjurme perkthimi ne DOM.
       Kthimi en→sq e ka `store` te mbushur ose `data-i18n-*` ne DOM, ndaj
       kalon me poshte dhe rikthimi behet si me pare. */
    if (!tr && store.current.size === 0 &&
        !document.querySelector(ATTRS.map(a => `[data-i18n-${a}]`).join(','))) return
    const pendingSet = new Set<string>()
    let queue = new Set<string>()
    let timer: ReturnType<typeof setTimeout> | null = null
    let dead = false

    const applyText = (n: Text) => {
      const p = n.parentElement
      if (p && (SKIP_TAGS.has(p.tagName) || p.closest('[data-no-translate]'))) return
      const orig = store.current.get(n) ?? (n.nodeValue || '')
      const t0 = orig.trim()
      if (!t0) return
      const i = idx.get(t0)
      if (i !== undefined) {
        if (!store.current.has(n)) store.current.set(n, n.nodeValue || '')
        const base = store.current.get(n) || ''
        n.nodeValue = tr ? base.replace(t0, tr[i]) : base
        return
      }
      if (!tr) { if (store.current.has(n)) n.nodeValue = store.current.get(n) || ''; return }
      if (t0.length < 2 || t0.length > 160 || !hasLetters(t0) || eshteKod(t0)) return
      if (cache[t0] !== undefined) {
        if (!store.current.has(n)) store.current.set(n, n.nodeValue || '')
        const base = store.current.get(n) || ''
        n.nodeValue = base.replace(t0, cache[t0])
        return
      }
      if (!pendingSet.has(t0)) { pendingSet.add(t0); queue.add(t0) }
    }
    const applyAttr = (el: Element, a: string) => {
      const bak = 'data-i18n-' + a
      const orig = el.getAttribute(bak) ?? el.getAttribute(a) ?? ''
      const t0 = orig.trim()
      if (!t0) return
      if (!el.hasAttribute(bak)) el.setAttribute(bak, orig)
      const i = idx.get(t0)
      if (i !== undefined) { el.setAttribute(a, tr ? tr[i] : orig); return }
      if (!tr) { el.setAttribute(a, orig); return }
      if (t0.length < 2 || t0.length > 160 || !hasLetters(t0) || eshteKod(t0)) return
      if (cache[t0] !== undefined) { el.setAttribute(a, cache[t0]); return }
      if (!pendingSet.has(t0)) { pendingSet.add(t0); queue.add(t0) }
    }
    const applyAttrs = (root: Element | Document) => {
      ATTRS.forEach(a => {
        if (root instanceof Element && root.hasAttribute(a) && !root.closest('[data-no-translate]')) applyAttr(root, a)
        root.querySelectorAll('[' + a + ']').forEach(el => {
          if (el.closest('[data-no-translate]')) return
          applyAttr(el, a)
        })
      })
    }
    const applyNode = (root: Node) => {
      if (root.nodeType === 3) { applyText(root as Text); return }
      if (root.nodeType !== 1 && root.nodeType !== 9) return
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let n: Node | null
      while ((n = w.nextNode())) applyText(n as Text)
      applyAttrs(root as Element | Document)
    }
    const flush = () => {
      if (dead || !tr || queue.size === 0) return
      const batch = Array.from(queue).slice(0, 50)
      queue = new Set(Array.from(queue).slice(50))
      fetch(TR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts: batch, target: lang }) })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (dead || !d || !Array.isArray(d.translations)) return
          batch.forEach((src, i) => { if (typeof d.translations[i] === 'string') cache[src] = d.translations[i] })
          try { localStorage.setItem(cacheKey, JSON.stringify(cache)) } catch {}
          applyNode(document.body)
          if (queue.size > 0) { timer = setTimeout(flush, 600) }
        })
        .catch(() => {})
    }
    const schedule = () => { if (timer) clearTimeout(timer); timer = setTimeout(flush, 400) }

    applyNode(document.body)
    schedule()
    if (!tr) return
    const mo = new MutationObserver((muts) => {
      muts.forEach(m => m.addedNodes.forEach(nd => applyNode(nd)))
      schedule()
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { dead = true; if (timer) clearTimeout(timer); mo.disconnect() }
  }, [lang])

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useT() { return useContext(Ctx) }
