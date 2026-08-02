import React from 'react';

/* ─── StarRating Display ──────────────────────────────────────────────────── */
export const StarRating = ({ rating = 0, size = 16, showNumber = true }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {stars.map(s => (
          <span
            key={s}
            style={{
              fontSize: size,
              color: s <= Math.round(rating) ? '#ffd700' : 'var(--text-muted)',
              lineHeight: 1,
            }}
          >
            ★
          </span>
        ))}
      </div>
      {showNumber && (
        <span style={{ fontSize: size - 2, color: 'var(--text-secondary)', fontWeight: 600 }}>
          {rating > 0 ? rating.toFixed(1) : 'No ratings'}
        </span>
      )}
    </div>
  );
};

/* ─── Interactive Star Picker ────────────────────────────────────────────── */
export const StarPicker = ({ value, onChange }) => {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 30,
            cursor: 'pointer',
            color: s <= (hovered || value) ? '#ffd700' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
            transform: s <= (hovered || value) ? 'scale(1.2)' : 'scale(1)',
            lineHeight: 1,
            padding: '2px',
          }}
          id={`star-${s}`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][value]}
        </span>
      )}
    </div>
  );
};
