export const campusRoles = [
    'Super Admin',
    'Facilities Manager',
    'Security Manager',
    'Sustainability Officer',
    'Student',
] as const;

export type CampusRole = (typeof campusRoles)[number];
export type CampusTeam = 'Facilities Team' | 'Security Team' | 'Sustainability Team' | 'Grounds Team' | 'Campus Operations';
export type CampusPermission =
    | 'view_dashboard'
    | 'create_report'
    | 'advance_ticket'
    | 'edit_ticket'
    | 'resolve_ticket'
    | 'view_security'
    | 'manage_sustainability';

const permissionMap: Record<CampusPermission, CampusRole[]> = {
    view_dashboard: ['Super Admin', 'Facilities Manager', 'Security Manager', 'Sustainability Officer', 'Student'],
    create_report: ['Super Admin', 'Facilities Manager', 'Security Manager', 'Sustainability Officer', 'Student'],
    advance_ticket: ['Super Admin', 'Facilities Manager', 'Security Manager'],
    edit_ticket: ['Super Admin', 'Facilities Manager', 'Security Manager'],
    resolve_ticket: ['Super Admin', 'Facilities Manager'],
    view_security: ['Super Admin', 'Security Manager'],
    manage_sustainability: ['Super Admin', 'Sustainability Officer'],
};

const roleTeamMap: Record<CampusRole, CampusTeam> = {
    'Super Admin': 'Campus Operations',
    'Facilities Manager': 'Facilities Team',
    'Security Manager': 'Security Team',
    'Sustainability Officer': 'Sustainability Team',
    Student: 'Grounds Team',
};

const roleAliases: Record<string, CampusRole> = {
    administrator: 'Super Admin',
    'super admin': 'Super Admin',
    'facilities team': 'Facilities Manager',
    'facilities manager': 'Facilities Manager',
    'security team': 'Security Manager',
    'security personnel': 'Security Manager',
    'security manager': 'Security Manager',
    'sustainability coordinator': 'Sustainability Officer',
    'sustainability officer': 'Sustainability Officer',
    student: 'Student',
    resident: 'Student',
};

export function getRoleOptions(): CampusRole[] {
    return [...campusRoles];
}

export function normalizeCampusRole(role?: string | null): CampusRole {
    const safeRole = (role ?? '').trim();
    if (!safeRole) return 'Student';

    const match = roleAliases[safeRole.toLowerCase()];
    if (match) return match;

    const exact = campusRoles.find((candidate) => candidate.toLowerCase() === safeRole.toLowerCase());
    if (exact) return exact;

    return 'Student';
}

export function resolveAuthRole(metadata?: Record<string, unknown> | null): CampusRole {
    const candidates = [
        metadata?.campus_role,
        metadata?.role,
        metadata?.access_role,
        metadata?.accessRole,
        metadata?.user_role,
        metadata?.app_role,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            const normalized = normalizeCampusRole(candidate);
            if (normalized) return normalized;
        }
    }

    return 'Student';
}

export function canPerformAction(role: string | CampusRole | null | undefined, action: CampusPermission): boolean {
    const normalized = normalizeCampusRole(role);
    return permissionMap[action].includes(normalized);
}

export function getDefaultAssignedTeam(role: string | CampusRole | null | undefined): CampusTeam {
    const normalized = normalizeCampusRole(role);
    return roleTeamMap[normalized] ?? 'Campus Operations';
}

const campusPermissionLabels: Record<CampusPermission, string> = {
    view_dashboard: 'dashboard access',
    create_report: 'report creation',
    advance_ticket: 'ticket updates',
    edit_ticket: 'ticket edits',
    resolve_ticket: 'ticket resolution',
    view_security: 'security visibility',
    manage_sustainability: 'sustainability management',
};

export function assertCampusPermission(
    role: string | CampusRole | null | undefined,
    action: CampusPermission,
    context = 'This action',
): CampusRole {
    const normalized = normalizeCampusRole(role);
    if (!canPerformAction(normalized, action)) {
        throw new Error(`${context} requires ${campusPermissionLabels[action]} permission for the ${normalized} role.`);
    }

    return normalized;
}
