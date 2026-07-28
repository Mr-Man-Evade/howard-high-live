
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuid } = require('uuid');
const multer = require('multer');
const XLSX = require('xlsx');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend'))); // serve frontend

const dbPath = process.env.DB_PATH || './database/howard.db';
const db = new sqlite3.Database(dbPath);

// Init DB from schema.sql
const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
db.exec(schema, (err)=>{
  if(err) console.log('Schema init note:', err.message);
  else console.log('DB ready');
});

// Auth middleware (simple)
const jwt = require('jsonwebtoken');
function isAuth(req,res,next){
  const token = (req.headers.authorization||'').replace('Bearer ','');
  if(!token) return res.status(401).json({error:'No token'});
  try{
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  }catch(e){ return res.status(401).json({error:'Invalid token'}); }
}
function isRole(...roles){
  return (req,res,next)=>{
    if(!roles.includes(req.user.role)) return res.status(403).json({error:'Forbidden'});
    next();
  }
}
function isReadOnlyStudent(req,res,next){
  if(req.user.role==='student' && req.method!=='GET') return res.status(403).json({error:'Students read-only'});
  next();
}

// Multer
const upload = multer({dest: path.join(__dirname, '../uploads/')});

// --- BULK ENDPOINTS ---
// 1. Subject marks bulk
app.post('/api/results/bulk/subject', isAuth, isRole('teacher','school_admin','super_admin'), upload.single('file'), (req,res)=>{
  try{
    const wb = XLSX.readFile(req.file.path);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let success=0, failed=0, errors=[];
    const stmt = db.prepare("INSERT OR REPLACE INTO results (id, student_id, subject_id, mark, grade, comment, session_id, is_published) VALUES (?,?,?,?,?,?,?,0)");
    rows.forEach((r,i)=>{
      try{
        if(!r.admission_no || r.mark==null) throw new Error('Missing admission_no/mark');
        // lookup student id by admission_no (simplified)
        const student = db.prepare("SELECT id FROM students WHERE admission_no=?").get(r.admission_no);
        // For demo, if not found create dummy
        let student_id = student ? student.id : uuid();
        if(!student){
          db.prepare("INSERT OR IGNORE INTO students (id, admission_no, first_name, last_name, house, form) VALUES (?,?,?,?,?,?)").run(student_id, r.admission_no, r.student_name||'Student', 'Demo', 'Falcon', '4');
        }
        let grade = r.grade || (r.mark>=80?'A':r.mark>=70?'B':r.mark>=60?'C':r.mark>=50?'D':'U');
        stmt.run(uuid(), student_id, r.subject_code||'GEN', r.mark, grade, r.comment||'', r.exam_session_id||'NOV2025');
        success++;
      }catch(e){ failed++; errors.push({row:i+2, error:e.message}); }
    });
    stmt.finalize();
    res.json({total:rows.length, success, failed, errors, whatsapp: process.env.WHATSAPP_NUMBER});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// 2. Overall comments bulk
app.post('/api/results/bulk/overall', isAuth, isRole('teacher','school_admin','super_admin'), upload.single('file'), (req,res)=>{
  try{
    const wb = XLSX.readFile(req.file.path);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let success=0;
    rows.forEach(r=>{
      db.run("INSERT OR REPLACE INTO overall_comments (id, student_id, session_id, overall_comment, conduct, attendance_days, position_in_class) VALUES (?,?,?,?,?,?,?)",
        [uuid(), r.admission_no, r.session_id||'NOV2025', r.overall_comment, r.conduct, r.attendance_days, r.position_in_class]);
      success++;
    });
    res.json({total:rows.length, success});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// 3. Students bulk register
app.post('/api/admin/bulk/students', isAuth, isRole('school_admin','super_admin'), upload.single('file'), (req,res)=>{
  try{
    const wb = XLSX.readFile(req.file.path);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let success=0;
    rows.forEach(r=>{
      const adm = `HHS/${r.enrollment_year||2026}/${String(success+1).padStart(4,'0')}`;
      db.run("INSERT INTO students (id, admission_no, first_name, last_name, dob, gender, house, form, enrollment_year) VALUES (?,?,?,?,?,?,?,?,?)",
        [uuid(), adm, r.first_name, r.last_name, r.dob, r.gender, r.house, r.form, r.enrollment_year||2026]);
      success++;
    });
    res.json({total:rows.length, success, message:`WhatsApp notification ready for ${process.env.WHATSAPP_NUMBER}`});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// 4. Generate Report Card PDF
app.get('/api/student/report-card/:session_id', isAuth, (req,res)=>{
  // Demo PDF generation
  (async()=>{
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();
    page.drawText('HOWARD HIGH SCHOOL - GODLINESS AND GOOD LEARNING', {x:30, y:height-40, size:12, font, color: rgb(0.04,0.1,0.19)});
    page.drawText(`Report Card - Session ${req.params.session_id}`, {x:30, y:height-70, size:18, font});
    page.drawText(`Student: ${req.user.admission_no||'HHS/2026/0001'} | House: Falcon | Form 4`, {x:30, y:height-100, size:10});
    page.drawText(`Address: P Bag 230 Chiweshe Glendale | Tel: +263 410-313-2867 | WhatsApp: +263782828857`, {x:30, y:30, size:8});
    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(__dirname, `../uploads/reports/${req.params.session_id}_${req.user.id||'demo'}.pdf`);
    fs.mkdirSync(path.dirname(outPath), {recursive:true});
    fs.writeFileSync(outPath, pdfBytes);
    res.json({pdf_url:`/uploads/reports/${path.basename(outPath)}`});
  })();
});

// Student read-only endpoints
app.get('/api/student/results', isAuth, isRole('student','parent','school_admin'), (req,res)=>{
  db.all("SELECT * FROM results WHERE student_id=? AND is_published=1", [req.user.student_id||'demo'], (err,rows)=>{
    res.json({results: rows||[]});
  });
});
app.get('/api/student/fees', isAuth, (req,res)=>{
  res.json({invoices:[{id:'1', total_usd:595, balance_usd:0, status:'paid'}], balance:0});
});
app.get('/api/student/newsletters', isAuth, (req,res)=>{
  db.all("SELECT * FROM newsletters WHERE is_published=1", [], (err,rows)=>{ res.json({newsletters: rows||[]}); });
});

// Login demo
app.post('/api/auth/login', (req,res)=>{
  const {email, role} = req.body;
  // demo - any email logs in
  const token = jwt.sign({id:uuid(), email, role: role||'student', student_id:'demo', admission_no:'HHS/2026/0001'}, process.env.JWT_SECRET, {expiresIn:'7d'});
  res.json({token, role: role||'student'});
});

// Fallback to frontend
app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

const PORT = process.env.PORT||3000;
app.listen(PORT, ()=>console.log(`Howard High LIVE running on http://localhost:${PORT}`));
