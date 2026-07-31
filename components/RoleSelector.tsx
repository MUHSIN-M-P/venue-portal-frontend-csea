'use client';

import { Role } from '@/types';
import { Button } from './Button';

type RoleSelectorProps = {
  currentRoles: Role[];
  onRoleChange: (roles: Role[]) => void;
};

export function RoleSelector({ currentRoles, onRoleChange }: RoleSelectorProps) {
  const roles: { id: Role; label: string }[] = [
    { id: 'club', label: 'Club' },
    { id: 'faculty_coordinator', label: 'Faculty Coordinator' },
    { id: 'staff_in_charge', label: 'Staff In-charge' },
    { id: 'faculty_in_charge', label: 'Faculty In-charge' },
    { id: 'hod', label: 'HOD' },
    { id: 'admin', label: 'Admin' },
  ];


  return (
    <div className="px-8 py-4 bg-[#f4d9c6] flex gap-2 flex-wrap">
      {roles.map((role) => (
        <Button
          key={role.id}
          variant={currentRoles.includes(role.id) ? 'primary' : 'outline'}
          size="sm"
          onPress={() => onRoleChange(currentRoles.includes(role.id) ? currentRoles.filter((current) => current !== role.id) : [...currentRoles, role.id])}
        >
          {role.label}
        </Button>
      ))}
    </div>
  );
}
