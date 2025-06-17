import { useEffect, useState } from 'react';
import { ArrowDownIcon } from '@heroicons/react/20/solid';

export default function ScrollHint({ scrollRef, children }) {
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        const checkScroll = () => {
            const el = scrollRef.current;
            if (!el) return;
            const isScrollable = el.scrollHeight > el.clientHeight;
            const atBottom = Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 2;
            setShowHint(isScrollable && !atBottom);
        };

        checkScroll();
        const raf = requestAnimationFrame(checkScroll);
        const timeout = setTimeout(checkScroll, 1); // <-- Add this line

        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
        }
        return () => {
            if (el) el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
            cancelAnimationFrame(raf);
            clearTimeout(timeout); // <-- And this line
        };
    }, [scrollRef]);

    return showHint ? (
        <div className="absolute bottom-0 left-0 w-full pointer-events-none">
            <div className="flex items-center justify-center w-full text-gray-500 dark:text-dark-500 opacity-75 bg-gradient-to-t from-white dark:from-dark-900/90 to-transparent">
                <span className="text-sm flex items-center justify-center gap-x-1 p-0.5 rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-dark-800/20 animate-bounce">
                    <ArrowDownIcon className="inline h-3 w-3" />
                    {children}
                </span>
            </div>
        </div>
    ) : null;
}