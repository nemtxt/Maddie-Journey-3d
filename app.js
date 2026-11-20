import {DIVISIONS,divisionForWorkspace} from './divisions.js?v=1.3.0';
import {createSoundscape} from './soundscape.js?v=1.4.0';
import {getTourStops,getFastTravelPoints,getPreviewReports} from './expedition-system.js?v=1.7.0';
const sound=createSoundscape();
const DISTRICTS=DIVISIONS;
const ORIGINAL='https://nemtxt.github.io/Maddie-Journey-Prototype/';
const MILESTONES=[
 {name:'Recruitment',place:'Growth Harbour',id:'business',route:'talent:pipeline',note:'Recruitment pipeline and workforce planning'},
 {name:'Onboarding',place:'People & Culture Hub',id:'hr',route:'journey:onboarding',note:'Hiring, orientation and probation'},
 {name:'Integration',place:'Convention Grounds',id:'gencon',route:'journey:belonging',note:'Culture, belonging and connection'},
 {name:'Performance',place:'Revenue Outlook',id:'revenue',route:'journey:report-cards',note:'Performance, attendance and evaluation'},
 {name:'Development',place:'Creative Atelier',id:'design',route:'learning:competency',note:'Training and competency growth'},
 {name:'Career Heights',place:'Growth Harbour',id:'business',route:'journey:level-gates',note:'Career direction and progression'},
 {name:'Transition',place:'Operations Campus',id:'corporate',route:'journey:employee-movement',note:'Movements and employment transitions'}
];
const $=id=>document.getElementById(id),safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let employees=[];
let divisionSummaries=[];
let manifest={workspaces:[]},world=null,force2D=false,motionEnabled=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let peopleSearch='',peopleDivision='all',lastSearchQuery='',currentView='world',selectedDistrict=null;
let introDone=Boolean(window.MADDIE_INTRO?.dismissed),introRunning=false,introTween=null,introFrame=0,sceneReady=false;
let tourActive=false,tourPaused=false,previewDismissed=false;
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const showIntroOnEntry=()=>!location.hash||['#overview','#world'].includes(location.hash);
function finishIntro({focus=true}={}){
 if(introDone)return;
 introDone=true;introRunning=false;
 document.body.classList.remove('intro-loaded','expedition-launching');
 if(introTween){introTween.kill();introTween=null;}
 if(introFrame){cancelAnimationFrame(introFrame);introFrame=0;}
 const reveal=['.world-hud','.hero-copy','.division-dock','.landmark-labels','.scene-tools','.fallback-button'];
 const gsap=window.gsap,allowMotion=motionEnabled&&!reduceMotion();
 if(gsap&&allowMotion)gsap.set(reveal,{opacity:0});
 document.body.classList.remove('intro-active');
 $('sky-intro').hidden=true;
 world?.endIntro();
 if(sceneReady&&!world&&!force2D)fallback2D();
 if(gsap&&allowMotion)gsap.to(reveal,{opacity:1,duration:.85,stagger:.09,ease:'power2.out',clearProps:'opacity'});
 window.MADDIE_INTRO?.complete?.();
 if(focus&&currentView==='world')$('hud-divisions').focus({preventScroll:true});
}
function startIntro(){
 if(introDone||introRunning)return;
 introRunning=true;document.body.classList.remove('intro-loaded');document.body.classList.add('expedition-launching');
 $('intro-start').disabled=true;sound.reveal();
 $('intro-status').textContent='Following the adventure trail through the clouds…';
 if(!world||!motionEnabled||reduceMotion()){finishIntro();return;}
 const progress={value:0},gsap=window.gsap;
 if(gsap){
  introTween=gsap.timeline({onComplete:()=>finishIntro()});
  introTween.to('#intro-content',{opacity:0,y:-35,scale:.975,duration:1.05,ease:'power2.inOut'},.15)
   .to('#intro-bottom',{opacity:0,duration:.8},0)
   .to('#intro-atmosphere',{opacity:.08,scale:1.35,duration:4.4,ease:'power1.inOut'},.7)
   .to('#intro-sky-veil',{opacity:0,duration:3.1,ease:'power2.inOut'},1.0)
   .to('#intro-sunlight',{opacity:0,duration:3.1,ease:'power2.in'},1.25)
   .to(progress,{value:1,duration:5.3,ease:'power2.inOut',onUpdate:()=>world?.setIntroProgress(progress.value)},.25)
   .to('#sky-intro',{opacity:0,duration:1.1,ease:'power2.inOut'},4.45);
 }else{
  // Native camera animation fallback if the GSAP CDN is unavailable.
  $('intro-content').style.transition='opacity .65s, transform .65s';
  $('intro-content').style.opacity='0';$('intro-content').style.transform='translateY(-28px)';
  const started=performance.now(),duration=5400;
  function step(now){if(introDone)return;const t=Math.min(1,(now-started)/duration);
    const eased=t*t*(3-2*t);world?.setIntroProgress(eased);
    $('intro-atmosphere').style.opacity=String(1-eased);
    $('intro-sky-veil').style.opacity=String(1-eased);
    if(t<1)introFrame=requestAnimationFrame(step);else finishIntro();}
  introFrame=requestAnimationFrame(step);
 }
}
const srcLink=(wid,sid)=>ORIGINAL+'#'+wid+':'+sid;
const wspace=id=>manifest.workspaces.find(w=>w.id===id);
const fullRoute=(wid,sid)=>'#'+wid+':'+sid;
const initials=name=>String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const distinct=(items)=>Array.from(new Set(items));
const icons={
 people:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><path d="M2 20v-2a6 6 0 0112 0v2M17 6a3 3 0 010 6m0 3a5 5 0 015 5"/></svg>',
 pay:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M16 15h2"/></svg>',
 pulse:'<svg viewBox="0 0 24 24"><path d="M2 12h5l3-7 4 14 3-7h5"/></svg>',
 journey:'<svg viewBox="0 0 24 24"><path d="m2 19 7-11 5 6 4-9 4 14H2z"/></svg>',
 learning:'<svg viewBox="0 0 24 24"><path d="m2 8 10-5 10 5-10 5-10-5zm4 3v6c4 3 8 3 12 0v-6"/></svg>',
 culture:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20a6 6 0 0112 0m-3 0a6 6 0 0111 0"/></svg>',
 talent:'<svg viewBox="0 0 24 24"><path d="M5 21V3m0 1c4-3 8 3 14 0v11c-6 3-10-3-14 0"/></svg>',
 governance:'<svg viewBox="0 0 24 24"><path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4zm-4 10 3 3 5-5"/></svg>',
 scoreboard:'<svg viewBox="0 0 24 24"><path d="M4 21V12m5 9V7m5 14V3m5 18v-8"/></svg>'
};
const divisionIcons={hr:icons.people,revenue:icons.pay,design:icons.learning,corporate:icons.pulse,media:icons.culture,it:icons.scoreboard,gencon:icons.talent,business:icons.journey};
const sourceStatus=section=>section?.sample_mode==='generated example'?'Generated fictional example':'Original fictional fixture';
function reportTotal(){return manifest.workspaces.reduce((a,w)=>a+w.sections.length,0);}
function routeTo(hash){
 const route=decodeURIComponent((hash||location.hash||'#overview').replace(/^#/,''));const [base,section]=route.split(':');
 if(!base||base==='overview'||base==='world'){
  showView('world');
  if(section){const d=DISTRICTS.find(d=>d.id===section)||((wspace(section))?divisionForWorkspace(section):null);if(d)selectDistrict(d.id,{fromRoute:true});}
  else if(!section)clearDistrict();
 }else if(base==='dashboard'){showView('dashboard');renderDashboard();}
 else if(base==='people'&&!section){showView('people');renderPeople();}
 else if(base==='journey'&&!section){showView('journey');renderJourney();}
 else if(base==='employee-journey'&&section){showView('employee-journey');renderEmployeeJourney(section);}
 else if(wspace(base)&&section){showView('report');renderReport(base,section);}
 else if(wspace(base)){showView('workspace');renderWorkspace(base);}
 else{location.hash='#overview';}
}
function showView(view){
 currentView=view;const inWorld=view==='world';document.body.classList.toggle('view-world',inWorld);sound.setWorld(inWorld);if(!inWorld){closeDivisionMenu();closeFastMap();hideReportPreview();}$('world-stage').hidden=!inWorld;$('world-stage').style.display=inWorld?'':'none';
 $('content-area').hidden=inWorld;$('content-area').style.display=inWorld?'none':'block';
 // Fullscreen world removes the traditional navigation tabs; dashboards retain their own back controls.
 if(!inWorld)world?.stopTour();
}
function setDetails(open){
 const on=Boolean(open&&selectedDistrict);
 document.body.classList.toggle('details-open',on);
 $('division-details').setAttribute('aria-expanded',String(on));
 $('focus-panel').setAttribute('aria-hidden',String(!on));
 $('focus-panel').hidden=!on;
 if(on)$('panel-dismiss').focus({preventScroll:true});
}
function closeDivisionMenu(){
 $('division-menu').hidden=true;$('hud-divisions').setAttribute('aria-expanded','false');
}
function openDivisionMenu(){
 $('division-menu').hidden=false;$('hud-divisions').setAttribute('aria-expanded','true');
}
function clearDistrict(){
 selectedDistrict=null;document.body.classList.remove('has-division-selection');setDetails(false);
 $('division-headline').hidden=true;
 hideReportPreview();
 world?.reset();
 $('panel-kicker').textContent='DIVISION GUIDE / 01—08';
 $('panel-content').innerHTML='<div class="panel-feature-icon">✳</div><h2>Discover eight division districts.</h2><p>Select a landmark to see its evaluator team, environmental identity and linked monitoring workspaces.</p><div class="guide-divider"></div><p class="small-note">The original nine monitoring workspaces and all fictional reports remain intact.</p>';
 paintStrip();
}
function selectDistrict(id,{fromTour=false,fromRoute=false,fromWorld=false}={}){
 const d=DISTRICTS.find(x=>x.id===id);if(!d)return;
 const previous=selectedDistrict;
 selectedDistrict=d.id;
 document.body.classList.add('has-division-selection');
 setDetails(false);
 const headline=$('division-headline');
 headline.hidden=false;
 headline.classList.toggle('is-long',d.name.length>21);
 headline.style.setProperty('--division-glow',d.color);
 if(previous!==d.id){headline.style.animation='none';void headline.offsetWidth;headline.style.animation='';}
 $('division-number').textContent=d.marker+' / 08';
 $('division-title').textContent=d.name;
 $('division-subtitle').textContent=d.short;
 $('division-summary').textContent=d.desc;
 $('panel-kicker').textContent='COMPANY DIVISION / '+d.marker+'—08';
 const names=d.evaluators.map(p=>'<div class="evaluator-person"><span class="evaluator-avatar" aria-hidden="true">'+safe(initials(p.name))+'</span><span><strong>'+safe(p.name)+'</strong><small>'+safe(p.role)+'</small></span></div>').join('');
 const related=d.workspaces.map(wspace).filter(Boolean);
 $('panel-content').innerHTML='<div class="panel-tag" style="background:'+safe(d.color)+'26;color:#345d64">DIVISION DESTINATION</div>'+
 '<h2>'+safe(d.name)+'</h2><p>'+safe(d.desc)+'</p>'+
 '<div class="panel-fine-label">ASSIGNED EVALUATOR'+(d.evaluators.length>1?'S':'')+' / USERS</div><div class="evaluator-list">'+names+'</div>'+
 '<div class="panel-fine-label">RELATED MONITORING WORKSPACES</div>'+
 '<div class="panel-section-list">'+related.map(w=>'<button type="button" data-workspace="'+safe(w.id)+'"><span>'+safe(w.name)+'</span><b>'+w.sections.length+' reports ↗</b></button>').join('')+'</div>'+
 '<button type="button" class="panel-cta" data-workspace="'+safe(related[0]?.id||'people')+'">Explore linked dashboards <span>↗</span></button>'+
 '<p class="panel-qualification">Division contact details are reference assignments, separate from the 51 fictional employee records.</p>';
 if(previous!==d.id)sound.select();
 if(!fromTour&&!fromWorld)world?.focus(id);
 closeDivisionMenu();
 paintStrip();
 showReportPreview(d);
 updateFastMapSelection();
 if(!fromRoute&&location.hash!=='#world:'+id)history.replaceState(null,'','#world:'+id);
}
function paintStrip(){
 document.querySelectorAll('.division-menu-item').forEach(b=>{
  b.setAttribute('aria-pressed',String(b.dataset.district===selectedDistrict));
 });
}
function worldSelected(id,flags){selectDistrict(id,{fromTour:Boolean(flags?.fromTour),fromWorld:Boolean(flags?.fromWorld)});}
function fallback2D(){
 force2D=true;const stage=$('world-stage');stage.classList.add('is-2d');$('world-fallback').hidden=false;$('world-mode').textContent='3D view';$('world-mode').setAttribute('aria-pressed','true');
 const positions=[[31,59],[25,71],[43,77],[56,78],[74,62],[74,75],[59,86],[38,84]];
 const labels=$('landmark-labels');if(!labels.children.length){
 DISTRICTS.forEach((d,i)=>{const b=document.createElement('button');b.className='world-label';b.innerHTML='<span class="label-dot"></span><span>'+safe(d.short)+'</span>';b.style.setProperty('--accent',d.color);b.addEventListener('click',()=>selectDistrict(d.id));labels.append(b);});
 }
 [...labels.children].forEach((b,i)=>{b.style.left=positions[i][0]+'%';b.style.top=positions[i][1]+'%';b.style.opacity='1';b.style.pointerEvents='auto';});
}
function toggleMode(){
 force2D=!force2D;const stage=$('world-stage');stage.classList.toggle('is-2d',force2D);$('world-fallback').hidden=!force2D;
 $('world-mode').textContent=force2D?'3D view':'2D view';$('world-mode').setAttribute('aria-pressed',String(force2D));
 if(force2D)fallback2D();
 else if(!world)fallback2D();else world.reset();
}
function fillSummary(root){
 $('stat-people').textContent=String(employees.length||manifest.people_count||'—');
 $('stat-districts').textContent=String(DISTRICTS.length).padStart(2,'0');
 $('stat-reports').textContent=String(reportTotal()).padStart(2,'0');
}
function renderDivisionMenu(){
 $('division-menu-list').innerHTML=DISTRICTS.map(d=>'<button type="button" class="division-menu-item" data-district="'+safe(d.id)+'" aria-pressed="false" style="--item-accent:'+safe(d.color)+'">'+
 '<span class="menu-number">'+safe(d.marker)+'</span><span class="menu-copy"><strong>'+safe(d.name)+'</strong><small>'+safe(d.short)+'</small></span></button>').join('');
}
function heading(title,desc){
 $('content-heading').textContent=title;$('content-subtitle').textContent=desc||'';$('content-area').scrollIntoView({behavior:motionEnabled?'smooth':'instant',block:'start'});
}
function dashboardMetrics(){

 return [
 ['Fictional people',employees.length,'Current active example roster'],
 ['Company divisions',DISTRICTS.length,'Distinct 3D world districts'],
 ['Report routes',reportTotal(),'From the original inventory'],
 ['Probationary',employees.filter(e=>e.status==='Probationary').length,'Derived from fictional records']
 ];
}
function metricCards(rows){return '<div class="info-grid">'+rows.map(([name,num,info])=>'<div class="metric-card"><span class="metric-label">'+safe(name)+'</span><strong>'+safe(num)+'</strong><small>'+safe(info)+'</small></div>').join('')+'</div>';}
function renderDashboard(){
 heading('World overview','Eight company divisions, nine monitoring workspaces and all 86 original fictional report routes.');
 const sourceGroups=divisionSummaries;
 $('content-body').innerHTML=metricCards(dashboardMetrics())+
 '<section class="surface-card" style="margin-top:17px"><h3>Explore the company divisions</h3>'+
 '<p class="card-description">Select a district to fly to its unique 3D campus. Evaluator assignments are provided contact references, not fictional employee roster entries.</p>'+
 '<div class="division-grid">'+DISTRICTS.map(d=>'<button class="division-tile" type="button" data-world="'+safe(d.id)+'" style="--division-accent:'+safe(d.color)+'">'+
 '<span class="division-tile-index">'+safe(d.marker)+'</span><strong>'+safe(d.name)+'</strong>'+
 '<span>'+safe(d.short)+'</span><small>'+safe(d.evaluators.map(e=>e.name).join(' · '))+'</small></button>').join('')+'</div></section>'+
 '<div class="dashboard-split"><section class="surface-card"><h3>All nine monitoring workspaces</h3>'+
 '<p class="card-description">Original routes and reports are unchanged. Workspaces are separate from the eight geographical division destinations.</p>'+
 '<div class="workspace-grid">'+manifest.workspaces.map(w=>'<button type="button" class="workspace-tile" data-workspace="'+safe(w.id)+'">'+
 '<span class="tile-bullet" style="--tile:'+safe((divisionForWorkspace(w.id)?.color)||'#79c9a5')+'"></span>'+
 '<span>'+safe(w.name)+'<small>'+w.sections.length+' reports ↗</small></span></button>').join('')+'</div></section>'+
 '<section class="surface-card"><h3>Fictional roster source groups</h3>'+
 '<p class="card-description">These eight sample-data group labels are not the same as the eight company districts. The original sample has not been remapped.</p>'+
 '<div class="table-scroll"><table class="data-table"><thead><tr><th>Source group</th><th>Fictional people</th></tr></thead><tbody>'+
 sourceGroups.map(d=>'<tr><td>'+safe(d[0])+'</td><td><strong>'+safe(d[1])+'</strong></td></tr>').join('')+'</tbody></table></div></section></div>';
}
function renderWorkspace(id){
 const w=wspace(id);if(!w)return;
 heading(w.name,'Explore '+w.sections.length+' original report routes in this preserved fictional monitoring workspace.');
 $('content-body').innerHTML='<section class="surface-card"><div class="district-heading"><div class="giant-number">'+String(manifest.workspaces.findIndex(x=>x.id===id)+1).padStart(2,'0')+'</div><div><h3 style="margin-bottom:6px">'+safe(w.name)+'</h3><p class="card-description" style="margin-bottom:0">'+'Read-only reporting workspace, independent of the eight geographical company divisions.'+'</p></div></div><p class="source-note">The routes and sample classifications below come from the unchanged original data manifest. Select a report to inspect its route or open its full existing fictional report.</p><div class="section-grid">'+
 w.sections.map((s,i)=>'<button type="button" class="section-tile" data-report="'+safe(id+':'+s.id)+'"><small>REPORT '+String(i+1).padStart(2,'0')+' / '+safe(sourceStatus(s))+'</small><b>'+safe(s.name)+' ↗</b></button>').join('')+
 '</div></section>';
}
function renderReport(id,sid){
 const w=wspace(id),s=w?.sections.find(x=>x.id===sid);if(!s){renderWorkspace(id);return;}
 heading(s.name,w.name+' / Original read-only fictional report route');
 const related=(id==='people'||id==='journey'||id==='pulse'||id==='scoreboard')?employees.slice(0,8):[];
 let details='';
 if(id==='people'&&sid==='masterlist')details=peopleTable(employees);
 else if(id==='people'||id==='journey'||id==='pulse')details='<section class="surface-card" style="margin-top:16px"><h3>Fictional employee snapshot</h3><p class="card-description">A quick read-only preview of the underlying sample roster. For full report-specific records, use the original report link.</p>'+peopleTable(related,true)+'</section>';
 $('content-body').innerHTML='<section class="surface-card"><div class="report-header"><div><span class="small-pill">'+safe(sourceStatus(s))+'</span><h3 style="margin-top:12px">'+safe(s.name)+'</h3></div><button class="subtle-btn" type="button" data-workspace="'+safe(id)+'">All '+safe(w.name)+' reports</button></div>'+
 '<p class="card-description">This report identifier is preserved exactly as <code>'+safe(id+':'+sid)+'</code>. The original demonstration remains the reference for its complete tables, charts, and detailed calculations.</p>'+
 '<div class="detail-actions"><a class="primary-btn" href="'+safe(srcLink(id,sid))+'" target="_blank" rel="noopener noreferrer">Open complete fictional report ↗</a><button class="soft-btn" type="button" data-world="'+safe(id)+'">See its world destination ↗</button></div></section>'+details+
 '<p class="source-note" style="margin-top:17px">V1 boundary: 3D navigation and read-only snapshot are operational; report-specific layouts beyond the People masterlist remain in the original fictional prototype. No missing source figures have been invented.</p>';
}
function filteredPeople(){
 const q=peopleSearch.trim().toLowerCase();return employees.filter(p=>(peopleDivision==='all'||p.dept===peopleDivision)&&(!q||[p.name,p.dept,p.role,p.status,p.id].join(' ').toLowerCase().includes(q)));
}
function peopleTable(list,short=false){
 return '<div class="table-scroll"><table class="data-table"><thead><tr><th>Employee</th><th>Division</th><th>Role</th><th>Status</th><th>201 files</th><th>Late / 30d</th></tr></thead><tbody>'+
 list.map(e=>'<tr><td><button type="button" class="row-name" data-employee="'+safe(e.k)+'">'+safe(e.name)+'</button></td><td>'+safe(e.dept)+'</td><td>'+safe(e.role)+'</td><td><span class="status-label '+(e.status==='Probationary'?'probationary':e.status==='Part-Time'?'part-time':'')+'">'+safe(e.status)+'</span></td><td>'+safe(e.f??'—')+'%</td><td>'+safe(e.l30??'—')+'</td></tr>').join('')+
 '</tbody></table></div>';
}
function renderPeople(){
 heading('The people behind the world','A searchable, read-only directory of the unchanged 51 fictional employee profiles.');
 const divisions=distinct(employees.map(e=>e.dept)).sort();
 $('content-body').innerHTML=metricCards([
 ['Active fictional employees',employees.length,'Exact demonstration roster'],
 ['Regular',employees.filter(x=>x.status==='Regular').length,'From source fixture'],
 ['Probationary',employees.filter(x=>x.status==='Probationary').length,'From source fixture'],
 ['Part-time',employees.filter(x=>x.status==='Part-Time').length,'From source fixture']
 ])+'<section class="surface-card" style="margin-top:17px"><h3>Employee directory</h3>'+
 '<div class="filter-row"><label for="people-filter" class="visually-hidden">Search employees</label><input type="search" id="people-filter" placeholder="Search name, position, ID or division…" value="'+safe(peopleSearch)+'">'+
 '<label for="division-filter" class="visually-hidden">Filter division</label><select id="division-filter"><option value="all">All divisions</option>'+divisions.map(d=>'<option value="'+safe(d)+'" '+(peopleDivision===d?'selected':'')+'>'+safe(d)+'</option>').join('')+'</select><span class="count-label" id="people-count"></span></div><div id="people-table"></div></section>';
 $('people-filter').addEventListener('input',e=>{peopleSearch=e.target.value;updatePeopleTable();});
 $('division-filter').addEventListener('change',e=>{peopleDivision=e.target.value;updatePeopleTable();});updatePeopleTable();
}
function updatePeopleTable(){
 const filtered=filteredPeople();$('people-count').textContent=filtered.length+' of '+employees.length+' people';
 $('people-table').innerHTML=filtered.length?peopleTable(filtered):'<div class="empty-state">No fictional profiles match your search. Clear the filters to see all employees.</div>';
}
function renderJourney(){
 heading('One world. Many journeys.','Seven visual chapters connect the existing Maddie Journey stages without replacing their nine report categories.');
 $('content-body').innerHTML='<section class="surface-card"><span class="small-pill">INTERACTIVE JOURNEY ROUTE</span><h3 style="margin-top:14px">Every milestone matters.</h3><p class="card-description">Select a stage to visit its 3D landscape, or open the existing detailed fictional report. These chapters are a visual navigation metaphor—not calculated career progression for any individual.</p><div class="journey-steps">'+
 MILESTONES.map((s,i)=>'<button type="button" class="journey-step" data-world="'+s.id+'"><span class="milestone-index">'+String(i+1).padStart(2,'0')+'</span><strong>'+safe(s.name)+'</strong><small>'+safe(s.place)+' ↗</small></button>').join('')+'</div><div class="section-grid">'+
 MILESTONES.map(s=>'<button type="button" class="section-tile" data-report="'+safe(s.route)+'"><small>'+safe(s.name)+'</small><b>'+safe(s.note)+' ↗</b></button>').join('')+'</div></section>';
}
function employeeModal(key){
 const e=employees.find(x=>x.k===key);if(!e)return;
 const fields=[
 ['Division',e.dept],['Position',e.role],['Employment status',e.status],['Start date',e.hire||'Not provided'],
 ['Regularization',e.reg||'Not provided'],['201 completion',e.f==null?'Unavailable':e.f+'%'],
 ['Documents on file',e.onFile==null?'Unavailable':e.onFile+' of '+e.tracked],['Late / 30 days',e.l30??'Unavailable'],['Late / 90 days',e.l90??'Unavailable'],
 ['Leave / 90 days',e.leave90??'Unavailable'],['Employee ID',e.id||'Not supplied'],['Journey status',e.stage||'Not provided']
 ];
 $('employee-details').innerHTML='<div class="profile-head"><div class="profile-avatar">'+safe(initials(e.name))+'</div><div><h2 id="employee-title">'+safe(e.name)+'</h2><p>'+safe(e.role)+' · '+safe(e.dept)+'</p></div></div><div class="profile-grid">'+
 fields.map(([label,value])=>'<div class="profile-field"><small>'+safe(label)+'</small><strong>'+safe(value)+'</strong></div>').join('')+
 '</div><div class="detail-actions"><button type="button" class="primary-btn" data-employee-journey="'+safe(e.k)+'">Explore individual journey ↗</button></div><p class="profile-notice">This is a fictional sample employee record from the original Maddie Journey demo. Personal records here are not live. All values are read-only.</p>';
 $('employee-dialog').showModal();
}
function renderEmployeeJourney(key){
 const e=employees.find(x=>x.k===key);
 if(!e){heading('Journey not found','This fictional record is not in the current snapshot.');$('content-body').innerHTML='<p class="source-note">Select an employee from the People Directory.</p>';return;}
 heading(e.name+'’s journey','A source-grounded visual trail through existing fictional employment records. Not all life-cycle stages have sample data.');
 const moments=[
 {place:'Talent Gateway',title:'Joining the team',value:e.hire||'Not recorded',note:'Start date from the original employee masterlist',present:!!e.hire},
 {place:'People Base Camp',title:'Employment status',value:e.status||'Not recorded',note:'Employment classification in the current fictional roster',present:!!e.status},
 {place:'Community Village',title:'Culture & belonging',value:'No individual record',note:'This personal milestone is not included in the display-only fixture',present:false},
 {place:'Activity Valley',title:'Attendance record',value:e.l30==null?'Not recorded':e.l30+' late occurrences / 30 days',note:'Reported fictional attendance summary',present:e.l30!=null},
 {place:'Learning Forest',title:'Journey evaluation',value:e.stage||'Not recorded',note:'Computed stage from existing probation and development data; not a training completion',present:!!e.stage},
 {place:'Career Heights',title:'Regularization',value:e.reg||'Not recorded',note:'Regularization date, only where provided in the sample',present:!!e.reg},
 {place:'Executive Summit',title:'Employment transition',value:'No individual record',note:'Do not infer a promotion, transfer or exit without a sourced event',present:false}
 ];
 $('content-body').innerHTML='<section class="surface-card"><div class="report-header"><div class="profile-head" style="margin:0"><div class="profile-avatar">'+safe(initials(e.name))+'</div><div><h3 style="margin-bottom:4px">'+safe(e.name)+'</h3><p class="card-description" style="margin:0">'+safe(e.role)+' · '+safe(e.dept)+'</p></div></div><span class="small-pill">FICTIONAL · READ ONLY</span></div><p class="card-description" style="margin-top:18px">The landmarks below show known sample values and explicitly identify gaps. They are not claims that every person completed all seven career stages.</p><div class="personal-path">'+
 moments.map((p,i)=>'<article class="path-stop '+(p.present?'path-present':'path-unknown')+'"><div class="path-dot">'+String(i+1).padStart(2,'0')+'</div><div><small>'+safe(p.place)+'</small><h4>'+safe(p.title)+'</h4><strong>'+safe(p.value)+'</strong><p>'+safe(p.note)+'</p></div></article>').join('')+
 '</div><div class="detail-actions"><button type="button" class="soft-btn" data-world="journey">Explore the 3D Journey area ↗</button><button type="button" class="soft-btn" data-report="journey:profile">Open original journey report ↗</button></div></section>';
}
function globalSearchResults(q){
 const term=q.trim().toLowerCase();
 if(!term)return '<p class="empty-state">Search the 51 fictional people, eight divisions or 86 reports.</p>';
 const results=[];
 employees.filter(e=>[e.name,e.dept,e.role,e.id].join(' ').toLowerCase().includes(term)).slice(0,8).forEach(e=>results.push({type:'Person',text:e.name,sub:e.dept,action:'person',key:e.k}));
 DISTRICTS.filter(d=>[d.name,d.short,d.desc,...d.evaluators.map(e=>e.name)].join(' ').toLowerCase().includes(term)).slice(0,6).forEach(d=>results.push({type:'Destination',text:d.name,sub:d.short,action:'world',key:d.id}));
 manifest.workspaces.forEach(w=>w.sections.filter(s=>s.name.toLowerCase().includes(term)).slice(0,5).forEach(s=>results.push({type:'Report',text:s.name,sub:w.name,action:'report',key:w.id+':'+s.id})));
 return results.slice(0,22).map(r=>'<button type="button" class="search-result" data-search-action="'+safe(r.action)+'" data-key="'+safe(r.key)+'"><strong>'+safe(r.text)+'</strong><span>'+safe(r.type)+' · '+safe(r.sub)+' ↗</span></button>').join('')||'<p class="empty-state">No matching fictional records or destinations.</p>';
}
function openSearch(){const d=$('search-dialog');d.showModal();$('global-search').focus();$('search-results').innerHTML=globalSearchResults($('global-search').value);}
function updateSoundUI(){
 const on=sound.enabled;
 for(const id of ['hud-audio','intro-audio'])$(id)?.setAttribute('aria-pressed',String(on));
 $('hud-audio-label').textContent=on?'Sound on':'Sound off';
 $('intro-audio-label').textContent=on?'Ambient sound on':'Enable ambient sound';
 $('hud-audio').setAttribute('aria-label',on?'Mute ambient music and sound effects':'Enable original ambient music and sound effects');
 $('intro-audio').setAttribute('aria-label',on?'Disable original soundtrack':'Enable original soundtrack');
}
async function toggleAudio(){
 const on=await sound.toggle();
 updateSoundUI();if(on)sound.tap();
 if(!sound.supported){
  $('hud-audio').disabled=true;$('intro-audio').disabled=true;
  $('hud-audio').title='Audio is not supported by this browser';
 }
}
function wireEvents(){
 window.MADDIE_INTRO?.register(startIntro,()=>finishIntro({focus:false}));
 $('tour-start').addEventListener('click',()=>{if(force2D)toggleMode();if(world)world.startTour();else location.hash='#journey';sound.reveal();});
 $('division-tour').addEventListener('click',()=>{closeDivisionMenu();if(force2D)toggleMode();world?.startTour();sound.reveal();});
 $('open-map').addEventListener('click',()=>{openDivisionMenu();sound.tap();});
 $('hud-divisions').addEventListener('click',()=>{if($('division-menu').hidden)openDivisionMenu();else closeDivisionMenu();sound.tap();});
 $('division-menu-close').addEventListener('click',()=>{closeDivisionMenu();$('hud-divisions').focus();});
 $('hud-reports').addEventListener('click',()=>{sound.tap();location.hash='#dashboard';});
 $('content-overview').addEventListener('click',()=>location.hash='#dashboard');
 $('content-search').addEventListener('click',openSearch);
 $('back-to-world').addEventListener('click',()=>{location.hash=selectedDistrict?'#world:'+selectedDistrict:'#overview';});
 $('division-return').addEventListener('click',()=>{history.replaceState(null,'','#overview');clearDistrict();sound.tap();});
 $('division-details').addEventListener('click',()=>{setDetails(!document.body.classList.contains('details-open'));sound.tap();});
 $('panel-dismiss').addEventListener('click',()=>{setDetails(false);$('division-details').focus();sound.tap();});
 $('reset-world').addEventListener('click',()=>{history.replaceState(null,'','#overview');clearDistrict();sound.tap();});
 $('zoom-in').addEventListener('click',()=>{world?.zoom(-12);sound.tap();});
 $('zoom-out').addEventListener('click',()=>{world?.zoom(12);sound.tap();});
 $('world-mode').addEventListener('click',()=>{toggleMode();sound.tap();});
 $('hud-motion').addEventListener('click',()=>{
  motionEnabled=!motionEnabled;world?.setMotion(motionEnabled);
  $('hud-motion').setAttribute('aria-pressed',String(motionEnabled));
  sound.tap();
 });
 $('hud-motion').setAttribute('aria-pressed',String(motionEnabled));
 $('hud-search').addEventListener('click',openSearch);
 $('search-close').addEventListener('click',()=>$('search-dialog').close());
 $('employee-close').addEventListener('click',()=>$('employee-dialog').close());
 $('hud-audio').addEventListener('click',toggleAudio);
 $('intro-audio').addEventListener('click',toggleAudio);
 updateSoundUI();
 $('global-search').addEventListener('input',e=>{$('search-results').innerHTML=globalSearchResults(e.target.value);});
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}
  if(e.key==='Escape'){closeDivisionMenu();if(document.body.classList.contains('details-open'))setDetails(false);}
 });
 document.addEventListener('pointerdown',e=>{
  if(!$('division-menu').hidden&&!e.target.closest('.division-dock'))closeDivisionMenu();
 });
 document.addEventListener('click',e=>{
  const result=e.target.closest('[data-search-action]');
  if(result){
   $('search-dialog').close();const action=result.dataset.searchAction,key=result.dataset.key;
   if(action==='person')employeeModal(key);
   if(action==='report')location.hash='#'+key;
   if(action==='world')location.hash='#world:'+key;
   sound.tap();return;
  }
  const individual=e.target.closest('[data-employee-journey]');if(individual){$('employee-dialog').close();location.hash='#employee-journey:'+individual.dataset.employeeJourney;return;}
  const emp=e.target.closest('[data-employee]');if(emp){employeeModal(emp.dataset.employee);sound.tap();return;}
  const report=e.target.closest('[data-report]');if(report){location.hash='#'+report.dataset.report;sound.tap();return;}
  const work=e.target.closest('[data-workspace]');if(work){location.hash='#'+work.dataset.workspace;sound.tap();return;}
  const district=e.target.closest('[data-district]');
  if(district){
   const id=district.dataset.district;
   closeDivisionMenu();
   if(location.hash==='#world:'+id)selectDistrict(id);else location.hash='#world:'+id;
   return;
  }
  const worldBtn=e.target.closest('[data-world]');if(worldBtn){location.hash='#world:'+worldBtn.dataset.world;return;}
 });
 addEventListener('hashchange',()=>routeTo(location.hash));
}
async function start(){
 wireEvents();
 try{const [res,snapshot]=await Promise.all([fetch('./data/mock-data-manifest.json',{cache:'no-cache'}),fetch('./data/fictional-snapshot.json',{cache:'no-cache'})]);if(!res.ok||!snapshot.ok)throw new Error('Fictional data unavailable');manifest=await res.json();const demo=await snapshot.json();employees=demo.people||[];divisionSummaries=demo.divisions||[];if(employees.length!==51||divisionSummaries.length!==8)console.warn('Unexpected fictional roster size');}
 catch(e){console.warn(e);$('panel-content').innerHTML='<h2>Data inventory unavailable</h2><p>Serve this project over HTTP to load the original fictional workspace manifest.</p>';}
 renderDivisionMenu();renderFastMap();fillSummary();
 const labelsRoot=$('landmark-labels');try{
  const mod=await import('./world.js?v=1.7.0');
  world=mod.createWorld({canvas:$('world-canvas'),labelsRoot,districts:DISTRICTS,onSelect:worldSelected,onHover:()=>sound.hover(),onTourProgress:updateTourProgress,onTourComplete:finishTour,motionEnabled,intro:showIntroOnEntry()&&!introDone&&!window.MADDIE_INTRO?.dismissed});
  if(selectedDistrict)world.focus(selectedDistrict);
 }catch(e){console.warn('3D world unavailable; switching to 2D:',e);fallback2D();}
 sceneReady=true;
 document.body.classList.remove('fallback-boot');
 $('intro-start').disabled=false;
 $('intro-status').textContent=world?'Your expedition is ready.':'An accessible 2D adventure is ready.';
 if(!introDone&&showIntroOnEntry()&&!reduceMotion()){
   document.body.classList.add('intro-loaded');
   setTimeout(()=>document.body.classList.remove('intro-loaded'),2200);
 }
 if(window.MADDIE_INTRO?.dismissed||!showIntroOnEntry())finishIntro({focus:false});
 else if(world)window.MADDIE_INTRO?.ready();
 else window.MADDIE_INTRO?.fail();
 routeTo(location.hash);
 if(!employees.length)console.warn('Display-only fictional roster unavailable. Check data/fictional-snapshot.json.');
}
start();
