import {FamilyAuthStore,validPassword} from './auth-store.mjs';
import {createInterface} from 'node:readline/promises';
import path from 'node:path';
const role=process.argv[2];
if(!['parent','student'].includes(role)||!process.stdin.isTTY)throw new Error('Run in the private server terminal: node standalone/reset-password.mjs parent|student');
// readline output is suppressed during secret entry, including echo redraws.
const sink={write(){},on(){},once(){},removeListener(){},isTTY:true,columns:80};
const rl=createInterface({input:process.stdin,output:sink,terminal:true});
process.stdout.write('Enter the new family password (hidden): ');
const password=await rl.question('');
process.stdout.write('\nConfirm the new password (hidden): ');
const confirmation=await rl.question('');rl.close();process.stdout.write('\n');
if(password!==confirmation||!validPassword(password))throw new Error('Passwords must match and contain 12 to 128 characters.');
const store=new FamilyAuthStore(path.resolve(process.env.JUDY_DATA_DIR||'./data','family-auth.sqlite'));
try{
 if(!store.initialized())throw new Error('Complete first-time setup first.');
 if(await store.verify(role==='parent'?'student':'parent',password))throw new Error('Parent and student passwords must differ.');
 await store.changePassword(role,password);
 console.log('Family password changed; previous sessions for this role are revoked.');
}finally{store.close();}
