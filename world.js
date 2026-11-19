import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

/** A lightweight bespoke Three.js diorama, no downloadable models or premium assets. */
export function createWorld({canvas,labelsRoot,districts,onSelect,motionEnabled=true}) {
  const stage=canvas.closest('.world-stage');
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#d6eef0');
  scene.fog=new THREE.FogExp2('#d6eef0',0.005);
  const camera=new THREE.PerspectiveCamera(39,1,.1,420);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.45;
  const hemi=new THREE.HemisphereLight(0xf8ffff,0x659381,2.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff5df,2.8);sun.position.set(-35,70,42);scene.add(sun);
  const world=new THREE.Group();scene.add(world);
  const mat=(hex,rough=1)=>new THREE.MeshStandardMaterial({color:hex,roughness:rough,metalness:0,flatShading:true});
  const grass=mat('#75b68c'),grassLight=mat('#9acb8b'),grassDark=mat('#487e62'),cliff=mat('#636b70'),stone=mat('#879198'),snow=mat('#f0f4f0'),soil=mat('#8c7762'),sand=mat('#e6cf94'),water=mat('#6ed0dd',.45),foam=mat('#d2f9fa'),wood=mat('#9b704d'),roofRed=mat('#d66d59'),roofBlue=mat('#5d9fb1'),gold=mat('#e9d27f'),goldGlow=new THREE.MeshBasicMaterial({color:'#fff3af'});
  const sphere=(radius,color,x,y,z,width=12,height=8)=>{const obj=new THREE.Mesh(new THREE.SphereGeometry(radius,width,height),color);obj.position.set(x,y,z);world.add(obj);return obj;};
  const cylinder=(rt,rb,h,seg,color,x,y,z)=>{const obj=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),color);obj.position.set(x,y,z);world.add(obj);return obj;};
  function seeded(seed=9){let s=seed;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
  const rand=seeded(340);
  // Irregular stepped floating island, grassy plateau and layered geological underside.
  for(const [rt,rb,h,y,c] of [[52,47,5,-2,grassDark],[49,39,9,-8,soil],[39,21,8,-16,cliff],[25,10,7,-23,stone]]){
    const ring=cylinder(rt,rb,h,17,c,0,y,0);ring.scale.z=.7;ring.rotation.y=.09;
  }
  const top=cylinder(51.9,51,1.3,18,grass,0,1,0);top.scale.z=.7;
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
  for(let i=0;i<(window.innerWidth<700?65:115);i++){
    const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.92;
    const x=Math.cos(a)*46*r,z=Math.sin(a)*30*r;
    const close=districts.some(d=>Math.hypot(d.x-x,d.z-z)<6);
    if(close||Math.abs(z)<3&&Math.abs(x)<8)continue;
    addTree(x,z,.5+rand()*.85,rand()<.33?'broad':'pine');
  }
  // Mountain range: low-poly slopes, peaks, snow caps, foreground ridge.
  function mountain(x,z,r,h,shade){
    const rock=new THREE.Mesh(new THREE.ConeGeometry(r,h,7,3),shade);rock.position.set(x,1.5+h/2,z);rock.rotation.y=rand();world.add(rock);
    const cap=new THREE.Mesh(new THREE.ConeGeometry(r*.32,h*.26,7),snow);cap.position.set(x,1.5+h*.87,z);cap.rotation.y=rock.rotation.y;world.add(cap);
  }
  mountain(-13,-15,12,23,cliff);mountain(1,-20,15,31,stone);mountain(16,-16,10,20,cliff);
  // Lake and river; gently animated cascading waterfall.
  const lake=cylinder(7,7,.16,32,water,13,1.81,2);lake.scale.z=.58;
  const streamPoints=[[3,-12],[4,-5],[9,-1],[13,2],[17,9],[23,14]].map(([x,z])=>new THREE.Vector3(x,1.94,z));
  const streamCurve=new THREE.CatmullRomCurve3(streamPoints);
  const stream=new THREE.Mesh(new THREE.TubeGeometry(streamCurve,85,1.05,9,false),water);world.add(stream);
  const falls=new THREE.Mesh(new THREE.BoxGeometry(3.8,11,.55),new THREE.MeshStandardMaterial({color:'#76d1e4',transparent:true,opacity:.85,roughness:.25}));
  falls.position.set(3,9,-13);world.add(falls);
  for(let i=0;i<17;i++){const bubble=sphere(.15+rand()*.28,foam,2.5+rand()*2,2.1+rand()*9,-12.5+rand());bubble.userData.waterfall=true;}
  // Routes: a broad warm pathway with luminous center line and a traveling highlight.
  const routePoints=districts.map(d=>new THREE.Vector3(d.x,2.23,d.z));
  routePoints.splice(4,0,new THREE.Vector3(22,2.23,13));
  routePoints.splice(6,0,new THREE.Vector3(36,2.23,-10));
  const curve=new THREE.CatmullRomCurve3(routePoints,false,'centripetal',.5);
  const routeBase=new THREE.Mesh(new THREE.TubeGeometry(curve,220,.65,8,false),sand);world.add(routeBase);
  const routeLit=new THREE.Mesh(new THREE.TubeGeometry(curve,220,.20,6,false),gold);world.add(routeLit);
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
  const accentColors=['#71b6a4','#f0c769','#8dc3cc','#f27d68','#a18bc8','#79c9a5','#f1b77e','#8aaebf','#b983a2'];
  const anchors=[];
  districts.forEach((d,i)=>{
    const color=mat(accentColors[i]),base=cylinder(4.45,4.65,.46,20,mat('#d8e7bc'),d.x,1.77,d.z);base.userData.district=d.id;hitTargets.push(base);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(4.5,.15,5,36),mat(accentColors[i]));ring.rotation.x=Math.PI/2;ring.position.set(d.x,2.08,d.z);world.add(ring);
    if(i===0){tent(d.x-1,d.z,color);tent(d.x+2,d.z+1,roofBlue);}
    else if(i===1){building(d.x,d.z,color,3.2);}
    else if(i===2){spire(d.x,d.z,color);}
    else if(i===3){spire(d.x,d.z,color);tent(d.x+4,d.z-1,roofBlue);}
    else if(i===4){building(d.x-1,d.z,roofBlue);building(d.x+3,d.z+2,color,3.4);}
    else if(i===5){building(d.x,d.z,color);tent(d.x+3,d.z,roofRed);}
    else if(i===6){building(d.x,d.z,color,4);}
    else if(i===7){spire(d.x,d.z,color);}
    else {spire(d.x,d.z,color);building(d.x+3,d.z+1,roofBlue,3);}
    const flag=cylinder(.07,.07,5,5,wood,d.x+4,4.5,d.z-2);
    const banner=new THREE.Mesh(new THREE.BoxGeometry(2,.95,.08),color);banner.position.set(d.x+5,6.2,d.z-2);world.add(banner);
    const hit=new THREE.Mesh(new THREE.CylinderGeometry(6,6,20,10),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    hit.position.set(d.x,7,d.z);hit.userData.district=d.id;world.add(hit);hitTargets.push(hit);
    anchors.push(new THREE.Vector3(d.x,12.5,d.z));
  });
  // Animated cumulus clouds.
  const clouds=[];
  for(let i=0;i<13;i++){
    const g=new THREE.Group(),x=(rand()-.5)*165,z=(rand()-.5)*105-15,y=36+rand()*30;
    for(let j=0;j<4;j++){const puff=new THREE.Mesh(new THREE.IcosahedronGeometry(3+rand()*2,1),new THREE.MeshBasicMaterial({color:0xfffdf6,transparent:true,opacity:.8}));puff.scale.set(1.2,.68,1);puff.position.set(j*2.5,rand()*2,rand()*2);g.add(puff);}
    g.position.set(x,y,z);world.add(g);clouds.push({obj:g,x,y,z,speed:.3+rand()*.5});
  }
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
  let active=null,touring=false,tourT=0,tourIndex=-1,run=true,animate=true,last=performance.now(),raf=0,disposed=false;
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
  function updateLabels(){if(stage.classList.contains('is-2d'))return;const rect=canvas.getBoundingClientRect();const stageRect=stage.getBoundingClientRect();
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
    orbit.theta=THREE.MathUtils.lerp(orbit.theta,orbit.thetaDesired,.07);
    orbit.phi=THREE.MathUtils.lerp(orbit.phi,orbit.phiDesired,.07);
    orbit.radius=THREE.MathUtils.lerp(orbit.radius,orbit.rDesired,.065);
    orbit.focus.lerp(orbit.target,.065);
    desiredPosition.set(orbit.focus.x+Math.sin(orbit.theta)*Math.sin(orbit.phi)*orbit.radius,orbit.focus.y+Math.cos(orbit.phi)*orbit.radius,orbit.focus.z+Math.cos(orbit.theta)*Math.sin(orbit.phi)*orbit.radius);
    camera.position.lerp(desiredPosition,.15);camera.lookAt(orbit.focus);
    if(animate){clouds.forEach(c=>{c.obj.position.x=c.x+Math.sin(time*.00012*c.speed+c.z)*10;});
      falls.material.opacity=.76+Math.sin(time*.003)*.09;
      world.children.forEach(c=>{if(c.userData.waterfall)c.position.y+=Math.sin(time*.003+c.position.x)*.001;});
    }
    renderer.render(scene,camera);updateLabels();
  }
  function visibility(){run=!document.hidden;last=performance.now();}
  document.addEventListener('visibilitychange',visibility);
  raf=requestAnimationFrame(tick);
  return {focus,reset,zoom,startTour,stopTour,setMotion,dispose(){disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);resizeObserver.disconnect();renderer.dispose();labelsRoot.replaceChildren();}};
}
