-- MAR-5: Price alerts trigger — fires when listing price drops
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMPTZ;

-- Function: when listing price is updated, check price alerts
CREATE OR REPLACE FUNCTION fn_price_alert_check()
RETURNS TRIGGER AS $$
DECLARE
  alert RECORD;
  listing_title TEXT;
BEGIN
  -- Only fire when price decreases
  IF NEW.price >= OLD.price THEN
    RETURN NEW;
  END IF;

  listing_title := COALESCE(NEW.title, 'Shpallje');

  FOR alert IN
    SELECT pa.id, pa.user_id, pa.target_price
    FROM price_alerts pa
    WHERE pa.listing_id = NEW.id
      AND pa.triggered = FALSE
      AND pa.target_price >= NEW.price
  LOOP
    -- Insert notification
    INSERT INTO notifications (user_id, type, title, body, link, ref_id, ref_type)
    VALUES (
      alert.user_id,
      'price_drop',
      '🎉 Çmimi u ul!',
      listing_title || ' — çmimi ra në ' ||
        CASE WHEN NEW.currency = 'EUR' THEN '€' ELSE '' END ||
        ROUND(NEW.price)::TEXT ||
        CASE WHEN NEW.currency != 'EUR' THEN ' L' ELSE '' END ||
        ' (objektivi yt: ' ||
        CASE WHEN NEW.currency = 'EUR' THEN '€' ELSE '' END ||
        ROUND(alert.target_price)::TEXT ||
        CASE WHEN NEW.currency != 'EUR' THEN ' L)' ELSE ')' END,
      '/listing/' || NEW.id::TEXT,
      NEW.id,
      'listing'
    );

    -- Mark alert as triggered
    UPDATE price_alerts
    SET triggered = TRUE, triggered_at = NOW()
    WHERE id = alert.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_price_alert_check ON listings;
CREATE TRIGGER trg_price_alert_check
  AFTER UPDATE OF price ON listings
  FOR EACH ROW
  EXECUTE FUNCTION fn_price_alert_check();
