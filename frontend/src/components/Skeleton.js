import React from 'react';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', margin = '10px 0' }) => {
    return (
        <div
            className="skeleton-pulse"
            style={{
                width,
                height,
                borderRadius,
                margin,
                background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%)',
                backgroundSize: '200% 100%',
                animation: 'pulse 1.5s infinite ease-in-out'
            }}
        />
    );
};

export default Skeleton;
