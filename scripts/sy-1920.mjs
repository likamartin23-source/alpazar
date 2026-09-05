import { chromium } from 'playwright'
const B = process.env.BAZA || 'https://alpazar.vercel.app'
const L='dcc29dcc-ad56-4297-b299-5fb7e4ea6349', BZ='49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const faqet=[['listing',`/listing/${L}`],['search-results','/search/results?q=makina'],['biznese-id',`/biznese/${BZ}`],['asistent','/asistent'],['takedown','/takedown'],['premium','/premium']]
const sh=await chromium.launch()
const k=await sh.newContext({viewport:{width:1920,height:1080},locale:'sq-AL'})
await k.addInitScript(()=>{try{localStorage.setItem('alpazar_age_ok','1');localStorage.setItem('alpazar_onboarded','1');localStorage.setItem('alpazar_cookie_consent','accepted')}catch{}})
for(const [emri,u] of faqet){
  const f=await k.newPage()
  try{
    await f.goto(B+u,{waitUntil:'domcontentloaded',timeout:45000}); await f.waitForTimeout(5000)
    await f.screenshot({path:`.ops/autopsi/sy-1920-${emri}.png`})
    console.log('OK '+emri)
  }catch(e){console.log('GABIM '+emri+' '+e.message.slice(0,60))}
  await f.close()
}
await sh.close()
