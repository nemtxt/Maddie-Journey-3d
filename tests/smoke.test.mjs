import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {DIVISIONS,divisionForWorkspace} from '../divisions.js';

const root=resolve(import.meta.dirname,'..');
const read=(name)=>readFileSync(resolve(root,name),'utf8');
const manifest=JSON.parse(read('data/mock-data-manifest.json'));
const snapshot=JSON.parse(read('data/fictional-snapshot.json'));

test('original route inventory retains nine workspaces and 86 unique routes',()=>{
 assert.equal(manifest.workspaces.length,9);
 assert.equal(manifest.people_count,51);
 assert.equal(manifest.division_count,8);
 const routeIds=manifest.workspaces.flatMap(w=>w.sections.map(s=>w.id+':'+s.id));
 assert.equal(routeIds.length,86);
 assert.equal(new Set(routeIds).size,86);
 for(const route of ['people:masterlist','journey:onboarding','scoreboard:decisions'])assert.ok(routeIds.includes(route));
});

test('fictional snapshot preserves 51 unique source-derived people in eight divisions',()=>{
 assert.equal(snapshot.people.length,51);
 assert.equal(snapshot.peopleCount,51);
 assert.equal(snapshot.divisions.length,8);
 assert.equal(snapshot.divisionCount,8);
 assert.equal(new Set(snapshot.people.map(e=>e.k)).size,51);
 assert.ok(snapshot.people.every(e=>e.name&&e.dept&&e.role&&e.status));
 assert.equal(snapshot.people[0].name,'Ari Mercado');
 const sum=snapshot.divisions.reduce((a,entry)=>a+entry[1],0);
 assert.equal(sum,51);
});

test('no original live connector engine, credentials or bootstrapping is imported',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.ok(/type="module" src="app\.js\?v=/.test(html));
 assert.ok(!html.includes('data/core.js'));
 assert.ok(!html.includes('data/data.js'));
 assert.ok(!html.includes('data/demo-data.js'));
 assert.ok(!html.includes('boot.js'));
 assert.ok(app.includes('fictional-snapshot.json'));
 assert.ok(!app.includes('airtable.com/'));
});

test('required interactive world and UI behaviors are implemented',()=>{
 const app=read('app.js'),world=read('world.js');
 for(const feature of ['renderReport','employeeModal','renderPeople','renderJourney','startTour','toggleMode'])assert.ok((app+world).includes(feature));
 assert.ok(world.includes('CatmullRomCurve3'));
 assert.ok(world.includes('updateLabels'));
 assert.ok(read('styles.css').includes('prefers-reduced-motion'));
});


test('welcome scene is fullscreen and Start is accessible after loading',()=>{
 const html=read('index.html'),css=read('styles.css');
 assert.ok(html.includes('class="intro-active"'));
 assert.ok(html.includes('id="sky-intro" aria-labelledby="intro-title"'));
 assert.ok(html.includes('Welcome to'));
 assert.ok(html.includes('Maddie Journey</em>'));
 assert.ok(html.includes('id="intro-start"'));
 assert.ok(!html.includes('id="intro-start" disabled'));
 assert.ok(html.includes('window.MADDIE_INTRO'));
 assert.ok(html.includes('setTimeout(function()'));
 assert.ok(html.includes('id="intro-sky-veil"'));
 assert.ok(css.includes('.intro-sky-veil'));
 assert.ok(html.includes('styles.css?v='));
 assert.ok(html.includes('id="intro-skip"'));
 assert.ok(html.includes('gsap@3.12.5/dist/gsap.min.js'));
 assert.ok(css.includes('body.intro-active #world-stage'));
 assert.ok(css.includes('height:100dvh'));
 assert.ok(css.includes('.atmosphere-cloud'));
});

