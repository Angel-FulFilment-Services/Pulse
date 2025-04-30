import { usePage } from '@inertiajs/react';

export function hasPermission(permission) {
    const { permissions } = usePage().props;

    // Ensure permissions are available
    if (!permissions || !Array.isArray(permissions)) {
        return false;
    }

    // Check if the permission exists
    return permissions.includes(permission);
}