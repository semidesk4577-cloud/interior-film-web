HOME FILM STEP34 HOME CONTENT MANAGER

1. Upload all HTML and JS files in this ZIP to the root of interior-film-web GitHub repo (do NOT upload SQL to public repo).
2. Run SETUP_HOME_CONTENT.sql ONCE in existing Supabase SQL Editor. It creates home_content table and admin RLS policies.
3. Sign in to existing admin.html, open home-content-admin.html.
4. Edit hero/about/service/gallery images and texts; add more service/gallery cards.
SQL seeds the 9 current images and text entries (hero 1, about 1, service 4, gallery 3), without overwriting future edits. New images use existing Supabase film-gallery bucket.
IMPORTANT: If image upload fails, check existing film-gallery storage admin upload policy. SQL does not alter storage policies.
No Railway/MySQL changes. Backup current GitHub files before replacing.
