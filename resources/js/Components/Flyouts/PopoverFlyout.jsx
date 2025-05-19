import { useState, useRef, useEffect } from 'react';
import { useFloating, offset, arrow, autoUpdate, computePosition, flip, shift } from '@floating-ui/react-dom';
import './PopoverFlyoutStyles.css';

export default function PopoverFlyout({ placement = 'top', width = 'auto', className = '', placementOffset = 5, style = {}, children, content }) {
  const [isOpen, setIsOpen] = useState(false);
  const referenceElement = useRef(null);
  const popperElement = useRef(null);
  const arrowElement = useRef(null);

  const { x, y, strategy, middlewareData, update } = useFloating({
    placement: placement,
    strategy: 'absolute',
    middleware: [offset(placementOffset), arrow({ element: arrowElement }), flip(), shift()], // Increased offset value
  });

  useEffect(() => {
    if (isOpen && referenceElement.current && popperElement.current) {
      const cleanup = autoUpdate(referenceElement.current, popperElement.current, () => {
        if (!popperElement.current) return;
        computePosition(referenceElement.current, popperElement.current, {
          placement: placement,
          middleware: [offset(placementOffset), flip(), arrow({ element: arrowElement.current }), shift({ padding: 5 })],
        }).then(({ x, y, placement, middlewareData }) => {
          if (!popperElement.current) return;

          Object.assign(popperElement.current.style, {
            left: `${x}px`,
            top: `${y}px`,
            visibility: 'visible',
          });
  
          const { x: arrowX, y: arrowY } = middlewareData.arrow;
          const { x: shiftX, y: shiftY } = middlewareData.shift;
  
          const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right',
          }[placement.split('-')[0]];
  
          if (arrowElement.current) {
            Object.assign(arrowElement.current.style, {
              left: arrowX != null ? `${arrowX - shiftX}px` : '',
              top: arrowY != null ? `${arrowY - shiftY}px` : '',
              right: '',
              bottom: '',
              [staticSide]: '-4px',
            });
          }
        });
      });
      
      return () => cleanup();
    }
  }, [isOpen, update]);

  const handleMouseEnter = () => {
    if (referenceElement.current && popperElement.current) {
      // Precompute the position before opening
      const { x, y, middlewareData, placement } = computePosition(referenceElement.current, popperElement.current, {
        placement: placement,
        middleware: [offset(placementOffset), flip(), arrow({ element: arrowElement.current }), shift({ padding: placementOffset })],
      });

      // Apply the calculated position
      Object.assign(popperElement.current.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: strategy,
        visibility: 'visible',
      });

      const { x: arrowX, y: arrowY } = middlewareData.arrow || {};
      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[placement.split('-')[0]];

      if (arrowElement.current) {
        Object.assign(arrowElement.current.style, {
          left: arrowX != null ? `${arrowX}px` : '',
          top: arrowY != null ? `${arrowY}px` : '',
          right: '',
          bottom: '',
          [staticSide]: '-4px',
        });
      }
    }

    // Open the popover after positioning
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <div
      ref={referenceElement}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${className}`}
      style={style}
    >
      {/* Trigger Element */}
      {children}

      {/* Popover Content */}
      {isOpen && (
        <div
          ref={popperElement}
          style={{
            position: strategy,
            top: y ?? '',
            left: x ?? '',
            zIndex: 9999,
          }}
          className={`bg-white dark:bg-dark-900 dark:ring-dark-100/5 rounded-lg shadow-lg text-sm leading-6 ring-1 ring-gray-900/5 isolate ${width}`}
        >
          {content}
          <div ref={arrowElement} className="arrow bg-white dark:bg-dark-900" />
        </div>
      )}
    </div>
  );
}