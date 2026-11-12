const $=id=>document.getElementById(id);
async function call(action,body={}){
 const response=await fetch('/api/auth/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin'});
 const result=await response.json();if(!response.ok){const e=new Error(result.message||'操作未完成。');e.code=result.code;throw e;}return result;
}
let resolveReauth=null;
function closeReauth(success=false){const resolve=resolveReauth;resolveReauth=null;const dialog=$('family-reauth');if(dialog.open)dialog.close();$('family-parent-password').value='';if(resolve)resolve(success);}
const initial=await fetch('/api/session').then(async r=>{if(r.status===401)location.assign('/family-login');return r.json();}).catch(()=>({}));
if(initial.authMode==='family'){
 document.body.insertAdjacentHTML('beforeend','<dialog id="family-reauth"><div class="dialog-top"><span class="eyebrow">家长验证</span><button id="family-cancel" class="close" aria-label="取消">×</button></div><h2>请确认家长身份</h2><form id="family-reauth-form"><label class="field-label" for="family-parent-password">家长管理密码</label><input id="family-parent-password" type="password" autocomplete="current-password" maxlength="128" required><p class="field-note">验证用于管理操作，约 5 分钟后需再次确认。</p><button class="primary" type="submit">确认身份</button><p id="family-reauth-message" role="status"></p></form></dialog>');
 $('family-cancel').onclick=()=>closeReauth(false);$('family-reauth').addEventListener('cancel',()=>closeReauth(false));$('family-reauth').addEventListener('close',()=>{if(resolveReauth)closeReauth(false);});
 $('family-reauth-form').onsubmit=async event=>{event.preventDefault();$('family-reauth-message').textContent='';const submit=$('family-reauth-form').querySelector('button[type=submit]');submit.disabled=true;try{await call('reauth',{password:$('family-parent-password').value});closeReauth(true);}catch(error){$('family-reauth-message').textContent=error.message;}finally{submit.disabled=false;}};
 window.judyFamilyAuth={
  async requireFreshParent(){
   const response=await fetch('/api/session'),s=await response.json();
   if(!response.ok){location.assign('/family-login');return false;}
   if(s.role!=='parent'){alert('这个操作需要先退出并以家长身份登录。');return false;}
   if(s.parentFresh)return true;
   if(resolveReauth)return false;
   $('family-reauth-message').textContent='';$('family-reauth').showModal();$('family-parent-password').focus();
   return new Promise(resolve=>resolveReauth=resolve);
  }
 };
 const header=document.querySelector('header>div');
 const logout=document.createElement('button');logout.className='text-button';logout.textContent='退出';logout.onclick=async()=>{try{await call('logout');location.assign('/family-login');}catch(error){alert(error.message);}};header.append(logout);
 if(initial.role==='student'){document.querySelectorAll('[data-view="parent"]').forEach(el=>el.hidden=true);if($('mobile-profile'))$('mobile-profile').hidden=true;}
 else{
  const accountsButton=document.createElement('button');accountsButton.className='text-button';accountsButton.textContent='账号与设备';header.append(accountsButton);
  document.body.insertAdjacentHTML('beforeend','<dialog id="family-accounts"><div class="dialog-top"><span class="eyebrow">家庭账号</span><button class="close" aria-label="关闭">×</button></div><h2>密码与登录设备</h2><p class="field-note">修改密码会让该身份的所有设备退出；此处不修改国家教育平台或 ChatGPT 密码。</p><form id="family-password-form"><label class="field-label" for="family-target-role">要修改的密码</label><select id="family-target-role"><option value="student">Judy 学习密码</option><option value="parent">家长管理密码</option></select><label class="field-label" for="family-new-password">新密码</label><input id="family-new-password" type="password" autocomplete="new-password" required minlength="12" maxlength="128"><button class="primary" type="submit">修改家庭密码</button></form><p id="family-account-message" role="status"></p><h3>当前有效登录</h3><div id="family-devices"></div><button id="family-revoke" class="secondary">让其他设备退出</button></dialog>');
  accountsButton.onclick=async()=>{const response=await fetch('/api/auth/devices');if(!response.ok)return;const d=await response.json();$('family-devices').replaceChildren();for(const device of d.devices){const p=document.createElement('p');p.className='field-note';p.textContent=(device.role==='parent'?'家长':'Judy')+(device.id===d.currentId?' · 当前设备':'')+' · 有效至 '+new Date(device.expiresAt).toLocaleDateString('zh-CN');$('family-devices').append(p);}$('family-accounts').showModal();};
  $('family-password-form').onsubmit=async event=>{event.preventDefault();if(!await window.judyFamilyAuth.requireFreshParent())return;const button=$('family-password-form').querySelector('button');button.disabled=true;try{const result=await call('password',{role:$('family-target-role').value,password:$('family-new-password').value});$('family-new-password').value='';if(result.loginAgain)location.assign('/family-login');else $('family-account-message').textContent='密码已修改，Judy 的原登录已失效。';}catch(error){$('family-account-message').textContent=error.message;}finally{button.disabled=false;}};
  $('family-revoke').onclick=async()=>{if(!await window.judyFamilyAuth.requireFreshParent())return;if(!confirm('确认让其他设备退出？它们需要重新输入家庭密码。'))return;try{await call('revoke-others');$('family-account-message').textContent='其他设备已退出。';}catch(error){$('family-account-message').textContent=error.message;}};
 }
}
