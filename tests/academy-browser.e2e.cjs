'use strict';
/* Browser regression: Chromium + WebKit emulation, not physical Safari/iPhone QA. */
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=process.env.DT_QA_URL||'http://127.0.0.1:4173';
const devices=[
 {engine:'chromium',name:'small-phone',width:320,height:700},
 {engine:'chromium',name:'desktop',width:1280,height:900},
 {engine:'webkit',name:'iPhone-width',width:390,height:844}
];
async function checkTargets(page,selector,min,label){
 const targets=await page.locator(selector).evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {w:b.width,h:b.height}}));
 assert.ok(targets.length>0,label+' has controls');
 for(const t of targets)assert.ok(t.w>=min&&t.h>=min,label+' undersized '+JSON.stringify(t));
}
async function checkOverflow(page,label){
 const box=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,w:window.innerWidth}));
 assert.ok(box.sw<=box.w+2,label+' overflow '+JSON.stringify(box));
}
async function run(){
 const report=[];
 for(const device of devices){
  const browser=await (device.engine==='chromium'?chromium:webkit).launch({headless:true});
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:2,isMobile:device.width<700,hasTouch:device.width<700});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const id=device.engine+'/'+device.name;
  try{
   process.stdout.write('Testing '+id+'\n');
   await page.goto(BASE+'/#home',{waitUntil:'load',timeout:35000});
   await page.locator('.studio-home').waitFor({timeout:20000});
   assert.equal(await page.locator('.studio-stat').count(),3,id+' summary metrics');
   assert.equal(await page.locator('.bottom-nav [data-page]').count(),5,id+' five mobile destinations');
   await checkTargets(page,'.studio-shortcuts button',44,id+' home shortcuts');
   await checkOverflow(page,id+' home');
   await page.goto(BASE+'/#progress',{waitUntil:'domcontentloaded'});
   await page.locator('.studio-progress').waitFor();
   assert.equal(await page.locator('.progress-course-card').count(),2,id+' foundation and intermediate summaries');
   assert.equal(await page.locator('.studio-evidence').count(),1,id+' assessment evidence separated');
   await checkOverflow(page,id+' progress');
   await page.goto(BASE+'/#academy',{waitUntil:'load',timeout:35000});
   await page.locator('.academy-hub').waitFor({timeout:20000});
   assert.equal(await page.locator('.hub-course-card').count(),2,id+' two focused courses');
   assert.equal(await page.locator('.hub-role-tabs button').count(),3,id+' roles');
   await checkOverflow(page,id+' hub');
   await checkTargets(page,'.hub-role-tabs button',44,id+' roles');
   await checkTargets(page,'.studio-local-nav button',44,id+' shortcut bar');
   await checkTargets(page,'.studio-module',44,id+' module selections');
   await page.locator('.hub-role-tabs [data-id="cucina"]').click();
   assert.equal(await page.locator('.hub-role-tabs [data-id="cucina"]').getAttribute('aria-pressed'),'true',id+' selected role');
   assert.match(await page.locator('.studio-program-top').innerText(),/Moduli di Fondamenti di cucina/i);
   await page.locator('.studio-module[data-course="cucina"]').first().click();
   await page.locator('.micro-module-toggle').first().waitFor();
   assert.equal(await page.locator('.micro-module-toggle').count(),4,id+' module count');
   assert.equal(await page.locator('.micro-chapter:visible').count(),3,id+' first module expanded');
   await checkTargets(page,'.micro-module-toggle',44,id+' module toggles');
   await page.locator('.micro-module-toggle').nth(1).click();
   assert.equal(await page.locator('.micro-module-toggle').nth(1).getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('.micro-module-toggle').first().getAttribute('aria-expanded'),'false');
   assert.equal(await page.locator('.micro-chapter:visible').count(),3,id+' next module chapters');
   await checkOverflow(page,id+' course');
   await page.locator('.micro-chapter:visible .micro-track-item').first().click();
   await page.locator('.micro-lesson-panel').waitFor();
   assert.equal(await page.locator('main').count(),1,id+' one main landmark');
   await page.locator('[data-action="microFinish"]').click();
   assert.match(page.url(),/#micro\/CUC-\d{3}\/1/,id+' new micro step');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.micro-lesson-panel').waitFor();
   assert.match(await page.locator('.micro-step-kicker').innerText(),/ATTIVITÀ 2/);
   await page.locator('.micro-back [data-action="microChapter"]').click();
   assert.equal(await page.locator('.micro-module-toggle').count(),4);
   await page.locator('.micro-back [data-page="academy"]').click();
   await page.locator('.academy-hub').waitFor();
   await page.locator('.studio-local-nav [data-page="shiftSimList"]').click();
   await page.locator('.shift-card').first().waitFor();
   await checkOverflow(page,id+' simulations');
   await page.goto(BASE+'/#academy',{waitUntil:'domcontentloaded'});
   await page.locator('.academy-hub').waitFor();
   await page.evaluate(()=>localStorage.setItem('dt_design_preview_v1',JSON.stringify({done:'bad',assessments:{},notes:12,activeCourse:'bad'})));
   // A fresh tab is closer to a normal cold start and releases the previous
   // journey's heavy lesson images before testing damaged persistent storage.
   await page.close();
   const recovery=await context.newPage();
   recovery.on('pageerror',error=>errors.push(error.message));
   await recovery.goto(BASE+'/#academy',{waitUntil:'domcontentloaded'});
   await recovery.locator('.academy-hub').waitFor();
   assert.equal(await recovery.locator('.hub-role-tabs [data-id="sala"]').getAttribute('aria-pressed'),'true',id+' recovered invalid data');
   await recovery.goto(BASE+'/#%broken-link',{waitUntil:'domcontentloaded'});
   await recovery.locator('.academy-hub').waitFor();
   await recovery.close();
   assert.deepEqual(errors,[],id+' no JS exceptions');
   report.push({browser:device.engine,viewport:device.name,layout:true,modules:true,lessonResume:true,storageRecovery:true});
  }finally{await context.close();await browser.close();}
 }
 process.stdout.write(JSON.stringify({status:'PASS',physicalIOS:false,report},null,2)+'\n');
}
run().catch(e=>{console.error(e);process.exitCode=1});
