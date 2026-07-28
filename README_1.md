
# HOWARD HIGH SCHOOL - LIVE DEPLOYMENT READY

## What You Got
- Frontend: Luxury world-best official site (glassmorphism, multi-page, Howard colors Sky Blue #2EB5E5 Navy #0A1931 Gold #C9A86A) + Student Portal Read-Only + Teacher Bulk Upload UI
- Backend: Node.js + Express + SQLite (easy cPanel) + Excel bulk + PDF report generation
- DB Schema: Full with students, parents (1 parent -> many students), staff, results, overall_comments, fees, bursaries, newsletters, bulk_uploads

## How to Go LIVE Now (3 options)

### Option 1: cPanel (Recommended for Zimbabwe hosting)
1. Zip backend folder, upload to cPanel File Manager public_html/howard
2. In cPanel > Node.js App > Create App: Node 18, App Root = howard/backend, Startup = src/server.js
3. NPM Install, set ENV: PORT, JWT_SECRET, WHATSAPP_NUMBER=+263782828857
4. Run `node src/server.js` or PM2
5. Point domain howardhigh.ac.zw to folder

### Option 2: Vercel / Render (Free, 2 mins)
1. Push this folder to GitHub
2. Import to Vercel, set root = backend, build = npm install, start = npm start
3. Add env vars from .env.example
4. Frontend auto-served from /frontend

### Option 3: Local PC (Test now)
```
cd backend
npm install
npm start
```
Open http://localhost:3000

## Bulk Excel Usage
- Subject Teacher: Use database/excel_templates/template_subject_marks.xlsx -> Upload via /api/results/bulk/subject (role teacher)
- Class Teacher: template_overall_comments.xlsx -> /api/results/bulk/overall
- Admin Students: template_students_bulk.xlsx -> /api/admin/bulk/students (creates users + parent links + WhatsApp msg)

## Student Portal
- Student logs in (POST /api/auth/login {email, role:'student'})
- Token saved, can only GET /api/student/* (read-only enforced)
- Can view: Results (published only), Report Card PDF, Fees Balance, Newsletters

## WhatsApp Wired
All admissions forms -> wa.me/263782828857?text=...
Bulk uploads also log WhatsApp number for notifications.

## Next Steps After Live
1. Replace SQLite with MySQL (change one line in server.js)
2. Add Paynow for fees
3. Add SMS gateway

Contact: +263782828857 for deploy help
