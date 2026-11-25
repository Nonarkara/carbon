// Rehearse a rollback only on a dedicated preview alias. Never changes production.
import {resolve} from 'node:path';
import {headCommit,repoRoot,createPristineTree} from './lib/release-tree.mjs';
import {acquireReleaseLock,createReleaseReceipt,finishRelease,lockfileIdentity} from './lib/release-operations.mjs';
import {run,localReleaseEnv} from './lib/release-run.mjs';
const root=repoRoot(),prior=headCommit(root,process.argv[2]||'3c9ef32'),candidate=headCommit(root,process.argv[3]||'HEAD');
const branch='carbona-restore-drill',base=`https://${branch}.forest-carbon-thailand.pages.dev`;
const lock=await acquireReleaseLock(root,candidate.sha),evidence=await createReleaseReceipt(root,candidate);
evidence.receipt.kind='preview-restore-drill';evidence.receipt.production=false;evidence.receipt.previous=prior;evidence.receipt.alias=base;await evidence.save();
const controller=new AbortController(),cancel=()=>controller.abort();process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
let tree;
const command=async(cmd,args,cwd,label,env=localReleaseEnv())=>{if(await run(cmd,args,{cwd,label,env,signal:controller.signal,onResult:evidence.recordPhase})!==0)throw Error(label+' failed');};
async function waitFor(short){const end=Date.now()+180000;while(Date.now()<end){if(controller.signal.aborted)throw Error('preview drill cancelled');try{const r=await fetch(base+'/version.json',{signal:AbortSignal.timeout(5000)});if(r.ok&&(await r.json()).commit===short)return;}catch{}await new Promise(r=>setTimeout(r,2000));}throw Error('preview alias did not serve '+short);}
try{
 for(const revision of [prior,candidate]){
  tree=await createPristineTree({commit:revision.sha,cwd:root});
  await command('npm',['ci','--include=dev','--no-audit','--no-fund'],tree.dir,'preview dependencies '+revision.short);
  const lockHash=await lockfileIdentity(tree.dir);
  await command('npm',['run','build'],tree.dir,'preview build '+revision.short);
  await command('npx',['--no-install','wrangler','pages','deploy','--project-name','forest-carbon-thailand','--branch',branch,'--commit-hash',revision.sha,'--commit-message','Preview restore drill '+revision.short,'--commit-dirty','true'],tree.dir,'preview upload '+revision.short);
  await waitFor(revision.short);
  // The current verifier reads every artifact from the selected checkout, not root/public.
  await command('node',[resolve(root,'scripts/release-smoke.mjs')],tree.dir,'preview exact bytes '+revision.short,{...localReleaseEnv(),BASE_URL:base});
  await command('node',['scripts/live-verify.mjs',base],tree.dir,'preview user journeys '+revision.short);
  evidence.receipt.domains.push({base,commit:revision.short,lockSha256:lockHash,ok:true});await evidence.save();
  await tree.remove();tree=null;
 }
 evidence.receipt.status='verified';await evidence.save();
}catch(error){evidence.receipt.status=controller.signal.aborted?'cancelled':'failed';await evidence.save();console.error(error.message);process.exitCode=1;
}finally{
 const errors=await finishRelease({tree,evidence,lock});if(errors.length){console.error(errors.join(', '));process.exitCode=1;}
 process.removeListener('SIGINT',cancel);process.removeListener('SIGTERM',cancel);console.log('Preview restore receipt:',evidence.dir);
}
