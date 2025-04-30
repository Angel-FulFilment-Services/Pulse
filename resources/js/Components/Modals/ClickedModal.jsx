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
    xs: { width: 'lg:w-[40%]', height: 'lg:h-[50%]' }, 
    sm: { width: 'lg:w-[50%]', height: 'lg:h-[60%]' }, 
    md: { width: 'lg:w-[60%]', height: 'lg:h-[70%]' }, 
    lg: { width: 'lg:w-[70%]', height: 'lg:h-[80%]' }, 
    xl: { width: 'lg:w-[80%]', height: 'lg:h-[90%]' }, 
    "2xl": { width: 'lg:w-[90%]', height: 'lg:h-[100%]' },
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
                flexDirection: "row"
              }}
            >
              <div className="hidden lg:flex lg:flex-col min-w-72 w-72"></div>
              <div
                style={{
                  width:"100%",
                  height:"100%",
                  postion:"relative",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div 
                  ref={popperElement}
                  id={"modal-content"}
                  className={`bg-white rounded-none lg:rounded-lg shadow-lg text-sm leading-6 ring-1 ring-gray-900/5 flex flex-shrink mt-16 lg:mt-0 w-full h-[calc(100vh-4rem)] ${sizeClasses[size]?.width} ${sizeClasses[size]?.height}`}
                >
                  {content(handleSubmit, handleClose)} {/* Pass handleSubmit and handleClose */}
                </div>
              </div>
            </FloatingOverlay>
          ) : (
            <>
              <div className="hidden lg:flex lg:flex-col min-w-72 w-72"></div>
              <div
                style={{
                  width:"100%",
                  height:"100%",
                  postion:"relative",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  ref={popperElement}
                  className={`bg-white rounded-none lg:rounded-lg shadow-lg text-sm leading-6 ring-1 ring-gray-900/5 flex flex-shrink mt-16 w-full h-[calc(100vh-4rem)] ${sizeClasses[size]?.width} ${sizeClasses[size]?.height}`}
                >
                  {content(handleSubmit, handleClose)} {/* Pass handleSubmit and handleClose */}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}