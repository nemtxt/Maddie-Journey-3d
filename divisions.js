/**
 * Public, user-supplied division/evaluator directory for the interactive world.
 * Keep these eight geographic destinations separate from the nine legacy
 * monitoring workspaces in data/mock-data-manifest.json.
 * Evaluator assignments are reference metadata, not fictional employee rows.
 */
export const DIVISIONS=Object.freeze([
  {id:'hr',name:'HR',short:'People & Culture Hub',x:-29,z:6,color:'#60b89d',theme:'people campus',marker:'01',
    desc:'The welcome pavilion connects people, onboarding, 201 files, employee journeys and governance.',
    evaluators:[{name:'GIEZELLE',role:'HR'},{name:'KURT',role:'HR'}],
    workspaces:['people','journey','governance','talent']},
  {id:'revenue',name:'Revenue Management Division',short:'Revenue Outlook',x:-32,z:-14,color:'#e3b45b',theme:'revenue observatory',marker:'02',
    desc:'A glass-and-stone outlook with KPI beacons, a business performance tower and financial insights.',
    evaluators:[{name:'TRIZIA BALDOVI',role:'Chief Experience Officer'}],
    workspaces:['pay','scoreboard']},
  {id:'design',name:'Design Division',short:'Creative Atelier',x:-11,z:20,color:'#c48eab',theme:'design studio',marker:'03',
    desc:'A daylight studio filled with drafting boards, material palettes and sculptural installations.',
    evaluators:[{name:'AR. AJ TRABADO',role:'Design Operations Manager'}],
    workspaces:['learning','journey']},
  {id:'corporate',name:'Corporate Operations',short:'Operations Campus',x:11,z:22,color:'#7d9fc4',theme:'operations headquarters',marker:'04',
    desc:'Connected offices, workflow boards and a landmark clocktower represent coordinated operations.',
    evaluators:[{name:'RENATO RENDON',role:'Corporate Operations Head'},{name:'ZSARINA MAE LACUMBA',role:'Corporate Operations Head'}],
    workspaces:['pulse','governance']},
  {id:'media',name:'Media',short:'Media & Broadcast',x:31,z:10,color:'#eb938c',theme:'broadcast studio',marker:'05',
    desc:'A creative production studio with a broadcast mast, cameras, display wall and content signage.',
    evaluators:[{name:'MICHELLE OROCIO',role:'Media Manager'}],
    workspaces:['culture','learning']},
  {id:'it',name:'IT',short:'Digital Valley',x:31,z:-10,color:'#6ca4c4',theme:'data and technology campus',marker:'06',
    desc:'Digital infrastructure, server pods, data pylons and a glowing circuit garden.',
    evaluators:[{name:'INIGO ARELLANO',role:'COO'}],
    workspaces:['pulse','scoreboard']},
  {id:'gencon',name:'GenCon',short:'Convention Grounds',x:14,z:-24,color:'#bf9e79',theme:'convention amphitheater',marker:'07',
    desc:'An event pavilion and tiered amphitheater for collaboration, gathering and organizational milestones.',
    evaluators:[{name:'INIGO ARELLANO',role:'COO'}],
    workspaces:['culture','talent']},
  {id:'business',name:'Business Development',short:'Growth Harbour',x:-17,z:-23,color:'#8cab76',theme:'partnership and growth port',marker:'08',
    desc:'A future-focused growth tower, partnership bridge and route markers point toward new opportunities.',
    evaluators:[{name:'MA. CRISTINE ORTIZ',role:'Business Development Head'}],
    workspaces:['talent','scoreboard','pay']}
]);

export function divisionForWorkspace(workspaceId){
  return DIVISIONS.find(division=>division.workspaces.includes(workspaceId))||DIVISIONS[0];
}
