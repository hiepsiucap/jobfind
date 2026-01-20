import { X } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray';
  onRemove?: () => void;
  className?: string;
}

const Badge = ({ children, variant = 'blue', onRemove, className = '' }: BadgeProps) => {
  const variants = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${variants[variant]} ${className}`}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-70 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
};

export default Badge;














