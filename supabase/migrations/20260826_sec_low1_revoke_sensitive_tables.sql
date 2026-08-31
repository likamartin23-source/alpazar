-- Siguri LOW-1 (26 gusht 2026): defense-in-depth mbi tabelat e ndjeshme.
-- RLS është ON + pa politika permissive (mohim total), por grantet e gjera lënë rrezik nëse
-- dikush shton pa kujdes një politikë USING(true). Hiq çdo grant nga anon/authenticated —
-- edge functions përdorin service_role (s'preken). Aplikuar LIVE.
revoke all on public.otp_codes            from anon, authenticated;
revoke all on public.otp_send_throttle    from anon, authenticated;
revoke all on public.otp_email_throttle   from anon, authenticated;
revoke all on public.admin_settings       from anon, authenticated;
