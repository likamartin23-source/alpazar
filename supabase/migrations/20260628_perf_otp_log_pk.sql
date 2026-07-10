-- Performance advisor: otp_request_log had no primary key.
-- Added as a trailing identity column so existing (column-listed or positional)
-- inserts are unaffected.
ALTER TABLE public.otp_request_log
  ADD COLUMN IF NOT EXISTS id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY;
