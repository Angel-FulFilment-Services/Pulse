import { usePage } from '@inertiajs/react';

// Hook version - use this at the top level of components
export function usePermission(permission) {
    const { permissions } = usePage().props;

    // Ensure permissions are available
    if (!permissions || !Array.isArray(permissions)) {
        return false;
    }

    // Check if the permission exists
    return permissions.includes(permission);
}

// Hook to get all permissions - use this to check multiple permissions
export function usePermissions() {
    const { permissions } = usePage().props;
    
    const hasPermission = (permission) => {
        if (!permissions || !Array.isArray(permissions)) {
            return false;
        }
        return permissions.includes(permission);
    };
    
    return { permissions: permissions || [], hasPermission };
}

// Legacy function - DEPRECATED: Only use where you know it won't violate hooks rules
// This function uses a hook internally, so it CANNOT be called conditionally
export function hasPermission(permission) {
    const { permissions } = usePage().props;

    // Ensure permissions are available
    if (!permissions || !Array.isArray(permissions)) {
        return false;
    }

    // Check if the permission exists
    return permissions.includes(permission);
}