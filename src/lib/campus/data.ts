export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export const statuses = ['Reported', 'Under Review', 'Assigned', 'In Progress', 'Resolved'] as const;
export type Status = typeof statuses[number];
export type RecordItem = { id: string; title: string; description: string; building: string; category: string; priority: Priority; status: Status; team: string; history: string[]; kind: 'maintenance' | 'community' | 'security'; photo?: string };
export const buildings = [
 {id:'academic',name:'Main Academic Block',type:'Teaching & learning',energy:3240,water:8200,occupancy:82,x:49,y:43},
 {id:'science',name:'Science Block',type:'Labs & research',energy:2860,water:6100,occupancy:74,x:33,y:17},
 {id:'library',name:'Library',type:'Library & study',energy:1680,water:2600,occupancy:67,x:63,y:22},
 {id:'hostel-a',name:'Hostel Block A',type:'Student residence',energy:1850,water:7200,occupancy:91,x:26,y:33},
 {id:'hostel-b',name:'Hostel Block B',type:'Student residence',energy:1710,water:6800,occupancy:89,x:18,y:45},
 {id:'sports',name:'Sports Complex',type:'Sport & recreation',energy:1420,water:3400,occupancy:48,x:84,y:35},
 {id:'admin',name:'Administration Building',type:'Campus operations',energy:860,water:1800,occupancy:63,x:73,y:55},
 {id:'cafe',name:'Cafeteria',type:'Dining',energy:1120,water:5200,occupancy:76,x:71,y:72},
 {id:'parking',name:'Parking Area',type:'Transport',energy:280,water:400,occupancy:56,x:18,y:66},
 {id:'green',name:'Green Zone',type:'Gardens & assembly point',energy:120,water:3800,occupancy:25,x:48,y:79},
];
export const readings = [
 {day:'Mon',energy:18.2,water:48.2,baseline:20.8},{day:'Tue',energy:19.8,water:47.4,baseline:21.2},{day:'Wed',energy:17.5,water:45.6,baseline:20.2},{day:'Thu',energy:21.4,water:51.2,baseline:23.2},{day:'Fri',energy:19.1,water:48.1,baseline:22.8},{day:'Sat',energy:15.7,water:42.8,baseline:18.4},{day:'Sun',energy:17.4,water:45.5,baseline:20.2}
];
export function makeSeed(): RecordItem[] { return [
 {id:'MT-1042',title:'Water leakage detected',description:'Water leaking from the second-floor restroom. Reading 9,600 L compared with baseline 8,000 L (+20%).',building:'academic',category:'Plumbing',priority:'Critical',status:'Reported',team:'Plumbing team',history:['09:42 · Simulated water anomaly detected'],kind:'maintenance'},
 {id:'MT-1041',title:'Unusual energy consumption',description:'Science laboratory reading 3,800 kWh exceeds its 2,860 kWh baseline by 32.9%. Check overnight equipment.',building:'science',category:'Electrical',priority:'High',status:'In Progress',team:'Electrical team',history:['09:15 · Energy threshold exceeded','09:30 · Electrical team assigned'],kind:'maintenance'},
 {id:'SC-2031',title:'Repeated failed login attempts',description:'8 simulated failed logins within 10 minutes. Threshold: 5. This pattern is an indicator, not proof of an attack.',building:'admin',category:'Access control',priority:'High',status:'Under Review',team:'Security team',history:['08:58 · Login pattern flagged'],kind:'security'},
 {id:'MT-1040',title:'Air conditioning requires inspection',description:'Cooling output is lower than the configured target in the east reading room.',building:'library',category:'Infrastructure',priority:'Medium',status:'Assigned',team:'Facilities team',history:['08:40 · Request created'],kind:'maintenance'},
 {id:'CR-3012',title:'Recycling bins need collection',description:'Recycling bins near the cafeteria are full and require collection.',building:'cafe',category:'Cleanliness',priority:'Low',status:'Reported',team:'Grounds team',history:['08:20 · Community report submitted'],kind:'community'},
 {id:'CR-3011',title:'Evening study shuttle',description:'A sample campus proposal: run an evening shuttle between the library and both hostel blocks so students can study later safely.',building:'green',category:'Campus idea',priority:'Low',status:'Under Review',team:'Sustainability team',history:['Yesterday · Idea submitted for review'],kind:'community'},
 {id:'MT-1039',title:'Corridor lighting replaced',description:'Faulty LED lights on the ground floor have been replaced.',building:'hostel-a',category:'Electrical',priority:'Low',status:'Resolved',team:'Electrical team',history:['Yesterday · Reported','08:05 · Resolved'],kind:'maintenance'},
 ]; }
export function classify(text: string) {
 const s=text.toLowerCase(); const critical=/fire|smoke|sparks|electric shock|flood|gas leak/.test(s);
 const category=/leak|water|pipe|tap|plumb/.test(s)?'Plumbing':/power|electric|light|socket|sparks/.test(s)?'Electrical':/trash|waste|bin|dirty|clean/.test(s)?'Cleanliness':/fire|danger|unsafe|smoke|security/.test(s)?'Safety':/wall|door|roof|crack|cooling/.test(s)?'Infrastructure':'Other';
 const priority: Priority=critical?'Critical':/leak|broken|outage|unsafe/.test(s)?'High':'Medium';
 return {category,priority,reason:critical?'A potential immediate safety hazard was mentioned.':priority==='High'?'The description indicates a leak, outage, or damaged facility.':'No immediate safety hazard was identified.',action:category==='Plumbing'?'Assign a plumbing inspection and compare the meter against its baseline.':category==='Electrical'?'Assign the electrical team to inspect the affected system.':'Send to the facilities team for review.'};
}
export function anomaly(observed:number,baseline:number,threshold=15) { const change=baseline>0?(observed-baseline)/baseline*100:0;return {flagged:baseline>0 && change>threshold,change}; }
export function buildingName(id:string) {return buildings.find(b=>b.id===id)?.name ?? 'Campus';}
export function duplicate(text:string,building:string,items:RecordItem[]) {const words=[...new Set(text.toLowerCase().match(/[a-z]{4,}/g)??[])].filter(w=>!['from','with','that','this','have','needs','need','near','floor','room','been','requires','replacement','reported'].includes(w));return items.find(i=>i.building===building && i.status!=='Resolved' && words.filter(w=>(i.title+' '+i.description).toLowerCase().includes(w)).length>=2);}
// Timeline notes and ages used when the shared demo is restored to the sample campus.
export const sampleNotes: Record<string, string[]> = {
  'MT-1042': ['Simulated water anomaly detected'],
  'MT-1041': ['Energy threshold exceeded', 'Electrical team assigned'],
  'SC-2031': ['Login pattern flagged'],
  'MT-1040': ['Request created'],
  'CR-3012': ['Community report submitted'],
  'CR-3011': ['Idea submitted for review'],
  'MT-1039': ['Reported', 'Resolved'],
};
export const sampleMinutesAgo: Record<string, number> = {
  'MT-1042': 25, 'MT-1041': 180, 'SC-2031': 240, 'MT-1040': 300,
  'CR-3012': 360, 'CR-3011': 420, 'MT-1039': 1440,
};
