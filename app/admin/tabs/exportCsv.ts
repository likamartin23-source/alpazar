'use client'

// Eksport CSV — i pranishem ne cdo panel serioz (Meta, TikTok, Temu).
// Punon mbi te dhenat qe tashme jane ne ekran: pa kerkese te dyte, pa varesi.
export function exportCsv(filename: string, rows: any[], columns?: { k: string; l: string }[]) {
  if (!rows || rows.length === 0) return false

  const cols = columns ?? Object.keys(rows[0]).map(k => ({ k, l: k }))
  const esc = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const head = cols.map(c => esc(c.l)).join(';')
  const body = rows.map(r => cols.map(c => esc(r[c.k])).join(';')).join('\n')
  // BOM qe Excel-i shqip t'i lexoje sakte shkronjat ë dhe ç
  const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
