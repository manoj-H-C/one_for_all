-- Purchase orders are an org-level feature, off by default like
-- project.inventory_enabled (V18) - the "Purchase Orders" nav item, route,
-- and every purchase-order endpoint are all unreachable until the org owner
-- turns this on from the new Organization Settings page.
alter table organization
    add column purchase_orders_enabled boolean not null default false;
