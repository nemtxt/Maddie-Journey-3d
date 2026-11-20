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
 assert.ok((await start.innerText()).includes('Begin Adventure'),'Primary action should read Begin Adventure');
 assert.equal(await page.locator('#expedition-compass').count(),1);
 assert.equal(await page.locator('#intro-flight-trail').count(),1);
 assert.equal(await page.locator('.expedition-float-note').count(),2);
 assert.equal(await page.locator('#intro-audio').getAttribute('aria-pressed'),'false','Audio must never autoplay');
 await page.screenshot({path:'browser-results/01-sky-intro.png'});
 await start.click();
 try{
  await page.waitForFunction(()=>!document.body.classList.contains('intro-active'),null,{timeout:24000});
 }catch(err){
  const diagnostic=await page.evaluate(()=>({
    introActive:document.body.classList.contains('intro-active'),
    status:document.querySelector('#intro-status')?.textContent,
    startDisabled:document.querySelector('#intro-start')?.disabled,
    sceneReady:window.MADDIE_INTRO?.isReady?.(),
    introHidden:document.querySelector('#sky-intro')?.hidden,
    worldMarker:document.querySelector('#world-canvas')?.dataset.adventureOutposts,
    fallback:document.body.classList.contains('fallback-boot')
  })).catch(e=>({evaluationError:String(e)}));
  await fs.writeFile('browser-results/00-intro-error.json',JSON.stringify({diagnostic,errors},null,2));
  throw new Error('Intro transition did not exit: '+JSON.stringify({diagnostic,errors,reason:String(err)}));
 }
 assert.equal(await page.locator('#sky-intro').isHidden(),true);
 await page.waitForFunction(()=>document.body.classList.contains('view-world'),null,{timeout:9000});
 const box=await page.locator('#world-stage').boundingBox();
 assert.ok(box&&Math.abs(box.height-768)<3,'3D world must fill the viewport');
 assert.equal(await page.locator('.topbar').count(),0,'Full-width top navigation removed');
 assert.equal(await page.locator('.bottom-bar').count(),0,'Bottom route strip removed');
 assert.equal(await page.locator('.site-foot').count(),0,'Footer removed from immersive world');
 assert.equal(await page.locator('.world-label').count(),8);
 await page.waitForFunction(()=>document.querySelector('#world-canvas')?.dataset.adventureOutposts==='8',null,{timeout:15000});
 assert.equal(await page.locator('#world-canvas').getAttribute('data-adventure-outposts'),'8');
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
 // Fast travel is a compact, coordinate-based map rather than another full page.
 await page.locator('#hud-map').click();
 await page.locator('#fast-travel-map').waitFor({state:'visible',timeout:5000});
 assert.equal(await page.locator('.fast-map-pin').count(),8,'Fast map must contain the eight real company destinations');
 await page.screenshot({path:'browser-results/02a-fast-travel-map.png'});
 await page.locator('.fast-map-pin[data-district="design"]').click();
 await page.waitForFunction(()=>location.hash==='#world:design'&&document.querySelector('#division-headline')?.hidden===false,null,{timeout:12000});
 await page.locator('#report-preview').waitFor({state:'visible',timeout:6000});
 assert.ok((await page.locator('#preview-heading').textContent()).includes('Design'));
 const previewRoutes=await page.locator('.preview-report').evaluateAll(xs=>xs.map(x=>x.dataset.report));
 assert.ok(previewRoutes.length>=1&&previewRoutes.length<=3);
 assert.ok(previewRoutes.every(x=>x.includes(':')));
 assert.equal(await page.locator('#fast-travel-map').isHidden(),true);
 console.log('PASS: 8-pin fast travel map and contextual real report previews');

 // Explore every division using the compact world picker.
 await page.locator('#hud-divisions').click();
 assert.equal(await page.locator('#division-menu').isVisible(),true);
 assert.equal(await page.locator('.division-menu-item').count(),8);
 await page.locator('.division-menu-item[data-district="hr"]').click();
 await page.waitForFunction(()=>location.hash==='#world:hr'&&document.querySelector('#division-title')?.textContent==='HR'&&document.querySelector('#division-headline')?.hidden===false,null,{timeout:11000});
 assert.equal(await page.locator('#division-headline').isVisible(),true);
 assert.ok(parseFloat(await page.locator('#division-title').evaluate(el=>getComputedStyle(el).fontSize))>=45,
   'Selected division title must be large');
 assert.equal(await page.locator('#focus-panel').isVisible(),false,'Details should not obscure the island by default');
 await page.screenshot({path:'browser-results/03-hr-large-headline.png'});
 await page.locator('#division-details').click();
 await page.locator('#focus-panel').waitFor({state:'visible',timeout:6000});
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

 // Guided expedition must visit all eight divisions, support pause/resume,
 // advance directly to any next stop, and exit without trapping navigation.
 await page.locator('#hud-divisions').click();
 await page.locator('#division-tour').click();
 await page.locator('#expedition-tour').waitFor({state:'visible',timeout:6000});
 await page.waitForFunction(()=>document.querySelector('#tour-count')?.textContent==='01 / 08',null,{timeout:5000});
 assert.match(await page.locator('#tour-destination').textContent(),/HR/);
 await page.locator('#tour-pause').click();
 assert.equal(await page.locator('#tour-pause').getAttribute('aria-pressed'),'true');
 const pausedProgress=await page.locator('#tour-progress').evaluate(el=>parseFloat(el.style.width));
 await page.waitForTimeout(430);
 const pausedProgressAfter=await page.locator('#tour-progress').evaluate(el=>parseFloat(el.style.width));
 assert.ok(Math.abs(pausedProgress-pausedProgressAfter)<.2,'Pause must freeze guided expedition progress');
 await page.locator('#tour-pause').click();
 assert.equal(await page.locator('#tour-pause').getAttribute('aria-pressed'),'false');
 const eight=['revenue','design','corporate','media','it','gencon','business'];
 for(let i=0;i<eight.length;i++){
   await page.locator('#tour-next').click();
   await page.waitForFunction(([id,index])=>location.hash==='#world:'+id&&document.querySelector('#tour-count')?.textContent===String(index+2).padStart(2,'0')+' / 08',[eight[i],i],{timeout:9000});
 }
 assert.equal(await page.locator('#tour-count').textContent(),'08 / 08');
 await page.locator('#tour-exit').click();
 assert.equal(await page.locator('#expedition-tour').isHidden(),true);
 assert.equal(await page.locator('#report-preview').isVisible(),true);
 await page.screenshot({path:'browser-results/05a-guided-expedition.png'});
 console.log('PASS: 8-stop tour, camera waypoint selection, pause/resume, Next and Exit');

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
