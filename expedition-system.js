/** Pure presentation helpers for the eight-company-division expedition. */
export const TOUR_STOP_SECONDS=5.7;
export const TOUR_FLY_SECONDS=2.9;
export const TOUR_HOLD_SECONDS=TOUR_STOP_SECONDS-TOUR_FLY_SECONDS;
export function getTourStops(divisions){
  return divisions.map((d,index)=>({id:d.id,name:d.name,short:d.short,index:index+1,x:d.x,z:d.z}));
}
export function getFastTravelPoints(divisions){
  return divisions.map((d,i)=>({
    id:d.id,name:d.name,index:i+1,marker:d.marker,color:d.color,
    // Project real Three.js island locations onto a compact north-oriented map.
    left:Math.max(8,Math.min(92,50+d.x/46*40)),
    top:Math.max(10,Math.min(90,50+d.z/32*39))
  }));
}
export function getPreviewReports(division,manifest,max=3){
  if(!division||!Array.isArray(manifest?.workspaces))return [];
  const linked=(division.workspaces||[])
    .map(id=>manifest.workspaces.find(w=>w.id===id)).filter(Boolean);
  const previews=[];
  // Round-robin makes the previews representative of all linked workspaces.
  let index=0;
  while(previews.length<max&&linked.some(w=>(w.sections||[]).length>index)){
    for(const workspace of linked){
      const section=(workspace.sections||[])[index];
      if(section&&previews.length<max){
        previews.push({
          workspaceId:workspace.id,workspaceName:workspace.name,
          reportId:section.id,reportName:section.name,
          route:'#'+workspace.id+':'+section.id,
          description:section.description||section.note||'Open the original fictional report',
          sampleMode:section.sample_mode||''
        });
      }
    }
    index++;
  }
  return previews;
}
export function normalizeTourIndex(index,length){
  if(!Number.isInteger(length)||length<=0)return 0;
  return ((Math.floor(index)%length)+length)%length;
}
