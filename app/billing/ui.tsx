'use client'

export const EVENT_LABELS: Record<string, string> = {
  created: 'Kërkesa u krijua',
  request_updated: 'Kërkesa u përditësua',
  activated: 'Plani u aktivizua',
  renewed: 'Plani u rinovua',
  cancel_scheduled: 'Anulimi u programua',
  cancel_reverted: 'Anulimi u rikthye',
  plan_change_scheduled: 'Ndryshim plani i programuar',
  canceled: 'Abonimi u anulua',
  expired: 'Abonimi skadoi',
  admin_adjusted: 'Rregullim nga administrata',
}

export function StatusBadge({ status, cape }: { status: string; cape?: boolean }) {
  const map: Record<string, [string, string]> = {
    active:   cape ? ['Anulohet në fund', '#E65100'] : ['Aktiv', '#2E7D32'],
    pending:  ['Në pritje', '#B26A00'],
    canceled: ['Anuluar', 'var(--az-gray-2)'],
    expired:  ['Skaduar', 'var(--az-gray-2)'],
  }
  const [label, color] = map[status] || [status, 'var(--az-gray-2)']
  return <span className="badge" style={{ color, borderColor: color }}>{label}</span>
}

export const BILLING_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--az-cream)}
.wrap{max-width:480px;margin:0 auto;min-height:100vh;padding-bottom:90px;background:var(--az-cream)}
.topbar{background:linear-gradient(165deg,var(--az-yellow-hi),var(--az-yellow) 52%,var(--az-yellow-lo));padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50}
.back{width:44px;height:44px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;color:#111}
.tt{font-size:15px;font-weight:700;color:#111}
.body{padding:14px}
.card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;border:.5px solid #eee}
.center{text-align:center}.muted{color:#555;font-size:12px}
.row{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.plan-name{font-size:17px;font-weight:800;color:#111}
.badge{font-size:11px;font-weight:700;border:1.5px solid;border-radius:999px;padding:3px 10px;white-space:nowrap}
.bar{background:#f0ead0;border-radius:6px;height:8px;margin-top:10px;overflow:hidden}
.fill{background:linear-gradient(90deg,var(--az-yellow),var(--az-red));height:100%;transition:width .4s}
.note{background:var(--az-cream);border:.5px solid var(--az-yellow);border-radius:9px;padding:9px 12px;font-size:12px;color:#5d4a00;margin-top:10px}
.note.warn{background:#FFF0EE;border-color:#F09595;color:#a02515}
.btns{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.btn{border:1.5px solid #ddd;background:#fff;border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#333;min-height:44px;display:inline-flex;align-items:center;justify-content:center;}
/* var(--az-red) jep 4,33:1 me te bardhen — humbje per pak (matur me axe-core,
   31 gusht 2026). Ngjyra --action-red-deep var(--az-red-deep), tashme token i projektit
   per pikerisht kete arsye, jep 5,85:1. */
.btn.primary{background:var(--az-red-deep);border-color:var(--az-red-deep);color:#fff}
.btn.danger{background:#fff;border-color:var(--az-red);color:#C42B0F}
.btn.small{padding:7px 10px;font-size:11px;width:100%;min-height:44px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.sec-t{font-size:13px;font-weight:700;color:#111;margin-bottom:10px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.pcard{border:1.5px solid #eee;border-radius:10px;padding:12px}
.pcard.cur{border-color:var(--az-yellow);background:var(--az-cream)}
.pname{font-size:13px;font-weight:800;color:#111}
.pprice{font-size:15px;font-weight:800;color:#C42B0F;margin:4px 0}
.cur-tag{font-size:11px;font-weight:700;color:#8a6d00;margin-top:8px}
.bank{background:#f8f9fb;border:.5px solid #e3e7ee;border-radius:9px;padding:11px 12px;font-size:12px;color:#333;margin-top:10px;display:flex;flex-direction:column;gap:4px}
.bank-t{font-weight:700;color:#111;margin-bottom:2px}
.bank span{color:#555}
.bank code{background:#eef1f6;border-radius:5px;padding:1px 6px;font-size:11px}
.ev{display:flex;justify-content:space-between;font-size:12px;padding:7px 0;border-bottom:.5px solid #f2f2f2}
.ev:last-child{border-bottom:none}
.msg{border-radius:10px;padding:9px 13px;font-size:12px;font-weight:600;margin-bottom:10px}
.msg.ok{background:#EAF3DE;color:#3B6D11;border:.5px solid #97C459}
.msg.err{background:#FFF0EE;color:#C42B0F;border:.5px solid #F09595}
select{width:100%;border:1.5px solid #e0e0e0;border-radius:8px;padding:7px;font-size:11px;font-family:inherit;background:#fff}
`
