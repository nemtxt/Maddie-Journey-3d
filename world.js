import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import {buildDivisionDistrict,enhanceTerrain,enhanceForest} from './world-assets.js?v=1.3.0';

/** A lightweight bespoke Three.js diorama, no downloadable models or premium assets. */
export function createWorld({canvas,labelsRoot,districts,onSelect,motionEnabled=true,intro=true}) {
  const stage=canvas.closest('.world-stage');
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#d6eef0');
  scene.fog=new THREE.FogExp2('#d6eef0',0.0032);
  const camera=new THREE.PerspectiveCamera(39,1,.1,420);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.28;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const hemi=new THREE.HemisphereLight(0xf8ffff,0x659381,2.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff5df,2.75);sun.position.set(-35,76,43);scene.add(sun);
  sun.castShadow=true;
  sun.shadow.mapSize.set(window.innerWidth<850?1024:2048,window.innerWidth<850?1024:2048);
  sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;
  sun.shadow.camera.near=1;sun.shadow.camera.far=190;sun.shadow.bias=-.00012;
  const rim=new THREE.DirectionalLight(0xc3e7e9,.73);rim.position.set(50,44,-58);scene.add(rim);
  const world=new THREE.Group();scene.add(world);
  const mat=(hex,rough=1)=>new THREE.MeshStandardMaterial({color:hex,roughness:rough,metalness:0,flatShading:true});
  const grass=mat('#75b68c'),grassLight=mat('#9acb8b'),grassDark=mat('#487e62'),cliff=mat('#636b70'),stone=mat('#879198'),snow=mat('#f0f4f0'),soil=mat('#8c7762'),sand=mat('#e6cf94'),water=new THREE.MeshPhysicalMaterial({color:'#69c4d8',roughness:.19,metalness:.07,clearcoat:.85,clearcoatRoughness:.16,transparent:true,opacity:.89}),foam=mat('#d2f9fa'),wood=mat('#9b704d'),roofRed=mat('#d66d59'),roofBlue=mat('#5d9fb1'),gold=mat('#e9d27f'),goldGlow=new THREE.MeshBasicMaterial({color:'#fff3af'});
  const sphere=(radius,color,x,y,z,width=12,height=8)=>{const obj=new THREE.Mesh(new THREE.SphereGeometry(radius,width,height),color);obj.position.set(x,y,z);world.add(obj);return obj;};
  const cylinder=(rt,rb,h,seg,color,x,y,z)=>{const obj=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),color);obj.position.set(x,y,z);world.add(obj);return obj;};
  function seeded(seed=9){let s=seed;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
  const rand=seeded(340);
  // Irregular stepped floating island, grassy plateau and layered geological underside.
  for(const [rt,rb,h,y,c] of [[52,47,5,-2,grassDark],[49,39,9,-8,soil],[39,21,8,-16,cliff],[25,10,7,-23,stone]]){
    const ring=cylinder(rt,rb,h,17,c,0,y,0);ring.scale.z=.7;ring.rotation.y=.09;
  }
  const top=cylinder(51.9,51,1.3,24,grass,0,1,0);top.scale.z=.7;top.receiveShadow=true;
  enhanceTerrain(THREE,world,districts);
  // Low-relief mounds and woodland clearing patches.
  for(let i=0;i<33;i++){
    const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.87;
    const x=Math.cos(a)*48*r,z=Math.sin(a)*32*r;
    const patch=cylinder(1+rand()*6,2+rand()*8,.15,7,i%3?grassLight:grassDark,x,1.72,z);patch.scale.z=.6;patch.rotation.y=rand()*Math.PI;
  }
  function addTree(x,z,s=1,type='pine'){
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.35*s,.55*s,3*s,6),wood);trunk.position.set(x,3.4*s,z);world.add(trunk);
    if(type==='broad'){
      for(let i=0;i<3;i++){const c=sphere((1.8+i*.26)*s,i%2?mat('#7cba64'):mat('#add173'),x+(i-1)*1.1*s,5.4*s+(i%2)*.7*s,z,9,6);c.scale.y=.82;}
    } else {
      for(let i=0;i<3;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry((2.7-i*.58)*s,5*s,6),i%2?grassDark:mat('#3f7f62'));cone.position.set(x,5.2*s+i*1.55*s,z);world.add(cone);}
    }
  }
  for(let i=0;i<(window.innerWidth<700?22:42);i++){
    const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.92;
    const x=Math.cos(a)*46*r,z=Math.sin(a)*30*r;
    const close=districts.some(d=>Math.hypot(d.x-x,d.z-z)<6);
    if(close||Math.abs(z)<3&&Math.abs(x)<8)continue;
    addTree(x,z,.5+rand()*.85,rand()<.33?'broad':'pine');
  }
  const animatedForest=enhanceForest(THREE,world,districts,{mobile:window.innerWidth<850});
  // Layered mountain faces with irregular ridges, naturally varied rock strata
  // and vertex-colored snowlines; no external textures or licensed models needed.
  function mountain(x,z,r,h,shade){
    const geometry=new THREE.ConeGeometry(r,h,12,7);
    const positions=geometry.attributes.position;
    const colors=[];
    const shadowRock=new THREE.Color('#64757b'),rockLight=new THREE.Color('#9a9f9f');
    const snowRock=new THREE.Color('#edf2ef'),moss=new THREE.Color('#788b7a');
    const baseSeed=rand()*100;
    for(let i=0;i<positions.count;i++){
      const px=positions.getX(i),py=positions.getY(i),pz=positions.getZ(i);
      const angle=Math.atan2(pz,px),altitude=(py+h/2)/h;
      const jagged=1+Math.sin(angle*4+baseSeed)*.13+Math.sin(angle*9+baseSeed*.63)*.065+
        Math.cos(py*.4+angle*6)*.035;
      positions.setX(i,px*jagged);
      positions.setZ(i,pz*jagged);
      const snowy=altitude>.76+Math.sin(angle*5+baseSeed)*.065;
      const rockColor=snowy?snowRock:altitude<.21?moss:shadowRock.clone().lerp(rockLight,Math.max(0,Math.sin(angle*3+py*.27))*.68+.1);
      colors.push(rockColor.r,rockColor.g,rockColor.b);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    const rock=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true}));
    rock.position.set(x,1.5+h/2,z);rock.rotation.y=rand()*.6;
    rock.castShadow=true;rock.receiveShadow=true;world.add(rock);
    // Scattered rockfall at the base blends the mountains into the terrain.
    for(let k=0;k<8;k++){
      const a=rand()*Math.PI*2,t=r*(.72+rand()*.35);
      const pebble=new THREE.Mesh(new THREE.DodecahedronGeometry(.55+rand()*1.3,0),stone);
      pebble.position.set(x+Math.cos(a)*t,2,z+Math.sin(a)*t*.77);
      pebble.scale.y=.48+rand()*.4;pebble.rotation.y=rand()*6.28;
      pebble.castShadow=true;pebble.receiveShadow=true;world.add(pebble);
    }
  }
  mountain(-9,-12,8.5,21,cliff);
  mountain(1,-14,10.5,29,stone);
  mountain(11,-13,7,17,cliff);
  // Lake and river; gently animated cascading waterfall.
  const lake=cylinder(7,7,.16,32,water,13,1.81,2);lake.scale.z=.58;
  const streamPoints=[[3,-12],[4,-5],[9,-1],[13,2],[17,9],[23,14]].map(([x,z])=>new THREE.Vector3(x,1.94,z));
  const streamCurve=new THREE.CatmullRomCurve3(streamPoints);
  const stream=new THREE.Mesh(new THREE.TubeGeometry(streamCurve,85,1.05,9,false),water);world.add(stream);
  const falls=new THREE.Mesh(new THREE.BoxGeometry(3.8,11,.55),new THREE.MeshPhysicalMaterial({color:'#78dce8',transparent:true,opacity:.78,roughness:.14,clearcoat:1}));
  falls.position.set(3,9,-13);world.add(falls);
  const waterRipples=[];
  for(let i=0;i<17;i++){const bubble=sphere(.15+rand()*.28,foam,2.5+rand()*2,2.1+rand()*9,-12.5+rand());bubble.userData.waterfall=true;}
  for(let i=0;i<5;i++){
    const ripple=new THREE.Mesh(new THREE.TorusGeometry(.65+i*.45,.038,4,40),
      new THREE.MeshBasicMaterial({color:'#d9f9fc',transparent:true,opacity:.48,depthWrite:false}));
    ripple.rotation.x=Math.PI/2;ripple.position.set(13,2.13,2);ripple.scale.setScalar(.65+i*.12);world.add(ripple);
    waterRipples.push(ripple);
  }
  // Routes: a broad warm pathway with luminous center line and a traveling highlight.
  const routePoints=districts.map(d=>new THREE.Vector3(d.x,2.35,d.z));
  routePoints.splice(3,0,new THREE.Vector3(1,2.35,27));
  routePoints.splice(6,0,new THREE.Vector3(36,2.35,1));
  const curve=new THREE.CatmullRomCurve3(routePoints,false,'centripetal',.5);
  const routeBase=new THREE.Mesh(new THREE.TubeGeometry(curve,220,.91,10,false),soil);world.add(routeBase);
  const routePaving=new THREE.Mesh(new THREE.TubeGeometry(curve,220,.70,10,false),sand);world.add(routePaving);
  const routeLit=new THREE.Mesh(new THREE.TubeGeometry(curve,220,.08,5,false),gold);world.add(routeLit);
  const traveler=new THREE.Mesh(new THREE.SphereGeometry(.88,12,12),goldGlow);traveler.position.copy(routePoints[0]);world.add(traveler);
  traveler.add(new THREE.PointLight(0xffefb1,1.5,8));
  // Forest props, campsites, flags, pavilion, towers: custom low-poly scenes per district.
  const hitTargets=[];
  function building(x,z,color,height=4.3){
    const walls=new THREE.Mesh(new THREE.BoxGeometry(4.5,height,3.5),mat('#f9f4e3'));walls.position.set(x,1.7+height/2,z);world.add(walls);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(3.8,2.8,4),color);roof.rotation.y=Math.PI/4;roof.position.set(x,2.15+height,z);world.add(roof);
    const door=new THREE.Mesh(new THREE.BoxGeometry(.75,1.8,.1),wood);door.position.set(x,1.7+.9,z+1.8);world.add(door);
    const windowMesh=new THREE.Mesh(new THREE.BoxGeometry(.8,.85,.1),mat('#7dc1d3'));windowMesh.position.set(x+1.1,3.5,z+1.8);world.add(windowMesh);
  }
  function spire(x,z,color){
    cylinder(2.1,2.8,9,7,mat('#e1d9c4'),x,6,z);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(3.1,5,5),color);roof.position.set(x,13,z);world.add(roof);
    cylinder(.1,.1,4,6,wood,x,17.3,z);
  }
  function tent(x,z,color){
    const shape=new THREE.Mesh(new THREE.ConeGeometry(2.1,3.2,4),color);shape.position.set(x,3.1,z);shape.rotation.y=Math.PI/4;world.add(shape);
  }
  // Distinct original project assets for eight actual company divisions.
  const accentColors=districts.map(d=>d.color);
  const anchors=[],animatedDistrictAssets=[];
  districts.forEach((d,i)=>{
    const district=buildDivisionDistrict(THREE,world,d);
    animatedDistrictAssets.push(...district.moving);
    const hit=new THREE.Mesh(new THREE.CylinderGeometry(7,7,22,12),
      new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    hit.position.set(d.x,9,d.z);hit.userData.district=d.id;
    world.add(hit);hitTargets.push(hit);
    anchors.push(new THREE.Vector3(d.x,14.5,d.z));
  });
  // Animated cumulus clouds.
  const clouds=[];
  for(let i=0;i<13;i++){
    const g=new THREE.Group(),x=(rand()-.5)*165,z=(rand()-.5)*105-15,y=36+rand()*30;
    for(let j=0;j<4;j++){const puff=new THREE.Mesh(new THREE.IcosahedronGeometry(3+rand()*2,1),new THREE.MeshBasicMaterial({color:0xfffdf6,transparent:true,opacity:.8}));puff.scale.set(1.2,.68,1);puff.position.set(j*2.5,rand()*2,rand()*2);g.add(puff);}
    g.position.set(x,y,z);world.add(g);clouds.push({obj:g,x,y,z,speed:.3+rand()*.5});
  }
  // Cumulus banks occupy the same 3D space as the island. The intro camera passes
  // through them on descent; no scene swap, screenshot, or second renderer is used.
  const skyClouds=[];
  const cloudPalette=['#fffefa','#fcffff','#ecf8f7','#f5fcfc'];
  const skyCloudMaterial=cloudPalette.map(color=>new THREE.MeshLambertMaterial({color,transparent:true,opacity:.84,depthWrite:false}));
  function addSkyCloud(x,y,z,scale=1,seed=0){
    const group=new THREE.Group();
    for(let j=0;j<7;j++){
      const part=new THREE.Mesh(new THREE.SphereGeometry((4.2+(j%3)*1.4)*scale,12,9),skyCloudMaterial[(j+seed)%skyCloudMaterial.length]);
      part.scale.set(1.35,.57,.9);
      part.position.set((j-3)*3.1*scale,Math.sin(j*1.7+seed)*1.3*scale,Math.cos(j+seed)*2.5*scale);
      group.add(part);
    }
    group.position.set(x,y,z);scene.add(group);
    skyClouds.push({group,baseX:x,phase:seed*1.6});
  }
  [
    [-23,126,83,1.75],[25,128,76,1.6],[3,124,49,1.4],
    [-24,111,103,1.45],[26,106,87,1.55],[0,101,75,1.35],
    [-27,88,76,1.5],[25,83,63,1.5],[2,78,42,1.2],
    [-38,66,48,1.45],[36,69,43,1.5]
  ].forEach((p,i)=>addSkyCloud(...p,i));

  const nameNodes=new Map();districts.forEach((d,i)=>{
    const btn=document.createElement('button');btn.className='world-label';btn.type='button';btn.style.setProperty('--accent',accentColors[i]);
    const dot=document.createElement('span');dot.className='label-dot';
    const words=document.createElement('span');words.textContent=d.short;
    const small=document.createElement('small');small.textContent='DESTINATION '+String(i+1).padStart(2,'0');words.append(small);
    btn.append(dot,words);btn.setAttribute('aria-label','Explore '+d.name);btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click',()=>{focus(d.id);onSelect(d.id,{fromWorld:true});});
    labelsRoot.append(btn);nameNodes.set(d.id,btn);
  });
  const orbit={theta:.35,phi:1.01,radius:107,target:new THREE.Vector3(0,3,0),focus:new THREE.Vector3(0,3,0),rDesired:107,thetaDesired:.35,phiDesired:1.01};
  const desiredPosition=new THREE.Vector3(),projected=new THREE.Vector3();
  const pointer={down:false,drag:false,x:0,y:0,theta:0,phi:0};
  let active=null,touring=false,tourT=0,tourIndex=-1,run=true,animate=Boolean(motionEnabled),last=performance.now(),raf=0,disposed=false;
  const introState={active:Boolean(intro),progress:0};
  const introCameraPoint=new THREE.Vector3(),introLookPoint=new THREE.Vector3();
  const startEye=new THREE.Vector3(0,138,139);
  const startTarget=new THREE.Vector3(0,132,-36);
  function bezierInto(out,p,a,b,c,d){
    const q=1-p;
    return out.set(
      q*q*q*a.x+3*q*q*p*b.x+3*q*p*p*c.x+p*p*p*d.x,
      q*q*q*a.y+3*q*q*p*b.y+3*q*p*p*c.y+p*p*p*d.y,
      q*q*q*a.z+3*q*q*p*b.z+3*q*p*p*c.z+p*p*p*d.z);
  }
  function setIntroProgress(value){introState.progress=THREE.MathUtils.clamp(Number(value)||0,0,1);}
  function endIntro(){
    introState.active=false;introState.progress=1;
    orbit.theta=orbit.thetaDesired=.35;
    orbit.phi=orbit.phiDesired=1.01;
    orbit.radius=orbit.rDesired=fitRadius();
    orbit.target.set(0,3,0);orbit.focus.copy(orbit.target);
    desiredPosition.set(
      orbit.focus.x+Math.sin(orbit.theta)*Math.sin(orbit.phi)*orbit.radius,
      orbit.focus.y+Math.cos(orbit.phi)*orbit.radius,
      orbit.focus.z+Math.cos(orbit.theta)*Math.sin(orbit.phi)*orbit.radius);
    camera.position.copy(desiredPosition);camera.lookAt(orbit.focus);
  }
  function fitRadius(){return Math.max(107,100/(2*Math.tan(39*Math.PI/360)*camera.aspect));}
  function focus(id){const d=districts.find(item=>item.id===id);if(!d)return;
    active=id;orbit.target.set(d.x,4,d.z);orbit.rDesired=Math.max(70,fitRadius()*.78);orbit.thetaDesired=.34;orbit.phiDesired=1;
    nameNodes.forEach((b,k)=>b.setAttribute('aria-pressed',String(k===id)));
  }
  function reset(){touring=false;active=null;orbit.target.set(0,3,0);orbit.rDesired=fitRadius();orbit.thetaDesired=.35;orbit.phiDesired=1;
    nameNodes.forEach(b=>b.setAttribute('aria-pressed','false'));}
  function zoom(delta){const fit=fitRadius();orbit.rDesired=THREE.MathUtils.clamp(orbit.rDesired+delta,Math.max(49,fit*.58),Math.max(146,fit*1.55));}
  function startTour(){tourT=0;tourIndex=-1;touring=true;active=null;}
  function stopTour(){touring=false;}
  function setMotion(enabled){animate=Boolean(enabled);if(!animate)stopTour();}
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
  function pick(event){const rect=canvas.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(hitTargets,false)[0];if(hit){const id=hit.object.userData.district;focus(id);onSelect(id,{fromWorld:true});}}
  canvas.addEventListener('pointerdown',e=>{pointer.down=true;pointer.drag=false;pointer.x=e.clientX;pointer.y=e.clientY;pointer.theta=orbit.thetaDesired;pointer.phi=orbit.phiDesired;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!pointer.down)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)+Math.abs(dy)>6)pointer.drag=true;if(pointer.drag){touring=false;orbit.thetaDesired=pointer.theta-dx*.005;orbit.phiDesired=THREE.MathUtils.clamp(pointer.phi+dy*.004,.46,1.48);}});
  canvas.addEventListener('pointerup',e=>{if(pointer.down&&!pointer.drag)pick(e);pointer.down=false;});
  canvas.addEventListener('pointercancel',()=>{pointer.down=false;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();touring=false;zoom(Math.sign(e.deltaY)*6);},{passive:false});
  function resize(){const width=Math.max(1,stage.clientWidth),height=Math.max(1,stage.clientHeight);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);if(!active&&!touring)orbit.rDesired=fitRadius();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);resize();
  function updateLabels(){if(introState.active||stage.classList.contains('is-2d'))return;const rect=canvas.getBoundingClientRect();const stageRect=stage.getBoundingClientRect();
    districts.forEach((d,i)=>{const label=nameNodes.get(d.id);
      projected.copy(anchors[i]).project(camera);
      const sx=(projected.x*.5+.5)*rect.width+rect.left-stageRect.left;
      const sy=(-projected.y*.5+.5)*rect.height+rect.top-stageRect.top;
      const behind=projected.z>1||projected.z< -1;
      label.style.left=sx+'px';label.style.top=sy+'px';
      label.style.opacity=behind||sx<10||sx>stage.clientWidth-10||sy<20||sy>stage.clientHeight-30?'0':'1';
      label.style.pointerEvents=label.style.opacity==='0'?'none':'auto';
    });
  }
  function tick(time){if(disposed)return;raf=requestAnimationFrame(tick);if(!run)return;const dt=Math.min(.045,(time-last)/1000||.016);last=time;
    if(touring){tourT+=dt/32;if(tourT>=1){tourT=1;touring=false;}
      traveler.position.copy(curve.getPointAt(Math.min(tourT,.9999)));const point=curve.getPointAt(Math.min(tourT,.9999));
      orbit.target.copy(point).add(new THREE.Vector3(0,2,0));orbit.rDesired=Math.max(55,fitRadius()*.65);orbit.thetaDesired=.35;orbit.phiDesired=.96;
      const idx=Math.min(districts.length-1,Math.floor(tourT*districts.length));
      if(idx!==tourIndex){tourIndex=idx;active=districts[idx].id;onSelect(active,{fromTour:true});}
      if(!touring){orbit.rDesired=85;}
    } else if(animate){traveler.position.copy(curve.getPointAt((time*.000012)%1));}
    if(introState.active){
      // A single continuous camera trajectory from clear sky, through the cloud
      // layers, down to the same exact isometric orbit used for world exploration.
      const p=introState.progress,r=fitRadius();
      const endEye=new THREE.Vector3(Math.sin(.35)*Math.sin(1.01)*r,3+Math.cos(1.01)*r,Math.cos(.35)*Math.sin(1.01)*r);
      bezierInto(introCameraPoint,p,startEye,new THREE.Vector3(-5,119,126),new THREE.Vector3(14,71,117),endEye);
      bezierInto(introLookPoint,p,startTarget,new THREE.Vector3(0,116,-36),new THREE.Vector3(0,12,4),new THREE.Vector3(0,3,0));
      camera.position.copy(introCameraPoint);camera.lookAt(introLookPoint);
    }else{
      const easing=animate?.07:1;
      orbit.theta=THREE.MathUtils.lerp(orbit.theta,orbit.thetaDesired,easing);
      orbit.phi=THREE.MathUtils.lerp(orbit.phi,orbit.phiDesired,easing);
      orbit.radius=THREE.MathUtils.lerp(orbit.radius,orbit.rDesired,easing);
      orbit.focus.lerp(orbit.target,easing);
      desiredPosition.set(orbit.focus.x+Math.sin(orbit.theta)*Math.sin(orbit.phi)*orbit.radius,orbit.focus.y+Math.cos(orbit.phi)*orbit.radius,orbit.focus.z+Math.cos(orbit.theta)*Math.sin(orbit.phi)*orbit.radius);
      camera.position.lerp(desiredPosition,animate?.15:1);camera.lookAt(orbit.focus);
    }
    animatedForest.update(time,animate);
    if(animate){clouds.forEach(c=>{c.obj.position.x=c.x+Math.sin(time*.00012*c.speed+c.z)*10;});
      waterRipples.forEach((r,i)=>{r.scale.setScalar(.6+((time*.00017+i*.22)%1)*1.3);r.material.opacity=.38*(1-(time*.00017+i*.22)%1);});
      animatedDistrictAssets.forEach((a,i)=>{
        if(a.kind==='beacon')a.obj.material.emissiveIntensity=.22+.15*Math.sin(time*.0018+i);
        if(a.kind==='sign')a.obj.rotation.y=Math.sin(time*.00048+i)*.024;
      });
      skyClouds.forEach(c=>{c.group.position.x=c.baseX+Math.sin(time*.00013+c.phase)*3.5;});
      falls.material.opacity=.76+Math.sin(time*.003)*.09;
      world.children.forEach(c=>{if(c.userData.waterfall)c.position.y+=Math.sin(time*.003+c.position.x)*.001;});
    }
    renderer.render(scene,camera);if(!introState.active)updateLabels();
  }
  function visibility(){run=!document.hidden;last=performance.now();}
  document.addEventListener('visibilitychange',visibility);
  raf=requestAnimationFrame(tick);
  return {focus,reset,zoom,startTour,stopTour,setMotion,setIntroProgress,endIntro,dispose(){disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);resizeObserver.disconnect();renderer.dispose();labelsRoot.replaceChildren();}};
}
