import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
 assert.ok(html.includes('type="module" src="app.js"'));
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
 assert.ok(html.includes('Maddie Journey.'));
 assert.ok(html.includes('id="intro-start" disabled'));
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
 assert.ok(world.includes('const introState='));
 assert.ok(world.includes('const skyClouds='));
 assert.ok(world.includes('scene.add(group)'));
 assert.ok(world.includes('bezierInto(introCameraPoint'));
 assert.ok(world.includes('bezierInto(introLookPoint'));
 assert.ok(world.includes('if(introState.active)'));
 assert.ok(world.includes('if(!introState.active)updateLabels()'));
 assert.ok(app.includes('reduceMotion()'));
});
