# Local test of the website on the Hisaab database

Checks `../website-on-hisaab.sql` against a plain local Postgres (16+), without touching Supabase.

```bash
P="psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1"
$P -c "create database hisaab"
$P -d hisaab -f 00-supabase-stubs.sql                  # auth.uid(), storage, Supabase roles
$P -d hisaab -f <hisaab repo>/backend/supabase-setup.sql
$P -d hisaab -f 01-phone-creates-shop.sql              # owner creates the shop, uploads an item with two sizes
sed 's/CHOOSE_A_PASSWORD/devpass/' ../website-on-hisaab.sql | $P -d hisaab
```

Then start the backend with the prod profile and
`SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/hisaab`, `SPRING_DATASOURCE_USERNAME=glyde_website`,
`SPRING_DATASOURCE_PASSWORD=devpass`, `SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver`.
On first start the catalogue seeders write the official products through the views, so they become Hisaab items.

`03-phone-edits.sql` plays a phone after website edits: it re-uploads an item without its website details
(they must survive), adds an item (it must appear on the website) and deletes one (it must disappear).
