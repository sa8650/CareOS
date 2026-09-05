export default function Button({ children, variant = 'primary', size, loading, disabled, className = '', ...props }) {
  const classes = ['btn', `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(' ');
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />}
      {children}
    </button>
  );
}