test('Start descends through clouds in one continuous Three.js scene with safe fallback',()=>{
 const app=read('app.js'),world=read('world.js');
 for(const hook of ['startIntro','finishIntro','showIntroOnEntry','setIntroProgress','endIntro'])assert.ok((app+world).includes(hook));
 assert.ok(app.includes('introTween=gsap.timeline'));
 assert.ok(app.includes('duration:5.3'));
 assert.ok(app.includes("!introDone"));
 assert.ok(app.includes('requestAnimationFrame(step)'));
 assert.ok(app.includes('window.MADDIE_INTRO?.register('));
 assert.ok(app.includes('window.MADDIE_INTRO?.ready()'));
 assert.ok(app.includes('window.MADDIE_INTRO?.fail()'));
 assert.ok(app.includes('world.js?v='));
 assert.ok(world.includes('const introState='));
 assert.ok(world.includes('const skyClouds='));
 assert.ok(world.includes('scene.add(group)'));
 assert.ok(world.includes('bezierInto(introCameraPoint'));
 assert.ok(world.includes('bezierInto(introLookPoint'));
 assert.ok(world.includes('if(introState.active)'));
 assert.ok(world.includes('if(!introState.active)updateLabels()'));
 assert.ok(app.includes('reduceMotion()'));
});


test('3D map uses eight precise company divisions and assigned evaluators',()=>{
 const expected=[
  ['hr','GIEZELLE','KURT'],
  ['revenue','TRIZIA BALDOVI','Chief Experience Officer'],
  ['design','AR. AJ TRABADO','Design Operations Manager'],
  ['corporate','RENATO RENDON','ZSARINA MAE LACUMBA'],
  ['media','MICHELLE OROCIO','Media Manager'],
  ['it','INIGO ARELLANO','COO'],
  ['gencon','INIGO ARELLANO','COO'],
  ['business','MA. CRISTINE ORTIZ','Business Development Head']
 ];
 assert.equal(DIVISIONS.length,8);
 assert.equal(new Set(DIVISIONS.map(d=>d.id)).size,8);
 for(let i=0;i<expected.length;i++){
  const [id,name,role]=expected[i],division=DIVISIONS[i];
  assert.equal(division.id,id);
  assert.ok(JSON.stringify(division.evaluators).includes(name));
  assert.ok(JSON.stringify(division.evaluators).includes(role));
  assert.ok(division.workspaces.every(id=>manifest.workspaces.some(w=>w.id===id)));
  assert.ok(Math.abs(division.x)<48&&Math.abs(division.z)<33);
 }
 assert.ok(divisionForWorkspace('people'));
 assert.ok(divisionForWorkspace('scoreboard'));
});

test('project assets and forest are procedural, weather animated and licensed without downloads',()=>{
 const world=read('world.js'),assets=read('world-assets.js'),app=read('app.js');
 assert.ok(world.includes("buildDivisionDistrict(THREE,world,d)"));
 assert.ok(assets.includes("switch(d.id)"));
 assert.ok(assets.includes("new THREE.InstancedMesh"));
 assert.ok(assets.includes("uForestWind"));
 assert.ok(world.includes("animatedForest.update(time,animate)"));
 assert.ok(world.includes("shadowMap.enabled=!lowQuality"));
 assert.ok(world.includes("MeshPhysicalMaterial"));
 assert.ok(world.includes("waterRipples.forEach"));
 assert.ok(app.includes("DISTRICTS=DIVISIONS"));
 assert.ok(app.includes("evaluator-person"));
 assert.ok(app.includes("divisionForWorkspace"));
 assert.ok(!assets.includes('https://'));
});

