'use client'

import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export function useListingBoot(o: any) {
  const { setUser, setCategories, setMyListingCount, setForm, setDraftRestored, imagePreviews, form, isDirty } = o

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      supabase.from('listings').select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id).eq('is_active', true)
        .then(({ count }) => setMyListingCount(count || 0))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) { window.location.href = '/auth/login' }
    })
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data) setCategories(data) })
    return () => { subscription.unsubscribe() }
  }, [])

  // Liro object URL-te ne unmount per te shmangur rrjedhje memorie
  useEffect(() => {
    return () => { imagePreviews.forEach((u: string) => URL.revokeObjectURL(u)) }
  }, [imagePreviews])

  // Rikthe draft-in nga localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alpazar_listing_draft')
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.title) {
          setForm((f: any) => ({ ...f, ...draft }))
          setDraftRestored(true)
          setTimeout(() => setDraftRestored(false), 4000)
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Ruajtje automatike (vetem fushat tekst)
  useEffect(() => {
    const { title, description, price, currency, condition, category_id, city, location_address } = form
    if (!title && !description) return
    try {
      localStorage.setItem('alpazar_listing_draft', JSON.stringify({
        title, description, price, currency, condition, category_id, city, location_address,
      }))
    } catch { /* ignore */ }
  }, [form.title, form.description, form.price, form.currency, form.condition, form.category_id, form.city, form.location_address])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (!isDirty) return; e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])
}
