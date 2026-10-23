export type AuthEnv={DB?:D1Database;ADMIN_EMAIL?:string;ELIT_HOME_PASSWORD?:string};
const cookieName='__Host-elit_session';
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
export async function digest(s:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))}
export async function passwordsEqual(a:string,b:string){const x=await digest(a),y=await digest(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x.charCodeAt(i)^y.charCodeAt(i);return diff===0}
function loginPage(error='',ready=true){return new Response('<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elit home · Giriş</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f6fc;color:#20385d;font-family:Segoe UI,Arial;min-height:100vh;display:grid;place-items:center;padding:24px}.card{background:white;width:100%;max-width:400px;padding:34px;border:1px solid #dfe8f6;border-radius:18px;box-shadow:0 20px 70px #17396b12}img{width:120px;border-radius:8px}h1{font-size:25px;margin:22px 0 8px}p{font-size:13px;line-height:1.8;color:#7184a1}label{display:block;font-size:12px;margin:20px 0;color:#526c92}input{display:block;width:100%;padding:13px;margin-top:8px;border:1px solid #d9e3f1;border-radius:8px;font-size:15px}button{width:100%;padding:14px;background:#df3d48;color:white;border:0;border-radius:8px;font-size:14px;cursor:pointer}.error{background:#fff0f0;color:#b63c47;padding:12px;border-radius:8px}small{display:block;margin-top:22px;color:#93a0b7;font-size:11px}</style><main class="card"><img src="/elit-home-logo.png" alt="Elit home"><h1>Mağazanıza giriş yapın</h1><p>Satış, ciro ve stok kayıtlarınıza güvenli erişim.</p>'+(error?'<p class="error" role="alert">'+error+'</p>':'')+(ready?'<form method="post" action="/auth/login"><label>E-posta<input required type="email" name="email" autocomplete="username" maxlength="254"></label><label>Şifre<input required type="password" name="password" autocomplete="current-password" maxlength="256"></label><button>Giriş yap</button></form>':'<p>Mağaza girişi hazırlanıyor. Yönetici ayarları tamamlandığında giriş yapabilirsiniz.</p>')+'<small>Elit home · Beyaz eşya mağaza yönetimi</small></main></html>',{status:error?401:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}})}
export async function authenticate(request:Request,env:AuthEnv):Promise<Request|Response>{
 const url=new URL(request.url),db=env.DB;
 const ready=!!db&&!!env.ADMIN_EMAIL&&!!env.ELIT_HOME_PASSWORD&&env.ELIT_HOME_PASSWORD.length>=14;
 const headers=new Headers(request.headers);
 for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-user-'))headers.delete(key);
 if(!['GET','HEAD','OPTIONS'].includes(request.method)&&request.headers.get('Origin')!==url.origin)return new Response('İstek doğrulanamadı.',{status:403});
 if(url.pathname==='/login'||url.pathname==='/signin-with-chatgpt')return loginPage('',ready);
 if(url.pathname==='/auth/login'){
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 if(!ready)return loginPage('',false);
 if(Number(request.headers.get('Content-Length')||0)>4096)return new Response('İstek çok büyük',{status:413});
 const now=Date.now(),key=await digest((request.headers.get('CF-Connecting-IP')||'unknown')+':'+Math.floor(now/900000));
 const counter=await db!.prepare('INSERT INTO login_attempts (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(key,now+900000).first<{attempts:number}>();
 if(!counter||counter.attempts>10)return new Response('Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',{status:429,headers:{'Retry-After':'900'}});
 const form=await request.formData().catch(()=>null),email=String(form?.get('email')||'').trim().toLowerCase(),password=String(form?.get('password')||'');
 const valid=await passwordsEqual(password.slice(0,256),env.ELIT_HOME_PASSWORD!);
 if(email!==env.ADMIN_EMAIL!.trim().toLowerCase()||password.length>256||!valid)return loginPage('E-posta veya şifre hatalı.');
 const token=hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
 await db!.batch([db!.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),db!.prepare('DELETE FROM login_attempts WHERE expires_at < ?').bind(now),db!.prepare('INSERT INTO sessions (token_hash,email,expires_at) VALUES (?,?,?)').bind(await digest(token+env.ELIT_HOME_PASSWORD),email,now+604800000)]);
 return new Response(null,{status:303,headers:{Location:'/', 'Set-Cookie':cookieName+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800','Cache-Control':'no-store'}});
 }
 const raw=request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 const session=ready&&raw&&/^[a-f0-9]{64}$/.test(raw)?await db!.prepare('SELECT email FROM sessions WHERE token_hash=? AND expires_at>?').bind(await digest(raw+env.ELIT_HOME_PASSWORD),Date.now()).first<{email:string}>():null;
 if(url.pathname==='/auth/logout'&&request.method==='POST'){
 if(raw&&db)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(raw+env.ELIT_HOME_PASSWORD)).run();
 return new Response(null,{status:303,headers:{Location:'/login','Set-Cookie':cookieName+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0','Cache-Control':'no-store'}});
 }
 if(!session||session.email!==env.ADMIN_EMAIL?.trim().toLowerCase())return url.pathname.startsWith('/api/')?Response.json({error:'Giriş gerekli.'},{status:401,headers:{'Cache-Control':'no-store'}}):new Response(null,{status:302,headers:{Location:'/login','Cache-Control':'no-store'}});
 headers.set('oai-authenticated-user-id','elithome-owner');
 headers.set('oai-authenticated-user-email',session.email);
 return new Request(request,{headers});
}
