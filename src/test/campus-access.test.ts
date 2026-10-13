import { describe, it, expect } from 'vitest';
import {
    assertCampusPermission,
    canPerformAction,
    getDefaultAssignedTeam,
    normalizeCampusRole,
    getRoleOptions,
    resolveAuthRole,
    type CampusRole,
} from '@/lib/campus/access';

describe('Campus access control', () => {
    it('allows super admins and facilities managers to advance maintenance requests', () => {
        expect(canPerformAction('Super Admin', 'advance_ticket')).toBe(true);
        expect(canPerformAction('Facilities Manager', 'advance_ticket')).toBe(true);
        expect(canPerformAction('Student', 'advance_ticket')).toBe(false);
    });

    it('blocks students from editing or resolving campus records', () => {
        expect(canPerformAction('Student', 'edit_ticket')).toBe(false);
        expect(canPerformAction('Student', 'resolve_ticket')).toBe(false);
    });

    it('throws when a role is missing permission for a campus write action', () => {
        expect(() => assertCampusPermission('Student', 'advance_ticket')).toThrow(/permission/i);
        expect(() => assertCampusPermission('Super Admin', 'advance_ticket')).not.toThrow();
    });

    it('maps each role to the default owning campus team for assignment flow', () => {
        expect(getDefaultAssignedTeam('Facilities Manager')).toBe('Facilities Team');
        expect(getDefaultAssignedTeam('Security Manager')).toBe('Security Team');
        expect(getDefaultAssignedTeam('Sustainability Officer')).toBe('Sustainability Team');
        expect(getDefaultAssignedTeam('Student')).toBe('Grounds Team');
    });

    it('normalizes legacy demo role names to platform roles', () => {
        expect(normalizeCampusRole('Administrator')).toBe('Super Admin');
        expect(normalizeCampusRole('Facilities team')).toBe('Facilities Manager');
        expect(normalizeCampusRole('Security team')).toBe('Security Manager');
        expect(normalizeCampusRole('Student')).toBe('Student');
    });

    it('exposes a stable role list for login and profile setup', () => {
        const roles: CampusRole[] = getRoleOptions();
        expect(roles).toContain('Super Admin');
        expect(roles).toContain('Facilities Manager');
        expect(roles).toContain('Security Manager');
        expect(roles).toContain('Student');
    });

    it('derives a valid campus role from authenticated user metadata and falls back safely', () => {
        expect(resolveAuthRole({ campus_role: 'Facilities Manager' })).toBe('Facilities Manager');
        expect(resolveAuthRole({ role: 'security manager' })).toBe('Security Manager');
        expect(resolveAuthRole({ access_role: 'Student' })).toBe('Student');
        expect(resolveAuthRole({})).toBe('Student');
    });
});
