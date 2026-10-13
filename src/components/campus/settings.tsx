import { useState } from 'react';
import { Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDefaultAssignedTeam, getRoleOptions, type CampusRole } from '@/lib/campus/access';
import { useCampus } from '@/lib/campus/store';
import { toast } from 'sonner';

export function CampusSettings() {
  const { items, profile, role, setRole, saveDisplayName } = useCampus();
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [selectedRole, setSelectedRole] = useState<CampusRole>(role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const exportRecords = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campus-records.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Campus records exported');
  };

  const save = async (action: () => Promise<void>) => {
    setSaving(true);
    setError('');
    try {
      await action();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Your settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl divide-y divide-border">
      <section className="py-6">
        <h2 className="mb-2 text-sm font-medium">Profile</h2>
        <p className="mb-5 text-xs text-muted-foreground">Manage the name shown to your campus workspace.</p>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save(() => saveDisplayName(displayName)); }}>
          <label className="form-field max-w-md">
            Display name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} placeholder="Your name" />
          </label>
          <label className="form-field max-w-md">
            Sign-in email
            <input value={profile.email ?? 'Phone sign-in'} readOnly aria-readonly="true" />
          </label>
          <Button type="submit" variant="outline" disabled={saving || displayName.trim() === (profile.display_name ?? '')}>
            <Save />Save profile
          </Button>
        </form>
      </section>

      <section className="py-6">
        <h2 className="mb-2 text-sm font-medium">Campus role</h2>
        <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
          Your role controls which campus records and actions are available to you. Default assignment team: {getDefaultAssignedTeam(role)}.
        </p>
        <label className="form-field max-w-md">
          Active role
          <select
            aria-label="Active campus role"
            value={selectedRole}
            onChange={(event) => {
              const nextRole = getRoleOptions().find((option) => option === event.target.value);
              if (nextRole) setSelectedRole(nextRole);
            }}
          >
            {getRoleOptions().map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <p className="mt-3 text-xs text-muted-foreground">
          {selectedRole === role ? `Current access: ${role}.` : `Changing to ${selectedRole} will update your workspace permissions.`}
        </p>
        <Button className="mt-4" disabled={saving || selectedRole === role} onClick={() => void save(() => setRole(selectedRole))}>
          <Save />Save role
        </Button>
      </section>

      <section className="py-6">
        <h2 className="mb-2 text-sm font-medium">Campus records</h2>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          Reports and activity are stored in the campus workspace and access is governed by your role.
        </p>
        <Button variant="outline" onClick={exportRecords}><Download />Export records</Button>
      </section>

      {error ? <p className="py-4 text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
