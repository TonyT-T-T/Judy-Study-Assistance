import http from 'node:http';
import path from 'node:path';
import {createFamilyApplication} from './application.mjs';
process.umask(0o077);
if(!process.env.PUBLIC_ORIGIN)throw new Error('Set PUBLIC_ORIGIN to the final HTTPS origin before starting.');
const app=createFamilyApplication({origin:process.env.PUBLIC_ORIGIN,dbPath:path.resolve(process.env.JUDY_DATA_DIR||'./data','family-auth.sqlite'),setupToken:process.env.FAMILY_SETUP_TOKEN||'',env:process.env,allowLocalHttp:process.env.ALLOW_INSECURE_LOCALHOST==='1'});
const server=http.createServer(async(req,res)=>{
 try{
  const chunks=[];let size=0;const max=req.url?.startsWith('/api/auth/')?8192:8e6;
  for await(const chunk of req){size+=chunk.length;if(size>max){res.writeHead(413,{'Cache-Control':'no-store'});res.end('Request too large');req.resume();return;}chunks.push(chunk);}
  // Never trust externally supplied forwarding/identity headers for login.
  const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value!==undefined&&!key.startsWith('oai-'))headers.set(key,Array.isArray(value)?value.join(', '):value);
  const request=new Request(new URL(req.url,app.origin),{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
  const response=await app.fetch(request,{clientKey:req.socket.remoteAddress||'family-gateway'});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{if(!res.headersSent)res.writeHead(500,{'Cache-Control':'no-store'});res.end('暂时无法完成请求。');}
});
server.requestTimeout=65000;server.headersTimeout=15000;server.maxHeadersCount=50;
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Judy family server is ready. Passwords and setup codes are never logged.'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{app.close();process.exit(0);}));
