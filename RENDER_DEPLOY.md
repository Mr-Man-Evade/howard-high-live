
# Deploy to Render - Step by Step (2 minutes)

## Quick Deploy
1. Go to https://dashboard.render.com
2. Click New + -> Web Service -> Connect GitHub OR Upload
3. EASIEST: 
   - Create new GitHub repo (public)
   - Upload this entire Howard_High_LIVE_Deploy folder to GitHub
   - In Render, select that repo
   - Render will auto-detect render.yaml
   - Click Create Web Service
   - Wait 2 mins -> You get live URL like https://howard-high-live.onrender.com

## Manual Settings if not using render.yaml
- Root Directory: backend
- Build Command: npm install
- Start Command: npm start
- Environment: Node
- Add Env Vars:
  JWT_SECRET = HOWARD_1923_SECRET
  WHATSAPP_NUMBER = +263782828857
  PORT = 10000

## After Deploy
- Your site lives at: https://your-app-name.onrender.com
- Login:
  - School Admin: admin@howard.ac.zw / admin123 (role school_admin)
  - Teacher: teacher@howard.ac.zw / teacher123
  - Student: student@howard.ac.zw / student123 (READ ONLY)
  - Parent: parent@howard.ac.zw / parent123 (sees only his kids)
  - Bursar: bursar@howard.ac.zw / bursar123

- Test bulk upload: Dashboard -> Teacher -> Upload Excel -> Use templates in /database/excel_templates/
- Student portal is read-only - cannot edit, only view results (published), fees, report card PDF
- WhatsApp wired to +263782828857 - admissions form opens wa.me

## For Production with MySQL
In Render, add PostgreSQL free DB and change DB_PATH env to use Postgres.

## Your Files
- frontend/index.html -> luxury official site
- backend/src/server.js -> full API with bulk endpoints
- database/schema.sql -> full schema (students, parents with 1->many, staff, results, overall_comments, invoices, payments, bursaries, newsletters)
- database/excel_templates/*.xlsx -> 4 templates

Need help? WhatsApp +263782828857
