// client/stocktrack-web/src/components/Modal.tsx
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  width?: number;
};

export default function Modal({ open, title, children, footer, onClose, width = 520 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-overlay)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        overflowY: 'auto',
        zIndex: 9999,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: '95vw',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--color-border)',
          marginBottom: 40,
        }}
      >
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--color-border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          color: 'var(--color-heading)'
        }}>
          <strong style={{ fontSize: 16 }}>{title}</strong>
          <button onClick={onClose} aria-label="Close"
            style={{ background:'transparent', border:'none', fontSize:20, cursor:'pointer', color:'var(--color-text)' }}>×</button>
        </div>

        <div style={{ padding: 18 }}>
          {children}
        </div>

        {footer && (
          <div style={{ padding: 14, borderTop: '1px solid var(--color-border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
