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
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: '95vw',
          background: '#ffffff',           // light background
          color: '#0f172a',                // dark text
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #eee',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          color: '#0f172a'                 // dark title
        }}>
          <strong style={{ fontSize: 16 }}>{title}</strong>
          <button onClick={onClose} aria-label="Close"
            style={{ background:'transparent', border:'none', fontSize:20, cursor:'pointer', color:'#0f172a' }}>×</button>
        </div>

        <div style={{ padding: 18 }}>
          {children}
        </div>

        {footer && (
          <div style={{ padding: 14, borderTop: '1px solid #eee', display:'flex', justifyContent:'flex-end', gap:8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
