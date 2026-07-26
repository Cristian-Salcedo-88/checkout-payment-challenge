import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import './Backdrop.css';

interface BackdropProps {
  children: ReactNode;
  // Omit onClose to make the backdrop non-dismissable (e.g. while a payment
  // is actively being charged and shouldn't be interrupted).
  onClose?: () => void;
}

const Backdrop = ({ children, onClose }: BackdropProps) => {
  // See Modal.tsx for why this is a ref: callers rarely memoize onClose, and
  // this effect should only run once per mount, not on every parent render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return createPortal(
    <div
      className="backdrop-overlay"
      onMouseDown={(event) => {
        if (onClose && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="backdrop-content"
        role={onClose ? 'dialog' : undefined}
        aria-modal={onClose ? true : undefined}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Backdrop;
