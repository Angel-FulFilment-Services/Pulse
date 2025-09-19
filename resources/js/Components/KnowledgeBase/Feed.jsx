import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import useFetchArticles from '../Fetches/KnowledgeBase/useFetchArticles';
import { Link } from '@inertiajs/react'
import FilterControl from '../Controls/FilterControl.jsx';

// Layout configuration - easily changeable by developers
const LAYOUT_CONFIG = {
  default: {
    style: 'card', // Options: 'card', 'condensed'
    showReadTime: true,
    showViews: true,
    showTags: true,
    maxTags: 10, // Maximum tags to show in condensed view
  },
  'call-hub': {
    style: 'condensed', // Use condensed layout for call-hub tab
    showDescription: false,
    showReadTime: true,
    showViews: true,
    showTags: true,
    maxTags: 5, // Show fewer tags in condensed view
  }
};

function applyFilters(data, filters = []) {
  // If no filters are provided, return the original data
  if (!filters || filters.length === 0) {
    return data;
  }

  return data.filter((item) => {
    return filters.every((filter) => {
      const filterExpression = filter.expression(item);

      // Group options by mode
      if (filter.advanced) {
        const checkedOptions = filter.options.filter(opt => opt.checked);
        const uncheckedOptions = filter.options.filter(opt => !opt.checked);

        if (checkedOptions.length === 0) return false;

        // "solo" mode: always include if checked and matches
        if (checkedOptions.some(opt => opt.mode === 'solo' && filterExpression(opt.value))) {
          return true;
        }

        // "and" mode: must match at least one checked "and" and not match any unchecked
        const checkedAndOptions = checkedOptions.filter(opt => opt.mode === 'and');
        if (checkedAndOptions.length > 0) {
          const matchesAnd = checkedAndOptions.some(opt => filterExpression(opt.value));
          const matchesUnchecked = uncheckedOptions.some(opt => filterExpression(opt.value));
          return matchesAnd && !matchesUnchecked;
        }

        // Fallback: must match at least one checked and not match any unchecked
        const matchesChecked = checkedOptions.some(opt => filterExpression(opt.value));
        const matchesUnchecked = uncheckedOptions.some(opt => filterExpression(opt.value));
        return matchesChecked && !matchesUnchecked;
      }

      if (filter.id === 'include') {
        // For "include" filters, check if the item matches any of the options
        return filter.options.some((option) => {
          if (option.checked) {
            return filterExpression(option.value);
          }
          return false;
        });
      }

      if (filter.id === 'exclude') {
        // For "exclude" filters, check if the item does not match any of the options
        return !filter.options.some((option) => {
          if (option.checked) {
            return filterExpression(option.value);
          }
          return false;
        });
      }

      const activeOptions = filter.options.filter((option) => option.checked);

      // If no options are checked, include all items
      if (activeOptions.length === 0) {
        return true;
      }

      // Check if the item matches any of the active filter options
      return activeOptions.some((option) => filterExpression(option.value));
    });
  });
}

