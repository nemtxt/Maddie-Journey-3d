/**
 * Original procedural 3D asset kit for Maddie Journey divisions.
 * No paid assets, runtime image downloads, credentials, or external GLB licenses.
 * The eight campuses each contain bespoke project-related landmarks.
 */
export function buildDivisionDistrict(THREE,root,d){
  const group=new THREE.Group();
  group.position.set(d.x,1.98,d.z);
  group.name='District: '+d.name;
  root.add(group);
  const sceneObjects=[],moving=[];
  const material=(color,rough=.78,extra={})=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0.04,...extra});
  const color=material(d.color,.62),limestone=material('#e8e4d4'),ivory=material('#f6f4ec'),stone=material('#9aa49e'),
  slate=material('#536974'),dark=material('#244c57'),wood=material('#92765c'),
  glass=material('#9bcdda',.18,{metalness:.2,transparent:true,opacity:.84}),
  grass=material('#98c69b'),gold=material('#e8c77d',.3,{metalness:.25}),
  neon=material('#79d8d5',.23,{emissive:'#2d9caa',emissiveIntensity:.38}),
  paper=material('#faf7ee'),screen=material('#31566d',.36,{emissive:'#17354a',emissiveIntensity:.35});
  const mesh=(geometry,mat,x=0,y=0,z=0,cast=true)=>{
    const obj=new THREE.Mesh(geometry,mat);obj.position.set(x,y,z);obj.castShadow=cast;obj.receiveShadow=true;group.add(obj);sceneObjects.push(obj);return obj;
  };
  const box=(w,h,dep,x,y,z,mat)=>mesh(new THREE.BoxGeometry(w,h,dep),mat,x,y,z);
  const cyl=(top,bottom,height,x,y,z,mat,sides=14)=>mesh(new THREE.CylinderGeometry(top,bottom,height,sides),mat,x,y,z);
  const orb=(radius,x,y,z,mat,seg=10)=>mesh(new THREE.IcosahedronGeometry(radius,seg===10?1:0),mat,x,y,z);
  const con=(rad,height,x,y,z,mat,sides=8)=>mesh(new THREE.ConeGeometry(rad,height,sides),mat,x,y,z);
  const ring=(radius,tube,x,y,z,mat)=>{const o=mesh(new THREE.TorusGeometry(radius,tube,5,42),mat,x,y,z);o.rotation.x=-Math.PI/2;return o;};
  const plinth=cyl(7.0,7.65,.38,0,-.07,0,stone,28);
  cyl(6.6,6.9,.22,0,.22,0,grass,32);
  ring(6.65,.1,0,.37,0,color);
  function tinyTree(x,z,s=1){
    cyl(.13*s,.2*s,1.8*s,x,1.2*s,z,wood,6);
    orb(.95*s,x,2.55*s,z,material('#7fac77'));
    orb(.7*s,x-.5*s,2.9*s,z,material('#a0ca8d'));
  }
  function post(x,z,height=3){
    cyl(.075,.1,height,x,height/2,z,slate,7);
    const glow=orb(.24,x,height+.1,z,gold);
    glow.castShadow=false;
    return glow;
  }
  function vegetation(){
    for(const [x,z] of [[-5,-3],[5,-2],[-5,3],[4.7,3.9]])tinyTree(x,z,.65);
    for(const [x,z] of [[-4.4,0],[4.3,0]])post(x,z,2.4);
  }
  function windowGrid(x,y,z,w,h,n=3){
    for(let i=0;i<n;i++){
      const win=box(w/n-.14,h,.075,x-w/2+(i+.5)*w/n,y,z,glass);
      win.castShadow=false;
    }
  }
  function building(x,z,w=5,h=4,dep=3.8,roofColor=color){
    box(w,.34,dep,x,.52,z,stone);
    box(w,h,dep,x,.67+h/2,z,ivory);
    box(w+.48,.2,dep+.38,x,h+.76,z,roofColor);
    windowGrid(x,h*.65,z+dep/2+.06,w*.72,1.25,3);
    box(.8,1.65,.09,x,.75+0.825,z+dep/2+.09,wood);
    return {x,z,h};
  }
  function display(x,z,text,accent=d.color,width=4){
    // CanvasTexture creates in-scene wayfinding and reporting props, entirely original.
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=280;
    const g=canvas.getContext('2d');
    g.fillStyle='#173d4c';g.beginPath();if(typeof g.roundRect==='function')g.roundRect(8,8,624,260,30);else g.rect(8,8,624,260);g.fill();
    g.fillStyle=accent;g.fillRect(35,36,120,8);
    g.fillStyle='#fafcf5';g.font='700 55px Arial, sans-serif';g.textAlign='center';
    const words=text.split(' '),line1=words.length>2?words.slice(0,Math.ceil(words.length/2)).join(' '):text;
    const line2=words.length>2?words.slice(Math.ceil(words.length/2)).join(' '):'';
    g.fillText(line1,320,line2?132:174,550);if(line2)g.fillText(line2,320,204,550);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const board=mesh(new THREE.PlaneGeometry(width,width*.44),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true}),x,3.05,z);
    board.castShadow=false;
    cyl(.09,.13,2.8,x,1.55,z-.2,slate,8);
    moving.push({kind:'sign',obj:board});
  }
  function shrubs(n=6){
    const angleStart=Math.PI*.26;
    for(let i=0;i<n;i++){
      const a=angleStart+i/n*Math.PI*1.5;
      orb(.3+((i%2)*.12),Math.cos(a)*5.5,.55,Math.sin(a)*5.5,material(i%2?'#76ab76':'#bfd19b'));
    }
  }
  function bench(x,z){
    box(1.8,.15,.5,x,.77,z,wood);
    for(const dx of [-.65,.65])box(.15,.65,.15,x+dx,.45,z,slate);
  }
  function human(x,z,tint){
    cyl(.18,.22,1.25,x,1.1,z,tint,8);orb(.34,x,2.0,z,material('#d5ab8a'));
  }
  function statsPillars(){
    const heights=[2.8,4.3,5.9,3.7];
    heights.forEach((h,i)=>{box(.85,h,.95,-2.5+i*1.45,h/2+.5,-2.7,i%2?gold:color);});
  }
  function arch(x,z,mat=limestone,height=4){
    box(.5,height,.6,x-2.3,height/2+.45,z,mat);
    box(.5,height,.6,x+2.3,height/2+.45,z,mat);
    box(5.2,.55,.8,x,height+.3,z,mat);
  }
  function antenna(x,z){
    cyl(.22,.45,8,x,4.3,z,slate,8);for(let k=0;k<3;k++){
      const radius=.7+k*.48;ring(radius,.07,x,6.1+k*1.2,z,neon);
    }
    const tip=orb(.42,x,9,z,color);moving.push({kind:'beacon',obj:tip});
  }
  // Eight differentiated landmarks are not tied to the fictional employee roster.
  switch(d.id){
    case 'hr':
      building(-1.3,-1.2,5.8,4.1,4.1);
      arch(-1.2,2.5,color,3.6);
      display(2.7,2.5,'201 FILES');
      bench(3,-1.3);bench(-4,1.2);
      human(1.5,1.5,material('#6ba9a0'));human(2.4,1.4,material('#cf8d8d'));
      break;
    case 'revenue':
      building(-1.0,-1.6,4.6,6.9,3.6,slate);
      // Stacked glazing creates a recognisable finance/analytics observatory.
      for(let i=0;i<4;i++){box(4.85,.09,3.8,-1,.9+i*1.7,-1.6,gold);}
      statsPillars();
      display(2.8,2.45,'KPI OUTLOOK');
      antenna(-1,-1.6);
      break;
    case 'design':
      building(-1.1,-1.9,5.1,3.5,4.2);
      box(2.7,2.0,.12,2.5,2.3,-.7,paper);
      for(let k=0;k<5;k++)box(.45,.9,.15,1.5+k*.5,2.3,-.57,material(['#da8985','#8dc4bf','#ddc58b','#a59bcb','#9abd8d'][k]));
      const sculpture=mesh(new THREE.TorusKnotGeometry(1,.25,45,7,2,3),gold,-3.1,2.25,1.3);sculpture.rotation.x=.9;
      display(2.8,3.2,'DESIGN LAB');
      break;
    case 'corporate':
      building(-2.1,-1.9,4.1,5.7,3.3,slate);
      building(2.2,-1.3,3.4,3.3,3.0,color);
      const clock=cyl(.85,.85,.22,-2.1,6.3,.16,ivory,20);clock.rotation.x=Math.PI/2;
      // Clock hands / schedule timetable
      box(.1,.65,.05,-2.1,6.35,.31,slate);
      box(.45,.1,.05,-1.86,6.22,.34,slate);
      display(1.5,3,'WORKFLOW');
      break;
    case 'media':
      building(-1.6,-1.4,5.2,3.7,3.6,slate);
      antenna(2,-1.2);
      box(2.5,1.9,.18,-.9,3.3,.46,screen);
      for(let k=0;k<3;k++)box(.62,.14,.08,-1.65+k*.75,3.2,.6,k%2?neon:color);
      // Abstract video camera: body, lens, tripod
      box(1.4,.85,.8,3,1.9,1.8,dark);cyl(.46,.46,.85,3.95,1.9,1.8,glass);
      for(let k=-1;k<=1;k++)cyl(.08,.1,1.25,3+k*.32,.72,1.8,slate,6);
      display(-1.2,3.2,'MEDIA STUDIO');
      break;
    case 'it':
      building(-1.5,-1.5,5.6,4.3,4.6,slate);
      for(let k=0;k<4;k++){
        const rack=box(.95,3.3,.95,-3.25+k*1.25,2,-1.1,dark);
        for(let j=0;j<4;j++)box(.64,.1,.07,-3.25+k*1.25,1.1+j*.67,-.58,neon);
      }
      for(const z of [.5,1.5,2.5])box(5.3,.07,.08,0,.45,z,neon);
      antenna(3.5,-2.1);display(1.2,3.4,'DATA NODES');
      break;
    case 'gencon':
      // Circular amphitheater / expo stage, with terraced audience seating.
      for(let k=0;k<4;k++){
        const seat=ring(2.2+k*.84,.21,0,.65+k*.17,0,stone);
        seat.rotation.z=.05;
      }
      box(5,.4,1.8,0,.8,-2.0,wood);
      arch(0,-2.2,color,4.4);
      box(3.6,.16,.6,0,5.1,-2.2,ivory);
      con(1.1,2.1,-3.6,1.9,2,color,5);
      con(1.1,2.1,3.7,1.9,2,color,5);
      display(2.8,3.0,'EVENT CAMPUS');
      break;
    case 'business':
      building(-2.5,-1.4,4.1,5.6,3.3,slate);
      // Elevated growth walkway with connected partner nodes.
      for(let i=0;i<4;i++){
        box(2.3,.19,1.1,1.2+i*.95,1.0+i*.42,-2.1+i*.96,wood);
        orb(.43,1.2+i*1.08,1.7+i*.5,-1.2+i*.9,i%2?gold:color);
      }
      const tower=cyl(.53,.75,6.2,-2.5,7.4,-1.4,slate,9);
      con(1.5,2.6,-2.5,11.9,-1.4,color);
      display(2.8,3.0,'GROWTH PATH');
      break;
  }
  vegetation();shrubs(); 
  return {group,moving,meshCount:sceneObjects.length};
}

