'use strict';
// Adapts internal, individually testable request handlers to Vercel's
// modern Web Request/Response Function interface.
module.exports=async function handleWeb(request,handler){
 const contentLength=Number(request.headers.get('content-length')||0);
 if(contentLength>300000)return Response.json({error:'Richiesta troppo grande.'},{status:413,headers:{'Cache-Control':'no-store'}});
 const headers=new Headers(),url=new URL(request.url);
 const req={
  method:request.method,
  headers:{...Object.fromEntries(request.headers.entries()),host:url.host},
  query:Object.fromEntries(url.searchParams.entries()),
  body:undefined
 };
 if(!['GET','HEAD'].includes(request.method)){
  try{
   const raw=await request.text();
   if(Buffer.byteLength(raw,'utf8')>300000)return Response.json({error:'Richiesta troppo grande.'},{status:413});
   req.body=raw;
  }catch{return Response.json({error:'Richiesta non valida.'},{status:400})}
 }
 const res={
  statusCode:200,
  setHeader(name,value){
   if(String(name).toLowerCase()==='set-cookie'&&Array.isArray(value)){
    for(const cookie of value)headers.append('Set-Cookie',cookie);
   }else headers.set(name,Array.isArray(value)?value.join(', '):String(value));
  },
  end(value){this.payload=String(value??'')}
 };
 try{await handler(req,res)}catch{return Response.json({error:'Operazione non disponibile.'},{status:500,headers:{'Cache-Control':'no-store'}})}
 return new Response(res.payload??'',{status:res.statusCode,headers});
};
