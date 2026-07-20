import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/constants';

export function usePermissions() {
  const { user } = useAuth();

  const can = useCallback((action, resource) => {
    if (!user) return false;
    const allowedRoles = PERMISSIONS[action]?.[resource];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

  const canAccessRoute = useCallback((route) => {
    if (!user) return false;
    if (!route.permission) return true;
    return can(route.permission.action, route.permission.resource);
  }, [user, can]);

  const canAny = useCallback((actions) => {
    return actions.some(({ action, resource }) => can(action, resource));
  }, [can]);

  return { can, canAccessRoute, canAny };
}
