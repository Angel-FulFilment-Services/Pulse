import { useState, useRef, useEffect } from 'react';
import { useFloating, autoUpdate } from '@floating-ui/react-dom';
import { FloatingOverlay } from '@floating-ui/react';

export default function ClickedModal({
  placement = 'top',
  size = 'md', // Default size
  overlay = false,
  className = '',
  style = {},
  children, // Trigger element
  content, // Modal content
  icon,
  onClose, // Callback for handling closure events
  onSubmit = () => {}, // Default to a no-op function
}) {
  const [isOpen, setIsOpen] = useState(false);
  const referenceElement = useRef(null);
  const popperElement = useRef(null);
  const arrowElement = useRef(null);

  const sizeClasses = {
    xs: { width: '50rem', height: '25rem' }, 
    sm: { width: '60rem', height: '30rem' }, 
    md: { width: '70rem', height: '40rem' }, 
    lg: { width: '80rem', height: '50rem' }, 
    xl: { width: '90rem', height: '60rem' }, 
    "2xl": { width: '95rem', height: '65rem' },
  };

  const { x, y, strategy, middlewareData, context, update } = useFloating({
    placement: placement,
    strategy: 'absolute',
    middleware: [],
  });

  useEffect(() => {
    if (isOpen) {
      const cleanup = autoUpdate(referenceElement.current, popperElement.current, update);
      return () => cleanup();
    }
  }, [isOpen, update]);

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
    setIsOpen(false); // Close the modal after submission
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
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

      {/* Modal Content */}
      {isOpen && (
        <>
          {overlay ? (
            <FloatingOverlay
              style={{
                zIndex: 999,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                ref={popperElement}
                style={{
                  width: sizeClasses[size]?.width, // Dynamically set width
                  height: sizeClasses[size]?.height, // Dynamically set height
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className={`bg-white rounded-lg shadow-lg text-sm leading-6 ring-1 ml-0 lg:ml-72 ring-gray-900/5`}
              >
                {content(handleSubmit, handleClose)} {/* Pass handleSubmit and handleClose */}
              </div>
            </FloatingOverlay>
          ) : (
            <div
              ref={popperElement}
              style={{
                width: sizeClasses[size]?.width, // Dynamically set width
                height: sizeClasses[size]?.height, // Dynamically set height
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className={`bg-white rounded-lg shadow-lg text-sm leading-6 ring-1 ring-gray-900/5`}
            >
              {content(handleSubmit, handleClose)} {/* Pass handleSubmit and handleClose */}
            </div>
          )}
        </>
      )}
    </div>
  );
}