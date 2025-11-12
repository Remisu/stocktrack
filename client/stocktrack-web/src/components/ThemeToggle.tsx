import { useTheme } from '../context/ThemeContext';

type ThemeToggleProps = {
  variant?: 'inline' | 'floating';
};

export default function ThemeToggle({ variant = 'inline' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const floating = variant === 'floating';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        border: '1px solid var(--color-border-strong)',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 9999,
        cursor: 'pointer',
        fontWeight: 600,
        boxShadow: floating ? 'var(--shadow-card)' : 'none',
        position: floating ? 'fixed' : undefined,
        top: floating ? '20px' : undefined,
        right: floating ? 'clamp(16px, 4vw, 32px)' : undefined,
        zIndex: floating ? 1000 : undefined,
      }}
    >
      <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Night' : 'Day'} mode</span>
    </button>
  );
}
