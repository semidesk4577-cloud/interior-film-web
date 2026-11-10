import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import mysql from 'mysql2/promise';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {origins,validate,publicRecord} from './validation.js';
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);app.use(helmet());app.use(express.json({limit:'12kb'}));
const pool=mysql.createPool({uri:process.env.MYSQL_URL||process.env.DATABASE_URL,waitForConnections:true,connectionLimit:5,enableKeepAlive:true});
const release='HOMEFILM-RAILWAY-A1';
app.use((req,res,next)=>{res.setHeader('X-Homefilm-Release',release);const origin=req.get('origin');if(origin&&origins.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');}if(req.method==='OPTIONS')return res.status(origin&&origins.has(origin)?204:403).end();next();});
app.get('/health',async(req,res)=>{try{await pool.query('SELECT 1');res.json({ok:true,release});}catch{res.status(503).json({ok:false,release});}});
const limiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-7',legacyHeaders:false,message:{ok:false,code:'RATE_LIMIT'}});
async function verify(token){
  const secret=process.env.TURNSTILE_SECRET_KEY;
  if(!secret)throw Object.assign(new Error('TURNSTILE_NOT_CONFIGURED'),{code:'CONFIG'});
  let response;
  try{
    response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({secret,response:token}),signal:AbortSignal.timeout(10000)
    });
  }catch(e){
    console.error('turnstile_network',e?.name||'unknown');
    throw Object.assign(new Error('VERIFICATION_UNAVAILABLE'),{code:'VERIFY_UNAVAILABLE'});
  }
  let data;
  try{data=await response.json();}catch{
    console.error('turnstile_invalid_json',{status:response.status});
    throw Object.assign(new Error('VERIFICATION_UNAVAILABLE'),{code:'VERIFY_UNAVAILABLE'});
  }
  const codes=Array.isArray(data?.['error-codes'])?data['error-codes'].filter(x=>typeof x==='string').slice(0,8):[];
  if(!response.ok){
    console.error('turnstile_http',{status:response.status,codes});
    if(response.status===400&&codes.length)return false;
    throw Object.assign(new Error('VERIFICATION_UNAVAILABLE'),{code:'VERIFY_UNAVAILABLE'});
  }
  if(data?.success!==true){console.warn('turnstile_rejected',codes);return false;}
  if(!['homefilm.co.kr','www.homefilm.co.kr'].includes(data.hostname)){
    console.warn('turnstile_hostname_rejected');return false;
  }
  return true;
}
app.post('/api/intake',limiter,async(req,res)=>{const id=randomUUID();const origin=req.get('origin');if(!origin||!origins.has(origin))return res.status(403).json({ok:false,code:'ORIGIN_DENIED',requestId:id});const error=validate(req.body);if(error)return res.status(400).json({ok:false,code:error,requestId:id});try{if(!await verify(req.body.turnstile_token))return res.status(403).json({ok:false,code:'VERIFICATION_FAILED',requestId:id});const item=publicRecord(req.body);const [result]=await pool.execute('INSERT INTO intakes (id,kind,author,title,body,phone,status) VALUES (?,?,?,?,?,?,?)',[id,item.type,item.author,item.title,item.body,item.phone,'new']);return res.status(201).json({ok:true,receipt:id,release});}catch(e){console.error('intake_error',{requestId:id,code:e.code||'DB_OR_INTERNAL',message:e.code?'':e.message});return res.status(503).json({ok:false,code:e.code==='VERIFY_UNAVAILABLE'?'VERIFY_UNAVAILABLE':e.code==='CONFIG'?'SERVER_CONFIG':'SERVER_ERROR',requestId:id,release});}});
async function adminAuth(req,res,next){
 const token=(req.get('authorization')||'').match(/^Bearer\s+(.+)$/i)?.[1];
 const base=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
 const key=process.env.SUPABASE_PUBLISHABLE_KEY;
 const email=(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
 if(!base||!/^https:\/\/[^/]+\.supabase\.co$/.test(base)||!key||!email){
  return res.status(503).json({ok:false,code:'ADMIN_AUTH_NOT_CONFIGURED'});
 }
 if(!token)return res.status(401).json({ok:false,code:'LOGIN_REQUIRED'});
 try{
  const r=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(7000)});
  if(!r.ok)return res.status(401).json({ok:false,code:'INVALID_SESSION'});
  const user=await r.json();
  if(!user?.id||!user.email_confirmed_at||String(user.email||'').toLowerCase()!==email){
   return res.status(403).json({ok:false,code:'ADMIN_ONLY'});
  }
  next();
 }catch(e){console.error('admin_auth_unavailable',e?.name||'error');res.status(503).json({ok:false,code:'AUTH_UNAVAILABLE'});}
}
app.get('/api/admin/intakes',adminAuth,async(req,res)=>{try{const [rows]=await pool.query('SELECT id,kind,author,title,body,phone,status,created_at FROM intakes ORDER BY created_at DESC LIMIT 100');res.json({ok:true,items:rows});}catch{res.status(503).json({ok:false});}});
app.patch('/api/admin/intakes/:id',adminAuth,async(req,res)=>{const status=req.body?.status;if(!['new','in_progress','closed'].includes(status))return res.status(400).json({ok:false});try{const [r]=await pool.execute('UPDATE intakes SET status=? WHERE id=?',[status,req.params.id]);res.json({ok:r.affectedRows>0});}catch{res.status(503).json({ok:false});}});

