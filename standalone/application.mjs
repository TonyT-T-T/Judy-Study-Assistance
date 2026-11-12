import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {FamilyAuthStore,secureEqual,validPassword} from './auth-store.mjs';
import {handleApi} from '../worker/api.js';
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const security={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(self), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"};
const json=(value,status=200,extra={})=>new Response(JSON.stringify(value),{status,headers:{...security,'Content-Type':'application/json; charset=utf-8',...extra}});
const cleanReturn=response=>{const headers=new Headers(response.headers);for(const [k,v]of Object.entries(security))headers.set(k,v);return new Response(response.body,{status:response.status,headers});};
const cookieToken=(request,name)=>{const values=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(name+'='));return values.length===1?values[0].slice(name.length+1):null;};
const ROOT=path.resolve(import.meta.dirname,'..');
export function createFamilyApplication({origin,dbPath,setupToken='',env={},clock,allowLocalHttp=false,distPath=ROOT+'/dist'}){
 const publicUrl=new URL(origin);
 if(publicUrl.username||publicUrl.password||publicUrl.pathname!=='/'||publicUrl.search||publicUrl.hash)throw new Error('PUBLIC_ORIGIN must be an origin only');
 const local=allowLocalHttp&&publicUrl.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(publicUrl.hostname);
 if(publicUrl.protocol!=='https:'&&!local)throw new Error('HTTPS is required');
 const canonical=publicUrl.origin,store=new FamilyAuthStore(dbPath,{clock});
 const cookieName=local?'judy_local_session':'__Host-judy_session';
 const cookie=(token,remembered=false,remove=false)=>cookieName+'='+token+'; Path=/; HttpOnly; SameSite=Lax'+(local?'':'; Secure')+(remove?'; Max-Age=0':remembered?'; Max-Age=2592000':'');
 const redirect=location=>new Response(null,{status:303,headers:{...security,Location:location}});
 const authJson=(value,status=200,setCookie)=>json(value,status,setCookie?{'Set-Cookie':setCookie}:{});
 const rate=(scope,limit=8)=>{const result=store.allowAttempt(scope,limit);return result.allowed?null:json({message:'尝试次数较多，请稍后再试。'},429,{'Retry-After':String(result.retryAfter)});};
 const getBody=async request=>{const raw=await request.text();if(raw.length>4096)throw new Error('BODY_TOO_LARGE');const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('BAD_BODY');return body;};
 async function serve(filename,type){try{return new Response(await readFile(filename),{headers:{...security,'Content-Type':type}});}catch{return new Response('Not found',{status:404,headers:security});}}
 async function fetch(request,{clientKey='family-gateway'}={}){
  const url=new URL(request.url),route=url.pathname,method=request.method;
  if(url.origin!==canonical)return json({message:'网站地址不匹配。'},400);
  if(route==='/health'&&method==='GET')return json({ok:true});
  const token=cookieToken(request,cookieName),session=store.session(token);
  if(route.startsWith('/api/auth/')&&method==='POST'){
   if(request.headers.get('Origin')!==canonical)return json({message:'请求来源不匹配。'},403);
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({message:'请求格式错误。'},415);
   let body;try{body=await getBody(request);}catch{return json({message:'请求内容无效或过大。'},400);}
   try{
    if(route==='/api/auth/setup'){
     const blocked=rate('setup:'+clientKey,5);if(blocked)return blocked;
     if(store.initialized())return json({message:'家庭账号已设置，请登录。'},409);
     if(setupToken.length<32)return json({message:'尚未配置首次设置码，请由服务器管理员配置。'},503);
     if(typeof body.setupToken!=='string'||!secureEqual(body.setupToken,setupToken))return json({message:'首次设置码无效。'},403);
     await store.setup(body.parentPassword,body.studentPassword);
     return json({ok:true,message:'家庭密码已设置，请登录。'});
    }
    if(route==='/api/auth/login'){
     if(!store.initialized())return json({code:'SETUP_REQUIRED',message:'请先完成家庭账号设置。'},409);
     const role=['parent','student'].includes(body.role)?body.role:null;
     if(!role)return json({message:'请选择学习或家长身份。'},400);
     const blocked=rate('login:'+role+':'+clientKey)||rate('login-global',40);if(blocked)return blocked;
     if(!await store.verify(role,body.password))return json({message:'密码不正确，请重试。'},401);
     if(token)store.removeSession(token);
     const created=store.createSession(role,body.remember===true,body.device);
     return authJson({ok:true,role,expiresAt:created.expiresAt},200,cookie(created.token,created.remembered));
    }
    if(route==='/api/auth/logout'){if(token)store.removeSession(token);return authJson({ok:true},200,cookie('',false,true));}
    if(!session)return json({code:'LOGIN_REQUIRED',message:'请先登录家庭学习空间。'},401);
    if(route==='/api/auth/reauth'){
     if(session.role!=='parent')return json({message:'此操作需要家长身份。'},403);
     const blocked=rate('reauth:'+clientKey,5);if(blocked)return blocked;
     if(!await store.verify('parent',body.password))return json({message:'家长密码不正确。'},401);
     store.markFresh(session.id);return json({ok:true});
    }
    if(session.role!=='parent')return json({message:'此操作仅限家长。'},403);
    if(!session.fresh)return json({code:'REAUTH_REQUIRED',message:'请再次输入家长密码。'},403);
    if(route==='/api/auth/password'){
     if(!['student','parent'].includes(body.role)||!validPassword(body.password))return json({message:'新密码需为12至128个字符。'},400);
     const blocked=rate('password-change:'+clientKey,5);if(blocked)return blocked;
     if(await store.verify(body.role==='parent'?'student':'parent',body.password))return json({message:'家长与学习密码需要不同。'},400);
     await store.changePassword(body.role,body.password);
     return authJson({ok:true,loginAgain:body.role==='parent'},200,body.role==='parent'?cookie('',false,true):undefined);
    }
    if(route==='/api/auth/revoke-others'){store.revokeOthers(session.id);return json({ok:true});}
    return json({message:'接口不存在。'},404);
   }catch(error){const messages={PASSWORD_LENGTH:'密码需为12至128个字符。',PASSWORDS_MUST_DIFFER:'家长与学习密码需要不同。',ALREADY_SETUP:'家庭账号已经设置。',AUTH_BUSY:'正在处理另一次登录，请稍后重试。'};return json({message:messages[error.message]||'暂时无法完成操作，请稍后重试。'},error.message==='AUTH_BUSY'?429:400);}
  }
  if(route==='/api/auth/status'&&method==='GET')return json({initialized:store.initialized(),authenticated:!!session,role:session?.role||null});
  if(route==='/api/auth/devices'&&method==='GET'){if(session?.role!=='parent')return json({message:'此操作仅限家长。'},403);return json({devices:store.devices(),currentId:session.id});}
  if(route==='/family-login'&&method==='GET'){if(!store.initialized())return redirect('/family-setup');if(session)return redirect('/');return serve(ROOT+'/standalone/public/login.html',MIME['.html']);}
  if(route==='/family-setup'&&method==='GET'){if(store.initialized())return redirect('/family-login');return serve(ROOT+'/standalone/public/setup.html',MIME['.html']);}
  if(['/auth-screen.js','/auth.css'].includes(route)&&method==='GET')return serve(ROOT+'/standalone/public'+route,MIME[path.extname(route)]);
  if(!session){if(route.startsWith('/api/'))return json({code:'LOGIN_REQUIRED',message:'请先登录家庭学习空间。'},401);return redirect('/family-login');}
  if(route==='/api/session'&&method==='GET')return json({authMode:'family',role:session.role,parentFresh:session.fresh,expiresAt:session.expiresAt,remembered:session.remembered,mode:env.FAMILY_ACCESS_VERIFIED==='true'?'family':'synthetic',realDataEnabled:env.FAMILY_ACCESS_VERIFIED==='true',aiEnabled:env.FAMILY_ACCESS_VERIFIED==='true'&&!!env.AI_API_KEY});
  if(route.startsWith('/api/')){
   const headers=new Headers(request.headers);
   for(const name of [...headers.keys()])if(name.startsWith('oai-'))headers.delete(name);
   headers.set('oai-authenticated-user-id','family-'+session.role);
   return cleanReturn(await handleApi(new Request(request,{headers}),{...env,PARENT_USER_IDS:'family-parent',STUDENT_USER_IDS:'family-student'}));
  }
  if(route==='/auth-ui.js'&&method==='GET')return serve(ROOT+'/standalone/public/auth-ui.js',MIME['.js']);
  if(!['GET','HEAD'].includes(method))return json({message:'不支持的请求方式。'},405);
  if(route==='/'||route==='/index.html'){
   let html=await readFile(distPath+'/index.html','utf8');
   html=html.replace('<head>','<head><meta name="judy-auth-mode" content="family">').replace('</body>','<script type="module" src="/auth-ui.js"></script></body>');
   return new Response(method==='HEAD'?null:html,{headers:{...security,'Content-Type':MIME['.html']}});
  }
  let decoded;try{decoded=decodeURIComponent(route);}catch{return json({message:'无效地址。'},400);}
  if(decoded.includes('\\')||decoded.split('/').some(p=>p.startsWith('.'))||decoded.startsWith('/server/')||!MIME[path.extname(decoded)])return new Response('Not found',{status:404,headers:security});
  const file=path.resolve(distPath,'.'+decoded);
  if(!file.startsWith(path.resolve(distPath)+'/'))return new Response('Not found',{status:404,headers:security});
  return serve(file,MIME[path.extname(file)]);
 }
 return {fetch,close:()=>store.close(),store,cookieName,origin:canonical};
}
