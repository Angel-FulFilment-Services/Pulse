import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, DocumentTextIcon, EyeIcon, TagIcon, SpeakerWaveIcon, WrenchIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import ScrollHint from '../../../Hints/ScrollHint';

// Get icon component based on article category
const getCategoryIcon = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower === 'call hub') {
        return SpeakerWaveIcon;
    } else if (categoryLower === 'technical support') {
        return WrenchIcon;
    }
    return DocumentTextIcon;
};
import useFetchLatestArticles from '../../../Fetches/Dashboard/useFetchLatestArticles.jsx';
import TextInput from '../../../Forms/TextInput.jsx';

const KnowledgeBaseWidget = ({ employee, isExpanded, isPreview = false }) => {
    // Preview mode - return static dummy content
    if (isPreview) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="mb-2 h-9 bg-gray-100 dark:bg-dark-800 rounded-md flex items-center px-3">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-400">Search...</span>
                </div>
                <div className="flex gap-2 mb-2">
                    <span className="px-3 py-1.5 text-xs font-medium bg-theme-50 text-theme-700 dark:bg-theme-900/30 dark:text-theme-400 rounded-lg">All</span>
                    <span className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-300 rounded-lg">Call Hub</span>
                </div>
                <div className="space-y-2">
                    {['Getting Started Guide', 'How to Reset Password', 'Call Hub Overview', 'Your Account Settings'].map((title, i) => (
                        <div key={i} className="border border-gray-200 dark:border-dark-700 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-theme-50 dark:bg-theme-900/30 flex items-center justify-center">
                                    <DocumentTextIcon className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-dark-100">{title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-dark-300 px-2 py-0.5 rounded-full">Guide</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [limitedArticles, setLimitedArticles] = useState([]);
    const initialLoadDone = useRef(false);
    const scrollRef = useRef(null);
    
    // Pass search query to the hook - it will debounce and fetch from API
    const { articles, categories, isLoading, isLoaded } = useFetchLatestArticles(selectedCategory, 10, searchQuery);
    
    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    
    const handleArticleClick = (article) => {
        // Navigate to the article
        router.visit(`/knowledge-base/article/${article.id}`);
    };
    
    // Only show loading skeleton on initial load, not when switching tabs
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);
    
    useEffect(() => {
        // Limit the articles count to 3 when not expanded
        if (!isExpanded && articles.length > 3) {
            setLimitedArticles(articles.slice(0, 3));
        } else {
            setLimitedArticles(articles);
        }
    }, [isExpanded, articles]);

    if (showSkeleton) {
        return (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Search skeleton */}
                <div className="mb-2">
                    <div className="h-9 bg-gray-100 dark:bg-dark-700 rounded-md animate-pulse"></div>
                </div>
                
                {/* Tabs skeleton */}
                <div className="flex gap-2 mb-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-7 w-20 bg-gray-100 dark:bg-dark-800 rounded-lg animate-pulse"></div>
                    ))}
                </div>
                
                {/* Articles skeleton */}
                <div className="space-y-2 flex-1 overflow-hidden">
                    {(isExpanded ? [1, 2, 3, 4, 5, 6] : [1, 2, 3]).map((i) => (
                        <div key={i} className={`border border-gray-200 dark:border-dark-700 rounded-lg p-3 ${isExpanded ? 'py-[1.70rem]' : ''} animate-pulse`}>
                            <div className="flex items-center gap-3 py-1">
                                <div className="h-8 w-8 bg-gray-200 dark:bg-dark-700 rounded-lg flex-shrink-0"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-dark-700 rounded"></div>
                                    <div className="h-4 w-1/4 bg-gray-200 dark:bg-dark-800 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
            {/* Search bar */}
            <div className="mb-2">
                <TextInput
                    id="knowledge-search"
                    placeholder="Search knowledge base..."
                    currentState={searchQuery}
                    onTextChange={(val) => setSearchQuery(Array.isArray(val) ? val[0]?.value : val)}
                    returnRaw={true}
                    Icon={MagnifyingGlassIcon}
                />
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1 flex-shrink-0">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        selectedCategory === null
                            ? 'bg-theme-50 text-theme-700 dark:bg-theme-900/30 dark:text-theme-400 border border-theme-200 dark:border-theme-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700'
                    }`}
                >
                    All
                </button>
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category.toLowerCase().replace(/\s+/g, '-'))}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                            selectedCategory === category.toLowerCase().replace(/\s+/g, '-')
                                ? 'bg-theme-50 text-theme-700 dark:bg-theme-900/30 dark:text-theme-400 border border-theme-200 dark:border-theme-800'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Articles list */}
            <div ref={scrollRef} className={`flex-1 overflow-y-auto ${limitedArticles.length === 0 ? 'flex items-center justify-center' : 'space-y-2'} ${isLoading ? 'opacity-50' : ''} transition-opacity`}>
                {limitedArticles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center px-4">
                        <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-dark-600 mb-3" />
                        {searchQuery.trim() ? (
                            <>
                                <p className="text-sm font-medium text-gray-600 dark:text-dark-300 mb-1">
                                    No results for "{searchQuery}"
                                </p>
                                <p className="text-xs text-gray-500 dark:text-dark-400">
                                    Try adjusting your search or browse by category
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gray-600 dark:text-dark-300 mb-1">
                                    No articles available
                                </p>
                                <p className="text-xs text-gray-500 dark:text-dark-400">
                                    Check back later for new content
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    limitedArticles.map((article) => (
                        <div 
                            key={article.id} 
                            onClick={() => handleArticleClick(article)}
                            className="border border-gray-200 dark:border-dark-700 group rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer transition-all"
                        >
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const IconComponent = getCategoryIcon(article.category);
                                    return (
                                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-theme-50 border border-theme-200 dark:border-theme-800 dark:bg-theme-900/30 flex items-center justify-center">
                                            <IconComponent className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                                        </div>
                                    );
                                })()}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors">
                                        {article.title}
                                    </p>
                                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-dark-300">
                                            {article.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-400">
                                            <EyeIcon className="h-3 w-3" />
                                            <span>{article.visits || 0} views</span>
                                        </div>
                                    </div>
                                    {/* Tags - only when expanded */}
                                    {Array.isArray(article.tags) && article.tags.length > 0 && isExpanded && (
                                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                                            <TagIcon className="h-3 w-3 text-gray-400 dark:text-dark-500 flex-shrink-0" />
                                            {article.tags.slice(0, 3).map((tag, index) => (
                                                <span 
                                                    key={index}
                                                    className="text-xs text-gray-500 dark:text-dark-400 bg-gray-100 dark:bg-dark-700 px-1.5 py-0.5 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {article.tags.length > 3 && (
                                                <span className="text-xs text-gray-400 dark:text-dark-500">
                                                    +{article.tags.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Scroll hint */}
            <ScrollHint scrollRef={scrollRef} basic={false} />
        </div>
    );
};

export default KnowledgeBaseWidget;
