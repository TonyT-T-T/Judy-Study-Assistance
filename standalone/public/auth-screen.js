const $=id=>document.getElementById(id);
const screen=document.body.dataset.authScreen;
$('auth-form').addEventListener('submit',async event=>{
 event.preventDefault();$('auth-message').textContent='';$('submit').disabled=true;
 const setup=screen==='setup';
 const body=setup?{setupToken:$('setup-token').value,parentPassword:$('parent-password').value,studentPassword:$('student-password').value}:{role:$('role').value,password:$('password').value,remember:$('remember').checked};
 if(setup&&body.parentPassword===body.studentPassword){$('auth-message').textContent='家长与学习密码需要不同。';$('submit').disabled=false;return;}
 try{
  const response=await fetch('/api/auth/'+(setup?'setup':'login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin'});
  const result=await response.json();
  if(!response.ok)throw new Error(result.message||'暂时无法完成，请重试。');
  for(const input of document.querySelectorAll('input[type=password]'))input.value='';
  location.assign(setup?'/family-login':'/');
 }catch(error){$('auth-message').textContent=error.message;}finally{$('submit').disabled=false;}
});
