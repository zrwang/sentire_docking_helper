import { useState } from 'react';
import { SidePanelSection } from '@/components/layout/side-panel';
import { useListReorder, type ReorderRowProps } from '@/hooks/use-list-reorder';
import {
  useTeamStore,
  DEFAULT_TEAM_ROLES,
  type TeamMember,
} from '@/stores/team-store';

const OTHER_ROLE = '__other__';

/**
 * Sidebar section for recording the surgical team (console surgeon, scrub
 * nurse, etc.). Members persist to localStorage so the team roster is
 * restored across page reloads. The panel is intentionally lightweight --
 * add / edit / remove only, no cross-reference to canvas equipment.
 */
export function TeamPanel() {
  const members = useTeamStore((s) => s.members);
  const addMember = useTeamStore((s) => s.addMember);
  const updateMember = useTeamStore((s) => s.updateMember);
  const removeMember = useTeamStore((s) => s.removeMember);
  const moveMember = useTeamStore((s) => s.moveMember);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { getRowProps } = useListReorder({
    onReorder: moveMember,
    mimeType: 'application/x-sentire-team-reorder',
  });

  return (
    <SidePanelSection title="Surgical Team" storageKey="team">
      <div className="flex flex-col gap-1">
        {members.length === 0 && !adding && (
          <p className="text-[11px] text-gray-500 px-1 py-1">
            No team members yet.
          </p>
        )}

        {members.map((m, index) =>
          editingId === m.id ? (
            <MemberForm
              key={m.id}
              initial={m}
              onCancel={() => setEditingId(null)}
              onSubmit={(patch) => {
                updateMember(m.id, patch);
                setEditingId(null);
              }}
            />
          ) : (
            <MemberRow
              key={m.id}
              member={m}
              dragProps={getRowProps(index)}
              onEdit={() => setEditingId(m.id)}
              onRemove={() => {
                if (
                  window.confirm(
                    `Remove ${m.name || m.role} from the team?`
                  )
                ) {
                  removeMember(m.id);
                }
              }}
            />
          )
        )}

        {adding ? (
          <MemberForm
            onCancel={() => setAdding(false)}
            onSubmit={(spec) => {
              addMember(spec);
              setAdding(false);
            }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-1 px-2 py-1.5 rounded border border-dashed border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500"
          >
            + Add team member
          </button>
        )}
      </div>
    </SidePanelSection>
  );
}

interface MemberRowProps {
  member: TeamMember;
  dragProps: ReorderRowProps;
  onEdit: () => void;
  onRemove: () => void;
}

function MemberRow({ member, dragProps, onEdit, onRemove }: MemberRowProps) {
  const dragState = dragProps['data-drag-state'];
  return (
    <div
      {...dragProps}
      className={`flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-800 group transition-opacity ${
        dragState === 'source' ? 'opacity-40' : ''
      } ${
        dragState === 'target'
          ? 'outline outline-1 outline-blue-500/60 bg-gray-800/60'
          : ''
      }`}
    >
      <span
        className="text-gray-600 group-hover:text-gray-400 text-xs leading-none cursor-grab select-none shrink-0 pt-0.5"
        title="Drag to reorder"
        aria-hidden="true"
      >
        ⋮⋮
      </span>
      <button
        onClick={onEdit}
        className="flex-1 min-w-0 text-left"
        title="Edit"
      >
        <div className="text-sm text-gray-200 truncate">
          {member.name || <span className="text-gray-500 italic">Unnamed</span>}
        </div>
        <div className="text-[10px] text-gray-500 truncate">
          {member.role}
          {member.notes ? ` — ${member.notes}` : ''}
        </div>
      </button>
      <button
        onClick={onRemove}
        title="Remove"
        className="text-[10px] text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

interface MemberFormProps {
  initial?: TeamMember;
  onCancel: () => void;
  onSubmit: (spec: Omit<TeamMember, 'id'>) => void;
}

function MemberForm({ initial, onCancel, onSubmit }: MemberFormProps) {
  const initialIsCustomRole =
    !!initial && !DEFAULT_TEAM_ROLES.includes(initial.role as (typeof DEFAULT_TEAM_ROLES)[number]);

  const [roleSelect, setRoleSelect] = useState<string>(
    initialIsCustomRole ? OTHER_ROLE : initial?.role ?? DEFAULT_TEAM_ROLES[0]
  );
  const [customRole, setCustomRole] = useState<string>(
    initialIsCustomRole ? initial!.role : ''
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSave = () => {
    const role =
      roleSelect === OTHER_ROLE ? customRole.trim() : roleSelect;
    if (!role) return;
    onSubmit({
      role,
      name: name.trim(),
      notes: notes.trim() || undefined,
    });
  };

  const canSubmit =
    roleSelect !== OTHER_ROLE || customRole.trim().length > 0;

  return (
    <div className="flex flex-col gap-1.5 px-2 py-2 rounded border border-gray-700 bg-gray-950/50">
      <select
        value={roleSelect}
        onChange={(e) => setRoleSelect(e.target.value)}
        className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
      >
        {DEFAULT_TEAM_ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
        <option value={OTHER_ROLE}>Other…</option>
      </select>
      {roleSelect === OTHER_ROLE && (
        <input
          type="text"
          autoFocus
          placeholder="Custom role"
          value={customRole}
          onChange={(e) => setCustomRole(e.target.value)}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
        />
      )}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
      />
      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
      />
      <div className="flex gap-1 justify-end">
        <button
          onClick={onCancel}
          className="px-2 py-0.5 text-[10px] rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSubmit}
          className="px-2 py-0.5 text-[10px] rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initial ? 'Save' : 'Add'}
        </button>
      </div>
    </div>
  );
}
