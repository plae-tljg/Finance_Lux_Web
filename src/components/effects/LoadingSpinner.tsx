interface LuxurySpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'secondary' | 'success';
}

const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
};

const colorClasses = {
    primary: 'border-blue-500 border-t-transparent',
    secondary: 'border-purple-500 border-t-transparent',
    success: 'border-green-500 border-t-transparent',
};

export default function LuxurySpinner({ size = 'md', color = 'primary' }: LuxurySpinnerProps) {
    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-4 border-opacity-50 rounded-full animate-spin ${colorClasses[color]}`}
            />
        </div>
    );
}

interface LuxurySkeletonProps {
    className?: string;
}

export function LuxurySkeleton({ className = '' }: LuxurySkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded-lg ${className}`}
            style={{ animation: 'shimmer 1.5s infinite linear' }}
        />
    );
}
