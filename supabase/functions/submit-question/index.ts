import { createClient } from "npm:@supabase/supabase-js@2";
const allowed = new Set(["https://homefilm.co.kr", "https://www.homefilm.co.kr"]);
const headersFor = (origin: string) => ({"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"content-type, apikey, authorization, x-client-info","Vary":"Origin","Cache-Control":"no-store"});
Deno.serve(async req => {
  const origin=req.headers.get('origin')||'';
  if(!allowed.has(origin)) return new Response('Forbidden',{status:403});
  const headers=headersFor(origin);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  const reply=(message:string,status:number)=>new Response(JSON.stringify({error:message}),{status,headers:{...headers,'Content-Type':'application/json'}});
  if(req.method!=='POST')return reply('Method not allowed',405);
  try{
    const raw=await req.text();
    if(new TextEncoder().encode(raw).length>10000)return reply('Payload too large',413);
    const body=JSON.parse(raw);
    if(!body||typeof body!=='object'||Array.isArray(body))return reply('Invalid request',400);
    const valid=(x:unknown,max:number)=>typeof x==='string'&&x.trim().length>0&&x.trim().length<=max;
    if(!valid(body.author,30)||!valid(body.title,100)||!valid(body.body,2000)||!valid(body.turnstile_token,4096))return reply('Invalid fields',400);
    const secret=Deno.env.get('TURNSTILE_SECRET_KEY');
    const url=Deno.env.get('SUPABASE_URL');
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!secret||!url||!serviceKey)return reply('Service unavailable',503);
    const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({secret,response:body.turnstile_token}),signal:AbortSignal.timeout(8000)
    });
    if(!verification.ok)return reply('Verification unavailable',503);
    const verdict=await verification.json();
    if(verdict.success!==true||!['homefilm.co.kr','www.homefilm.co.kr'].includes(verdict.hostname))return reply('Verification failed',403);
    const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error}=await db.from('film_questions').insert({author:body.author.trim(),title:body.title.trim(),body:body.body.trim(),published:false,answer:null});
    if(error){console.error('Question insert error',error.code);return reply('Save failed',500);}
    return new Response(JSON.stringify({success:true}),{status:200,headers:{...headers,'Content-Type':'application/json'}});
  }catch(e){console.error('Question submit failed',e instanceof Error?e.name:'unknown');return reply('Submission failed',500);}
});
