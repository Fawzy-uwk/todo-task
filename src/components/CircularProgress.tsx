import React from 'react';

// Define props interface for TypeScript
interface CircularProgressProps {
    percentage: number; // Explicitly typed as number
}

// Use React.FC for TSX with typed props
const CircularProgress: React.FC<CircularProgressProps> = ({ percentage }) => {
    
    return (
        <div className="relative size-12">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                {/* Background Circle */}
                <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-current text-primary/15 dark:text-primary"
                    strokeWidth="2"
                />
                {/* Progress Circle */}
                <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className={`stroke-current transition-all duration-300 ease-in-out ${percentage > 50 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                        }`}
                    strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset={100 - Math.min(Math.max(percentage, 0), 100)} // Clamp between 0-100
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-primary">
                {percentage}%
            </div>
        </div>
    );
};

export default CircularProgress;