export function getAccessibleOrganizationIds(user: any): string[] {
  if (!user) return [];

  if (user.isPlatformAdmin) {
    return [];
  }

  const roles = Array.isArray(user.organizationRoles)
    ? user.organizationRoles
    : [];

  return roles
    .map((item: any) => item?.organization?.id)
    .filter(Boolean);
}