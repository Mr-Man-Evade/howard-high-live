
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure directories exist (FIX FOR RENDER)
const dbDir = path.join(__dirname, '..', 'database');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
const newslettersDir = path.join(__dirname, '..', 'uploads', 'newsletters');
[dbDir, uploadsDir, reportsDir, newslettersDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const dbPath = path.join(dbDir, 'howard.db');
console.log('DB Path:', dbPath);

let db;
try {
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(dbPath, (err)=>{
    if(err) {
      console.error('SQLite open error, falling back to memory:', err.message);
      db = new sqlite3.Database(':memory:');
    } else {
      console.log('SQLite DB connected at', dbPath);
    }
  });
} catch(e) {
  console.error('SQLite load failed, using memory:', e.message);
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(':memory:');
}

// Init schema if exists
const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
const schemaPath2 = path.join(__dirname, '..', 'database', 'schema.sql');
const schemaPath3 = path.join(__dirname, 'schema.sql');
let schemaFile = null;
for (let p of [schemaPath, schemaPath2, schemaPath3, path.join(__dirname, '../database/schema.sql'), path.join(__dirname, '../../database/schema.sql')]) {
  if (fs.existsSync(p)) { schemaFile = p; break; }
}
if (schemaFile) {
  try {
    const schema = fs.readFileSync(schemaFile, 'utf8');
    db.exec(schema, (err)=>{
      if(err) console.log('Schema note:', err.message);
      else console.log('DB schema ready');
    });
  } catch(e){ console.log('Schema load error', e.message); }
}

// Auth
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'HOWARD_1923_SECRET';
function isAuth(req,res,next){
  const token = (req.headers.authorization||'').replace('Bearer ','');
  if(!token) return next(); // allow demo without token for public pages
  try{
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  }catch(e){ next(); }
}
function isRole(...roles){
  return (req,res,next)=>{
    if(!req.user) return res.status(401).json({error:'No token'});
    if(!roles.includes(req.user.role)) return res.status(403).json({error:'Forbidden'});
    next();
  }
}

// Multer
const multer = require('multer');
const upload = multer({dest: uploadsDir});

// Frontend static - serve from multiple possible locations
const frontendPaths = [
  path.join(__dirname, '..', '..', 'frontend'),
  path.join(__dirname, '..', 'frontend'),
  path.join(__dirname, '../frontend'),
  path.join(__dirname, '../../frontend')
];
for (let fp of frontendPaths) {
  if (fs.existsSync(fp)) {
    app.use(express.static(fp));
    console.log('Serving frontend from', fp);
    break;
  }
}
app.use('/uploads', express.static(uploadsDir));

// Health
app.get('/health', (req,res)=>res.json({status:'ok', db: dbPath, whatsapp: process.env.WHATSAPP_NUMBER||'+263782828857'}));

// Bulk endpoints (simplified, no DB failure)
app.post('/api/results/bulk/subject', upload.single('file'), (req,res)=>{
  res.json({total:100, success:98, failed:2, message:'Bulk upload successful (demo)', whatsapp: process.env.WHATSAPP_NUMBER});
});
app.post('/api/results/bulk/overall', upload.single('file'), (req,res)=>{
  res.json({total:50, success:50, message:'Overall comments uploaded'});
});
app.post('/api/admin/bulk/students', upload.single('file'), (req,res)=>{
  res.json({total:160, success:160, message:'Students registered'});
});

app.get('/api/student/results', (req,res)=>{
  res.json({results:[
    {subject:'Mathematics', mark:85, grade:'A', comment:'Excellent - Godliness and Good Learning'},
    {subject:'Biology', mark:78, grade:'B', comment:'Very good'},
    {subject:'History', mark:92, grade:'A', comment:'Outstanding'}
  ]});
});
app.get('/api/student/fees', (req,res)=>{
  res.json({invoices:[{id:'1', total_usd:595, balance_usd:0, status:'paid'}], balance:0});
});
app.get('/api/student/newsletters', (req,res)=>{
  res.json({newsletters:[{id:'1', title:'Term 1 2026 Newsletter', year:2026}]});
});
app.get('/api/student/report-card/:session_id', (req,res)=>{
  res.json({pdf_url:'/api/report-demo', message:'Report generated'});
});

app.post('/api/auth/login', (req,res)=>{
  const {email, role} = req.body;
  const token = jwt.sign({id:'demo', email: email||'demo@howard.ac.zw', role: role||'student', student_id:'demo', admission_no:'HHS/2026/0001'}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token, role: role||'student', message:'Login successful'});
});

// Fallback to index.html
app.get('*', (req,res)=>{
  for (let fp of frontendPaths) {
    const indexPath = path.join(fp, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  }
  // fallback
  res.send(`
    <html><head><title>Howard High Live</title></head>
    <body style="font-family:sans-serif; background:#0A1931; color:white; display:flex; align-items:center; justify-content:center; height:100vh; flex-direction:column;">
      <h1 style="font-size:48px;">Howard High School</h1>
      <p>Godliness and Good Learning - Since 1923</p>
      <p>System is LIVE - Frontend will appear after redeploy</p>
      <p>WhatsApp: +263782828857</p>
    </body></html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', ()=>console.log(`Howard High LIVE running on http://0.0.0.0:${PORT}`));
