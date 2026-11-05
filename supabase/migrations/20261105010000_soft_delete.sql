-- Deleting a list item hides it (deleted_at) instead of removing the row,
-- so it can be undone. Rows deleted more than 30 days ago are purged by the
-- app (src/cms/store.ts → purgeDeleted).

alter table public.content add column deleted_at timestamptz;

create index content_deleted_idx on public.content (type, deleted_at);
