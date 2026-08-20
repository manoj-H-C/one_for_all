-- Same "terminology is a display concern, not a data concern" mechanism as
-- item_display_name_singular/plural on project - lets a non-software team
-- rename "Sprint" to "Phase", "Billing Cycle", "Round", whatever fits,
-- without touching the underlying sprint mechanic (still just a name +
-- optional date range).
alter table project add column sprint_label_singular varchar(100) default 'Sprint';
alter table project add column sprint_label_plural varchar(100) default 'Sprints';
