(function(){"use strict";
 const URLS=[
  {label:"Reg. (CE) 852/2004: igiene dei prodotti alimentari",url:"https://eur-lex.europa.eu/eli/reg/2004/852/oj"},
  {label:"Reg. (UE) 1169/2011: allergeni e informazioni al consumatore",url:"https://eur-lex.europa.eu/eli/reg/2011/1169/oj"},
  {label:"Reg. (UE) 2021/382: allergeni e cultura della sicurezza alimentare",url:"https://eur-lex.europa.eu/eli/reg/2021/382/oj"}
 ];
 const IMGS={sala:["assets/foto_03.jpg","assets/foto_09.jpg","assets/foto_04.jpg"],cucina:["assets/foto_01.jpg","assets/foto_07.jpg","assets/foto_08.jpg"],bar:["assets/foto_02.jpg","assets/foto_05.jpg","assets/foto_10.jpg"]};
 function make(area,data){
  if(!["sala","cucina","bar"].includes(area)||data.modules.length!==4||data.lessons.length!==12||data.diagnostics.length!==16||data.final.length!==8)throw Error("Struttura corso intermedio non valida: "+area);
  const id=area+"-intermedio",prefix=({sala:"SAL",cucina:"CUC",bar:"BAR"})[area];
  const lessons=data.lessons.map((x,i)=>{
   if(!x||!x.title||!x.objective||!x.intro||!x.problem||!x.method||!x.control||!x.case||!x.practice||!x.actions||!x.failures)throw Error("Lezione incompleta "+area+" "+i);
   const module=data.modules[Math.floor(i/3)];
   return {id:prefix+"-I"+String(i+1).padStart(3,"0"),module:module.id,title:x.title,
    objective:x.objective,minutes:x.minutes||43,photo:IMGS[area][i%3],intro:x.intro,
    sections:[{title:"Lettura della situazione",text:x.problem},{title:"Decisione professionale",text:x.method},{title:"Controllo e tracciabilità",text:x.control}],
    steps:x.actions,errors:x.failures,case:x.case,practice:x.practice,criteria:x.criteria||["Definisci chi decide, chi esegue e quando si verifica.","Giustifica le priorità con vincoli e rischi reali.","Prevedi un punto di escalation e un piano di continuità."],
    codex:["METODO","QUALITÀ"],glossary:x.glossary||"Responsabilità = decisione assegnata; verifica = evidenza di un risultato, non supposizione.",
    environments:x.environment||"Le varianti dipendono da flussi, attrezzature, responsabilità e procedure specifiche dell'attività. Quando la sicurezza è incerta, prevale la procedura applicabile, non il ritmo del servizio.",
    dialogue:x.dialogue||"Riassumi il fatto verificabile, comunica il rischio, assegna un responsabile e concorda quando verrà data la conferma."};
  });
  function q(raw,id,lesson,module){if(!raw||raw.length!==5||!Array.isArray(raw[1])||raw[1].length!==3||!Number.isInteger(raw[2])||raw[2]<0||raw[2]>2||!raw[0]||!raw[3])throw Error("Domanda invalida "+id);return {id,lesson,module,type:"choice",prompt:raw[0],options:raw[1],correct:raw[2],explanation:raw[3],critical:!!raw[4]};}
  const questions=[];
  data.lessons.forEach((x,i)=>{if(!Array.isArray(x.q)||x.q.length!==2)throw Error("Mancano 2 domande: "+area+" "+i);for(let j=0;j<2;j++)questions.push(q(x.q[j],prefix+"-IQ"+String(i*2+j+1).padStart(3,"0"),lessons[i].id,lessons[i].module));});
  const skill_questions=data.diagnostics.map((x,i)=>q(x,prefix+"-ISC"+String(i+1).padStart(2,"0"),lessons[Math.floor(i/4)*3+Math.floor(i%4/2)].id,data.modules[Math.floor(i/4)].id));
  const final_questions=data.final.map((x,i)=>q(x,prefix+"-IF"+String(i+1).padStart(2,"0"),lessons[Math.floor(i/2)*3+2].id,data.modules[Math.floor(i/2)].id));
  const sources=area==="bar"?[...URLS,
    {label:"FIPE (12/08/2026): vendita e somministrazione di alcolici ai minori di 18 anni",url:"https://www.fipe.it/2026/08/12/normativa-di-settore/alcol-e-under-18-le-regole-da-conoscere/"},
    {label:"Specialty Coffee Association: dati di estrazione e rapporto dose/bevanda",url:"https://sca.coffee/sca-news/25/issue-9/english/water-and-coffee-acidity-how-to-adapt-your-water-for-different-extraction-methods-25-magazine-issue-9-pxjby"}]:URLS;
  const course={id,title:"Sala",subtitle:"",desc:data.desc,hero:data.hero||"03",level:"intermedio",area,
    modules:data.modules,lessons,questions,skill_questions,final_questions,sources,
    disclaimer:"Formazione professionale intermedia a scopo didattico, non certificata. Le esercitazioni simulate non sostituiscono procedure aziendali, formazione obbligatoria o osservazione pratica."};
  course.title=data.title;course.subtitle=data.subtitle||"Percorso intermedio · decisioni, qualità e autonomia";
  return course;
 }
 window.DT_INTERMEDIATE_COURSES={};
 window.DT_BUILD_INTERMEDIATE=make;
})();