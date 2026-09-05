// WEB-PUSH — ndihmësit e klientit (5 shtator 2026).
//
// Freskia: SW-ja push-only regjistrohet me scope '/push-scope/' (s'kontrollon faqet
// reale), me updateViaCache:'none' (skedari rikontrollohet gjithmonë). Nëse çelësi
// VAPID publik s'është vendosur, GJITHÇKA këtu është inerte — s'regjistrohet asgjë,
// UI-ja fshihet, freskia mbetet e paprekur.

import { supabase } from './supabase'

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const SCOPE = '/push-scope/'
export const PUSH_SW_URL = '/push-sw.js'

export function pushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

export function pushConfigured(): boolean { return !!VAPID }

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1)
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia?.('(display-mode: standalone)')?.matches === true
      || (navigator as any).standalone === true
  } catch { return false }
}

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

async function waitActive(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.active) return
  const sw = reg.installing || reg.waiting
  if (!sw) return
  await new Promise<void>(resolve => {
    const done = () => resolve()
    sw.addEventListener('statechange', () => { if (sw.state === 'activated') done() })
    setTimeout(done, 3500)
  })
}

/** Gjendja aktuale: a mund/duhet të shfaqet toggle-i, dhe a është aktiv. */
export async function pushStatus(): Promise<{
  supported: boolean; configured: boolean; permission: NotificationPermission | 'unsupported'; subscribed: boolean
}> {
  if (!pushSupported()) return { supported: false, configured: pushConfigured(), permission: 'unsupported', subscribed: false }
  let subscribed = false
  try {
    const reg = await navigator.serviceWorker.getRegistration(SCOPE)
    const sub = reg ? await reg.pushManager.getSubscription() : null
    subscribed = !!sub
  } catch { /* ignore */ }
  return { supported: true, configured: pushConfigured(), permission: Notification.permission, subscribed }
}

/** THIRRET nga një veprim përdoruesi (klik) — kërkohet gjest për iOS. */
export async function subscribePush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' }
  if (!pushConfigured()) return { ok: false, reason: 'unconfigured' }
  try {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return { ok: false, reason: 'denied' }

    const reg = await navigator.serviceWorker.register(PUSH_SW_URL, { scope: SCOPE, updateViaCache: 'none' })
    await waitActive(reg)

    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID) as unknown as BufferSource,
      })
    }
    const json: any = sub.toJSON()
    const keys = json.keys || {}
    if (!json.endpoint || !keys.p256dh || !keys.auth) return { ok: false, reason: 'invalid' }

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ua: navigator.userAgent.slice(0, 300),
      last_seen: new Date().toISOString(),
    }, { onConflict: 'endpoint' })
    if (error) return { ok: false, reason: 'db' }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, reason: e?.name || 'error' }
  }
}

export async function unsubscribePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration(SCOPE)
    const sub = reg ? await reg.pushManager.getSubscription() : null
    if (sub) {
      const ep = sub.endpoint
      await sub.unsubscribe().catch(() => {})
      await supabase.from('push_subscriptions').delete().eq('endpoint', ep)
    }
    if (reg) await reg.unregister().catch(() => {})
  } catch { /* ignore */ }
}
