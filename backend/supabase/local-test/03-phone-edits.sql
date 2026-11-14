-- Simulates the owner's phone after the website made changes.
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false) \g /dev/null
select business_id as biz from public.members limit 1 \gset
-- a) the phone edits P101 Deluxe (renames it, changes rack) and uploads its whole item JSON, which has no "web" part
insert into public.records (id, business_id, kind, data, deleted) values
 ('aaaaaaaa-0000-0000-0000-000000000001', :'biz', 'item', '{"name":"P101 Deluxe (new stock)","unit":"ft","sale_price":0,"purchase_price":4200,"opening_stock":0,"low_stock":0,"active":1,"sku":"","category":"Tracks","brand":"","color":"White","material":"","supplier":"Shree Metals","rack":"R2","description":"Deluxe grade","images":[],"images_removed":[],"barcode":"","rate_unit":"ft","sale_rate":7000,"purchase_rate":4200}', false)
on conflict (id) do update set business_id = excluded.business_id, kind = excluded.kind, data = excluded.data, deleted = excluded.deleted;
-- b) the phone adds a new item
insert into public.records (id, business_id, kind, data, deleted) values
 ('bbbbbbbb-0000-0000-0000-000000000001', :'biz', 'item', '{"name":"Silent Runner Box","unit":"pcs","sale_price":35000,"purchase_price":20000,"active":1,"category":"Accessories","description":"Box of 100"}', false);
-- c) the phone deletes the website-made test bracket
update public.records set deleted = true where kind = 'item' and data->>'sku' = 'WEB-TEST-1'  -- made on the website by the round-trip test;
reset role;
