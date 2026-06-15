create index if not exists evidence_items_region_id_idx on public.evidence_items (region_id);
create index if not exists evidence_items_entity_id_idx on public.evidence_items (entity_id);
create index if not exists evidence_items_document_id_idx on public.evidence_items (document_id);

create index if not exists feedback_region_id_idx on atlas_private.feedback (region_id);
create index if not exists feedback_evidence_item_id_idx on atlas_private.feedback (evidence_item_id);
