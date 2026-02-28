import React, { useEffect, useState } from 'react';
import './TimelineNavigator.css';
import { TimelineEvent } from '../types';

interface TimelineNavigatorProps {
    events: TimelineEvent[];
    onYearSelect: (id: number) => void;
}

export const TimelineNavigator: React.FC<TimelineNavigatorProps> = ({ events, onYearSelect }) => {
    const [activeYear, setActiveYear] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            // Find visible event
            // This is a simplified check; usually use IntersectionObserver
            // For sticky nav, we just check scroll position relative to elements
            // But implementing full scroll spy is complex.
            // We'll trust the user interaction for now or add a basic check later.
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const sortedEvents = [...events].sort((a, b) => a.year - b.year);

    const handleClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        onYearSelect(id);
        setActiveYear(id); // Optimistic update
    };

    return (
        <div className="timeline-navigator">
            <div className="nav-track"></div>
            <div className="nav-items">
                {sortedEvents.map((event) => (
                    <div
                        key={event.id}
                        className={`nav-item ${activeYear === event.id ? 'active' : ''}`}
                        onClick={(e) => handleClick(e, event.id)}
                        title={`${event.year} - ${event.title}`}
                    >
                        <span className="nav-year">{event.year}</span>
                        <span className="nav-dot"></span>
                    </div>
                ))}
            </div>
        </div>
    );
};