// Admin moderation: requires migration sql/02_admin_moderation.sql.
app.get('/api/admin/moderation',adminAuth,async(req,res)=>{try{const [rows]=await pool.query('SELECT id,kind,author,title,body,phone,status,answer,published,created_at FROM intakes ORDER BY created_at DESC LIMIT 100');res.json({ok:true,items:rows});}catch(e){console.error('moderation_list',e.code||'unknown');res.status(503).json({ok:false,code:'DB_ERROR'});}});
app.patch('/api/admin/moderation/:id',adminAuth,async(req,res)=>{
 const {status,answer,published}=req.body||{};
 if(status!==undefined&&!['new','in_progress','closed'].includes(status))return res.status(400).json({ok:false,code:'BAD_STATUS'});
 if(answer!==undefined&&(typeof answer!=='string'||answer.length>4000))return res.status(400).json({ok:false,code:'BAD_ANSWER'});
 if(published!==undefined&&typeof published!=='boolean')return res.status(400).json({ok:false,code:'BAD_PUBLISHED'});
 if(status===undefined&&answer===undefined&&published===undefined)return res.status(400).json({ok:false,code:'NO_CHANGES'});
 try{
  const [rows]=await pool.execute('SELECT kind FROM intakes WHERE id=? LIMIT 1',[req.params.id]);
  if(!rows.length)return res.status(404).json({ok:false,code:'NOT_FOUND'});
  if(rows[0].kind!=='question'&&(answer!==undefined||published!==undefined))return res.status(400).json({ok:false,code:'QUESTION_ONLY'});
  const sets=[],values=[];
  if(status!==undefined){sets.push('status=?');values.push(status);}
  if(answer!==undefined){sets.push('answer=?');values.push(answer);}
  if(published!==undefined){sets.push('published=?');values.push(published?1:0);}
  values.push(req.params.id);
  await pool.execute(`UPDATE intakes SET ${sets.join(',')} WHERE id=?`,values);
  res.json({ok:true});
 }catch(e){console.error('moderation_update',e.code||'unknown');res.status(503).json({ok:false,code:'DB_ERROR'});}
});

// STEP03: member token is verified server-side; never trust client-supplied user IDs.
async function memberAuth(req,res,next){
 const token=(req.get('authorization')||'').match(/^Bearer\s+(.+)$/i)?.[1];
 const base=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
 const key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!token)return res.status(401).json({ok:false,code:'LOGIN_REQUIRED'});
 if(!/^https:\/\/[^/]+\.supabase\.co$/.test(base)||!key)return res.status(503).json({ok:false,code:'MEMBER_AUTH_NOT_CONFIGURED'});
 try{
  const r=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(7000)});
  if(!r.ok)return res.status(401).json({ok:false,code:'INVALID_SESSION'});
  const u=await r.json();
  if(!u?.id||!u.email_confirmed_at)return res.status(403).json({ok:false,code:'EMAIL_NOT_VERIFIED'});
  req.memberId=u.id;next();
 }catch(e){console.error('member_auth_error',e?.name||'error');res.status(503).json({ok:false,code:'AUTH_UNAVAILABLE'});}
}
app.get('/api/member/questions',memberAuth,async(req,res)=>{
 try{
  const [rows]=await pool.execute('SELECT id,kind,title,body,status,answer,created_at FROM intakes WHERE member_id=? ORDER BY created_at DESC LIMIT 100',[req.memberId]);
  res.json({ok:true,items:rows});
 }catch(e){console.error('member_questions_error',e.code||'unknown');res.status(503).json({ok:false,code:'DB_ERROR'});}
});


app.post('/api/member/questions',limiter,memberAuth,async(req,res)=>{
 const id=randomUUID();
 if(!origins.has(req.get('origin')))return res.status(403).json({ok:false,code:'ORIGIN_DENIED'});
 const data={...req.body,type:'question'};
 const error=validate(data);if(error)return res.status(400).json({ok:false,code:error});
 try{
  if(!await verify(data.turnstile_token))return res.status(403).json({ok:false,code:'VERIFICATION_FAILED'});
  const item=publicRecord(data);
  await pool.execute('INSERT INTO intakes (id,kind,author,title,body,phone,status,member_id) VALUES (?,?,?,?,?,?,?,?)',[id,item.type,item.author,item.title,item.body,item.phone,'new',req.memberId]);
  res.status(201).json({ok:true,receipt:id});
 }catch(e){console.error('member_question_error',e.code||'unknown');res.status(503).json({ok:false,code:'SERVER_ERROR'});}
});

app.get('/api/public/questions',async(req,res)=>{try{const [rows]=await pool.query("SELECT id,author,title,body,answer,created_at FROM intakes WHERE kind='question' AND published=1 ORDER BY created_at DESC LIMIT 100");res.json({ok:true,items:rows});}catch(e){console.error('public_questions',e.code||'unknown');res.status(503).json({ok:false,code:'DB_ERROR'});}});
app.use((err,req,res,next)=>{console.error('request_error',err.type||err.name);res.status(err.status||500).json({ok:false,code:'BAD_REQUEST'});});
const port=Number(process.env.PORT||3000);app.listen(port,'0.0.0.0',()=>console.log(`${release} listening ${port}`));
