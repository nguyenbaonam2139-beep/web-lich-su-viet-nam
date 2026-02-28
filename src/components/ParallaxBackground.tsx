import React, { useEffect, useState } from 'react';
import './ParallaxBackground.css';

export const ParallaxBackground: React.FC = () => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="parallax-container">
            {/* Layer 1: Distant Background (Slowest) */}
            <div
                className="parallax-layer layer-1"
                style={{ transform: `translateY(${scrollY * 0.2}px)` }}
            >
                <div className="bg-pattern-dots"></div>
            </div>

            {/* Layer 2: Mid-ground (Medium Speed) */}
            <div
                className="parallax-layer layer-2"
                style={{ transform: `translateY(${scrollY * 0.4}px)` }}
            >
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
            </div>

            {/* Layer 3: Foreground (Fastest - Subtle particles) */}
            <div
                className="parallax-layer layer-3"
                style={{ transform: `translateY(${scrollY * 0.6}px)` }}
            >
                <div className="floating-particle p1"></div>
                <div className="floating-particle p2"></div>
                <div className="floating-particle p3"></div>
            </div>
        </div>
    );
};
