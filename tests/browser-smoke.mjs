import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';

const BASE='http://127.0.0.1:8765/';
await fs.mkdir('browser-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:20000});
  const start=page.locator('#intro-start');
  await start.waitFor({state:'visible',timeout:10000});
  assert.equal(await start.isEnabled(),true,'Start must not be disabled before Three.js finishes');
  assert.equal(await page.locator('.intro-sky-veil').count(),1,'Opaque sky veil is present');
  await page.screenshot({path:'browser-results/01-before-start.png'});
  await start.click();
  await page.waitForFunction(()=>!document.body.classList.contains('intro-active'),null,{timeout:17000});
  assert.equal(await page.locator('#sky-intro').isHidden(),true,'Intro closes after Start');
  assert.equal(await page.locator('#world-stage').isVisible(),true,'World is visible after Start');
  await page.screenshot({path:'browser-results/02-after-start.png'});
  console.log('PASS: Start escapes the sky and reveals world; initial errors:',errors.slice(0,5));

  const blocked=await browser.newPage({viewport:{width:1366,height:768}});
  await blocked.route('**/app.js?*',route=>route.abort('failed'));
  await blocked.goto(BASE,{waitUntil:'domcontentloaded',timeout:20000});
  assert.equal(await blocked.locator('#intro-start').isEnabled(),true,'Start must work even when app.js fails');
  await blocked.locator('#intro-start').click();
  await blocked.waitForFunction(()=>!document.body.classList.contains('intro-active'),null,{timeout:14000});
  assert.equal(await blocked.locator('#sky-intro').isHidden(),true,'A module failure must not trap users in the intro');
  assert.equal(await blocked.getByRole('link',{name:/Open fictional dashboard/}).count(),1,'Fallback link remains available');
  await blocked.screenshot({path:'browser-results/03-module-failure-fallback.png'});
  console.log('PASS: blocked app module leaves a usable fallback instead of a frozen Start');
  await blocked.close();

  const direct=await browser.newPage({viewport:{width:1200,height:800}});
  await direct.goto(BASE+'#people',{waitUntil:'domcontentloaded',timeout:20000});
  await direct.waitForFunction(()=>!document.body.classList.contains('intro-active'),null,{timeout:18000});
  assert.equal(await direct.locator('#sky-intro').isHidden(),true,'Direct People link must bypass intro');
  console.log('PASS: direct report deep link bypasses welcome screen');
  await direct.close();
  await page.close();
}finally{await browser.close();}
