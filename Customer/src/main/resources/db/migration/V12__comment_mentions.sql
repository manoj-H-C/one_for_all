alter table comment add column mentioned_user_ids jsonb not null default '[]'::jsonb;
