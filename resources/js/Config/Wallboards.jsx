/**
 * Wallboard Configuration
 * 
 * Define your wallboards here with their sources and tile layouts
 * 
 * Available layouts:
 * - 'single': One full-screen tile
 * - 'split-vertical-65-35': Two vertical tiles (65% left, 35% right)
 * - 'split-vertical-50-50': Two vertical tiles (50% each)
 * - 'split-horizontal-50-50': Two horizontal tiles (50% each)
 * - 'grid-2x2': Four tiles in a 2x2 grid
 * - 'grid-3x3': Nine tiles in a 3x3 grid
 * - 'triple-column': Three equal columns
 * - 'main-sidebar': Large main area (70%) with sidebar (30%)
 * - 'slideshow': Cycles through sources automatically
 * 
 * For slideshow layout:
 * - Add slideInterval: number (in seconds) at wallboard level for global default
 * - Add slideInterval: number (in seconds) on individual sources to override global default
 * - Global default is 10 seconds if not specified
 * 
 * Refresh Options:
 * - All wallboards refresh at midnight automatically (start of day)
 * - Add refreshInterval: number (in seconds) for periodic refresh
 *   Example: refreshInterval: 300 = refresh every 5 minutes
 * 
 * Permissions:
 * - Add permission: 'permission_name' to restrict access to a wallboard
 * - If no permission is specified, wallboard is accessible to all users
 * 
 * Picture-in-Picture (PiP):
 * - Add pip: {} object to overlay a semi-transparent window on any layout
 * - pip.source: URL of the content to display
 * - pip.title: Title for the iframe
 * - pip.position: 'top-left', 'top-center', 'top-right', 'center-left', 'center', 
 *                 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'
 * - pip.width: Tailwind width class (default: 'w-96')
 * - pip.height: Tailwind height class (default: 'h-64')
 * - pip.opacity: Background opacity class (default: 'opacity-75')
 * - pip.scale: Scale factor for the content (default: 0.5 = 50%)
 *              Use 0.3 for zoomed out view, 0.7 for closer view
 */

export const wallboards = {
    // Default wallboard configuration
    "management-&-access-control": {
        name: 'Management & Access Control',
        layout: 'split-vertical-65-35',
        layout_name: '65/35 Vertical Split',
        refreshInterval: 3600, // Refresh every 1 hour
        sources: [
            {
                source: 'https://wings.angelfs.co.uk/dashboard/group/management',
                tile_id: 1,
                title: 'Wings Dashboard'
            },
            {
                source: 'https://pulse.angelfs.co.uk/onsite/widgets/access-control',
                tile_id: 2,
                title: 'Access Control'
            }
        ]
    },

    // Example: 50/50 split
    "call-centre-wallboard": {
        name: 'Call Centre Wallboard',
        layout: 'split-vertical-50-50',
        layout_name: '50/50 Vertical Split',
        refreshInterval: 3600, // Refresh every 1 hour
        sources: [
            {
                source: 'https://wings.angelfs.co.uk/dashboard/group/call-centre',
                tile_id: 1,
                title: 'Wings Dashboard'
            },
            {
                source: 'https://wings.angelfs.co.uk/call-centre/wallboard',
                tile_id: 2,
                title: 'Call Centre Wallboard'
            }
        ],
    },

    // Example: Slideshow with 15 second intervals
    "it-dashboard": {
        name: 'IT Dashboard Slideshow',
        layout: 'slideshow',
        layout_name: 'Slideshow',
        refreshInterval: 3600, // Refresh every 1 hour
        permission: 'pulse_view_administration', // Restrict to users with this permission
        slideInterval: 10, // Global default time in seconds for each slide
        sources: [
            {
                source: 'https://prtg.angelfs.co.uk:8443/public/mapshow.htm?id=2969&mapid=F075D4E9-D782-4F61-8078-0AE653A26CC5',
                title: 'Server Room Monitoring',
                slideInterval: 10
            },
            {
                source: 'https://prtg.angelfs.co.uk:8443/public/mapshow.htm?id=3036&mapid=67B553D2-596F-4412-A03D-103E25E9FB50',
                title: 'Network Overview',
                slideInterval: 10
            },
            {
                source: 'https://prtg.angelfs.co.uk:8443/public/mapshow.htm?id=3131&mapid=BC9293FC-2B55-4FA7-9655-81B194F6F2B4',
                title: 'PBX Overview',
                slideInterval: 10 // Override: show this slide for 10 seconds
            },
            {
                source: 'https://wings.angelfs.co.uk/call-centre/wallboard',
                title: 'Call Centre Wallboard',
                slideInterval: 10 // Uses global default of 10 seconds
            },
            {
                source: 'https://angelfs.atlassian.net/jira/dashboards/wallboard?dashboardId=10003',
                title: 'Jira Wallboard',
                slideInterval: 10 // Override: show this slide for 20 seconds
            }
        ],
        pip: {
            source: '/proxy/cameras/3d-printer', // Proxied through Laravel to convert HTTP to HTTPS
            title: 'Camera Feed',
            position: 'bottom-right',
            opacity: 'opacity-75',
            sizes: {
                small: {
                    width: 'w-[20rem]',
                    height: 'h-[15rem]',
                },
                medium: {
                    width: 'w-[40rem]',
                    height: 'h-[30rem]',
                },
                fullscreen: {
                    width: 'w-screen',
                    height: 'h-screen',
                }
            }
        }
    },
};

// Get list of all available wallboards for selection
export const getWallboardList = () => {
    return Object.keys(wallboards).map(key => ({
        id: key,
        name: wallboards[key].name,
        layout: wallboards[key].layout,
        layout_name: wallboards[key].layout_name,
        permission: wallboards[key].permission
    }));
};

// Get specific wallboard configuration
export const getWallboard = (id) => {
    return wallboards[id] || wallboards.default;
};
