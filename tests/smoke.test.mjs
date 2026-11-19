import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const read=(name)=>readFileSync(resolve(root,name),'utf8');
const manifest=JSON.parse(read('data/mock-data-manifest.json'));

function loadOriginalFictionalDemo(){
 const context={console};context.window=context;context.self=context;
 vm.createContext(context);
 for(const file of ['data/core.js','data/data.js','data/demo-data.js']){
   vm.runInContext(read(file),context,{filename:file,timeout:5000});
 }
 if(context.MC_DEMO_ERROR)throw context.MC_DEMO_ERROR;
 return context;
}

test('source manifest preserves all nine workspaces and 86 unique route IDs',()=>{
 assert.equal(manifest.workspaces.length,9);
 assert.equal(manifest.people_count,51);
 assert.equal(manifest.division_count,8);
 const routeIds=manifest.workspaces.flatMap(w=>w.sections.map(s=>w.id+':'+s.id));
 assert.equal(routeIds.length,86);
 assert.equal(new Set(routeIds).size,86);
 assert.ok(routeIds.includes('people:masterlist'));
 assert.ok(routeIds.includes('journey:onboarding'));
 assert.ok(routeIds.includes('scoreboard:decisions'));
});

test('original fictional source loads 51 people in eight divisions',()=>{
 const demo=loadOriginalFictionalDemo();
 assert.equal(demo.MCD.EMP.length,51);
 assert.equal(demo.MCD.D.length,8);
 assert.equal(new Set(demo.MCD.EMP.map(e=>e.k)).size,51);
 assert.ok(demo.MCD.EMP.every(e=>e.name&&e.dept&&e.status));
 assert.equal(demo.MC_FICTIONAL,true);
});

test('no live connector bootstrap is imported in new HTML',()=>{
 const html=read('index.html');
 assert.ok(html.includes('data/demo-data.js'));
 assert.ok(!html.includes('live-readonly.html'));
 assert.ok(!html.includes('boot.js'));
 assert.ok(!html.includes('p-main.js'));
});

test('routes, labels and render modules exist',()=>{
 const app=read('app.js'),world=read('world.js');
 assert.ok(app.includes('sourceStatus'));
 assert.ok(app.includes('renderReport'));
 assert.ok(app.includes('employeeModal'));
 assert.ok(world.includes('CatmullRomCurve3'));
 assert.ok(world.includes('startTour'));
 assert.ok(world.includes('prefers')===false); // reduced-motion toggle is controlled by app.js
});
