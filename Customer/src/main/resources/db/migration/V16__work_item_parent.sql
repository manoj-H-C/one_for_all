alter table work_item
    add column parent_work_item_id uuid references work_item(id);

create index idx_work_item_parent_work_item_id on work_item(parent_work_item_id);
