'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { detectType, toE164 } from '../../../lib/authHelpers'

type Mode = 'login' | 'register' | 'forgot'
type Step = 'form' | 'otp' | 'new-pass' | 'totp' | 'link-sent'

const FN_URL = 'https://sopafwfkrxpcdaljddoh.supabase.co/functions/v1'

function fmt2(n: number) { return String(n).padStart(2, '0') }

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
  body{background:#FFFBEA;}
  .wrap{min-height:100vh;background:#FFFBEA;display:flex;align-items:center;justify-content:center;padding:20px;}
  .card{background:#fff;border-radius:16px;border:1.5px solid #e0b030;padding:28px 24px;width:100%;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.06);}
  .logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:20px;}
  .brand{font-size:24px;font-weight:700;color:#111;letter-spacing:2px;}
  h2{font-size:17px;font-weight:700;color:#111;margin-bottom:5px;text-align:center;}
  .sub{font-size:12px;color:#888;text-align:center;margin-bottom:18px;line-height:1.6;}
  .sub strong{color:#111;}
  .row-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .field{margin-bottom:12px;}
  label{font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px;}
  input[type=text],input[type=email],input[type=tel],input[type=number],input[type=password]{width:100%;border:1.5px solid #ddd;border-radius:8px;padding:11px 13px;font-size:13px;font-family:inherit;outline:none;transition:border .15s;background:#fff;color:#111;}
  input:focus{border-color:#F5C842;}
  .hint{font-size:10px;color:#aaa;margin-top:4px;line-height:1.5;}
  .hint.ok{color:#3B6D11;}
  .hint.warn{color:#A05000;}
  .btn{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px;box-shadow:0 4px 14px -3px rgba(230,51,18,.45);transition:transform .15s ease,box-shadow .15s ease;}
  .btn:hover{transform:translateY(-1px);box-shadow:0 7px 20px -4px rgba(230,51,18,.55);}
  .btn:disabled{opacity:.6;cursor:not-allowed;}
  .btn-ghost{width:100%;background:none;color:#555;border:1.5px solid #ddd;border-radius:9px;padding:12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:8px;transition:border .15s;}
  .btn-ghost:hover{border-color:#bbb;}
  .btn-yellow{width:100%;background:#F5C842;color:#111;border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px;transition:opacity .15s;}
  .btn-yellow:hover{opacity:.9;}
  .msg{text-align:center;font-size:12px;padding:10px 12px;border-radius:8px;margin-bottom:12px;font-weight:500;line-height:1.5;}
  .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
  .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
  .info{background:#EEF4FF;color:#185FA5;border:0.5px solid #85B7EB;}
  .warn{background:#FFF8EE;color:#A05000;border:0.5px solid #F5C842;}
  .divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:#ccc;font-size:12px;}
  .divider::before,.divider::after{content:'';flex:1;border-top:1px solid #eee;}
  .back{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:14px;color:#888;font-size:12px;cursor:pointer;}
  .back:hover{color:#E63312;}
  .otp-row{display:flex;gap:8px;justify-content:center;margin-bottom:16px;}
  .otp-input{width:46px;height:54px;border:2px solid #e0e0e0;border-radius:12px;font-size:22px;font-weight:700;text-align:center;color:#111;outline:none;transition:border-color .15s ease,box-shadow .15s ease;background:#fff;}
  .otp-input:focus{border-color:#111;box-shadow:0 4px 16px -4px rgba(0,0,0,.2);}
  .otp-input:focus{border-color:#F5C842;background:#FFFBEA;}
  .otp-input.filled{border-color:#E63312;color:#E63312;}
  .otp-input:disabled{background:#f9f9f9;color:#bbb;border-color:#eee;}
  .countdown{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:8px 12px;border-radius:8px;background:#FFFBEA;border:1px solid #f0e0a8;}
  .countdown-time{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;}
  .countdown-time.ok-c{color:#3B6D11;}
  .countdown-time.warn-c{color:#A05000;}
  .countdown-time.err-c{color:#E63312;}
  .resend-btn{font-size:12px;color:#E63312;font-weight:600;background:none;border:none;cursor:pointer;font-family:inherit;text-decoration:underline;}
  .resend-btn:disabled{color:#bbb;text-decoration:none;cursor:default;}
  .steps{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:16px;}
  .step-dot{width:8px;height:8px;border-radius:50%;background:#eee;}
  .step-dot.active{background:#E63312;width:20px;border-radius:4px;}
  .step-dot.done{background:#97C459;}
  .terms{font-size:10px;color:#aaa;text-align:center;margin-top:10px;line-height:1.6;}
  .terms a{color:#888;text-decoration:underline;}
  .pass-wrap{position:relative;}
  .pass-toggle{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;font-size:13px;padding:4px;}
  .contact-wrap{position:relative;}
  .contact-type{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none;}
  .forgot-link{display:block;text-align:center;font-size:11px;color:#aaa;cursor:pointer;margin-top:4px;}
  .forgot-link:hover{color:#E63312;text-decoration:underline;}
  .sms-fail-box{background:#FFF8EE;border:1.5px solid #F5C842;border-radius:12px;padding:14px;margin-bottom:10px;}
  .sms-fail-header{display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;}
  .sms-fail-header span{font-size:22px;flex-shrink:0;}
  .sms-fail-header strong{font-size:13px;font-weight:700;color:#111;display:block;margin-bottom:3px;}
  .sms-fail-header p{font-size:11px;color:#888;margin:0;line-height:1.5;}
  .sec-row{text-align:center;font-size:12px;color:#888;margin-top:6px;}
  .sec-row a{color:#E63312;font-weight:700;cursor:pointer;text-decoration:none;}
  .sec-row a:hover{text-decoration:underline;}
`

const OTP_SECONDS = 120 // 2 minuta — duhet të përputhet me OTP_VALIDITY_MS=120*1000 në edge function

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login')
  const [step, setStep] = useState<Step>('form')

  // login fields
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // register extra fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')

  // register password fields
  const [regPass, setRegPass] = useState('')
  const [regPass2, setRegPass2] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [showRegPass2, setShowRegPass2] = useState(false)

  // new password (forgot flow)
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showNewPass2, setShowNewPass2] = useState(false)

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const [expired, setExpired] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [resolvedId, setResolvedId] = useState('')
  // Google login shfaqet vetëm kur admini e ndez flamurin (pas konfigurimit të
  // provider-it në Supabase). Default: fshehur, që të mos dështojë butoni.
  const [googleOn, setGoogleOn] = useState(false)

  // 2FA (TOTP) state
  const [totpCode, setTotpCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [forgotTokens, setForgotTokens] = useState<{access: string; refresh: string} | null>(null)

  // Reset mode: user arrived via recovery magic link (?reset=1)
  const [isResetMode, setIsResetMode] = useState(false)

  // KOMA 6-b: Age gate 16+ per L.124/2024 n.8
  const [showAgeGate, setShowAgeGate] = useState<boolean | null>(null)
  const [ageGateUserId, setAgeGateUserId] = useState('')

  // Auto-submit cancel — tregon "Duke verifikuar në Xs..." me mundësi anulimi
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoSubmitIn, setAutoSubmitIn] = useState<number>(0)
  const autoSubmitCountRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Bllokon ridrejtimin nga onAuthStateChange gjatë fluksit të verifikimit OTP.
  // Kur setSession() vendos sesionin, onAuthStateChange nuk duhet të ridrejtojë
  // derisa vetë kodi ta bëjë eksplicit (pasi fjalëkalimi të ndryshohet ose regjistrimi të plotësohet).
  const blockAuthRedirectRef = useRef(false)

  function cancelAutoSubmit() {
    if (autoSubmitTimerRef.current) { clearTimeout(autoSubmitTimerRef.current); autoSubmitTimerRef.current = null }
    if (autoSubmitCountRef.current) { clearInterval(autoSubmitCountRef.current); autoSubmitCountRef.current = null }
    setAutoSubmitIn(0)
  }

  function scheduleAutoSubmit(code: string) {
    cancelAutoSubmit()
    const DELAY_MS = 1500
    setAutoSubmitIn(DELAY_MS / 1000)
    autoSubmitCountRef.current = setInterval(() => {
      setAutoSubmitIn(prev => {
        if (prev <= 0.1) { clearInterval(autoSubmitCountRef.current!); return 0 }
        return +(prev - 0.1).toFixed(1)
      })
    }, 100)
    autoSubmitTimerRef.current = setTimeout(() => {
      cancelAutoSubmit()
      verifyOtp(code)
    }, DELAY_MS)
  }

  // SMS fallback — when SMS is not configured, collect email instead
  const [smsFailMode, setSmsFailMode] = useState(false)
  const [smsFailEmail, setSmsFailEmail] = useState('')
  const [originalPhone, setOriginalPhone] = useState('')

  // A është ndezur Google login? (app_config.google_login_enabled)
  useEffect(() => {
    supabase.from('app_config').select('value').eq('key', 'google_login_enabled').maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? '').toString().toLowerCase()
        setGoogleOn(v === 'true' || v === '1' || v === 'yes')
      })
  }, [])

  useEffect(() => {
    // Recovery magic link: ?reset=1 means user clicked recovery email link
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('reset') === '1') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsResetMode(true)
          setStep('new-pass')
          setMode('forgot')
        } else {
          window.location.href = '/auth/login'
        }
      })
      return
    }
    // Kontrollo sesionin ekzistues dhe dëgjo ndryshimet
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !blockAuthRedirectRef.current) window.location.href = '/'
    })
    return () => {
      subscription.unsubscribe()
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current)
      if (autoSubmitCountRef.current) clearInterval(autoSubmitCountRef.current)
    }
  }, [])

  function startCountdown() {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(OTP_SECONDS)
    setExpired(false)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); setExpired(true); setLoading(false); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function resetToForm() {
    cancelAutoSubmit()
    setStep('form'); setOtp(['', '', '', '', '', '']); setMsg(''); setExpired(false)
    setForgotTokens(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function switchMode(m: Mode) {
    setMode(m); setStep('form'); setMsg('')
    setContact(''); setPassword(''); setNewPass(''); setNewPass2('')
    setRegPass(''); setRegPass2('')
    setFirstName(''); setLastName(''); setAge(''); setResolvedId('')
    setOtp(['', '', '', '', '', '']); setExpired(false)
    setSmsFailMode(false); setSmsFailEmail(''); setOriginalPhone('')
    setForgotTokens(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // ── Module 1: Google OAuth ──────────────────────────────────────
  async function loginWithGoogle() {
    setLoading(true); setMsg('')
    const ref = document.cookie.match(/alpazar_ref=([^;]+)/)?.[1]
    // Uses custom OIDC provider 'google-oidc' stored in auth.custom_oauth_providers
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google-oidc' as 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${ref ? `?ref=${ref}` : ''}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        skipBrowserRedirect: false,
      },
    })
    if (error) {
      const m = (error.message || '').toLowerCase()
      if (m.includes('not enabled') || m.includes('provider') || m.includes('unsupported')) {
        // Provider s'është konfiguruar ende → fshihe butonin dhe mos e ngec përdoruesin.
        setGoogleOn(false)
        setMsg('err:Hyrja me Google nuk është aktive për momentin. Përdor email ose telefon.')
      } else {
        setMsg(`err:${error.message}`)
      }
    }
    setLoading(false)
  }

  // ── Module 1: 2FA TOTP verify ────────────────────────────────────
  async function verifyTotp() {
    if (totpCode.length !== 6) { setMsg('err:Fut kodin 6-shifror nga aplikacioni!'); return }
    setLoading(true); setMsg('')
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId,
      code: totpCode,
    })
    if (error) {
      setMsg(`err:${error.message.includes('Invalid') ? 'Kodi i gabuar!' : error.message}`)
    } else {
      setMsg('ok:Hyrja u krye! Duke u ridrejtuar...')
      setTimeout(() => { window.location.href = '/' }, 600)
    }
    setLoading(false)
  }

  // ── 1. LOGIN — email/phone + password ──────────────────────────────
  async function login() {
    const raw = contact.trim()
    if (!raw || !password) { setMsg('err:Plotëso të gjitha fushat!'); return }
    setLoading(true); setMsg('')
    const type = detectType(raw)
    const id = type === 'phone' ? toE164(raw) : raw

    // For phone: try phone auth first, then fall back to derived email
    // (OTP registration stores accounts as phone@sms.al internally)
    let authResult = await supabase.auth.signInWithPassword(
      type === 'phone' ? { phone: id, password } : { email: id, password }
    )
    if (type === 'phone' && authResult.error) {
      const derived = (id.startsWith('+') ? id.slice(1) : id) + '@sms.al'
      authResult = await supabase.auth.signInWithPassword({ email: derived, password })
    }

    const { error } = authResult
    if (error) {
      const raw2 = error.message.toLowerCase()
      const isWrong = raw2.includes('invalid') || raw2.includes('credentials') || raw2.includes('phone') || raw2.includes('disabled')
      const isUnconfirmed = raw2.includes('email not confirmed') || raw2.includes('email_not_confirmed')
      setMsg(`err:${
        isUnconfirmed
          ? 'Llogaria nuk është konfirmuar. Përdor "Harrova fjalëkalimin" për të konfirmuar numrin/emailin.'
          : isWrong
            ? 'Email/telefon ose fjalëkalim i gabuar!'
            : error.message
      }`)
    } else {
      // Check if 2FA is required
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const totp = factors?.totp?.[0]
        if (totp) {
          setMfaFactorId(totp.id)
          setStep('totp')
          setMsg('info:Fut kodin nga aplikacioni i autentikimit (Google Authenticator / Authy)')
          setLoading(false); return
        }
      }
      setMsg('ok:Hyrja u krye! Duke u ridrejtuar...')
      setTimeout(() => { window.location.href = '/' }, 600)
    }
    setLoading(false)
  }

  // ── 2 & 3. Send OTP (register / forgot) ────────────────────────────
  async function sendOtp() {
    const raw = contact.trim()
    if (!raw) { setMsg('err:Fut emailin ose numrin e telefonit!'); return }

    if (mode === 'register' && step !== 'otp') {
      if (!firstName.trim()) { setMsg('err:Emri është i detyrueshëm!'); return }
      if (!lastName.trim()) { setMsg('err:Mbiemri është i detyrueshëm!'); return }
      const ageN = parseInt(age)
      if (!age || ageN < 16 || ageN > 120) { setMsg('err:Mosha duhet të jetë minimumi 16 vjeç!'); return }
      if (regPass.length < 8) { setMsg('err:Fjalëkalimi duhet të ketë minimumi 8 karaktere!'); return }
      if (regPass !== regPass2) { setMsg('err:Fjalëkalimet nuk përputhen!'); return }
    }

    const type = detectType(raw)
    if (type === 'unknown') {
      setMsg('err:Fut email të vlefshëm ose nr. telefoni me prefiks (+355, +1, +44...)')
      return
    }
    const id = type === 'phone' ? toE164(raw) : raw
    setResolvedId(id)
    setLoading(true); setMsg('')
    try {
      // Email: magic link flow (Option A — zero keys, free)
      if (type === 'email') {
        const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

        // Forgot password: use resetPasswordForEmail → recovery magic link
        if (mode === 'forgot') {
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(id, {
            redirectTo: `${window.location.origin}/auth/callback?recovery=1`,
          })
          if (resetErr) {
            setMsg(`err:${resetErr.message}`)
          } else {
            setStep('link-sent')
            setMsg(`info:Email u dërgua te 📧 ${id} — kontrollo Spam/Junk nëse nuk e gjen`)
          }
          setLoading(false)
          return
        }

        // Register / login: send a 6-digit CODE via our server (Resend).
        if (mode === 'register') {
          localStorage.setItem('alpazar_reg_pending', JSON.stringify({
            full_name: fullName || null,
            age: parseInt(age) || null,
            password: regPass || null,
          }))
        }
        const otpRes = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'otp', email: id, mode,
            password: mode === 'register' ? regPass : undefined,
            full_name: fullName || undefined,
            age: parseInt(age) || undefined,
          }),
        })
        const otpJson = await otpRes.json().catch(() => ({}))
        if (otpRes.ok && otpJson.success) {
          setStep('otp'); startCountdown(); setOtp(['', '', '', '', '', ''])
          setMsg(`info:Kodi u dërgua te 📧 ${id} — kontrollo Spam/Junk nëse nuk e gjen`)
          setTimeout(() => inputRefs.current[0]?.focus(), 150)
          setLoading(false)
          return
        }
        // Rate-limit (429): mesazh i qartë shqip, jo dështim në heshtje.
        if (otpRes.status === 429 || /rate|too many|429/i.test(String(otpJson.error || ''))) {
          setMsg('err:Shumë kërkesa për kod. Prit ~60 sekonda dhe provo sërish.')
          setLoading(false)
          return
        }
        if (otpRes.status !== 503) {
          if (mode === 'register') localStorage.removeItem('alpazar_reg_pending')
          setMsg(`err:${otpJson.error || 'Gabim gjatë dërgimit të kodit. Provo sërish.'}`)
          setLoading(false)
          return
        }
        // 503 = email service not configured → fall back to magic-link flow (still works)
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: id,
          options: {
            shouldCreateUser: mode === 'register',
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            ...(fullName && { data: { full_name: fullName, age: parseInt(age) || null } }),
          },
        })
        if (otpErr) {
          localStorage.removeItem('alpazar_reg_pending')
          const em = otpErr.message.toLowerCase()
          setMsg(`err:${em.includes('not found') || em.includes('not exist') || em.includes('signup')
            ? 'Ky email nuk është i regjistruar. Regjistrohu fillimisht.'
            : otpErr.message}`)
        } else {
          setStep('link-sent')
          setMsg(`info:Email u dërgua te 📧 ${id} — kontrollo Spam/Junk nëse nuk e gjen`)
        }
        setLoading(false)
        return
      }

      // Phone: custom edge function (SMS gateway)
      const res = await fetch(`${FN_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id, mode }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        const rawErr = String(data.error ?? '')
        const isRateLimit = rawErr.includes('rate') || rawErr.includes('429') || res.status === 429
        const isInvalidPhone = rawErr.includes('invalid') || rawErr.includes('not found')
        if (isRateLimit) {
          setMsg('err:Shumë kërkesa. Provo sërish pas pak sekondash.')
        } else if (isInvalidPhone && !rawErr.includes('sms')) {
          setMsg('err:Numri i telefonit është i pavlefshëm.')
        } else {
          // Any SMS delivery/gateway failure → email fallback
          setOriginalPhone(id)
          setSmsFailMode(true)
          setMsg('')
        }
      } else {
        setStep('otp'); startCountdown(); setOtp(['', '', '', '', '', ''])
        setMsg(`info:Kodi u dërgua te 📱 ${id}`)
        setTimeout(() => inputRefs.current[0]?.focus(), 150)
      }
    } catch (e: unknown) {
      setMsg(`err:${e instanceof Error ? e.message : 'Gabim lidhjeje'}`)
    }
    setLoading(false)
  }

  // ── Send OTP via email (SMS fallback) ──────────────────────────────
  async function sendOtpViaEmail() {
    const email = smsFailEmail.trim()
    if (!email || !email.includes('@')) { setMsg('err:Fut adresën e emailit të vlefshëm!'); return }
    setLoading(true); setMsg('')
    setResolvedId(email)
    try {
      if (mode === 'forgot') {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?recovery=1`,
        })
        if (resetErr) {
          const em = resetErr.message.toLowerCase()
          if (em.includes('not found') || em.includes('not exist') || em.includes('invalid')) {
            setMsg('err:Nuk gjetëm llogari me këtë email. Nëse u regjistruat me numër telefoni, hyni direkt me: Numrin tuaj + Fjalëkalimin (nuk kërkohet SMS).')
          } else {
            setMsg(`err:${resetErr.message}`)
          }
        } else {
          setSmsFailMode(false)
          setStep('link-sent')
          setMsg(`info:Email u dërgua te 📧 ${email} — kontrollo Spam/Junk`)
        }
      } else {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: mode === 'register',
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (otpErr) {
          const em = otpErr.message.toLowerCase()
          const notFound = em.includes('not found') || em.includes('not exist') || em.includes('signup') || em.includes('invalid')
          if (notFound && mode === 'login') {
            setMsg('err:Nuk gjetëm llogari me këtë email. Nëse u regjistruat me numër telefoni, hyni direkt me: Numrin tuaj + Fjalëkalimin (nuk kërkohet SMS).')
          } else {
            setMsg('err:Gabim gjatë dërgimit të emailit. Kontrolloni adresën dhe provoni sërish.')
          }
        } else {
          setSmsFailMode(false)
          setStep('link-sent')
          setMsg(`info:Email u dërgua te 📧 ${email} — kontrollo Spam/Junk`)
        }
      }
    } catch (e: unknown) {
      setMsg(`err:${e instanceof Error ? e.message : 'Gabim lidhjeje'}`)
    }
    setLoading(false)
  }

  // ── Verify OTP (register / forgot) ─────────────────────────────────
  // codeOverride lejon auto-submit me vlerën e sapo plotësuar (para re-render të React)
  async function verifyOtp(codeOverride?: string) {
    const code = codeOverride ?? otp.join('')
    if (code.length !== 6) { setMsg('err:Plotëso kodin 6-shifror!'); return }
    if (expired) { setMsg('err:Kodi ka skaduar! Klikoje "Ridërgo" për kod të ri.'); return }
    setLoading(true); setMsg('')
    try {
      // Email: Supabase native OTP verification — bypasses custom edge function
      if (detectType(resolvedId) === 'email') {
        blockAuthRedirectRef.current = true
        const { data: vd, error: vErr } = await supabase.auth.verifyOtp({
          email: resolvedId,
          token: code,
          // Codes are issued via admin generateLink(magiclink) and relayed by our
          // server, so they verify as 'magiclink' for both register and login.
          type: 'magiclink',
        })
        if (vErr || !vd.session) {
          blockAuthRedirectRef.current = false
          const em = vErr?.message ?? ''
          setMsg(`err:${em.includes('expired') || em.includes('invalid') || em.includes('otp') || em.includes('token')
            ? 'Kodi i gabuar ose ka skaduar! Klikoje "Ridërgo" për kod të ri.'
            : em || 'Kodi i gabuar ose ka skaduar!'}`)
          setLoading(false)
          return
        }
        if (timerRef.current) clearInterval(timerRef.current)

        if (mode === 'forgot') {
          setForgotTokens({ access: vd.session.access_token, refresh: vd.session.refresh_token })
          setStep('new-pass')
          setMsg('')
          setLoading(false)
          return
        }

        // Registration: set password + update profile
        if (regPass) await supabase.auth.updateUser({ password: regPass })
        const refCookieEmail = document.cookie.match(/alpazar_ref=([^;]+)/)?.[1]
        const uid = vd.session.user.id
        const profileUpdate: Record<string, unknown> = {}
        const fn = firstName.trim(); const ln = lastName.trim()
        if (fn || ln) profileUpdate.full_name = [fn, ln].filter(Boolean).join(' ')
        if (age) profileUpdate.age = parseInt(age)
        if (refCookieEmail) profileUpdate.referred_by = refCookieEmail
        if (Object.keys(profileUpdate).length > 0) {
          await supabase.from('profiles').update(profileUpdate).eq('id', uid)
        }
        const { data: existingProfileEmail } = await supabase
          .from('profiles').select('id, created_at').eq('id', uid).single()
        const isNewUserEmail = !existingProfileEmail || (Date.now() - new Date(existingProfileEmail.created_at).getTime()) < 60000
        if (isNewUserEmail) {
          setAgeGateUserId(uid)
          setShowAgeGate(true)
          setLoading(false)
          return
        }
        setMsg('ok:Llogaria u krijua! Duke u ridrejtuar...')
        setTimeout(() => { blockAuthRedirectRef.current = false; window.location.href = '/' }, 700)
        setLoading(false)
        return
      }

      // Phone: custom edge function
      const refCookie = document.cookie.match(/alpazar_ref=([^;]+)/)?.[1]
      const res = await fetch(`${FN_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: resolvedId, code, mode,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          age: age ? parseInt(age) : undefined,
          referredBy: mode === 'register' ? (refCookie || undefined) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        const rawErr = data.error ?? 'Kodi i gabuar ose ka skaduar!'
        const friendlyErr = rawErr.toLowerCase().includes('already registered')
          ? 'Ky numër/email është i regjistruar tashmë. Hyr me fjalëkalim ose përdor "Harrova fjalëkalimin".'
          : rawErr
        setMsg(`err:${friendlyErr}`)
        setLoading(false)
        return
      }
      if (timerRef.current) clearInterval(timerRef.current)

      if (mode === 'forgot') {
        // Ruaj tokenat pa vendosur sesionin — onAuthStateChange nuk aktivizohet fare.
        // setSession() thirret vetëm brenda setNewPassword() pasi fjalëkalimi të ruhet.
        setForgotTokens({ access: data.access_token, refresh: data.refresh_token })
        setStep('new-pass')
        setMsg('')
      } else {
        // Regjistrim: vendos sesionin dhe ridrejto
        blockAuthRedirectRef.current = true
        const { error: sessErr } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
        if (sessErr) {
          blockAuthRedirectRef.current = false
          setMsg(`err:${sessErr.message}`)
          setLoading(false)
          return
        }
        // Set the password the user chose during registration
        if (regPass) {
          await supabase.auth.updateUser({ password: regPass })
        }
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          if (originalPhone) {
            await supabase.from('profiles').update({ phone: originalPhone }).eq('id', currentUser.id)
          }
          // KOMA 6-b: kontrollo nëse është përdorues i ri (created_at brenda 60s)
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, created_at')
            .eq('id', currentUser.id)
            .single()
          const isNewUser = !existingProfile || (Date.now() - new Date(existingProfile.created_at).getTime()) < 60000
          if (isNewUser) {
            setAgeGateUserId(currentUser.id)
            setShowAgeGate(true)
            setLoading(false)
            return // mos ridrejto ende — prit konfirmimin e moshës
          }
        }
        setMsg('ok:Llogaria u krijua! Duke u ridrejtuar...')
        setTimeout(() => {
          blockAuthRedirectRef.current = false
          window.location.href = '/'
        }, 700)
      }
    } catch (e: unknown) {
      setMsg(`err:${e instanceof Error ? e.message : 'Gabim lidhjeje'}`)
    }
    setLoading(false)
  }

  async function setNewPassword() {
    if (newPass.length < 8) { setMsg('err:Fjalëkalimi duhet të ketë minimumi 8 karaktere!'); return }
    if (newPass !== newPass2) { setMsg('err:Fjalëkalimet nuk përputhen!'); return }
    setLoading(true); setMsg('')

    // Recovery magic link flow: session already set by callback, just update password
    if (isResetMode) {
      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) {
        setMsg(`err:${error.message}`)
      } else {
        setMsg('ok:Fjalëkalimi u ndryshua! Duke u ridrejtuar...')
        setTimeout(() => { window.location.href = '/' }, 700)
      }
      setLoading(false)
      return
    }

    if (!forgotTokens) { setMsg('err:Sesioni ka skaduar. Provo sërish nga fillimi.'); setLoading(false); return }
    // Vendos sesionin vetëm tani — platforma nuk hapet pa fjalëkalim të ri
    blockAuthRedirectRef.current = true
    const { error: sessErr } = await supabase.auth.setSession({
      access_token: forgotTokens.access,
      refresh_token: forgotTokens.refresh,
    })
    if (sessErr) {
      blockAuthRedirectRef.current = false
      setMsg(`err:${sessErr.message}`)
      setLoading(false)
      return
    }
    if (originalPhone) {
      const { data: { user: cu } } = await supabase.auth.getUser()
      if (cu) await supabase.from('profiles').update({ phone: originalPhone }).eq('id', cu.id)
    }
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) {
      blockAuthRedirectRef.current = false
      setMsg(`err:${error.message}`)
    } else {
      setForgotTokens(null)
      setMsg('ok:Fjalëkalimi u ndryshua! Duke u ridrejtuar...')
      setTimeout(() => {
        blockAuthRedirectRef.current = false
        window.location.href = '/'
      }, 700)
    }
    setLoading(false)
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d*$/.test(val) || expired) return
    cancelAutoSubmit()
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next)
    if (val && i < 5) {
      setTimeout(() => inputRefs.current[i + 1]?.focus(), 0)
    }
    // Auto-submit me 1.5s vonesë — lë kohë për të korrigjuar gabime
    if (val && next.every(d => d !== '') && !expired) {
      scheduleAutoSubmit(next.join(''))
    }
  }
  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      cancelAutoSubmit()
      if (!otp[i] && i > 0) {
        const next = [...otp]; next[i - 1] = ''; setOtp(next)
        inputRefs.current[i - 1]?.focus()
      }
    }
    if (e.key === 'Enter' && otp.join('').length === 6) { cancelAutoSubmit(); verifyOtp() }
  }
  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    cancelAutoSubmit()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = Array(6).fill('')
    text.split('').forEach((d, i) => { next[i] = d })
    setOtp(next)
    setTimeout(() => inputRefs.current[Math.min(text.length, 5)]?.focus(), 0)
    // Auto-submit me vonesë pas paste-it
    if (text.length === 6 && !expired) {
      scheduleAutoSubmit(text)
    }
  }

  const [t, m] = msg.split(/:(.+)/)
  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60
  const timeClass = countdown > 30 ? 'ok-c' : countdown > 10 ? 'warn-c' : 'err-c'
  const stepIdx = step === 'form' ? 0 : step === 'otp' ? 1 : 2
  const cType = detectType(contact)

  const contactHint = contact.length > 2
    ? cType === 'email'
      ? <p className="hint ok"><span aria-hidden="true">📧</span> Lidhja e konfirmimit dërgohet me <strong>email</strong></p>
      : cType === 'phone'
        ? smsFailMode
          ? <p className="hint ok"><span aria-hidden="true">📧</span> Numri ruhet — kodi dërgohet me <strong>email</strong></p>
          : <p className="hint ok"><span aria-hidden="true">📱</span> Kodi konfirmimit dërgohet me <strong>SMS</strong></p>
        : <p className="hint warn">Fut email (user@domain.com) ose nr. telefoni (+355, +1, +44...)</p>
    : <p className="hint"><span aria-hidden="true">📧</span> Email &nbsp;·&nbsp; <span aria-hidden="true">📱</span> Çdo numër telefoni bote (+355, +1, +44...)</p>

  const Logo = (
    <div className="logo">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#E63312"/>
        <g fill="#111">
          <ellipse cx="20" cy="22" rx="4" ry="5.5"/>
          <circle cx="15.5" cy="13" r="3.2"/>
          <circle cx="24.5" cy="13" r="3.2"/>
          <polygon points="13,15.5 11,16.5 13,17.5"/>
          <polygon points="27,15.5 29,16.5 27,17.5"/>
          <polygon points="20,20 6,18 8,26 20,25"/>
          <polygon points="20,20 34,18 32,26 20,25"/>
          <polygon points="17,27 23,27 24,33 20,32 16,33"/>
        </g>
        <rect x="24" y="26" width="12" height="10" rx="3" fill="#F5C842"/>
      </svg>
      <span className="brand">ALPAZAR</span>
    </div>
  )

  const OtpStep = (
    <>
      <h2><span aria-hidden="true">🔐</span> Konfirmo Kodin</h2>
      <p className="sub">
        Kodi 6-shifror u dërgua te<br />
        <strong>{resolvedId}</strong><br />
        {detectType(resolvedId) === 'email' && (
          <span style={{ fontSize: 10, color: '#aaa' }}>Nëse nuk e gjen, kontrollo Spam / Junk</span>
        )}
      </p>

      <div className="countdown">
        <span style={{ fontSize: 12, color: '#888' }}>{expired ? 'Kodi skadoi' : 'Skadon në:'}</span>
        <span className={`countdown-time ${expired ? 'err-c' : timeClass}`}>
          {expired ? '0:00' : `${mins}:${fmt2(secs)}`}
        </span>
        <button
          type="button"
          className="resend-btn"
          onClick={sendOtp}
          disabled={!expired && countdown > 0}
          aria-label="Ridërgo kodin"
        >
          Ridërgo
        </button>
      </div>

      {expired && <div className="msg warn" role="alert">Kodi ka skaduar. Klikoje &quot;Ridërgo&quot; për kod të ri.</div>}

      <div className="otp-row" role="group" aria-label="Kodi i konfirmimit 6-shifror" onPaste={handleOtpPaste}>
        {otp.map((d, i) => (
          <input key={i}
            ref={el => { inputRefs.current[i] = el }}
            aria-label={`Shifra ${i + 1}`}
            className={`otp-input${d ? ' filled' : ''}`}
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
            value={d} disabled={expired || loading}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            autoComplete="one-time-code" />
        ))}
      </div>

      {autoSubmitIn > 0 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'#EEF4FF', border:'1px solid #85B7EB', borderRadius:8,
          padding:'8px 12px', marginBottom:10, fontSize:12 }}>
          <span style={{ color:'#185FA5' }}><span aria-hidden="true">⏳</span> Duke verifikuar automatikisht në <strong>{autoSubmitIn.toFixed(1)}s</strong>…</span>
          <button type="button" onClick={cancelAutoSubmit}
            style={{ background:'none', border:'none', color:'#E63312', cursor:'pointer',
              fontWeight:700, fontSize:12, padding:'0 4px' }}><span aria-hidden="true">✕</span> Anulo</button>
        </div>
      )}

      <button type="button" className="btn" onClick={() => { cancelAutoSubmit(); verifyOtp() }} disabled={loading || expired}>
        {loading ? <><span aria-hidden='true'>⏳</span> Duke verifikuar...</> : <><span aria-hidden='true'>✅</span> Konfirmo Kodin</>}
      </button>
      <button type="button" className="btn-ghost" onClick={() => { cancelAutoSubmit(); resetToForm() }}>← Ndrysho adresën</button>
    </>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ════════════════════════════════════════
          KOMA 6-b: Age gate modal — L.124/2024, neni 8
          Shfaqet vetëm pas OTP të suksesshëm për profil të ri
          ════════════════════════════════════════ */}
      {showAgeGate === true && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
          <div role="dialog" aria-modal="true" aria-label="Konfirmimi i moshës" style={{
            background: '#fff', borderRadius: 16, padding: '36px 28px',
            maxWidth: 340, width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px -12px rgba(0,0,0,0.28)',
          }}>
            <div aria-hidden="true" style={{ fontSize: 52, marginBottom: 10 }}>🔞</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8, margin: '0 0 8px' }}>
              Konfirmo moshën tënde
            </h2>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>
              Alpazar është vetëm për persona <strong>16 vjeç e lart</strong><br />
              (Ligji 124/2024, neni 8).
            </p>
            <button
              type="button"
              onClick={async () => {
                setShowAgeGate(null)
                blockAuthRedirectRef.current = false
                window.location.href = '/'
              }}
              style={{
                width: '100%', background: 'linear-gradient(135deg,#F8D24E,#F5C842)', color: '#111',
                border: 'none', borderRadius: 12, padding: '13px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                marginBottom: 10, fontFamily: 'inherit', boxShadow: '0 2px 8px -2px rgba(245,200,66,.5)',
              }}
            >
              ✅ Po, jam 16 vjeç ose më shumë
            </button>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                setShowAgeGate(null)
                setAgeGateUserId('')
                blockAuthRedirectRef.current = false
                setMsg('err:Nuk mund të regjistrohesh nën moshën 16 vjeç.')
                setStep('form')
              }}
              style={{
                width: '100%', background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff',
                border: 'none', borderRadius: 12, padding: '13px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 14px -3px rgba(230,51,18,.45)',
              }}
            >
              ❌ Jo, jam nën 16 vjeç
            </button>
          </div>
        </div>
      )}

      <div className="wrap">
        <div className="card">
          <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', margin: 0 }}>Alpazar — Autentikimi</h1>
          {Logo}

          {mode !== 'login' && (
            <div className="steps">
              {Array.from({ length: mode === 'forgot' ? 3 : 2 }).map((_, i) => (
                <div key={i} className={`step-dot ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}`} />
              ))}
            </div>
          )}

          {msg && <div className={`msg ${t}`} role="alert">{m}</div>}

          {/* ════════════════════════════════════════
              1. HYRJA — email/telefon + fjalëkalim (PRIMARE)
              ════════════════════════════════════════ */}
          {mode === 'login' && step === 'form' && (
            <form onSubmit={e => { e.preventDefault(); login() }}>
              <h2>Mirë se vini në ALPAZAR</h2>
              <p className="sub">Shit · Bli · Bëj Pazrin Tënd</p>

              <div className="field">
                <label htmlFor="login-identifier">Email ose Numër Telefoni</label>
                <div className="contact-wrap">
                  <input
                    id="login-identifier"
                    type="text"
                    placeholder="+355 6X XXX XXXX  ose  email@domain.com"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && login()}
                    autoComplete="username"
                    style={{ paddingRight: 36 }}
                  />
                  <span className="contact-type">
                    {cType === 'email' ? <span aria-hidden='true'>📧</span> : cType === 'phone' ? <span aria-hidden='true'>📱</span> : null}
                  </span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="login-password">Fjalëkalimi</label>
                <div className="pass-wrap">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && login()}
                    autoComplete="current-password"
                    style={{ paddingRight: 36 }}
                  />
                  <button type="button" className="pass-toggle" aria-label={showPass ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'} aria-pressed={showPass} onClick={() => setShowPass(v => !v)}>
                    <span aria-hidden="true">{showPass ? '🙈' : '👁️'}</span>
                  </button>
                </div>
                {/* 3. Rikthimi — tertiar, nën fjalëkalim */}
                <span className="forgot-link" role="button" tabIndex={0} onClick={() => switchMode('forgot')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') switchMode('forgot') }}>
                  Keni harruar fjalëkalimin?
                </span>
              </div>

              {/* Butoni kryesor */}
              <button className="btn" type="submit" disabled={loading}>
                {loading ? <><span aria-hidden='true'>⏳</span> Duke hyrë...</> : <><span aria-hidden='true'>🔑</span> Hyr</>}
              </button>

              {/* Module 1: Google OAuth — shfaqet vetëm kur provider-i është ndezur
                  (app_config.google_login_enabled = 'true'). Përndryshe butoni do
                  të dështonte me "provider is not enabled". */}
              {googleOn && (
                <>
                  <div className="divider">ose vazhdo me</div>
                  <button className="btn-ghost" type="button" onClick={loginWithGoogle} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.1-10.3 7.1-17.2z"/><path fill="#34A853" d="M24 47c6.5 0 11.9-2.1 15.9-5.8l-7.8-6c-2.1 1.4-4.8 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.6v6.2C6.5 41.7 14.7 47 24 47z"/><path fill="#FBBC04" d="M10.6 27.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6v-6.2H2.6C1 15.6 0 19.7 0 24s1 8.4 2.6 11.8l8-6.2z"/><path fill="#E94235" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.4 30.5 0 24 0 14.7 0 6.5 5.3 2.6 13.2l8 6.2C12.5 13.7 17.8 9.5 24 9.5z"/></svg>
                    Hyr me Google
                  </button>
                </>
              )}

              {/* 2. Regjistrimi — sekondare */}
              <div className="divider">ose</div>
              <button className="btn-yellow" type="button" onClick={() => switchMode('register')}>
                <><span aria-hidden="true">📝</span> Regjistrohu Falas</>
              </button>
            </form>
          )}

          {/* ════════════════════════════════════════
              2. REGJISTRIMI — OTP (SEKONDARE)
              ════════════════════════════════════════ */}
          {mode === 'register' && step === 'form' && (
            <>
              <h2><span aria-hidden="true">📝</span> Regjistrohu Falas</h2>
              <p className="sub">Krijo llogarinë tënde — konfirmo me email ose SMS</p>

              <div className="row-2">
                <div className="field">
                  <label htmlFor="reg-firstname">Emri *</label>
                  <input id="reg-firstname" type="text" placeholder="Arta" value={firstName}
                    onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
                <div className="field">
                  <label htmlFor="reg-lastname">Mbiemri *</label>
                  <input id="reg-lastname" type="text" placeholder="Hoxha" value={lastName}
                    onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
              </div>

              <div className="field">
                <label htmlFor="reg-age">Mosha * (min. 16 vjeç)</label>
                <input id="reg-age" type="number" placeholder="25" value={age} min="16" max="120"
                  onChange={e => setAge(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="reg-identifier">Email ose Numër Telefoni *</label>
                <div className="contact-wrap">
                  <input id="reg-identifier" type="text"
                    placeholder="+355 6X XXX XXXX  ose  email@domain.com"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    autoComplete="email"
                    style={{ paddingRight: 36 }} />
                  <span className="contact-type">
                    {cType === 'email' ? <span aria-hidden='true'>📧</span> : cType === 'phone' ? <span aria-hidden='true'>📱</span> : null}
                  </span>
                </div>
                {contactHint}
              </div>

              <div className="field">
                <label htmlFor="reg-password">Fjalëkalimi * (min. 8 karaktere)</label>
                <div className="pass-wrap">
                  <input id="reg-password" type={showRegPass ? 'text' : 'password'} placeholder="••••••••"
                    value={regPass} onChange={e => setRegPass(e.target.value)}
                    autoComplete="new-password" style={{ paddingRight: 36 }} />
                  <button type="button" className="pass-toggle" aria-label={showRegPass ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'} aria-pressed={showRegPass} onClick={() => setShowRegPass(v => !v)}>
                    <span aria-hidden="true">{showRegPass ? '🙈' : '👁️'}</span>
                  </button>
                </div>
                {regPass.length > 0 && regPass.length < 8 && (
                  <p className="hint warn">Minimum 8 karaktere</p>
                )}
              </div>

              <div className="field">
                <label htmlFor="reg-password-confirm">Konfirmo Fjalëkalimin *</label>
                <div className="pass-wrap">
                  <input id="reg-password-confirm" type={showRegPass2 ? 'text' : 'password'} placeholder="••••••••"
                    value={regPass2} onChange={e => setRegPass2(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    autoComplete="new-password" />
                  <button type="button" className="pass-toggle" aria-label={showRegPass2 ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'} aria-pressed={showRegPass2} onClick={() => setShowRegPass2(v => !v)}>
                    <span aria-hidden="true">{showRegPass2 ? '🙈' : '👁️'}</span>
                  </button>
                </div>
                {regPass2.length > 0 && regPass !== regPass2 && (
                  <p className="hint warn">Fjalëkalimet nuk përputhen</p>
                )}
              </div>

              {!smsFailMode ? (
                <>
                  <button type="button" className="btn" onClick={sendOtp} disabled={loading}>
                    {loading ? <><span aria-hidden='true'>⏳</span> Duke dërguar...</> : cType === 'email' ? <><span aria-hidden='true'>📨</span> Dërgo Linkun e Konfirmimit</> : <><span aria-hidden='true'>📨</span> Dërgo Kodin e Konfirmimit</>}
                  </button>
                  <div className="sec-row">Ke llogari? &nbsp;<a role="button" tabIndex={0} onClick={() => switchMode('login')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') switchMode('login') }} style={{ cursor: 'pointer' }}>Hyr →</a></div>
                  <p className="terms">
                    Duke u regjistruar pranon{' '}
                    <a href="/kushtet">Kushtet e Përdorimit</a> dhe{' '}
                    <a href="/privatesia">Politikën e Privatësisë</a>
                  </p>
                </>
              ) : (
                <div className="sms-fail-box">
                  <div className="sms-fail-header">
                    <span aria-hidden="true">📱</span>
                    <div>
                      <strong>SMS nuk funksionon për {originalPhone}</strong>
                      <p>Konfirmo regjistrimin me email — numri ruhet në profil.</p>
                    </div>
                  </div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label htmlFor="otp-email-1"><span aria-hidden="true">📧</span> Emaili yt *</label>
                    <input id="otp-email-1" type="email" placeholder="emri@domain.com"
                      value={smsFailEmail}
                      onChange={e => setSmsFailEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendOtpViaEmail()}
                      autoComplete="email"
                      autoFocus />
                  </div>
                  <button type="button" className="btn" onClick={sendOtpViaEmail} disabled={loading}>
                    {loading ? <><span aria-hidden='true'>⏳</span> Duke dërguar...</> : <><span aria-hidden='true'>📧</span> Dërgo Linkun në Email</>}
                  </button>
                  <button type="button" className="btn-ghost" style={{ marginTop: 6 }}
                    onClick={() => { setSmsFailMode(false); setMsg('') }}>
                    ← Ndrysho numrin e telefonit
                  </button>
                </div>
              )}
            </>
          )}

          {mode === 'register' && step === 'otp' && OtpStep}

          {/* ════════════════════════════════════════
              MAGIC LINK SENT — link-sent step (register / forgot)
              ════════════════════════════════════════ */}
          {(mode === 'register' || mode === 'forgot') && step === 'link-sent' && (
            <>
              <h2><span aria-hidden="true">📧</span> Kontrollo Email-in</h2>
              <p className="sub">
                Dërguam {mode === 'forgot' ? 'link rivendosjeje' : 'link konfirmimi'} te<br />
                <strong>{resolvedId}</strong><br />
                <span style={{ fontSize: 10, color: '#aaa' }}>Kontrollo Spam/Junk nëse nuk e gjen</span>
              </p>
              <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: 10, padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
                <span aria-hidden="true" style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>📬</span>
                <p style={{ fontSize: 13, color: '#3B6D11', fontWeight: 600, margin: 0 }}>
                  Kliko linkun në email për {mode === 'forgot' ? 'të ndryshuar fjalëkalimin' : 'të aktivizuar llogarinë'}
                </p>
              </div>
              <button type="button" className="btn" onClick={sendOtp} disabled={loading}>
                {loading ? <><span aria-hidden="true">⏳</span> Duke ridërguar...</> : <><span aria-hidden="true">🔄</span> Ridërgo linkun</>}
              </button>
              <button type="button" className="btn-ghost" onClick={resetToForm}>← Ndrysho adresën</button>
            </>
          )}

          {/* ════════════════════════════════════════
              3. RIKTHIMI I LLOGARISË — OTP (OPSIONALE)
              ════════════════════════════════════════ */}
          {mode === 'forgot' && step === 'form' && (
            <>
              <h2><span aria-hidden="true">🔓</span> Rikthe Llogarinë</h2>
              <p className="sub">
                Fut emailin ose numrin e telefonit të llogarisë — dërgojmë kod konfirmimi, pastaj vendos fjalëkalim të ri
              </p>

              <div className="field">
                <label htmlFor="forgot-identifier">Email ose Numër Telefoni *</label>
                <div className="contact-wrap">
                  <input id="forgot-identifier" type="text"
                    placeholder="+355 6X XXX XXXX  ose  email@domain.com"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    autoComplete="email"
                    style={{ paddingRight: 36 }} />
                  <span className="contact-type">
                    {cType === 'email' ? <span aria-hidden='true'>📧</span> : cType === 'phone' ? <span aria-hidden='true'>📱</span> : null}
                  </span>
                </div>
                {contactHint}
              </div>

              {!smsFailMode ? (
                <button type="button" className="btn" onClick={sendOtp} disabled={loading}>
                  {loading ? <><span aria-hidden='true'>⏳</span> Duke dërguar...</> : cType === 'email' ? <><span aria-hidden='true'>📨</span> Dërgo Linkun e Rivendosjes</> : <><span aria-hidden='true'>📨</span> Dërgo Kodin e Konfirmimit</>}
                </button>
              ) : null}

              {smsFailMode && (
                <div className="sms-fail-box" style={{ marginTop: 4 }}>
                  <div className="sms-fail-header">
                    <span aria-hidden="true">📱</span>
                    <div>
                      <strong>SMS nuk funksionoi për {originalPhone}</strong>
                      <p>Nëse e di fjalëkalimin, hyr direkt. Nëse jo, fut emailin për ta rivendosur.</p>
                    </div>
                  </div>
                  <button type="button" className="btn-yellow" style={{ marginBottom: 10 }}
                    onClick={() => { const ph = contact; switchMode('login'); setTimeout(() => setContact(ph), 0) }}>
                    <><span aria-hidden="true">🔑</span> Hyr me Numrin + Fjalëkalim</>
                  </button>
                  <div className="divider">ose rivendos fjalëkalimin me email</div>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <label htmlFor="otp-email-2"><span aria-hidden="true">📧</span> Emaili yt *</label>
                    <input id="otp-email-2" type="email" placeholder="emri@domain.com"
                      value={smsFailEmail}
                      onChange={e => setSmsFailEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendOtpViaEmail()}
                      autoComplete="email"
                      autoFocus />
                    <p className="hint">Duhet të jetë emaili me të cilin u regjistruat.</p>
                  </div>
                  <button type="button" className="btn" onClick={sendOtpViaEmail} disabled={loading}>
                    {loading ? <><span aria-hidden='true'>⏳</span> Duke dërguar...</> : <><span aria-hidden='true'>📧</span> Dërgo Linkun Rivendosjes</>}
                  </button>
                  <button type="button" className="btn-ghost" style={{ marginTop: 6 }}
                    onClick={() => { setSmsFailMode(false); setMsg('') }}>
                    ← Ndrysho numrin
                  </button>
                </div>
              )}

              {!smsFailMode && (
                <button type="button" className="btn-ghost" onClick={() => switchMode('login')}>← Kthehu te Hyrja</button>
              )}
            </>
          )}

          {mode === 'forgot' && step === 'otp' && OtpStep}

          {/* Module 1: 2FA TOTP verification step */}
          {step === 'totp' && (
            <>
              <h2><span aria-hidden="true">🔐</span> Verifikimi me 2 Hapa</h2>
              <p className="sub">Fut kodin 6-shifror nga<br /><strong>Google Authenticator / Authy</strong></p>
              <div className="field">
                <label htmlFor="totp-code">Kodi i autentikimit (TOTP)</label>
                <input
                  id="totp-code"
                  type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                  placeholder="123456" value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && verifyTotp()}
                  autoFocus autoComplete="one-time-code"
                  style={{ letterSpacing: 4, fontSize: 20, textAlign: 'center', fontWeight: 700 }}
                />
              </div>
              <button type="button" className="btn" onClick={verifyTotp} disabled={loading || totpCode.length !== 6}>
                {loading ? <><span aria-hidden='true'>⏳</span> Duke verifikuar...</> : <><span aria-hidden='true'>✅</span> Konfirmo</>}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setStep('form'); setTotpCode(''); setMsg('') }}>
                ← Kthehu
              </button>
            </>
          )}

          {mode === 'forgot' && step === 'new-pass' && (
            <>
              <h2><span aria-hidden="true">🔒</span> Fjalëkalim i Ri</h2>
              <p className="sub">Zgjidh një fjalëkalim të sigurt (min. 8 karaktere)</p>

              <div className="field">
                <label htmlFor="reset-new-password">Fjalëkalimi i ri *</label>
                <div className="pass-wrap">
                  <input id="reset-new-password" type={showNewPass ? 'text' : 'password'} placeholder="••••••••" value={newPass}
                    onChange={e => setNewPass(e.target.value)} autoComplete="new-password"
                    style={{ paddingRight: 36 }} />
                  <button type="button" className="pass-toggle" aria-label={showNewPass ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'} aria-pressed={showNewPass} onClick={() => setShowNewPass(v => !v)}>
                    <span aria-hidden="true">{showNewPass ? '🙈' : '👁️'}</span>
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="reset-confirm-password">Konfirmo fjalëkalimin *</label>
                <div className="pass-wrap">
                  <input id="reset-confirm-password" type={showNewPass2 ? 'text' : 'password'} placeholder="••••••••" value={newPass2}
                    onChange={e => setNewPass2(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setNewPassword()}
                    autoComplete="new-password" />
                  <button type="button" className="pass-toggle" aria-label={showNewPass2 ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'} aria-pressed={showNewPass2} onClick={() => setShowNewPass2(v => !v)}>
                    <span aria-hidden="true">{showNewPass2 ? '🙈' : '👁️'}</span>
                  </button>
                </div>
              </div>

              <button type="button" className="btn" onClick={setNewPassword} disabled={loading}>
                {loading ? <><span aria-hidden='true'>⏳</span> Duke ruajtur...</> : <><span aria-hidden='true'>🔒</span> Ruaj Fjalëkalimin</>}
              </button>
            </>
          )}

          <div className="back" role="button" tabIndex={0} onClick={() => window.location.href = '/'} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = '/' }}>
            ← Kthehu te faqja kryesore
          </div>
        </div>
      </div>
    </>
  )
}
