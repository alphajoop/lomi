import { SetMetadata } from '@nestjs/common';

export const DASHBOARD_PERMISSION_KEY = 'dashboard_permission';

/** Required org permission for OrganizationContextGuard (e.g. catalog.read). */
export const DashboardPermission = (permission: string) =>
  SetMetadata(DASHBOARD_PERMISSION_KEY, permission);