// Card layout component (current layout)
const ArticleCard = ({ post, config }) => (
  <article className="flex max-w-full flex-col items-start justify-between pt-4">
    <div className="flex items-center gap-x-4 text-xs">
      <time dateTime={post.datetime} className="text-gray-500">
        {post.date}
      </time>
      {config.showReadTime && (
        <span className="text-gray-500">
          {post.read_time} min read
        </span>
      )}
      {config.showViews && (
        <span className="text-gray-500">
          {post.visits} views
        </span>
      )}
      {config.showTags && (
        <div className="flex flex-wrap gap-2">
          {post.tags && post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="relative z-10 rounded-full bg-theme-50 px-3 py-1.5 font-medium text-theme-600 ring-1 ring-theme-500/10 dark:bg-theme-600 dark:text-theme-300 dark:ring-theme-700/20 cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
    <div className="group relative cursor-pointer">
      <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
        <Link href={`/knowledge-base/article/${post.id}`} className="focus:outline-none">
          <span className="absolute inset-0" />
          {post.title}
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{post.description}</p>
    </div>
  </article>
);

// Condensed list layout component
const ArticleCondensed = ({ post, config }) => (
  <article className="flex items-center justify-between py-3">
    <div className="flex-1 min-w-0 group relative cursor-pointer">
      <div className="flex items-center gap-x-3">
        <div className="">
          <h3 className="font-semibold text-gray-900 dark:text-dark-100 group-hover:text-gray-600 truncate">
            <Link href={`/knowledge-base/article/${post.id}`} className="focus:outline-none">
              <span className="absolute inset-0" />
              {post.title}
            </Link>
          </h3>
        </div>
        {config.showTags && post.tags && post.tags.slice(0, config.maxTags).map((tag, idx) => (
          <span
            key={idx}
            className="relative z-10 rounded-full bg-theme-50 px-3 py-1.5 font-medium text-xs text-theme-600 ring-1 ring-theme-500/10 dark:bg-theme-600 dark:text-theme-300 dark:ring-theme-700/20 cursor-pointer"
          >
            {tag}
          </span>
        ))}
        {config.showTags && post.tags && post.tags.length > config.maxTags && (
          <span className="text-xs text-gray-500 dark:text-dark-400">
            +{post.tags.length - config.maxTags} more
          </span>
        )}
      </div>
      {config.showDescription && (
        <p className="text-sm text-gray-600 dark:text-dark-300 line-clamp-1 mt-2">{post.description}</p>
      )}
    </div>
    <div className="flex items-center gap-x-4 text-xs text-gray-500 dark:text-dark-400 ml-4 flex-shrink-0">
      <time dateTime={post.datetime}>{post.date}</time>
      {config.showReadTime && (
        <span>{post.read_time} min read</span>
      )}
      {config.showViews && (
        <span>{post.visits} views</span>
      )}
    </div>
  </article>
);

export default function Feed({ searchTerm, activeTab, refreshTrigger }) {
  const { articles, isLoading, isLoaded } = useFetchArticles(activeTab, refreshTrigger);

  // Get the layout configuration for the current tab
  const layoutConfig = LAYOUT_CONFIG[activeTab] || LAYOUT_CONFIG.default;

  const formattedPosts = useMemo(() => articles.map((article) => ({
    id: article.id,
    title: article.title,
    description: article.description,
    category: article.category,
    date: article.published_at ? new Date(article.published_at).toLocaleDateString('en-UK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) : 'No date',
    datetime: article.published_at ? article.published_at : new Date().toISOString(),
    tags: JSON.parse(article.tags || '[]'),
    visits: article.visits || 0,
    read_time: article.read_time || 1,
  })), [articles]);

  // State for filters - initialize as empty array
  const [filters, setFilters] = useState([]);

  // Initialize filters when articles are loaded for the first time
  useEffect(() => {
    if (formattedPosts.length > 0 && filters.length === 0) {
      // Get unique tags for tag filter
      const uniqueTags = [...new Set(formattedPosts.flatMap(post => post.tags))].sort();

      const initialFilters = [
        {
          id: 'tags',
          name: 'Tags',
          label: 'Tags',
          expression: (item) => (value) => item.tags.includes(value),
          options: uniqueTags.map(tag => ({
            label: tag,
            value: tag,
            checked: false
          }))
        },
        {
          id: 'readTime',
          name: 'Read Time',
          label: 'Read Time',
          expression: (item) => (value) => {
            switch(value) {
              case 'quick': return item.read_time <= 2;
              case 'medium': return item.read_time >= 3 && item.read_time <= 5;
              case 'long': return item.read_time > 5;
              default: return true;
            }
          },
          options: [
            { label: 'Quick Read (≤2 min)', value: 'quick', checked: false },
            { label: 'Medium Read (3-5 min)', value: 'medium', checked: false },
            { label: 'Long Read (>5 min)', value: 'long', checked: false }
          ]
        },
        {
          id: 'popularity',
          name: 'Popularity',
          label: 'Popularity',
          expression: (item) => (value) => {
            const maxVisits = Math.max(...formattedPosts.map(p => p.visits));
            const threshold = maxVisits * 0.3; // Top 30% are considered popular
            
            switch(value) {
              case 'popular': return item.visits >= threshold;
              case 'unpopular': return item.visits < threshold;
              default: return true;
            }
          },
          options: [
            { label: 'Popular Articles', value: 'popular', checked: false },
            { label: 'Less Popular Articles', value: 'unpopular', checked: false }
          ]
        }
      ];
      
      setFilters(initialFilters);
    }
  }, [formattedPosts.length]);

  // Filter posts based on search term
  const searchFilteredPosts = formattedPosts.filter((post) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      post.title.toLowerCase().includes(searchLower) ||
      post.description.toLowerCase().includes(searchLower) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
      searchLower.includes(post.title.toLowerCase()) ||
      searchLower.includes(post.description.toLowerCase()) ||
      post.tags.some((tag) => searchLower.includes(tag.toLowerCase()))
    );
  });

  // Apply filters to the search-filtered posts
  const filteredPosts = applyFilters(searchFilteredPosts, filters);

  // Filter change handler
  const handleFilterChange = (filterUpdate) => {
    const updatedFilters = filters.map(filter => {
      if (filter.id === filterUpdate.id) {
        return {
          ...filter,
          options: filter.options.map(option => {
            if (option.value === filterUpdate.value) {
              return {
                ...option,
                checked: filterUpdate.checked
              };
            }
            return option;
          })
        };
      }
      return filter;
    });
    
    setFilters(updatedFilters);
  };

  // Clear filters handler
  const clearFilters = () => {
    const clearedFilters = filters.map(filter => ({
      ...filter,
      options: filter.options.map(option => ({
        ...option,
        checked: false
      }))
    }));
    setFilters(clearedFilters);
  };

  

  return (
    <div className="bg-white dark:bg-dark-900">
      {
        isLoaded && (
          <div className={`px-6 py-4 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 shadow-sm slide-down z-20 ${false ? 'pointer-events-none' : ''}`}>
            <FilterControl 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              clearFilters={clearFilters} 
            />
          </div>
        )
      }
      
      <div className="mx-auto max-w-full w-full px-6 lg:px-8">
        <div className="mx-auto max-w-full w-full">
          <div className="mt-2 w-full space-y-4">
            {layoutConfig.style === 'condensed' ? (
              // Condensed list layout
              <motion.div
                className="overflow-y-auto h-screen pb-96 no-scrollbar divide-y divide-gray-200 dark:divide-dark-700"
                layout
              >
                <AnimatePresence>
                  {filteredPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="bg-white dark:bg-dark-900"
                    >
                      <ArticleCondensed post={post} config={layoutConfig} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              // Card layout (original)
              <motion.ul
                className="overflow-y-auto h-screen pb-96 no-scrollbar divide-y divide-gray-200 dark:divide-dark-700"
                layout
              >
                <AnimatePresence>
                  {filteredPosts.map((post) => (
                    <motion.li
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: -30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 30 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="flex justify-between gap-x-6 py-2 bg-white dark:bg-dark-900"
                    >
                      <ArticleCard post={post} config={layoutConfig} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}