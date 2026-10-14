import React, { useState, useEffect } from 'react';

export const LiveClockWidget: React.FC = () => {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedLiveTime = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedLiveDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="bg-black/20 backdrop-blur-md rounded-2xl px-4 py-2 text-right border border-white/10 flex-1 sm:flex-initial">
            <div className="text-xl font-black tracking-wider text-teal-100 font-mono">
                {formattedLiveTime} <span className="text-xs font-normal">WIB</span>
            </div>
            <div className="text-[11px] text-teal-100/80 font-medium">
                {formattedLiveDate}
            </div>
        </div>
    );
};