/** Lightweight terrain dressing; shared instanced geometries avoid hundreds of draw calls. */
export function enhanceTerrain(THREE,root,districts){
  let seed=93019;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  const isClear=(x,z)=>districts.every(d=>Math.hypot(d.x-x,d.z-z)>8.1) && !(x>0&&x<24&&z>-8&&z<11);
  const allowed=(x,z)=>x*x/(47*47)+z*z/(31*31)<.87&&isClear(x,z);
  const base=new THREE.Object3D();
  const collections=[
    {count:165,geometry:new THREE.DodecahedronGeometry(.28,0),material:new THREE.MeshStandardMaterial({color:'#86958a',flatShading:true,roughness:.96}),scale:[.7,2.2,.5,1.5],y:1.8},
    {count:210,geometry:new THREE.ConeGeometry(.19,.68,4),material:new THREE.MeshStandardMaterial({color:'#638d64',flatShading:true,roughness:1}),scale:[.5,1.1,.4,1.3],y:1.99},
    {count:105,geometry:new THREE.IcosahedronGeometry(.18,0),material:new THREE.MeshStandardMaterial({color:'#e6cc9b',flatShading:true,roughness:.9}),scale:[.5,1.2,.5,1.2],y:1.84}
  ];
  const all=[];
  for(const item of collections){
    const im=new THREE.InstancedMesh(item.geometry,item.material,item.count);
    im.castShadow=true;im.receiveShadow=true;
    let placed=0,tries=0;
    while(placed<item.count&&tries<item.count*22){
      tries++;const x=(rand()-.5)*93,z=(rand()-.5)*61;if(!allowed(x,z))continue;
      const scale=item.scale[0]+rand()*(item.scale[1]-item.scale[0]);
      base.position.set(x,item.y,z);base.rotation.set(0,rand()*Math.PI*2,rand()*.11);
      base.scale.set(scale,scale*(item.scale[2]+rand()*(item.scale[3]-item.scale[2])),scale);
      base.updateMatrix();im.setMatrixAt(placed,base.matrix);placed++;
    }
    im.count=placed;im.instanceMatrix.needsUpdate=true;root.add(im);all.push(im);
  }
  // Low cost foliage variation and clustered limestone boulders.
  const boulder=new THREE.MeshStandardMaterial({color:'#b1aea1',roughness:.94,flatShading:true});
  for(let i=0;i<34;i++){
    const x=(rand()-.5)*90,z=(rand()-.5)*61;
    if(!allowed(x,z))continue;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.6+rand()*1.35,0),boulder);
    rock.position.set(x,1.75,z);rock.scale.set(1,.45+rand()*.5,.75+rand()*.4);
    rock.rotation.set(rand()*.3,rand()*Math.PI*2,0);
    rock.receiveShadow=true;rock.castShadow=true;root.add(rock);
  }
  return all;
}

