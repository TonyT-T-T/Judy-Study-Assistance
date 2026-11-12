import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
let dom,doc;
before(async()=>{
 const html=(await readFile(new URL('../dist/index.html',import.meta.url),'utf8')).replace('<head>','<head><meta name="judy-auth-mode" content="family">');
 dom=new JSDOM(html,{url:'https://family.test/#parent',pretendToBeVisual:true});doc=dom.window.document;
 for(const k of ['window','document','localStorage','location','navigator','FileReader'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
 dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 globalThis.fetch=async()=>new Response(JSON.stringify({authMode:'family',role:'student',aiEnabled:false,realDataEnabled:false}));
 await import('../dist/app.js');await new Promise(r=>setTimeout(r,20));
});
after(()=>dom.window.close());
test('standalone student cannot enter parent view through hash or visible navigation',()=>{assert.equal(doc.getElementById('parent').hidden,true);assert.equal(doc.getElementById('home').hidden,false);doc.querySelector('[data-view="parent"]').click();assert.equal(doc.getElementById('parent').hidden,true);});
test('standalone profile changes are denied without fresh parent authentication',async()=>{const old=dom.window.judyTest.getState().settings.grade;let checks=0;dom.window.judyFamilyAuth={requireFreshParent:async()=>{checks++;return false;}};doc.getElementById('settings-grade').value='初三';doc.getElementById('save-settings').click();await new Promise(r=>setTimeout(r,10));assert.equal(checks,1);assert.equal(dom.window.judyTest.getState().settings.grade,old);});
test('standalone login pages use password fields and do not contain ChatGPT sign-in redirects',async()=>{const html=await readFile(new URL('../standalone/public/login.html',import.meta.url),'utf8');const page=new JSDOM(html).window.document;assert.equal(page.getElementById('password').type,'password');assert.equal(page.getElementById('remember').checked,true);assert.doesNotMatch(html,/signin-with-chatgpt|auth\.openai/);});
