import { describe, it, expect } from 'vitest';
import { classify, anomaly, duplicate, makeSeed, buildings, readings } from '@/lib/campus/data';
describe('Campus demo rules',()=>{
 it('classifies leaks with an explained high priority',()=>{const result=classify('A leaking pipe near the restroom');expect(result.category).toBe('Plumbing');expect(result.priority).toBe('High');expect(result.reason.length).toBeGreaterThan(10);});
 it('raises potential immediate hazards to critical',()=>{expect(classify('Smoke and sparks from a socket').priority).toBe('Critical');});
 it('classifies unknown content without inventing a category',()=>{expect(classify('General question').category).toBe('Other');});
 it('detects threshold crossings against actual baselines',()=>{expect(anomaly(9600,8000)).toEqual({flagged:true,change:20});expect(anomaly(115,100).flagged).toBe(false);expect(anomaly(100,0).flagged).toBe(false);});
 it('suggests duplicates only at matching locations',()=>{expect(duplicate('Water leaking restroom','academic',makeSeed())?.id).toBe('MT-1042');expect(duplicate('Water leaking restroom','library',makeSeed())).toBeUndefined();});
 it('keeps all records related to existing buildings',()=>{expect(makeSeed().every(i=>buildings.some(b=>b.id===i.building))).toBe(true);expect(new Set(makeSeed().map(i=>i.id)).size).toBe(makeSeed().length);});
 it('keeps a deterministic sample baseline',()=>{expect(readings.reduce((s,r)=>s+r.energy,0)).toBeCloseTo(129.1);expect(readings.reduce((s,r)=>s+r.baseline,0)).toBeCloseTo(146.8);});
});
