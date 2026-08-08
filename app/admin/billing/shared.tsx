'use client'

export function Field({ label, value, onChange, type = 'text' }: any) {
  return (
    <label className="fld">
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

export const ADMIN_BILLING_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA}
.wrap{max-width:560px;margin:0 auto;min-height:100vh;padding-bottom:80px;background:#FFFBEA}
.topbar{background:#111;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50}
.back{width:32px;height:32px;background:rgba(255,255,255,.15);border-radius:50%;border:none;cursor:pointer;color:#F5C842;font-size:16px}
.tt{font-size:15px;font-weight:700;color:#F5C842}
.tabs{display:flex;gap:6px;padding:10px 14px 0}
.tab{border:1.5px solid #e5dcb8;background:#fff;border-radius:999px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#555}
.tab.on{background:#111;border-color:#111;color:#F5C842}
.body{padding:14px}
.card{background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;border:.5px solid #eee}
.card.edit{border-color:#F5C842;background:#FFFDF4}
.center{text-align:center}.muted{color:#888;font-size:12px}
.row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.row-r{display:flex;align-items:center;gap:8px}
.dot{width:10px;height:10px;border-radius:50%}.dot.g{background:#4CAF50}.dot.r{background:#ccc}
.btn{border:1.5px solid #ddd;background:#fff;border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#333}
.btn.primary{background:#E63312;border-color:#E63312;color:#fff}
.btn.small{padding:6px 11px;font-size:11px}
.btns{display:flex;gap:8px;margin-top:12px}
.sec-t{font-size:13px;font-weight:700;color:#111;margin-bottom:10px}
.fld{display:block;margin-bottom:9px}
.fld span{display:block;font-size:11px;font-weight:600;color:#666;margin-bottom:3px}
.fld input,.fld select,.fld textarea{width:100%;border:1.5px solid #e0e0e0;border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;background:#fff}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.chk{display:flex;align-items:center;gap:7px;font-size:12px;color:#333;margin:8px 0}
.note{background:#FFFBEA;border:.5px solid #F5C842;border-radius:9px;padding:9px 12px;font-size:12px;color:#5d4a00;margin-bottom:12px}
.msg{border-radius:10px;padding:9px 13px;font-size:12px;font-weight:600;margin-bottom:10px}
.msg.ok{background:#EAF3DE;color:#3B6D11;border:.5px solid #97C459}
.msg.err{background:#FFF0EE;color:#E63312;border:.5px solid #F09595}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.st{background:#fff;border:.5px solid #eee;border-radius:10px;padding:9px 6px;text-align:center}
.st b{display:block;font-size:16px;font-weight:800;color:#111}
.st span{font-size:9px;color:#888}
.search{width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px 12px;font-size:13px;font-family:inherit;background:#fff;margin-bottom:4px}
.pill{font-size:8px;font-weight:800;padding:2px 6px;border-radius:5px;margin-left:5px;vertical-align:middle}
.pill.admin{background:#111;color:#F5C842}
.pill.prem{background:#FFF3C4;color:#8a6d00}
.pill.susp{background:#FFF0EE;color:#E63312}
.pill.ver{background:#EAF3DE;color:#3B6D11}
.panel{border-top:.5px solid #eee;margin-top:10px;padding-top:10px}
.sub-t{font-size:11px;font-weight:700;color:#666;margin:10px 0 6px}
.btn.danger{background:#fff;border-color:#E63312;color:#E63312}
.btns{flex-wrap:wrap}
`
