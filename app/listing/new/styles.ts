export const NEW_LISTING_CSS = `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:100px;}
        @media(min-width:768px){.wrap{max-width:760px}}
        @media(min-width:1024px){.wrap{max-width:1080px}}
        .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:44px;height:44px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;}
        .body{padding:14px;}
        .msg-box{border-radius:12px;padding:10px 14px;margin-bottom:12px;font-size:var(--fs-meta);font-weight:600;}
        .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
        .err{background:#FFF0EE;color:#C42B0F;border:0.5px solid #F09595;}
        .warn{background:#FFF8E1;color:#E65100;border:0.5px solid #FFB74D;}
        .card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;border:0.5px solid #eee;}
        .section-title{font-size:var(--fs-tit-s);font-weight:700;color:#111;margin-bottom:12px;display:flex;align-items:center;gap:6px;}
        .section-title i{font-size:16px;color:#C42B0F;}
        label{font-size:var(--fs-meta);font-weight:600;color:#555;display:block;margin-bottom:4px;}
        .field{margin-bottom:12px;}
        input[type=text],input[type=number],textarea,select{width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:10px 13px;font-size:var(--fs-trup);min-height:44px;font-family:inherit;outline:none;transition:border .15s;background:#fff;color:#111;}
        input:focus,textarea:focus,select:focus{border-color:#111;box-shadow:0 4px 16px -4px rgba(0,0,0,.2);}
        textarea{min-height:90px;resize:vertical;}
        .price-row{display:flex;gap:8px;}
        .price-row input{flex:1;}
        .price-row select{width:90px;flex-shrink:0;}
        .cond-row{display:flex;gap:8px;}
        .cond-btn{flex:1;border:1.5px solid #e0e0e0;border-radius:12px;padding:9px;font-size:var(--fs-meta);font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;min-height:44px;display:flex;align-items:center;justify-content:center;}
        .cond-btn.active{border-color:#E63312;background:#FFF0EE;color:#C42B0F;}
        .img-zone{border:2px dashed #e0b030;border-radius:10px;padding:20px;text-align:center;cursor:pointer;background:#FFFBEA;}
        .img-zone input{display:none;}
        .img-zone i{font-size:32px;color:#e0b030;display:block;margin-bottom:8px;}
        .img-zone p{font-size:var(--fs-meta);color:#555;}
        .img-previews{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
        .img-prev{width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid #F5C842;}
        .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
        .cat-btn{border:1.5px solid #e0e0e0;border-radius:12px;padding:8px 4px;min-height:44px;font-size:var(--fs-meta);font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;}
        .cat-btn i{font-size:18px;color:#aaa;}
        .cat-btn.active{border-color:#F5C842;background:#FFFBEA;color:#111;}
        .cat-btn.active i{color:#C42B0F;}
        .submit-btn{width:100%;min-height:52px;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:800;letter-spacing:.3px;cursor:pointer;font-family:inherit;box-shadow:0 6px 18px -3px rgba(230,51,18,.5);transition:transform .15s ease,box-shadow .15s ease;} .submit-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 9px 24px -4px rgba(230,51,18,.6);}
        .submit-btn:disabled{opacity:.6;cursor:not-allowed;}
      `
