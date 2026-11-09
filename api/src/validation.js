export const origins = new Set(['https://homefilm.co.kr','https://www.homefilm.co.kr']);
export function validate(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return 'INVALID_BODY';
 const {type,author,title,body,phone,turnstile_token}=payload;
 const str=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;
 if(!['question','consultation'].includes(type))return 'INVALID_TYPE';
 if(!str(author,1,40)||!str(body,1,3000)||!str(turnstile_token,1,4096))return 'INVALID_FIELDS';
 if(type==='question'&&!str(title,1,120))return 'INVALID_FIELDS';
 if(type==='consultation'&&phone!=null&&!str(phone,1,40))return 'INVALID_FIELDS';
 return null;
}
export function publicRecord(body){return {type:body.type,author:body.author.trim(),title:body.type==='question'?body.title.trim():null,body:body.body.trim(),phone:body.type==='consultation'?(body.phone||'').trim():null};}
