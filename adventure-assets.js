/**
 * Adventure Journey wayfinding kit — original lightweight Three.js geometry.
 * Eight expedition outposts make the company divisions read like destinations,
 * not a dashboard. No model downloads, accounts or copyrighted asset packs.
 */
export function createAdventureAssets(THREE,world,districts,{lowQuality=false}={}){
  const root=new THREE.Group();
  root.name='Maddie Adventure Journey — eight expedition outposts';
  world.add(root);
  const enabled=!lowQuality;
  const ink=new THREE.MeshStandardMaterial({color:'#34545c',roughness:.73,flatShading:true});
  const timber=new THREE.MeshStandardMaterial({color:'#a7825c',roughness:.95,flatShading:true});
  const sand=new THREE.MeshStandardMaterial({color:'#f1deba',roughness:.9,flatShading:true});
  const white=new THREE.MeshStandardMaterial({color:'#faf6e8',roughness:.67,flatShading:true});
  const bronze=new THREE.MeshStandardMaterial({color:'#c29b63',roughness:.38,metalness:.2});
  const flagGeometry=new THREE.PlaneGeometry(2.9,1.42,6,3);
  const animated=[];
  const boxes=[];
  function make(geometry,mat,parent,x=0,y=0,z=0){
    const o=new THREE.Mesh(geometry,mat);o.position.set(x,y,z);
    o.castShadow=!lowQuality;o.receiveShadow=true;parent.add(o);boxes.push(o);return o;
  }
  const poleShape=new THREE.CylinderGeometry(.095,.15,5.1,7);
  const capShape=new THREE.ConeGeometry(.29,.64,6);
  const panelShape=new THREE.BoxGeometry(2.55,.77,.19);
  const ringShape=new THREE.TorusGeometry(1.45,.08,5,32);
  const signGeometry=new THREE.PlaneGeometry(2.3,.64);
  function plaque(text,color){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=154;
    const g=canvas.getContext('2d');if(!g)return null;
    g.fillStyle='#315b60';g.fillRect(0,0,512,154);
    g.fillStyle=color;g.fillRect(16,16,86,6);
    g.fillStyle='#fff8df';g.textAlign='center';g.font='800 54px sans-serif';
    g.fillText(text,256,95,475);
    g.font='700 19px sans-serif';g.letterSpacing='2px';g.fillStyle='#d6decf';
    g.fillText('EXPEDITION OUTPOST',256,129);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide});
    return {texture,mat};
  }
  const resources=[];
  for(const d of districts){
    const group=new THREE.Group();
    group.name='Waypoint '+d.marker+': '+d.name;
    group.position.set(d.x+5.3,2.36,d.z+3.55);
    root.add(group);
    const color=new THREE.Color(d.color);
    const tint=new THREE.MeshStandardMaterial({color:color,roughness:.71,flatShading:true,side:THREE.DoubleSide});
    // A hand-built directional sign and tiny compass medallion.
    make(poleShape,timber,group,0,2.55,0);
    make(capShape,bronze,group,0,5.35,0);
    make(panelShape,ink,group,1.21,2.55,.15);
    make(new THREE.BoxGeometry(2.69,.095,.24),bronze,group,1.22,2.98,.15);
    const label=plaque('STOP '+d.marker,d.color);
    if(label){
      resources.push(label);
      const plane=make(signGeometry,label.mat,group,1.21,2.54,.27);
      plane.castShadow=false;
    }
    // A polygonal pennant with a raised staff and stitched edge.
    const flag=make(flagGeometry,tint,group,1.56,4.42,.1);
    flag.rotation.y=-.08;
    const thread=make(new THREE.BoxGeometry(2.88,.045,.07),white,group,1.56,3.73,.12);
    thread.castShadow=false;
    // Location marker on the ground: readable without blocking 3D campus.
    const waypoint=make(ringShape,bronze,group,.1,.10,.2);
    waypoint.rotation.x=-Math.PI/2;waypoint.castShadow=false;
    const inner=make(new THREE.CylinderGeometry(.42,.50,.12,12),tint,group,.1,.05,.2);
    const pin=make(new THREE.OctahedronGeometry(.37),white,group,.1,.64,.2);
    const dot=make(new THREE.SphereGeometry(.18,8,6),bronze,group,0,5.83,0);
    dot.castShadow=false;
    if(enabled){
      // Two tiny travel stones and a rolled map near the signpost.
      for(let i=0;i<2;i++){
        const rock=make(new THREE.DodecahedronGeometry(.38+i*.16,0),sand,group,1.6+i*.6,.23,-1.1+i*.65);
        rock.rotation.y=i*1.15;rock.scale.y=.6;
      }
      const scroll=make(new THREE.CylinderGeometry(.17,.17,.95,8),white,group,-.78,.40,-.92);
      scroll.rotation.z=Math.PI/2;
      make(new THREE.BoxGeometry(.12,.39,.4),bronze,group,-.78,.44,-.92);
    }
    animated.push({flag,pin,waypoint,group,phase:Number(d.marker)*1.8,id:d.id,base:color});
  }
  const draw=new THREE.Group();draw.name='Explorer field kit';
  draw.position.set(-23.5,2.1,11.5);root.add(draw);
  // Map board / folded compass case decorating the HR gateway.
  make(new THREE.BoxGeometry(2.6,.22,1.8),timber,draw,0,.8,0);
  make(new THREE.BoxGeometry(2.3,.04,1.5),white,draw,0,.95,0);
  const compass=make(new THREE.CylinderGeometry(.51,.51,.075,18),bronze,draw,.55,1.02,-.15);
  compass.castShadow=false;
  const direction=make(new THREE.ConeGeometry(.18,.58,3),ink,draw,.55,1.12,-.15);
  direction.rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){
    const strip=make(new THREE.BoxGeometry(1.15,.04,.055),i%2?bronze:ink,draw,-.56,1.03,-.4+i*.34);
    strip.rotation.y=-.2;
  }
  let active=null;
  function setActive(id){active=id||null;}
  function update(t,motionEnabled){
    if(!motionEnabled)return;
    const seconds=t*.001;
    for(const a of animated){
      const highlight=active===a.id;
      a.flag.rotation.y=-.08+Math.sin(seconds*1.23+a.phase)*.07;
      a.flag.rotation.z=Math.cos(seconds*.87+a.phase)*.027;
      a.pin.position.y=.64+Math.sin(seconds*1.2+a.phase)*.13;
      a.waypoint.scale.setScalar(highlight?1.10+Math.sin(seconds*1.8)*.05:1);
    }
  }
  function dispose(){
    for(const r of resources){r.texture.dispose();r.mat.dispose();}
    flagGeometry.dispose();poleShape.dispose();capShape.dispose();panelShape.dispose();ringShape.dispose();signGeometry.dispose();
  }
  return {update,setActive,dispose,outpostCount:animated.length};
}