/**
 * Animated woodland using GPU instancing and subtle vertex-level wind.
 * Height / color variation gives more natural silhouettes without per-tree draw calls.
 */
export function enhanceForest(THREE,root,districts,{mobile=false}={}){
  let seed=312893;
  const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const count=mobile?68:146;
  const positions=[];
  let attempts=0;
  while(positions.length<count&&attempts<count*35){
    attempts++;
    const x=(rand()-.5)*91,z=(rand()-.5)*59;
    if(x*x/(48*48)+z*z/(32*32)>.89)continue;
    if(districts.some(d=>Math.hypot(d.x-x,d.z-z)<8.8))continue;
    if(x>0&&x<23&&z>-10&&z<10)continue;
    const scale=.6+rand()*.85,shape=rand();
    positions.push({x,z,s:scale,shape});
  }
  const windClock={value:0};
  function windyMaterial(hex){
    const material=new THREE.MeshStandardMaterial({color:hex,roughness:.97,metalness:0,flatShading:true});
    material.onBeforeCompile=shader=>{
      shader.uniforms.uForestWind=windClock;
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uForestWind;');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        #ifdef USE_INSTANCING
          float windOffset = uForestWind*.8 + instanceMatrix[3].x*.13 + instanceMatrix[3].z*.21;
          transformed.x += sin(windOffset) * .07 * max(transformed.y,0.);
          transformed.z += cos(windOffset*.63) * .035 * max(transformed.y,0.);
        #endif
      `);
    };
    return material;
  }
  const trunkMaterial=new THREE.MeshStandardMaterial({color:'#7f6855',roughness:1,flatShading:true});
  const evergreen=windyMaterial('#548c70'),juniper=windyMaterial('#79a386'),broadleaf=windyMaterial('#90b87e');
  const trunkGeometry=new THREE.CylinderGeometry(.19,.30,2.8,5);
  const pineGeometry=new THREE.ConeGeometry(2.0,4.6,6);
  const leafGeometry=new THREE.IcosahedronGeometry(1.95,1);
  const trunks=new THREE.InstancedMesh(trunkGeometry,trunkMaterial,positions.length);
  const pines=new THREE.InstancedMesh(pineGeometry,evergreen,positions.length);
  const broad=new THREE.InstancedMesh(leafGeometry,broadleaf,positions.length);
  const secondary=new THREE.InstancedMesh(pineGeometry,juniper,positions.length);
  const tmp=new THREE.Object3D();
  let pineCount=0,broadCount=0,secondCount=0;
  positions.forEach((p,i)=>{
    const {x,z,s,shape}=p;
    tmp.position.set(x,2.0+1.4*s,z);tmp.rotation.y=rand()*6.28;tmp.scale.setScalar(s);tmp.updateMatrix();
    trunks.setMatrixAt(i,tmp.matrix);
    if(shape<.56){
      tmp.position.set(x,4.4*s+1.9,z);tmp.scale.setScalar(s);tmp.updateMatrix();pines.setMatrixAt(pineCount++,tmp.matrix);
      tmp.position.set(x,5.6*s+1.9,z);tmp.scale.setScalar(s*.68);tmp.updateMatrix();secondary.setMatrixAt(secondCount++,tmp.matrix);
    }else{
      tmp.position.set(x,4.6*s+1.9,z);tmp.scale.set(s*1.18,s*.9,s*1.1);tmp.updateMatrix();broad.setMatrixAt(broadCount++,tmp.matrix);
    }
  });
  pines.count=pineCount;broad.count=broadCount;secondary.count=secondCount;
  for(const im of [trunks,pines,broad,secondary]){
    im.instanceMatrix.needsUpdate=true;
    im.castShadow=!mobile;im.receiveShadow=false;im.frustumCulled=false;
    root.add(im);
  }
  return {
    count:positions.length,
    update(time,enabled){if(enabled)windClock.value=time*.001;},
    dispose(){for(const im of [trunks,pines,broad,secondary])im.geometry.dispose();}
  };
}
