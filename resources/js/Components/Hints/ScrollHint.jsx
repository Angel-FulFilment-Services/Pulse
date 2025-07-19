import { useEffect, useState } from 'react';
import { ArrowDownIcon } from '@heroicons/react/20/solid';

export default function ScrollHint({ scrollRef, basic = false, children }) {
    const [showHint, setShowHint] = useState(false);
    const [hasScroll, setHasScroll] = useState(false);

    useEffect(() => {
        let el = scrollRef.current;
        if (!el) return;

        const checkScroll = () => {
            if (!el) return;
            const isScrollable = el.scrollHeight > el.clientHeight;
            const atBottom = Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 2;
            setShowHint(isScrollable && !atBottom);
            setHasScroll(isScrollable);
        };

        checkScroll();

        el.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        // Observe content size changes
        const resizeObserver = new window.ResizeObserver(checkScroll);
        resizeObserver.observe(el);

        // Also observe children for changes (mutation observer)
        const mutationObserver = new window.MutationObserver(checkScroll);
        mutationObserver.observe(el, { childList: true, subtree: true });

        return () => {
            if (el) {
                el.removeEventListener('scroll', checkScroll);
            }
            window.removeEventListener('resize', checkScroll);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [scrollRef, children]);

    const scrollToBottom = () => {
        const el = scrollRef.current;
        if (el) {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    return basic ? (
        hasScroll && (
            <div className="absolute bottom-[0.295rem] left-0 w-full -mb-1 border-none">
                <div className="flex items-center h-10 justify-center w-full text-gray-500 dark:text-dark-500 bg-gradient-to-t from-white dark:from-dark-900/90 to-transparent">
                    { showHint ? (
                        <span
                            className="text-sm flex items-center justify-center gap-x-1 p-0.5 rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-dark-800/20 dark:ring-dark-700 animate-bounce cursor-pointer"
                            onClick={scrollToBottom}
                        >
                            <ArrowDownIcon className="inline h-3 w-3" />
                            {children}
                        </span>
                    ) : null }
                </div>
            </div>
        )
    ) : (
        showHint ? (
            <div className="absolute bottom-0 left-0 w-full -mb-1 border-none">
                <div className="flex items-center h-10 justify-center w-full text-gray-500 dark:text-dark-500 bg-gradient-to-t from-white dark:from-dark-900/90 to-transparent">
                    <span
                        className="text-sm flex items-center justify-center gap-x-1 p-0.5 rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-dark-800/20 dark:ring-dark-700 animate-bounce cursor-pointer"
                        onClick={scrollToBottom}
                    >
                        <ArrowDownIcon className="inline h-3 w-3" />
                        {children}
                    </span>
                </div>
            </div>
        ) : null
    );
}