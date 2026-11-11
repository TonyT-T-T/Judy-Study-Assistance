// 仓库凭据仅通过 stdin 接收并保留在进程内存中，不写文件或打印。
import {spawnSync} from 'node:child_process';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
console.log('Ready for source credential JSON (hidden stdin).');
let raw='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{raw+=s;if(!raw.includes('\n'))return;process.stdin.pause();try{const c=JSON.parse(raw);raw='';const env={...process.env};if(c.token){env.GIT_CONFIG_COUNT='1';env.GIT_CONFIG_KEY_0='http.extraHeader';env.GIT_CONFIG_VALUE_0='Authorization: Bearer '+c.token;}const run=spawnSync('git',['push',c.remote_url,'HEAD:refs/heads/'+c.branch],{env,encoding:'utf8'});if(run.status!==0){process.stderr.write(String(run.stderr||'Source push failed').replaceAll(c.token||'__NO_TOKEN__','[redacted]'));process.exitCode=1;}else console.log('Source push complete.');}catch{console.error('Source credential input failed.');process.exitCode=1;}});
