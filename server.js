import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.disable('x-powered-by');
// Render routes traffic through its reverse proxy.
app.set('trust proxy', 1);
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'14mb'}));
app.use(express.static(path.join(__dirname,'public')));
app.get('/health',(_req,res)=>res.status(200).json({status:'ok'}));
app.use('/api',rateLimit({windowMs:15*60*1000,limit:35,standardHeaders:'draft-7',legacyHeaders:false}));
const platforms=['TikTok','Instagram','Facebook','X / Twitter','YouTube','Umum'];
const tones=['Santai','Sopan','Lucu','Tegas','Singkat'];
const MAX_IMAGES=4;
// Require a separate private access code to prevent abuse of your paid AI account.
// This code is NOT the OpenAI API key and is never embedded in the frontend.
function authorize(req,res,next){
 const expected=process.env.APP_ACCESS_TOKEN||'';
 if(expected.length<12)return res.status(503).json({error:'Kode akses aplikasi belum dikonfigurasi pada server (APP_ACCESS_TOKEN, minimal 12 karakter).'});
 const supplied=req.get('x-app-access-token')||'';
 const a=Buffer.from(expected),b=Buffer.from(supplied);
 if(a.length!==b.length||!timingSafeEqual(a,b))return res.status(401).json({error:'Kode akses aplikasi tidak sesuai.'});
 next();
}
function validImage(s){return typeof s==='string' && /^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(s) && s.length < 3_500_000}
const limits=(s,max)=>typeof s==='string'?s.trim().slice(0,max):'';
app.post('/api/generate',authorize,async (req,res)=>{
 try{
  const {caption,description,platform,tone,count,images}=req.body||{};
  const c=limits(caption,8000),d=limits(description,3000);
  const p=platforms.includes(platform)?platform:'Umum';
  const t=tones.includes(tone)?tone:'Santai';
  const n=Number(count);
  if(!Number.isInteger(n)||n<1||n>5)return res.status(400).json({error:'Jumlah komentar tiap kategori harus 1–5.'});
  if(!Array.isArray(images)||images.length>MAX_IMAGES||!images.every(validImage))return res.status(400).json({error:'Format/ukuran gambar tidak valid. Maksimal 4 gambar.'});
  if(!c&&!d&&!images.length)return res.status(400).json({error:'Tambahkan teks, deskripsi, foto, atau frame video.'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'OPENAI_API_KEY belum diatur pada server.'});
  const prompt=`Buat masing-masing ${n} komentar media sosial berbahasa Indonesia dalam 3 sudut pandang: positif, negatif, netral. Platform: ${p}. Gaya: ${t}. Konten sumber:\nCAPTION: ${c||'(tidak ada)'}\nDESKRIPSI: ${d||'(tidak ada)'}\nGambar yang dilampirkan dapat berupa foto atau cuplikan dari video. Jika video, jangan mengklaim mengetahui audio atau seluruh adegan dari frame. Jika materi tidak jelas, gunakan komentar umum dan jangan mengarang detail.\nKomentar harus natural, khas warganet Indonesia, tidak berulang, relevan dengan materi, ringkas, tanpa hashtag berlebihan. Positif berarti apresiatif, negatif berarti kritis namun santun, netral berarti berimbang atau bertanya. Jangan membuat tuduhan fakta tak terverifikasi, hinaan, doxxing, ujaran kebencian, ancaman atau promosi disinformasi. Jika konten mengandung isu politik, hindari ajakan manipulatif atau kampanye yang menyamar sebagai opini organik. Keluarkan JSON valid HANYA dengan bentuk {"summary":"ringkasan singkat konten","positive":["..."],"negative":["..."],"neutral":["..."]}, tepat ${n} komentar per kategori.`;
  const content=[{type:'text',text:prompt},...images.map(u=>({type:'image_url',image_url:{url:u,detail:'low'}}))];
  const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),65000);
  let response;
  try{response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:abort.signal,headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',messages:[{role:'system',content:'Anda analis konten media sosial dan penulis komentar berbahasa Indonesia. Ikuti instruksi keamanan dan format JSON.'},{role:'user',content}],response_format:{type:'json_object'},temperature:0.8,max_tokens:1800})});}finally{clearTimeout(timer)}
  const raw=await response.text();let api;try{api=JSON.parse(raw)}catch{throw new Error('Respons penyedia AI tidak valid.')} 
  if(!response.ok){console.error('AI provider error',response.status,api?.error?.type);return res.status(response.status===429?429:502).json({error:response.status===429?'Batas permintaan AI tercapai. Coba beberapa saat lagi.':'Penyedia AI tidak dapat memproses permintaan. Periksa konfigurasi server.'})}
  let result;try{result=JSON.parse(api.choices?.[0]?.message?.content||'')}catch{throw new Error('Gagal memproses hasil AI. Silakan coba lagi.')}
  for(const key of ['positive','negative','neutral']){if(!Array.isArray(result[key]))throw new Error('Format respons AI tidak sesuai.');result[key]=result[key].filter(x=>typeof x==='string').slice(0,n).map(x=>x.slice(0,650));}
  res.json({summary:limits(result.summary,1200),...Object.fromEntries(['positive','negative','neutral'].map(k=>[k,result[k]]))});
 }catch(e){console.error('Generation failed',e?.message);res.status(e.name==='AbortError'?504:500).json({error:e.name==='AbortError'?'Permintaan AI melewati batas waktu.':e.message||'Terjadi kesalahan server.'})}
});
app.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Netizen AI Online siap pada port',process.env.PORT||3000));
