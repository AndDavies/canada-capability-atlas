create index if not exists company_locations_source_document_id_idx on public.company_locations (source_document_id);
create index if not exists procurement_notices_document_id_idx on public.procurement_notices (document_id);
create index if not exists press_releases_document_id_idx on public.press_releases (document_id);

create policy "Service role can manage source runs"
on atlas_private.source_runs
for all
to service_role
using (true)
with check (true);

create policy "Service role can manage raw documents"
on atlas_private.raw_documents
for all
to service_role
using (true)
with check (true);

create policy "Service role can manage review queue"
on atlas_private.review_queue
for all
to service_role
using (true)
with check (true);

revoke execute on function public.rls_auto_enable() from anon, authenticated;
