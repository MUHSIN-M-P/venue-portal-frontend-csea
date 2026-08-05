'use client';

import { ROLE_OPTIONS, PortalRole, formatRoleLabel } from '@/lib/utils';
import { Button } from './Button';

type RoleSelectorProps = {
  currentRoles: (PortalRole | string)[];
  onRoleChange: (roles: PortalRole[]) => void;
  className?: string;
};

export function RoleSelector({ currentRoles, onRoleChange, className }: RoleSelectorProps) {
  const toggleRole = (role: PortalRole) => {
    if (currentRoles.includes(role)) {
      onRoleChange(currentRoles.filter((r) => r !== role) as PortalRole[]);
    } else {
      onRoleChange([...currentRoles, role] as PortalRole[]);
    }
  };

  return (
    <div className={className || "flex flex-wrap gap-2"}>
      {ROLE_OPTIONS.map((roleOption) => {
        const isSelected = currentRoles.includes(roleOption);
        return (
          <Button
            key={roleOption}
            type="button"
            variant={isSelected ? 'primary' : 'outline'}
            size="sm"
            onPress={() => toggleRole(roleOption)}
          >
            {formatRoleLabel(roleOption)}
          </Button>
        );
      })}
    </div>
  );
}
