// Pure auth-input helpers, extracted so they can be unit-tested in isolation
// (used by app/auth/login/page.tsx). No React / no side effects.

export function detectType(val: string): 'email' | 'phone' | 'unknown' {
  if (val.includes('@')) return 'email'
  const clean = val.replace(/[\s\-().]/g, '')
  if (/^\+\d{7,15}$/.test(clean)) return 'phone'
  if (/^00\d{9,14}$/.test(clean)) return 'phone'
  if (/^0[67]\d{7,}$/.test(clean)) return 'phone'
  if (/^[67]\d{7,}$/.test(clean)) return 'phone'
  return 'unknown'
}

export function toE164(phone: string): string {
  const clean = phone.replace(/[\s\-().]/g, '')
  if (clean.startsWith('+')) return clean
  if (clean.startsWith('00')) return '+' + clean.slice(2)
  if (/^0[67]\d{7,}$/.test(clean)) return '+355' + clean.slice(1)
  if (/^[67]\d{7,}$/.test(clean)) return '+355' + clean
  return '+' + clean
}
