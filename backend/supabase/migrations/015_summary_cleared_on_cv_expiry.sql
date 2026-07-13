-- AVG rule 4: job_search_summary embeds CV-derived facts (skills, employers,
-- CV samenvatting) and must not outlive the CV it was built from.
-- Clear it wherever the CV is auto-expired.
create or replace function opstap_delete_expired_cvs()
returns void language plpgsql security definer as $$
declare
    rec record;
begin
    for rec in
        select id, user_id, cv_path
        from public.profiles
        where cv_expires_at is not null
          and cv_expires_at <= now()
          and cv_path is not null
    loop
        -- Storage deletion is handled by a separate Edge Function.
        -- Clear all CV-derived data so nothing outlives the source CV.
        update public.profiles
        set cv_path                        = null,
            cv_expires_at                  = null,
            cv_warning_sent                = false,
            cv_structured                  = null,
            job_search_summary             = null,
            job_search_summary_approved_at = null
        where id = rec.id;
    end loop;
end;
$$;
