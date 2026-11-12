import {DatabaseSync} from 'node:sqlite';
import {scrypt as scryptCallback,randomBytes,randomUUID,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdirSync,chmodSync} from 'node:fs';
import path from 'node:path';
const scrypt=promisify(scryptCallback);
const digest=value=>createHash('sha256').update(value).digest('hex');
const COST={N:131072,r:8,p:1,maxmem:256*1024*1024};
const ROLES=new Set(['parent','student']);
export function validPassword(password){return typeof password==='string'&&[...password].length>=12&&[...password].length<=128&&Buffer.byteLength(password)<=512;}
export function secureEqual(a,b){return timingSafeEqual(Buffer.from(digest(String(a))),Buffer.from(digest(String(b))));}
export class FamilyAuthStore{
 constructor(filename,{clock=()=>Date.now()}={}){
  this.clock=clock;this.hashing=false;
  if(filename!==':memory:'){mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});}
  this.db=new DatabaseSync(filename);
  if(filename!==':memory:')chmodSync(filename,0o600);
  this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  this.db.exec('CREATE TABLE IF NOT EXISTS users (role TEXT PRIMARY KEY, salt TEXT NOT NULL, password_hash TEXT NOT NULL, changed_at INTEGER NOT NULL);');
  this.db.exec('CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, role TEXT NOT NULL REFERENCES users(role), created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, recent_until INTEGER NOT NULL, remembered INTEGER NOT NULL, device TEXT NOT NULL);');
  this.db.exec('CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);');
 }
 initialized(){return this.db.prepare('SELECT count(*) AS n FROM users').get().n===2;}
 close(){this.db.close();}
 async hash(password,salt){
  if(!validPassword(password))throw new Error('PASSWORD_LENGTH');
  if(this.hashing)throw new Error('AUTH_BUSY');
  this.hashing=true;try{return Buffer.from(await scrypt(password,salt,64,COST)).toString('hex');}finally{this.hashing=false;}
 }
 async setup(parentPassword,studentPassword){
  if(this.initialized())throw new Error('ALREADY_SETUP');
  if(!validPassword(parentPassword)||!validPassword(studentPassword))throw new Error('PASSWORD_LENGTH');
  if(secureEqual(parentPassword,studentPassword))throw new Error('PASSWORDS_MUST_DIFFER');
  const parentSalt=randomBytes(32).toString('hex'),studentSalt=randomBytes(32).toString('hex');
  const parentHash=await this.hash(parentPassword,parentSalt),studentHash=await this.hash(studentPassword,studentSalt);
  this.db.exec('BEGIN IMMEDIATE;');
  try{
   if(this.db.prepare('SELECT count(*) AS n FROM users').get().n!==0)throw new Error('ALREADY_SETUP');
   const insert=this.db.prepare('INSERT INTO users(role,salt,password_hash,changed_at) VALUES(?,?,?,?)');
   insert.run('parent',parentSalt,parentHash,this.clock());insert.run('student',studentSalt,studentHash,this.clock());
   this.db.exec('COMMIT;');
  }catch(error){this.db.exec('ROLLBACK;');throw error;}
 }
 allowAttempt(scope,limit=8,windowMs=15*60*1000){
  const now=this.clock(),key=digest(scope);
  this.db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').run(now);
  this.db.prepare('INSERT INTO rate_limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+windowMs);
  const row=this.db.prepare('SELECT count,reset_at FROM rate_limits WHERE key=?').get(key);
  return {allowed:row.count<=limit,retryAfter:Math.max(1,Math.ceil((row.reset_at-now)/1000))};
 }
 async verify(role,password){
  if(!ROLES.has(role)||!validPassword(password))return false;
  const row=this.db.prepare('SELECT salt,password_hash FROM users WHERE role=?').get(role);
  if(!row)return false;
  const candidate=await this.hash(password,row.salt);
  return secureEqual(candidate,row.password_hash);
 }
 createSession(role,remembered=false,device=''){
  if(!ROLES.has(role)||!this.initialized())throw new Error('INVALID_ROLE');
  const token=randomBytes(32).toString('base64url'),id=randomUUID(),now=this.clock();
  const expires=now+(remembered?30*864e5:12*36e5);
  this.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now);
  // Each role is bounded to a small family device list.
  this.db.prepare('DELETE FROM sessions WHERE role=? AND id NOT IN (SELECT id FROM sessions WHERE role=? ORDER BY created_at DESC LIMIT 9)').run(role,role);
  this.db.prepare('INSERT INTO sessions(id,token_hash,role,created_at,expires_at,recent_until,remembered,device) VALUES(?,?,?,?,?,?,?,?)').run(id,digest(token),role,now,expires,role==='parent'?now+5*60e3:0,remembered?1:0,String(device).trim().slice(0,40));
  return {token,id,role,expiresAt:expires,remembered:!!remembered};
 }
 session(token){
  if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const row=this.db.prepare('SELECT id,role,created_at,expires_at,recent_until,remembered,device FROM sessions WHERE token_hash=?').get(digest(token));
  if(!row||row.expires_at<=this.clock())return null;
  return {id:row.id,role:row.role,createdAt:row.created_at,expiresAt:row.expires_at,remembered:!!row.remembered,device:row.device,fresh:row.role==='parent'&&row.recent_until>this.clock()};
 }
 removeSession(token){if(typeof token==='string')this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));}
 markFresh(sessionId){this.db.prepare('UPDATE sessions SET recent_until=? WHERE id=? AND role=?').run(this.clock()+5*60e3,sessionId,'parent');}
 async changePassword(role,password){
  if(!ROLES.has(role)||!validPassword(password))throw new Error('PASSWORD_LENGTH');
  const salt=randomBytes(32).toString('hex'),hash=await this.hash(password,salt);
  this.db.exec('BEGIN IMMEDIATE;');try{
   this.db.prepare('UPDATE users SET salt=?,password_hash=?,changed_at=? WHERE role=?').run(salt,hash,this.clock(),role);
   this.db.prepare('DELETE FROM sessions WHERE role=?').run(role);this.db.exec('COMMIT;');
  }catch(error){this.db.exec('ROLLBACK;');throw error;}
 }
 devices(){return this.db.prepare('SELECT id,role,created_at AS createdAt,expires_at AS expiresAt,device FROM sessions WHERE expires_at>? ORDER BY created_at DESC').all(this.clock());}
 revokeOthers(currentSessionId){this.db.prepare('DELETE FROM sessions WHERE id<>?').run(currentSessionId);}
}