test('immersive world has no old top or bottom page navigation',()=>{
 const html=read('index.html'),css=read('styles.css');
 assert.ok(!html.includes('class="topbar"'));
 assert.ok(!html.includes('class="bottom-bar"'));
 assert.ok(!html.includes('class="site-foot"'));
 for(const id of ['world-hud','hud-divisions','division-headline','division-title','division-details','division-menu','hud-audio','hud-reports','intro-audio'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(css.includes('height:100dvh!important'));
 assert.ok(css.includes('division-headline h2'));
 assert.ok(css.includes('body.has-division-selection'));
});
test('soundtrack is entirely original, opt-in, and locally synthesized',()=>{
 const audio=read('soundscape.js'),app=read('app.js');
 assert.ok(audio.includes('export function createSoundscape'));
 assert.ok(audio.includes('window.AudioContext||window.webkitAudioContext'));
 assert.ok(audio.includes('createBuffer('));
 assert.ok(audio.includes('createOscillator()'));
 assert.ok(audio.includes('original'));
 assert.ok(!audio.includes('new Audio('));
 assert.ok(!audio.includes('fetch('));
 assert.ok(app.includes("sound.toggle()"));
 assert.ok(app.includes("sound.select()"));
 assert.ok(app.includes("sound.hover()"));
 assert.ok(app.includes("sound.reveal()"));
 assert.ok(!app.includes("'search-toggle'"));
 assert.ok(!app.includes("'all-reports'"));
});


test('Dream Factory-informed details are original procedural scenery and preserve route controls',()=>{
 const world=read('world.js');
 const scenic=read('dream-details.js');
 const app=read('app.js');
 for(const part of ['geologicalLayers','rockFragments','waterfallCurtains','balloons','StoryEnvironment']){
   assert.ok((world+scenic).includes(part),'Expected scenic feature: '+part);
 }
 assert.ok(world.includes("buildStoryEnvironment(THREE,world,{districts,route:curve,lowQuality})"));
 assert.ok(world.includes("storyDetails.update(time,animate)"));
 assert.ok(world.includes("dataset.geologicalLayers"));
 assert.ok(scenic.includes("new THREE.ShaderMaterial"));
 assert.ok(scenic.includes("new THREE.InstancedMesh"));
 assert.ok(scenic.includes("waterfallMat.uniforms.uTime"));
 assert.ok(scenic.includes("spinner.rotation.z"));
 assert.ok(scenic.includes("if(!enabled)return"));
 assert.ok(scenic.includes("lowQuality?2:4"));
 assert.ok(!scenic.includes("sketchfab.com/"));
 assert.ok(!scenic.includes("hkdi.edu.hk/dreamfactory/assets"));
 assert.ok(app.includes("world.js?v=1.6.0"));
 assert.equal(snapshot.people.length,51);
 assert.equal(manifest.workspaces.length,9);
 assert.equal(manifest.workspaces.reduce((sum,w)=>sum+w.sections.length,0),86);
});


test('Adventure Journey has route imagery, editorial typography, usable Start CTA and reduced motion',()=>{
 const html=read('index.html'),css=read('styles.css'),app=read('app.js');
 for(const token of [
  'expedition-graphics','expedition-compass','intro-flight-trail','intro-flight-line',
  'intro-waypoint','expedition-float-note','intro-edition','intro-destination-count',
  'Begin Adventure','THE ADVENTURE BEGINS','division-route-ornament'
 ])assert.ok(html.includes(token),'Missing expedition visual '+token);
 assert.ok(css.includes('"Fraunces"'));
 assert.ok(css.includes('"DM Sans"'));
 assert.ok(css.includes('.intro-start.expedition-start'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('body.expedition-launching .intro-flight-line'));
 assert.ok(app.includes("classList.add('expedition-launching')"));
 assert.ok(app.includes("classList.add('intro-loaded')"));
 assert.ok(app.includes("classList.remove('intro-loaded','expedition-launching')"));
 assert.ok(app.includes('introTween=gsap.timeline'));
 assert.ok(app.includes('bezierInto')===false); // Camera path belongs in world.js, not the app.
});
test('Eight 3D adventure outposts use original shared geometric assets',()=>{
 const world=read('world.js'),assets=read('adventure-assets.js');
 assert.ok(world.includes('createAdventureAssets(THREE,world,districts,{lowQuality})'));
 assert.ok(world.includes('adventureAssets.update(time,animate)'));
 assert.ok(world.includes('adventureAssets.setActive(id)'));
 assert.ok(world.includes('dataset.adventureOutposts'));
 for(const token of ['EXPEDITION OUTPOST','Waypoint ','flagGeometry','compass','outpostCount','dispose'])assert.ok(assets.includes(token));
 assert.ok(!assets.includes('fetch('));
 assert.ok(!assets.includes('https://'));
 assert.equal(DIVISIONS.length,8);
 assert.equal(snapshot.people.length,51);
 assert.equal(manifest.workspaces.length,9);
 assert.equal(manifest.workspaces.reduce((sum,w)=>sum+w.sections.length,0),86);
});
