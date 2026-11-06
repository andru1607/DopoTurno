'use strict';
/* Chromium responsive emulation. This is NOT a physical iPhone or Safari test.
 * Run: python3 -m http.server 4173 & node tests/mobile-browser.e2e.cjs
 * Requires: npm install --no-save playwright; npx playwright install chromium
 */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const BASE=process.env.DT_QA_URL||'http://127.0.0.1:4173';
const viewports=[
 {name:'small-phone',width:320,height:700,mobile:true},
 {name:'phone-375',width:375,height:812,mobile:true},
 {name:'phone-390',width:390,height:844,mobile:true},
 {name:'large-phone',width:430,height:932,mobile:true},
 {name:'tablet',width:768,height:1024,mobile:true},
 {name:'desktop',width:1280,height:900,mobile:false}
];
async function run(){
 const browser=await chromium.launch({headless:true});
 const report=[];
 try{
  for(const profile of viewports){
   const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.mobile?2:1,isMobile:profile.mobile,hasTouch:profile.mobile});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/#simulazioni',{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('.shift-case-card, .shift-card').first().waitFor({timeout:15000});
   assert.equal(await page.locator('.shift-card:visible').count(),18,profile.name+' catalog must list 18');
   await assertNoOverflow(page,profile.name+' catalog');
   await assertTarget(page,'.shift-filter-row button',44,profile.name+' filters');
   await page.locator('#shiftSearch').fill('allergeni');
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'shiftSearch',profile.name+' search must keep keyboard focus');
   assert.ok(await page.locator('.shift-card:visible').count()<18,profile.name+' query should narrow results');
   await page.locator('#shiftSearch').fill('');
   assert.equal(await page.locator('.shift-card:visible').count(),18,profile.name+' clearing search restores all cases');
   await page.locator('[data-action="shiftOpen"][data-id="S02"]').click();
   await page.locator('.shift-choice').first().waitFor();
   assert.equal(await page.locator('.shift-pin').count(),5,profile.name+' five map stations');
   await assertNoOverflow(page,profile.name+' scenario');
   await assertTarget(page,'.shift-pin',44,profile.name+' map pins');
   await page.locator('.shift-pin').nth(2).click();
   assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.step),'2',profile.name+' map focus restored');
   assert.equal(await page.locator('.shift-feedback').count(),0,profile.name+' no premature feedback');
   await page.locator('.shift-choice').nth(1).click();
   await page.locator('.shift-feedback').waitFor();
   assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('shift-feedback')),true,profile.name+' focus lands on outcome');
   await assertNoOverflow(page,profile.name+' feedback');
   await page.locator('[data-action="shiftNext"]').click();
   assert.equal(await page.evaluate(()=>document.activeElement?.matches('.shift-decision h2')),true,profile.name+' focus lands on next decision');
   // In a test only, follow the predefined second and third options.
   for(let i=0;i<2;i++){
    await page.locator('.shift-choice').nth(1).click();
    await page.locator('[data-action="shiftNext"]').click();
   }
   await page.locator('.shift-result').waitFor();
   assert.equal(await page.evaluate(()=>document.activeElement?.matches('.shift-result h2')),true,profile.name+' debrief focus');
   await assertNoOverflow(page,profile.name+' debrief');
   assert.ok((await page.locator('.shift-result').innerText()).includes('Debriefing')||(await page.locator('.shift-result').innerText()).includes('Rileggi'),profile.name+' result copy');
   assert.deepEqual(errors,[],profile.name+' console exceptions');
   report.push({viewport:profile.name,width:profile.width,overflow:false,focus:true,pins:5,search:true});
   await context.close();
  }
  process.stdout.write(JSON.stringify({status:'PASS',browser:'Chromium',physicalIOS:false,report},null,2)+'\n');
 }finally{await browser.close()}
}
async function assertNoOverflow(page,label){
 const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth,body:document.body.scrollWidth}));
 assert.ok(sizes.scroll<=sizes.inner+2,label+' horizontal overflow '+JSON.stringify(sizes));
}
async function assertTarget(page,selector,min,label){
 const boxes=await page.locator(selector).evaluateAll(els=>els.filter(x=>!x.hidden).map(x=>{const b=x.getBoundingClientRect();return {width:b.width,height:b.height,txt:(x.textContent||'').trim().slice(0,30)}}));
 assert.ok(boxes.length>0,label+' no targets');
 for(const b of boxes)assert.ok(b.width>=min&&b.height>=min,label+' small target '+JSON.stringify(b));
}
run().catch(err=>{console.error(err);process.exitCode=1});
