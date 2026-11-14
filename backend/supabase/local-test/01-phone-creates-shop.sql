-- Simulates the owner's phone: Google sign-in, create business, upload 1 item with 2 sizes and a customer.
insert into auth.users(id, email) values ('11111111-1111-1111-1111-111111111111', 'owner@example.com');
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select set_config('request.jwt.claims', '{"is_anonymous": false}', false);
select public.create_business('Glyde_test', 'phone-1', 'Owner phone') ->> 'business_id' as biz \gset
insert into public.records (id, business_id, kind, data, deleted) values
 ('aaaaaaaa-0000-0000-0000-000000000001', :'biz', 'item', '{"name":"P101 Deluxe","unit":"ft","sale_price":0,"purchase_price":4000,"opening_stock":0,"low_stock":0,"active":1,"sku":"","category":"Tracks","brand":"","color":"White","material":"","supplier":"Shree Metals","rack":"","description":"Deluxe grade","bulk_unit":"","bulk_factor":0,"images":[],"images_removed":[],"barcode":"","rate_unit":"ft","sale_rate":6500,"purchase_rate":4000,"opening_godown":""}', false),
 ('aaaaaaaa-0000-0000-0000-000000000002', :'biz', 'variant', '{"item":"aaaaaaaa-0000-0000-0000-000000000001","name":"8 ft","sale_price":52000,"purchase_price":0,"opening_stock":0,"low_stock":0,"active":1,"sort":0,"barcode":"","length":8}', false),
 ('aaaaaaaa-0000-0000-0000-000000000003', :'biz', 'variant', '{"item":"aaaaaaaa-0000-0000-0000-000000000001","name":"10 ft","sale_price":65000,"purchase_price":0,"opening_stock":0,"low_stock":0,"active":1,"sort":1,"barcode":"","length":10}', false),
 ('aaaaaaaa-0000-0000-0000-000000000004', :'biz', 'party', '{"name":"Ramesh","phone":"9999999999","type":0}', false);
reset role;
