import { Link } from 'react-router-dom';

export default function Button({ children, to, onClick, variant = 'primary', className = '', ...props }) {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-full transition focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500',
    secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500',
  };

  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes} {...props}>
      {children}
    </button>
  );
}