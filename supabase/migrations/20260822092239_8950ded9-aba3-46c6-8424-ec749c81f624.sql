DO $$
DECLARE _did uuid; _st text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub','f097f496-f026-48f7-8013-75cfb0adca80','role','authenticated')::text, true);
  PERFORM set_config('role','authenticated', true);
  _did := public.request_delivery('b0682847-9d77-4045-942a-06f916859ad2');
  RESET role;
  SELECT status INTO _st FROM public.deliveries WHERE id=_did;
  RAISE NOTICE 'after request: %', _st;
  IF _st = 'awaiting_assignment' THEN
    PERFORM set_config('request.jwt.claims', json_build_object('sub','43b72711-999a-44f2-ac2d-d75aad631630','role','authenticated')::text, true);
    PERFORM public.assign_delivery(_did, 'af9a7f8e-7f84-45d7-9b7f-6c2bd05ae73c');
  END IF;
  SELECT status INTO _st FROM public.deliveries WHERE id=_did;
  RAISE NOTICE 'after assign: %', _st;
END $$;