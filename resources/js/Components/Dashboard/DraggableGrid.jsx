import React, { useState, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import WidgetItem from './WidgetItem.jsx';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DraggableGrid = ({ 
    widgets = [], 
    onLayoutChange,
    className = "",
    ...gridProps 
}) => {
    // Default breakpoints and columns
    const defaultBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const defaultCols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

    // Generate layouts from widgets
    const layouts = useMemo(() => {
        const defaultLayout = widgets.map((widget, index) => ({
            i: widget.key || widget.id || `widget-${index}`,
            x: widget.x || (index % 4) * 3,
            y: widget.y || Math.floor(index / 4) * 4,
            w: widget.w || 3,
            h: widget.h || 4,
            minW: widget.minW || 2,
            minH: widget.minH || 3,
            maxW: widget.maxW || 12,
            maxH: widget.maxH || 8,
            static: widget.locked || false, // Lock widget if specified
            ...widget.gridProps
        }));

        return {
            lg: defaultLayout,
            md: defaultLayout.map(item => ({
                ...item,
                w: Math.min(item.w, 5),
                x: item.x >= 10 ? 0 : item.x
            })),
            sm: defaultLayout.map(item => ({
                ...item,
                w: Math.min(item.w, 3),
                x: item.x >= 6 ? 0 : item.x
            })),
            xs: defaultLayout.map(item => ({
                ...item,
                w: Math.min(item.w, 2),
                x: item.x >= 4 ? 0 : item.x
            })),
            xxs: defaultLayout.map(item => ({
                ...item,
                w: 2,
                x: 0
            }))
        };
    }, [widgets]);

    const handleLayoutChange = (currentLayout, allLayouts) => {
        if (onLayoutChange) {
            onLayoutChange(currentLayout, allLayouts);
        }
    };

    return (
        <ResponsiveGridLayout
            className={`layout ${className}`}
            layouts={layouts}
            breakpoints={defaultBreakpoints}
            cols={defaultCols}
            rowHeight={42}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={false} // Disable resize globally
            compactType="vertical"
            preventCollision={false}
            {...gridProps}
        >
            {widgets.map((widget, index) => {
                const key = widget.key || widget.id || `widget-${index}`;
                
                return (
                    <div key={key} className="widget-container">
                        {widget.showHeader === false ? (
                            // Render content directly without WidgetItem wrapper for special cases like WelcomeCard
                            widget.content
                        ) : (
                            <WidgetItem
                                title={widget.title}
                                headerAction={widget.headerAction}
                                className="h-full"
                            >
                                {widget.content}
                            </WidgetItem>
                        )}
                    </div>
                );
            })}
        </ResponsiveGridLayout>
    );
};

export default DraggableGrid;