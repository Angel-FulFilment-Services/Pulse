import { useState, useRef, useEffect } from 'react';
import { useFloating, offset, arrow, autoUpdate, computePosition, flip, shift } from '@floating-ui/react-dom';
import {FloatingOverlay} from '@floating-ui/react';
import './PopoverFlyoutStyles.css';

export default function ClickedFlyout({
  placement = 'top',
  width = 'auto',
  height = 'auto',
  overlay = false,
  className = '',
  style = {},
  children,
  content,
  icon,
  onClose, // Prop for handling closure events
  onSubmit = () => {}, // Default to a no-op function
}) {
  const [isOpen, setIsOpen] = useState(false);
  const referenceElement = useRef(null);
  const popperElement = useRef(null);
  const arrowElement = useRef(null);

  const { x, y, strategy, middlewareData, update } = useFloating({
    placement: placement,
    strategy: 'absolute',
    middleware: [offset(5), arrow({ element: arrowElement }), flip()],
  });

  useEffect(() => {
    if (isOpen) {
      const cleanup = autoUpdate(referenceElement.current, popperElement.current, () => {
        computePosition(referenceElement.current, popperElement.current, {
          placement: placement,
          middleware: [offset(10), flip(), arrow({ element: arrowElement.current }), shift({ padding: 5 })],
        }).then(({ x, y, placement, middlewareData }) => {

          Object.assign(popperElement.current.style, {
            left: `${x}px`,
            top: `${y}px`,
          });

          const { x: arrowX, y: arrowY } = middlewareData.arrow;
          const { x: shiftX, y: shiftY } = middlewareData.shift;

          const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right',
          }[placement.split('-')[0]];

          Object.assign(arrowElement.current.style, {
            left: arrowX != null ? `${arrowX - shiftX}px` : '',
            top: arrowY != null ? `${arrowY - shiftY}px` : '',
            right: '',
            bottom: '',
            [staticSide]: '-4px',
          });
        });
      });

      return () => cleanup();
    }
  }, [isOpen, update]);

  // Close the flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        referenceElement.current &&
        !referenceElement.current.contains(event.target) &&
        popperElement.current &&
        !popperElement.current.contains(event.target)
      ) {
        setIsOpen(false);
        if (onClose) onClose(); // Trigger the onClose callback
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsOpen(false);
          if (onClose) onClose(); // Trigger the onClose callback
        }
      },
      { threshold: 0.1 } // Trigger when at least 10% of the element is visible
    );

    if (referenceElement.current) {
      observer.observe(referenceElement.current);
    }

    return () => {
      if (referenceElement.current) {
        observer.unobserve(referenceElement.current);
      }
    };
  }, [onClose]);

  const handleClick = (event) => {
    // Prevent closing when clicking inside the popperElement
    if (popperElement.current && popperElement.current.contains(event.target)) {
      return;
    }
    setIsOpen((prev) => {
      const newState = !prev;
      if (!newState && onClose) onClose(); // Trigger the onClose callback when closing
      return newState;
    });
  };

  const handleSubmit = (...args) => {
    onSubmit(...args); // Safely call onSubmit (default is a no-op)
    setIsOpen(false); // Close the flyout after submission
  };

  return (
    <div
      ref={referenceElement}
      onClick={handleClick}
      className={`${className} ${isOpen ? className.replace(/hover:/g, '') : ''}`}
      style={style}
    >
      {icon}


      {/* Trigger Element */}
      {children}

      {/* Popover Content */}
      {isOpen && (
        <>
          {overlay ? (
            <FloatingOverlay
              style={{
                zIndex: 999,
                webkitTransform: "translate3d(0, 0, 0)",
                transform: "translate3d(0, 0, 0)",
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              }}
              className="bg-red-600"
            >
              <div
                ref={popperElement}
                style={{
                  position: strategy,
                  top: y ?? '',
                  left: x ?? '',
                }}
                className={`bg-white rounded-lg shadow-lg text-sm leading-6 ring-1 ring-gray-900/5 isolate ${width} ${height}`}
              >
                {content(handleSubmit)} {/* Pass handleSubmit to the content */}
                <div 
                  ref={arrowElement} 
                  className="arrow" 
                  style={{
                    position: 'absolute',
                    left: middlewareData.arrow?.x,
                    top: middlewareData.arrow?.y,
                  }}
                />
              </div>
            </FloatingOverlay>
          ) : (
            <div
              ref={popperElement}
              style={{
                position: strategy,
                top: y ?? '',
                left: x ?? '',
                zIndex: 1000,
              }}
              className={`bg-white rounded-lg shadow-lg text-sm leading-6 ring-1 ring-gray-900/5 isolate ${width} ${height}`}
            >
              {content(handleSubmit)} {/* Pass handleSubmit to the content */}
              <div 
                ref={arrowElement} 
                className="arrow" 
                style={{
                  position: 'absolute',
                  left: middlewareData.arrow?.x,
                  top: middlewareData.arrow?.y,
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}