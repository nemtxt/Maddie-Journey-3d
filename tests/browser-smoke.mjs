import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';

const BASE='http://127.0.0.1:8765/';
await fs.mkdir('browser-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
]});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:25000});
 const start=page.locator('#intro-start');
 await start.waitFor({state:'visible',timeout:10000});
 assert.equal(await start.isEnabled(),true,'Start must remain accessible while loading');
 assert.equal(await page.locator('#intro-audio').getAttribute('aria-pressed'),'false','Audio must never autoplay');
 await page.screenshot({path:'browser-results/01-sky-intro.png'});
 await start.click();
 await page.waitForFunction(()=>!document.body.classList.contains('intro-active'),null,{timeout:22000});
 assert.equal(await page.locator('#sky-intro').isHidden(),true);
 await page.waitForFunction(()=>document.body.classList.contains('view-world'),null,{timeout:9000});
 const box=await page.locator('#world-stage').boundingBox();
 assert.ok(box&&Math.abs(box.height-768)<3,'3D world must fill the viewport');
 assert.equal(await page.locator('.topbar').count(),0,'Full-width top navigation removed');
 assert.equal(await page.locator('.bottom-bar').count(),0,'Bottom route strip removed');
 assert.equal(await page.locator('.site-foot').count(),0,'Footer removed from immersive world');
 assert.equal(await page.locator('.world-label').count(),8);
 await page.waitForFunction(()=>document.querySelector('#world-canvas')?.dataset.storyEnvironment==='v1.5',null,{timeout:15000});
 const scenic=await page.locator('#world-canvas').evaluate(el=>({
  version:el.dataset.storyEnvironment,
  layers:Number(el.dataset.geologicalLayers),
  quality:el.dataset.storyQuality
 }));
 assert.equal(scenic.layers,4,'All four original geological strata must be constructed');
 assert.ok(['lite','enhanced'].includes(scenic.quality),'Mobile-quality fallback remains available');
 await page.waitForTimeout(900);
 await page.screenshot({path:'browser-results/02-fullscreen-world.png'});

 // Explore every division using the compact world picker.
 await page.locator('#hud-divisions').click();
 assert.equal(await page.locator('#division-menu').isVisible(),true);
 assert.equal(await page.locator('.division-menu-item').count(),8);
 await page.locator('.division-menu-item[data-district="hr"]').click();
 await page.waitForFunction(()=>location.hash==='#world:hr'&&document.querySelector('#division-title')?.textContent==='HR',null,{timeout:11000});
 assert.equal(await page.locator('#division-headline').isVisible(),true);
 assert.ok(parseFloat(await page.locator('#division-title').evaluate(el=>getComputedStyle(el).fontSize))>=45,
   'Selected division title must be large');
 assert.equal(await page.locator('#focus-panel').isVisible(),false,'Details should not obscure the island by default');
 await page.screenshot({path:'browser-results/03-hr-large-headline.png'});
 await page.locator('#division-details').click();
 assert.equal(await page.locator('#focus-panel').isVisible(),true);
 assert.match(await page.locator('#panel-content').innerText(),/GIEZELLE/);
 assert.match(await page.locator('#panel-content').innerText(),/KURT/);
 await page.screenshot({path:'browser-results/04-evaluator-drawer.png'});
 await page.locator('#panel-dismiss').click();
 assert.equal(await page.locator('#focus-panel').isVisible(),false);

 const assignments=[
  ['revenue','Revenue Management Division','TRIZIA BALDOVI'],
  ['design','Design Division','AR. AJ TRABADO'],
  ['corporate','Corporate Operations','RENATO RENDON'],
  ['media','Media','MICHELLE OROCIO'],
  ['it','IT','INIGO ARELLANO'],
  ['gencon','GenCon','INIGO ARELLANO'],
  ['business','Business Development','MA. CRISTINE ORTIZ']
 ];
 for(const [id,title,name] of assignments){
  await page.locator('#hud-divisions').click();
  await page.locator('.division-menu-item[data-district="'+id+'"]').click();
  await page.waitForFunction(([id,title])=>location.hash==='#world:'+id&&document.querySelector('#division-title')?.textContent===title,[id,title],{timeout:11000});
  await page.locator('#division-details').click();
  assert.ok((await page.locator('#panel-content').innerText()).includes(name),'Evaluator must match '+title);
  await page.locator('#panel-dismiss').click();
 }
 await page.screenshot({path:'browser-results/05-eight-divisions.png'});
 console.log('PASS: full-screen world, eight large division titles, and evaluator details');

 // Opt-in audio needs a real user gesture; toggle must expose its state.
 assert.equal(await page.locator('#hud-audio').getAttribute('aria-pressed'),'false');
 await page.locator('#hud-audio').click();
 const audioSupported=await page.evaluate(()=>Boolean(window.AudioContext||window.webkitAudioContext));
 if(audioSupported){
  await page.waitForFunction(()=>document.querySelector('#hud-audio')?.getAttribute('aria-pressed')==='true',null,{timeout:5000});
  assert.equal(await page.locator('#hud-audio-label').textContent(),'Sound on');
  await page.locator('#hud-audio').click();
  assert.equal(await page.locator('#hud-audio').getAttribute('aria-pressed'),'false');
 }
 console.log('PASS: explicit ambient music / SFX consent control');

 await page.locator('#hud-reports').click();
 await page.waitForFunction(()=>location.hash==='#dashboard'&&document.querySelectorAll('.workspace-tile').length===9,null,{timeout:12000});
 assert.equal(await page.locator('.workspace-tile').count(),9);
 assert.equal(await page.locator('.division-tile').count(),8);
 await page.screenshot({path:'browser-results/06-original-reports.png'});
 console.log('PASS: 9 original workspaces and 86 preserved report routes');

 // Native bootstrap failure must not strand the visitor.
 const blocked=await browser.newPage({viewport:{width:1366,height:768}});
 await blocked.route('**/app.js?*',route=>route.abort('failed'));
 await blocked.goto(BASE,{waitUntil:'domcontentloaded',timeout:22000});
 assert.equal(await blocked.locator('#intro-start').isEnabled(),true);
 await blocked.locator('#intro-start').click();
 await blocked.waitForFunction(()=>!document.body.classList.contains('intro-active'),null,{timeout:14000});
 assert.equal(await blocked.getByRole('link',{name:/Open fictional dashboard/}).count(),1);
 console.log('PASS: failed app bundle still exposes source prototype link');
 await blocked.close();

 const direct=await browser.newPage({viewport:{width:1200,height:800}});
 await direct.goto(BASE+'#people',{waitUntil:'domcontentloaded',timeout:22000});
 await direct.waitForFunction(()=>!document.body.classList.contains('intro-active'),null,{timeout:18000});
 await direct.waitForFunction(()=>document.querySelectorAll('.data-table tbody tr').length===51,null,{timeout:11000});
 assert.equal(await direct.locator('.data-table tbody tr').count(),51);
 console.log('PASS: People deep link bypasses intro and shows 51 fictional profiles');
 await direct.close();

 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await mobile.goto(BASE+'#world:design',{waitUntil:'domcontentloaded',timeout:22000});
 await mobile.waitForFunction(()=>document.querySelector('#division-title')?.textContent==='Design Division',null,{timeout:20000});
 const mobileStage=await mobile.locator('#world-stage').boundingBox();
 assert.ok(mobileStage&&Math.abs(mobileStage.height-844)<3);
 assert.equal(await mobile.locator('#hud-divisions').isVisible(),true);
 await mobile.screenshot({path:'browser-results/07-mobile-world.png'});
 console.log('PASS: mobile full-screen world and division title');
 await mobile.close();

 assert.deepEqual(errors,[],'No uncaught browser JavaScript errors');
 await page.close();
}finally{
 await browser.close();
}
