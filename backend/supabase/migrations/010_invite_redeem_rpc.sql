-- Atomic invite code redemption: server-side increment prevents race conditions
-- that client-side read-modify-write cannot solve via PostgREST.
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code_id uuid, p_user_id uuid)
RETURNS TABLE(ok boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  -- Atomic: only fires if use_count < max_uses at the moment of the UPDATE
  UPDATE invite_codes
  SET use_count = use_count + 1
  WHERE id = p_code_id AND use_count < max_uses;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN QUERY SELECT false::boolean, 'exhausted'::text;
    RETURN;
  END IF;

  -- Record the use. ON CONFLICT handles double-redemption by the same user idempotently.
  INSERT INTO invite_uses (code_id, user_id)
  VALUES (p_code_id, p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY SELECT true::boolean, 'ok'::text;
END;
$$;
