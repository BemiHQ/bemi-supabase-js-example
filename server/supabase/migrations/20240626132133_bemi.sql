CREATE OR REPLACE FUNCTION bemi_set_context(context text)
RETURNS text
AS $$
BEGIN
  PERFORM set_config('bemi.context', context, false);
  RETURN context;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION _bemi_pass_sb_context_func()
  RETURNS TRIGGER
AS $$
DECLARE
  _bemi_context TEXT;
BEGIN
  SELECT current_setting('bemi.context', true) INTO _bemi_context;
  IF _bemi_context IS NOT NULL THEN
    RAISE log 'BEMI CONTEXT: %', _bemi_context;
    PERFORM pg_logical_emit_message(true, '_bemi', _bemi_context);
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE _bemi_create_triggers()
AS $$
DECLARE
  current_tablename TEXT;
BEGIN
  FOR current_tablename IN
    SELECT tablename FROM pg_tables
    LEFT JOIN information_schema.triggers ON tablename = event_object_table AND schemaname = trigger_schema AND trigger_name LIKE '_bemi_row_trigger_%'
    WHERE schemaname = 'public' AND trigger_name IS NULL
    GROUP BY tablename
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER _bemi_row_trigger_%s
      BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW
      EXECUTE FUNCTION _bemi_pass_sb_context_func()',
      current_tablename, current_tablename
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CALL _bemi_create_triggers();
