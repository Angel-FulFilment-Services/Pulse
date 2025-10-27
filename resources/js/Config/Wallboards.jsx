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
 */

export const wallboards = {
    // Default wallboard configuration
    "management-&-access-control": {
        name: 'Management & Access Control',
        layout: 'split-vertical-65-35',
        layout_name: '65/35 Vertical Split',
        sources: [
            {
                source: 'https://wings.angelfs.co.uk',
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
        sources: [
            {
                source: 'https://wings.angelfs.co.uk',
                tile_id: 1,
                title: 'Wings Dashboard'
            },
            {
                source: 'https://wings.angelfs.co.uk/call-centre/wallboard',
                tile_id: 2,
                title: 'Call Centre Wallboard'
            }
        ]
    },
};

// Get list of all available wallboards for selection
export const getWallboardList = () => {
    return Object.keys(wallboards).map(key => ({
        id: key,
        name: wallboards[key].name,
        layout: wallboards[key].layout,
        layout_name: wallboards[key].layout_name
    }));
};

// Get specific wallboard configuration
export const getWallboard = (id) => {
    return wallboards[id] || wallboards.default;
};
