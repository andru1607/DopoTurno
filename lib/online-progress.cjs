'use strict';
const {json,method,body,upstream,session,guarded,fail}=require('./cloud-server');
const allowed=['done','microProgress','microReviews','placements','assessments','activeCourse','lastLesson','shiftSimResults','shiftSimDrafts'];
module.exports=async function handler(req,res){
 if(!method(req,res,['GET','POST']))return;
 const cfg=guarded(req,res);if(!cfg)return;
 try{
  const s=await session(req,res,cfg);if(!s){json(res,401,{error:'Devi accedere per usare il salvataggio cloud.'});return}
  const u=encodeURIComponent(s.user.id);
  if(req.method==='GET'){
   const q=new URLSearchParams({select:'snapshot,saved_at',owner_id:'eq.'+s.user.id,limit:'1'});
   const out=await upstream(cfg,'/rest/v1/dt_progress?'+q,{token:s.token});
   if(!out.ok){json(res,502,{error:'Impossibile caricare i progressi.'});return}
   json(res,200,{snapshot:out.data?.[0]?.snapshot||null,savedAt:out.data?.[0]?.saved_at||null});return;
  }
  const input=body(req,275000);
  if(input.action!=='save'||!input.snapshot||typeof input.snapshot!=='object'||Array.isArray(input.snapshot)){json(res,400,{error:'Formato dei progressi non valido.'});return}
  const filtered=Object.fromEntries(allowed.filter(k=>Object.prototype.hasOwnProperty.call(input.snapshot,k)).map(k=>[k,input.snapshot[k]]));
  if(Buffer.byteLength(JSON.stringify(filtered),'utf8')>250000){json(res,413,{error:'Progressi troppo grandi: esporta prima un backup.'});return}
  const out=await upstream(cfg,'/rest/v1/dt_progress?on_conflict=owner_id',{method:'POST',token:s.token,prefer:'resolution=merge-duplicates,return=minimal',body:{owner_id:s.user.id,snapshot:filtered,saved_at:new Date().toISOString()}});
  if(!out.ok){json(res,502,{error:'Il salvataggio cloud non è riuscito.'});return}
  json(res,200,{success:true});
 }catch(e){fail(res,e)}
};
