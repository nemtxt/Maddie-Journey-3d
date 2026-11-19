/**
 * Dream Factory-informed environment detailing for Maddie Journey.
 *
 * All meshes, textures and motion are original procedural work. Inspiration:
 * whimsical floating geological island, graceful aerial props, visible water,
 * sustainability objects and curious little discovery landmarks.
 *
 * No models, textures or sounds are copied from HKDI or another website.
 * Mobile / software GL gets smaller asset counts and simpler rendering.
 */
export function buildStoryEnvironment(THREE,world,{districts=[],route=null,lowQuality=false}={}){
  const scenery=new THREE.Group();
  scenery.name='Maddie World - original scenic details';
  world.add(scenery);
  const interactiveMotion=[];
  const cream=new THREE.MeshStandardMaterial({color:'#f6f2e7',roughness:.68,metalness:.035,flatShading:true});
  const brass=new THREE.MeshStandardMaterial({color:'#e7b768',roughness:.28,metalness:.44});
  const rust=new THREE.MeshStandardMaterial({color:'#d98768',roughness:.63});
  const teal=new THREE.MeshStandardMaterial({color:'#67b4ad',roughness:.45});
  const dark=new THREE.MeshStandardMaterial({color:'#315965',roughness:.63});
  const blueGlass=new THREE.MeshPhysicalMaterial({color:'#6ca6bd',roughness:.12,metalness:.21,clearcoat:.8});
  const white=new THREE.MeshStandardMaterial({color:'#fffaf1',roughness:.55});
  const lavender=new THREE.MeshStandardMaterial({color:'#a794c8',roughness:.6});
  const amberGlow=new THREE.MeshBasicMaterial({color:'#fff2ba'});
  function mesh(geom,material,parent=scenery,cast=true){
    const object=new THREE.Mesh(geom,material);object.castShadow=!lowQuality&&cast;object.receiveShadow=!lowQuality;
    parent.add(object);return object;
  }
  const box=(w,h,d,x,y,z,material,parent=scenery)=>{
    const o=mesh(new THREE.BoxGeometry(w,h,d),material,parent);o.position.set(x,y,z);return o;
  };
  const cylinder=(rTop,rBottom,height,x,y,z,material,parent=scenery,n=8)=>{
    const o=mesh(new THREE.CylinderGeometry(rTop,rBottom,height,n),material,parent);o.position.set(x,y,z);return o;
  };
  const ico=(radius,x,y,z,material,parent=scenery,detail=0)=>{
    const o=mesh(new THREE.IcosahedronGeometry(radius,detail),material,parent);o.position.set(x,y,z);return o;
  };
  const path=(points,radius,material,parent=scenery)=>{
    const curve=new THREE.CatmullRomCurve3(points.map(([x,y,z])=>new THREE.Vector3(x,y,z)));
    return mesh(new THREE.TubeGeometry(curve,Math.max(18,points.length*10),radius,6,false),material,parent,false);
  };

  // 1. Geological cutaway -- irregular layered mantle with an exposed rock core,
  // a signature readable feature of high-quality whimsical floating islands.
  const radialSegments=36;
  const layerLevels=[
    {y: .05, rx:52.45, rz:36.7, tint:'#88a08b'},
    {y:-4.75,rx:48.4,rz:34.25,tint:'#94846f'},
    {y:-12.8,rx:40.25,rz:28.55,tint:'#837467'},
    {y:-20.4,rx:22.85,rz:17.2,tint:'#74726e'},
    {y:-26.85,rx:10.4,rz:7.8,tint:'#62686d'}
  ];
  let bedrockCount=0;
  for(let layer=0;layer<layerLevels.length-1;layer++){
    const top=layerLevels[layer],bottom=layerLevels[layer+1];
    const pos=[],colors=[],indices=[];
    const topC=new THREE.Color(top.tint),bottomC=new THREE.Color(bottom.tint);
    for(let k=0;k<=radialSegments;k++){
      const a=k/radialSegments*Math.PI*2;
      const ridge=1+.026*Math.sin(a*7.3+.7)+.035*Math.sin(a*13.7+layer*.91);
      for(const [lev,idx] of [[top,0],[bottom,1]]){
        const wobble=ridge*(1+.015*Math.sin(a*10+layer*1.8+idx));
        const variation=.18*Math.sin(a*6+layer*1.7);
        pos.push(Math.cos(a)*lev.rx*wobble,lev.y+variation,Math.sin(a)*lev.rz*wobble);
        const color=(idx?bottomC:topC).clone();
        color.multiplyScalar(.86+.09*Math.sin(a*8+layer*1.1)+.065*Math.cos(a*13));
        colors.push(color.r,color.g,color.b);
      }
    }
    for(let i=0;i<radialSegments;i++){
      const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const rock=mesh(geometry,new THREE.MeshStandardMaterial({
      vertexColors:true,roughness:.96,flatShading:true,side:THREE.DoubleSide
    }),scenery,false);
    rock.receiveShadow=true;
    rock.name='Layered exposed island geology '+layer;
    bedrockCount++;
  }
  // Localized fractured limestone chunks read as geological depth, not a clean cone.
  const rocks=lowQuality?21:51;
  const pebbleGeom=new THREE.DodecahedronGeometry(.94,0);
  const pebbleMat=new THREE.MeshStandardMaterial({color:'#88877a',flatShading:true,roughness:.95});
  const fragments=new THREE.InstancedMesh(pebbleGeom,pebbleMat,rocks);
  const dummy=new THREE.Object3D();
  for(let i=0;i<rocks;i++){
    const a=i*2.39996,depth=.5+(i%4)*.14;
    const t=i%3===0?-.25:i%3===1?-.5:-.73;
    const r=t>-.4?48:t>-.6?34:19;
    dummy.position.set(Math.cos(a)*r*(.96+.1*depth),t*26,Math.sin(a)*r*.70*(.96+.1*depth));
    const scale=.6+((i*7)%9)*.14;
    dummy.scale.set(scale*1.25,scale*.65,scale*.95);
    dummy.rotation.set(i*.16,i*.73,i*.31);dummy.updateMatrix();
    fragments.setMatrixAt(i,dummy.matrix);
  }
  fragments.instanceMatrix.needsUpdate=true;
  fragments.castShadow=!lowQuality;fragments.receiveShadow=!lowQuality;
  scenery.add(fragments);

  // 2. An additional river-to-edge fall: flowing water leaves the island and
  // pours into the open sky, with waving ribbons and a little foam plume.
  const riverMat=new THREE.MeshPhysicalMaterial({
    color:'#75d8e1',transparent:true,opacity:.87,roughness:.14,
    metalness:.04,clearcoat:.85,side:THREE.DoubleSide
  });
  path([[23,2.15,14],[30,2.2,17.2],[36,2.2,20.5],[39.8,2.05,23.4]],1.45,riverMat);
  const waterfallVertex=`
    uniform float uTime;
    varying vec2 vUv;
    void main(){
      vUv=uv;
      vec3 p=position;
      p.x+=sin(uv.y*22.0+uTime*1.9+uv.x*7.0)*.17+
           sin(uv.y*42.0-uTime*2.5)*.08;
      p.z+=sin(uv.y*15.0+uTime*1.35+uv.x*9.0)*.12;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    }`;
  const waterfallFragment=`
    precision mediump float;
    uniform float uTime;
    varying vec2 vUv;
    void main(){
      float stripes=sin(vUv.x*62.0+sin(vUv.y*18.0-uTime*2.1)*2.1)*.5+.5;
      float flecks=sin(vUv.y*105.0+uTime*5.5+vUv.x*12.0)*.5+.5;
      float edge=smoothstep(.0,.11,vUv.x)*(1.0-smoothstep(.87,1.0,vUv.x));
      vec3 turquoise=vec3(.24,.71,.79);
      vec3 pearl=vec3(.85,.99,.99);
      vec3 col=mix(turquoise,pearl,.26+.37*stripes+.16*flecks);
      float fade=smoothstep(.0,.17,vUv.y);
      gl_FragColor=vec4(col,(.45+.27*stripes)*edge*(.35+.65*fade));
    }`;
  const waterfallMat=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},
    vertexShader:waterfallVertex,fragmentShader:waterfallFragment,
    transparent:true,depthWrite:false,side:THREE.DoubleSide
  });
  const curtains=[];
  for(let i=0;i<(lowQuality?2:4);i++){
    const fall=mesh(new THREE.PlaneGeometry(5.35-i*.65,31,13,43),waterfallMat,scenery,false);
    fall.position.set(39.6+(i-1.5)*.2,-13.3,23.6+(i-1.5)*.25);
    fall.rotation.y=-.55+i*.08;
    curtains.push(fall);
  }
  const sprayMat=new THREE.MeshBasicMaterial({color:'#dcf9f4',transparent:true,opacity:.25,depthWrite:false});
  const spray=[];
  for(let i=0;i<(lowQuality?7:16);i++){
    const piece=ico(.43+(i%5)*.09,39.7+Math.sin(i*2.1)*2.5,-22-i%4*1.3,24.0+(i%3)*.7,sprayMat,scenery,1);
    piece.scale.set(1.2,.65,1);piece.castShadow=false;
    spray.push({obj:piece,phase:i*.73});
  }

  // 3. Renewable-energy motifs: a quietly rotating turbine and a genuine
  // architectural solar array at the IT district (symbolic, not live metrics).
  const turbine=new THREE.Group();
  turbine.name='Revenue outlook wind turbine';
  turbine.position.set(-42,2.25,-7.0);scenery.add(turbine);
  cylinder(.19,.36,8.8,0,4.4,0,cream,turbine,12);
  const nacelle=box(1.35,.52,.7,0,9.0,.21,white,turbine);
  const spinner=new THREE.Group();spinner.position.set(0,9,.63);turbine.add(spinner);
  const hub=ico(.34,0,0,0,brass,spinner);
  for(let blade=0;blade<3;blade++){
    const bladeGroup=new THREE.Group();
    bladeGroup.rotation.z=blade*Math.PI*2/3;
    spinner.add(bladeGroup);
    const material=blade%2===0?white:cream;
    const wing=mesh(new THREE.ConeGeometry(.51,4.2,3),material,bladeGroup);
    wing.position.set(0,2.25,.06);
  }
  const solarGroup=new THREE.Group();solarGroup.name='IT sustainable data campus';solarGroup.position.set(37.3,2.2,-15);scenery.add(solarGroup);
  const silicon=new THREE.MeshStandardMaterial({color:'#23596a',metalness:.38,roughness:.2});
  const grid=new THREE.MeshBasicMaterial({color:'#91d3d3'});
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){
    const frame=new THREE.Group();frame.position.set((i-0.5)*3.1,.85,(j-.5)*3.15);frame.rotation.x=-.34;
    solarGroup.add(frame);
    box(2.8,.13,2.25,0,0,0,dark,frame);
    box(2.6,.045,2.05,0,.085,0,silicon,frame);
    for(let l=0;l<4;l++)box(.035,.025,2.0,-1.05+l*.7,.117,0,grid,frame);
    for(let l=0;l<3;l++)box(2.55,.025,.035,0,.12,-.69+l*.69,grid,frame);
    cylinder(.06,.09,1.3,(i-0.5)*3.1,.15,(j-.5)*3.15,cream,solarGroup,6);
  }

  // 4. Curious little devices: a future-looking telescope at the Media overlook,
  // curved sculptural color ribbons near Design, and elevated wayfinding lights.
  const telescope=new THREE.Group();telescope.name='Media horizon telescope';telescope.position.set(38,2.3,15);scenery.add(telescope);
  cylinder(.73,.9,.36,0,.25,0,dark,telescope,12);
  cylinder(.13,.20,3.8,0,2.05,0,cream,telescope,9);
  const scope=new THREE.Group();scope.position.set(0,4.05,0);scope.rotation.z=.85;telescope.add(scope);
  const tube=cylinder(.81,.9,5.0,0,.45,0,cream,scope,15);
  cylinder(.88,.92,.3,0,2.95,0,brass,scope,15);
  const lens=cylinder(.64,.64,.055,0,3.14,0,blueGlass,scope,15);
  cylinder(.58,.66,.24,0,-2.12,0,dark,scope,15);
  const bands=[
    {color:rust,x:-17.5,z:15.5,height:5},
    {color:lavender,x:-15.2,z:14.9,height:7},
    {color:teal,x:-12.7,z:14.0,height:5.8}
  ];
  for(const item of bands){
    path([[item.x-2,2.15,item.z],[item.x-1,3,item.z],
      [item.x,2+item.height,item.z],[item.x+1.4,3,item.z],[item.x+2,2.2,item.z]],
      .22,item.color);
  }
  // Small solar lanterns trace the existing route at night or during focused
  // exploration. No invented KPI values appear in the environmental props.
  if(route){
    const markers=lowQuality?10:22;
    for(let i=1;i<=markers;i++){
      const p=route.getPointAt(i/(markers+1));
      const post=cylinder(.065,.085,1.5,p.x,2.78,p.z,cream,scenery,6);
      const bulb=ico(.23,p.x,3.67,p.z,amberGlow,scenery,1);
      bulb.castShadow=false;
    }
  }

  // 5. A handful of aerial props create depth and the exploratory character
  // of the reference. They do not obscure the original eight division markers.
  const floaters=[];
  function addSkyBalloon(x,y,z,scale,color){
    const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);
    scenery.add(g);
    const balloon=ico(2.4,0,2.75,0,color,g,2);
    balloon.scale.set(.95,1.23,.95);
    const cap=ico(.76,0,.1,0,cream,g,1);cap.scale.y=.45;
    box(1.2,.9,1.2,0,-2.15,0,brass,g);
    for(const dx of [-.45,.45])for(const dz of [-.45,.45]){
      const rope=cylinder(.035,.035,2.5,dx,-.55,dz,cream,g,5);
    }
    floaters.push({group:g,originY:y,phase:x*.2+z*.1,speed:.32+scale*.12});
  }
  addSkyBalloon(-50,37,21,.9,rust);
  if(!lowQuality)addSkyBalloon(49,43,-33,.75,lavender);
  // A soft cloud sculpture, a new independent design rather than HKDI's mascot.
  if(!lowQuality){
    const cloud=new THREE.Group();cloud.position.set(5,48,-38);scenery.add(cloud);
    const puffMat=new THREE.MeshStandardMaterial({color:'#effaff',roughness:.89,transparent:true,opacity:.88});
    for(let i=0;i<5;i++){
      const puff=ico(3.5+i%2*.55,(i-2)*3.6,Math.sin(i)*1.3,0,puffMat,cloud,1);
      puff.scale.set(1.2,.7,.9);
    }
    const orbit=mesh(new THREE.TorusGeometry(7,.13,5,46),brass,cloud,false);
    orbit.rotation.y=.42;orbit.rotation.x=.27;
    floaters.push({group:cloud,originY:48,phase:2.3,speed:.12});
  }

  let frame=0;
  function update(time,enabled){
    if(!enabled)return;
    const t=time*.001;
    waterfallMat.uniforms.uTime.value=t;
    spinner.rotation.z=t*.51;
    for(const {obj,phase} of spray){
      obj.position.y=-22+((t*.9+phase)%1)*-7.5;
      obj.position.x=39.7+Math.sin(t+phase)*2.3;
      obj.material.opacity=.18+.10*Math.sin(t+phase);
    }
    for(const item of floaters){
      item.group.position.y=item.originY+Math.sin(t*item.speed+item.phase)*1.3;
      item.group.rotation.y=Math.sin(t*.1+item.phase)*.09;
    }
  }
  return {
    update,
    counts:{geologicalLayers:bedrockCount,rockFragments:rocks,waterfallCurtains:curtains.length,balloons:lowQuality?1:2},
    dispose(){
      // Existing world owner disposes the renderer; standalone subsystem assets
      // are retained for the lifetime of the scene to avoid premature deletion.
    }
  };
}
