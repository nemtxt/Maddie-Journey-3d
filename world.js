import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import {buildDivisionDistrict,enhanceTerrain,enhanceForest} from './world-assets.js?v=1.3.0';
import {buildStoryEnvironment} from './dream-details.js?v=1.5.0';
import {createAdventureAssets} from './adventure-assets.js?v=1.6.0';

/** A lightweight bespoke Three.js diorama, no downloadable models or premium assets. */
export function createWorld({canvas,labelsRoot,districts,onSelect,onHover=()=>{},onTourProgress=()=>{},onTourComplete=()=>{},motionEnabled=true,intro=true}) {
  const stage=canvas.closest('.world-stage');
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#d6eef0');
  scene.fog=new THREE.FogExp2('#d6eef0',0.0032);
  // A physically large gradient sky dome keeps the aerial intro and world in one
  // continuous scene while adding a soft painterly sunrise and horizon haze.
  const skyDome=new THREE.Mesh(
    new THREE.SphereGeometry(290,36,20),
    new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,fog:false,
      vertexShader:`
        varying vec3 vSkyDirection;
        void main() {
          vSkyDirection=normalize(position);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }
      `,
      fragmentShader:`
        precision mediump float;
        varying vec3 vSkyDirection;
        void main(){
          vec3 dir=normalize(vSkyDirection);
          float horizon=clamp(dir.y*.66+.43,0.0,1.0);
          vec3 low=vec3(.89,.955,.93);
          vec3 high=vec3(.63,.85,.91);
          vec3 col=mix(low,high,smoothstep(.03,.92,horizon));
          float light=pow(max(dot(dir,normalize(vec3(-.43,.71,.48))),0.0),24.0);
          col+=vec3(1.0,.87,.59)*light*.19;
          gl_FragColor=vec4(col,1.0);
        }
      `
    })
  );
  skyDome.frustumCulled=false;skyDome.renderOrder=-100;scene.add(skyDome);
  const camera=new THREE.PerspectiveCamera(39,1,.1,420);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  const gl=renderer.getContext();
  const debugInfo=gl.getExtension('WEBGL_debug_renderer_info');
  const rendererName=debugInfo?String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)||''):'';
  const lowQuality=window.innerWidth<700||/(swiftshader|llvmpipe|software)/i.test(rendererName);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,lowQuality?1:window.innerWidth<950?1.25:1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.28;
  renderer.shadowMap.enabled=!lowQuality;
  renderer.shadowMap.type=THREE.PCFShadowMap;
  const hemi=new THREE.HemisphereLight(0xf8ffff,0x659381,2.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff5df,2.75);sun.position.set(-35,76,43);scene.add(sun);
  sun.castShadow=!lowQuality;
  sun.shadow.mapSize.set(lowQuality?512:1024,lowQuality?512:1024);
  sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;
  sun.shadow.camera.near=1;sun.shadow.camera.far=190;sun.shadow.bias=-.00012;
  const rim=new THREE.DirectionalLight(0xc3e7e9,.73);rim.position.set(50,44,-58);scene.add(rim);
  const districtGlow=new THREE.PointLight(0xffefbe,0,36,2);
  districtGlow.position.set(0,12,0);scene.add(districtGlow);
  const world=new THREE.Group();scene.add(world);
  const mat=(hex,rough=1)=>new THREE.MeshStandardMaterial({color:hex,roughness:rough,metalness:0,flatShading:true});
  const grass=mat('#75b68c'),grassLight=mat('#9acb8b'),grassDark=mat('#487e62'),cliff=mat('#636b70'),stone=mat('#879198'),snow=mat('#f0f4f0'),soil=mat('#8c7762'),sand=mat('#e6cf94'),water=new THREE.MeshPhysicalMaterial({color:'#69c4d8',roughness:.19,metalness:.07,clearcoat:.85,clearcoatRoughness:.16,transparent:true,opacity:.89}),foam=mat('#d2f9fa'),wood=mat('#9b704d'),roofRed=mat('#d66d59'),roofBlue=mat('#5d9fb1'),gold=mat('#e9d27f'),goldGlow=new THREE.MeshBasicMaterial({color:'#fff3af'});
  const sphere=(radius,color,x,y,z,width=12,height=8)=>{const obj=new THREE.Mesh(new THREE.SphereGeometry(radius,width,height),color);obj.position.set(x,y,z);world.add(obj);return obj;};
  const cylinder=(rt,rb,h,seg,color,x,y,z)=>{const obj=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),color);obj.position.set(x,y,z);world.add(obj);return obj;};
  function seeded(seed=9){let s=seed;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
  const rand=seeded(340);
  // Sparse firefly/dust particles create depth without expensive postprocessing.
  const particleCount=lowQuality?58:170;
  const motesPositions=new Float32Array(particleCount*3);
  for(let i=0;i<particleCount;i++){
    const a=rand()*6.283,rr=Math.sqrt(rand());
    motesPositions[i*3]=Math.cos(a)*rr*46;
    motesPositions[i*3+1]=3+rand()*23;
    motesPositions[i*3+2]=Math.sin(a)*rr*29;
  }
  const motesGeometry=new THREE.BufferGeometry();
  motesGeometry.setAttribute('position',new THREE.BufferAttribute(motesPositions,3));
  const motes=new THREE.Points(motesGeometry,new THREE.PointsMaterial({
    color:0xfff0bf,size:lowQuality?.44:.63,sizeAttenuation:true,transparent:true,
    opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending
  }));
  world.add(motes);
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
  const animatedForest=enhanceForest(THREE,world,districts,{mobile:window.innerWidth<850||lowQuality});
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
  const storyDetails=buildStoryEnvironment(THREE,world,{districts,route:curve,lowQuality});
  canvas.dataset.storyEnvironment='v1.5';
  canvas.dataset.geologicalLayers=String(storyDetails.counts.geologicalLayers);
  canvas.dataset.storyQuality=lowQuality?'lite':'enhanced';
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
  const adventureAssets=createAdventureAssets(THREE,world,districts,{lowQuality});
  canvas.dataset.adventureOutposts=String(adventureAssets.outpostCount);
  const anchors=[],animatedDistrictAssets=[],districtModels=new Map();
  districts.forEach((d,i)=>{
    const district=buildDivisionDistrict(THREE,world,d);
    districtModels.set(d.id,district.group);
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
    const words=document.createElement('span');words.textContent=d.name;
    const small=document.createElement('small');small.textContent=d.short+' · '+String(i+1).padStart(2,'0');words.append(small);
    btn.append(dot,words);btn.setAttribute('aria-label','Explore '+d.name);btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click',()=>{focus(d.id);onSelect(d.id,{fromWorld:true});});
    btn.addEventListener('pointerenter',()=>onHover(d.id));
    btn.addEventListener('focus',()=>onHover(d.id));
    labelsRoot.append(btn);nameNodes.set(d.id,btn);
  });
  const overviewX=window.innerWidth>=1100?-7:0;
  const orbit={theta:.35,phi:1.01,radius:107,target:new THREE.Vector3(overviewX,3,0),focus:new THREE.Vector3(overviewX,3,0),rDesired:107,thetaDesired:.35,phiDesired:1.01};
  const desiredPosition=new THREE.Vector3(),projected=new THREE.Vector3();
  const pointer={down:false,drag:false,x:0,y:0,theta:0,phi:0};
  let active=null,touring=false,tourT=0,tourIndex=-1,tourElapsed=0,tourPaused=false,tourNotice=0,flight=null,run=true,animate=Boolean(motionEnabled),last=performance.now(),raf=0,disposed=false;
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
    orbit.target.set(overviewX,3,0);orbit.focus.copy(orbit.target);
    desiredPosition.set(
      orbit.focus.x+Math.sin(orbit.theta)*Math.sin(orbit.phi)*orbit.radius,
      orbit.focus.y+Math.cos(orbit.phi)*orbit.radius,
      orbit.focus.z+Math.cos(orbit.theta)*Math.sin(orbit.phi)*orbit.radius);
    camera.position.copy(desiredPosition);camera.lookAt(orbit.focus);
  }
  function fitRadius(){return Math.max(107,100/(2*Math.tan(39*Math.PI/360)*camera.aspect));}
  const flightRibbon=new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(1,1,1)),20,.12,5,false),
    new THREE.MeshBasicMaterial({color:'#f0c57c',transparent:true,opacity:.82,depthWrite:false})
  );
  flightRibbon.visible=false;flightRibbon.renderOrder=8;world.add(flightRibbon);
  const flightSpark=new THREE.Mesh(new THREE.SphereGeometry(.55,10,8),
    new THREE.MeshBasicMaterial({color:'#fff7c5',transparent:true,opacity:.88,depthWrite:false}));
  flightSpark.visible=false;world.add(flightSpark);
  let sparkPath=null;
  const easeJourney=t=>t*t*(3-2*t);
  function startFlight(target,duration=2.9,radiusScale=.71){
    const fromEye=camera.position.clone();
    const fromLook=flight?.currentLook?.clone()||orbit.focus.clone();
    const toLook=target.clone();
    const radius=Math.max(69,fitRadius()*radiusScale),theta=.36,phi=1.02;
    const toEye=new THREE.Vector3(
      toLook.x+Math.sin(theta)*Math.sin(phi)*radius,
      toLook.y+Math.cos(phi)*radius,
      toLook.z+Math.cos(theta)*Math.sin(phi)*radius);
    orbit.theta=orbit.thetaDesired=theta;
    orbit.phi=orbit.phiDesired=phi;
    orbit.radius=orbit.rDesired=radius;
    orbit.focus.copy(toLook);orbit.target.copy(toLook);
    if(!animate||duration<=0||introState.active){
      flight=null;camera.position.copy(toEye);camera.lookAt(toLook);
      flightRibbon.visible=false;flightSpark.visible=false;return;
    }
    const fromRoute=new THREE.Vector3(fromLook.x,5.4,fromLook.z);
    const toRoute=new THREE.Vector3(toLook.x,5.4,toLook.z);
    sparkPath=new THREE.CatmullRomCurve3([
      fromRoute,new THREE.Vector3((fromRoute.x*2+toRoute.x)/3,7.5,(fromRoute.z*2+toRoute.z)/3),
      new THREE.Vector3((fromRoute.x+toRoute.x*2)/3,8.4,(fromRoute.z+toRoute.z*2)/3),toRoute
    ]);
    flightRibbon.geometry.dispose();
    flightRibbon.geometry=new THREE.TubeGeometry(sparkPath,55,.14,6,false);
    flightRibbon.visible=true;flightSpark.visible=true;
    flight={
      elapsed:0,duration,fromLook,toLook,currentLook:fromLook.clone(),fromEye,toEye,
      eyeCurve:new THREE.CubicBezierCurve3(fromEye,
        fromEye.clone().add(new THREE.Vector3(0,17,0)),
        toEye.clone().add(new THREE.Vector3(0,19,0)),toEye)
    };
  }
  function focus(id){const d=districts.find(item=>item.id===id);if(!d)return;
    districtGlow.position.set(d.x,16,d.z);districtGlow.color.set(d.color);districtGlow.intensity=lowQuality?.2:1.15;
    active=id;adventureAssets.setActive(id);startFlight(new THREE.Vector3(d.x,4,d.z));
    nameNodes.forEach((b,k)=>b.setAttribute('aria-pressed',String(k===id)));
  }
  function reset(){touring=false;tourPaused=false;active=null;adventureAssets.setActive(null);districtGlow.intensity=0;startFlight(new THREE.Vector3(overviewX,3,0),2.5,1);
    nameNodes.forEach(b=>b.setAttribute('aria-pressed','false'));}
  function zoom(delta){const fit=fitRadius();orbit.rDesired=THREE.MathUtils.clamp(orbit.rDesired+delta,Math.max(49,fit*.58),Math.max(146,fit*1.55));}
  const TOUR_STOP_SECONDS=5.7;
  function announceTour(){
    if(!touring||tourIndex<0)return;
    onTourProgress({
      index:tourIndex,count:districts.length,id:districts[tourIndex].id,
      name:districts[tourIndex].name,elapsed:tourElapsed,
      stopProgress:Math.min(1,tourElapsed/TOUR_STOP_SECONDS),paused:tourPaused
    });
  }
  function advanceTour(nextIndex){
    if(nextIndex>=districts.length){stopTour({complete:true});return;}
    tourIndex=nextIndex;tourElapsed=0;tourNotice=0;
    const d=districts[tourIndex];
    focus(d.id);
    onSelect(d.id,{fromTour:true});
    announceTour();
  }
  function startTour(){
    touring=true;tourPaused=false;tourT=0;tourIndex=-1;tourElapsed=0;
    advanceTour(0);
  }
  function pauseTour(paused){
    if(!touring)return false;
    tourPaused=typeof paused==='boolean'?paused:!tourPaused;
    announceTour();return tourPaused;
  }
  function nextTourStop(){if(touring){tourPaused=false;advanceTour(tourIndex+1);}}
  function stopTour({complete=false}={}){
    const wasTouring=touring;touring=false;tourPaused=false;
    if(wasTouring)onTourComplete({complete,index:tourIndex,total:districts.length});
  }
  function setMotion(enabled){
    animate=Boolean(enabled);
    if(!animate){
      if(flight){const ending=flight.toLook.clone();flight=null;camera.lookAt(ending);flightRibbon.visible=false;flightSpark.visible=false;}
      if(touring)stopTour();
    }
  }
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
  function pick(event){const rect=canvas.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(hitTargets,false)[0];if(hit){const id=hit.object.userData.district;focus(id);onSelect(id,{fromWorld:true});}}
  canvas.addEventListener('pointerdown',e=>{pointer.down=true;pointer.drag=false;pointer.x=e.clientX;pointer.y=e.clientY;pointer.theta=orbit.thetaDesired;pointer.phi=orbit.phiDesired;canvas.setPointerCapture(e.pointerId);});
  let lastHoveredId=null;
  canvas.addEventListener('pointermove',e=>{if(!pointer.down){const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);
    const hovered=raycaster.intersectObjects(hitTargets,false)[0]?.object.userData.district||null;
    canvas.style.cursor=hovered?'pointer':'grab';
    if(hovered&&hovered!==lastHoveredId)onHover(hovered);
    lastHoveredId=hovered;return;}const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)+Math.abs(dy)>6)pointer.drag=true;if(pointer.drag){touring=false;orbit.thetaDesired=pointer.theta-dx*.005;orbit.phiDesired=THREE.MathUtils.clamp(pointer.phi+dy*.004,.46,1.48);}});
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
      const offscreen=behind||sx<10||sx>stage.clientWidth-10||sy<20||sy>stage.clientHeight-30;
      label.style.opacity=offscreen?'0':active&&d.id!==active?'.42':'1';
      label.style.pointerEvents=label.style.opacity==='0'?'none':'auto';
    });
  }
  function tick(time){if(disposed)return;raf=requestAnimationFrame(tick);if(!run)return;const dt=Math.min(.045,(time-last)/1000||.016);last=time;
    if(touring&&!tourPaused){
      tourElapsed+=dt;tourNotice+=dt;
      if(tourElapsed>=TOUR_STOP_SECONDS)advanceTour(tourIndex+1);
      else if(tourNotice>=.16){tourNotice=0;announceTour();}
    }
    if(animate&&!touring)traveler.position.copy(curve.getPointAt((time*.000012)%1));
    districtModels.forEach((obj,id)=>{const next=id===active?1.055:1;const value=obj.scale.x+(next-obj.scale.x)*.085;obj.scale.setScalar(value);});
    if(introState.active){
      // A single continuous camera trajectory from clear sky, through the cloud
      // layers, down to the same exact isometric orbit used for world exploration.
      const p=introState.progress,r=fitRadius();
      const endEye=new THREE.Vector3(overviewX+Math.sin(.35)*Math.sin(1.01)*r,3+Math.cos(1.01)*r,Math.cos(.35)*Math.sin(1.01)*r);
      bezierInto(introCameraPoint,p,startEye,new THREE.Vector3(-5,119,126),new THREE.Vector3(14,71,117),endEye);
      bezierInto(introLookPoint,p,startTarget,new THREE.Vector3(0,116,-36),new THREE.Vector3(0,12,4),new THREE.Vector3(overviewX,3,0));
      camera.position.copy(introCameraPoint);camera.lookAt(introLookPoint);
    }else if(flight){
      flight.elapsed=Math.min(flight.duration,flight.elapsed+dt);
      const p=easeJourney(Math.min(1,flight.elapsed/flight.duration));
      camera.position.copy(flight.eyeCurve.getPoint(p));
      flight.currentLook.copy(flight.fromLook).lerp(flight.toLook,p);
      camera.lookAt(flight.currentLook);
      if(sparkPath)flightSpark.position.copy(sparkPath.getPoint(p));
      if(flight.elapsed>=flight.duration){
        camera.position.copy(flight.toEye);camera.lookAt(flight.toLook);
        orbit.focus.copy(flight.toLook);flight=null;
        flightRibbon.visible=false;flightSpark.visible=false;
      }
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
    adventureAssets.update(time,animate);
    storyDetails.update(time,animate);
    if(animate){motes.rotation.y=Math.sin(time*.000085)*.015;motes.position.y=Math.sin(time*.0002)*.5;}
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
  return {focus,reset,zoom,startTour,stopTour,pauseTour,nextTourStop,setMotion,setIntroProgress,endIntro,detailCounts:{...storyDetails.counts,adventureOutposts:adventureAssets.outpostCount},dispose(){adventureAssets.dispose();storyDetails.dispose();disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);resizeObserver.disconnect();renderer.dispose();labelsRoot.replaceChildren();}};
}
