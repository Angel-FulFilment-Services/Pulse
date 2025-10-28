import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import useFetchConfigurations from '../Fetches/Administration/useFetchConfigurations.jsx';
import { Link } from '@inertiajs/react'
import { hasPermission } from '../../Utils/Permissions';
import FilterControl from '../Controls/FilterControl.jsx';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';

// Layout configuration - easily changeable by developers
const LAYOUT_CONFIG = {
  default: {
    style: 'condensed', // Use condensed layout for call-hub tab
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

// Condensed list layout component
const ArticleCondensed = ({ post, config, refetch }) => {
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  const handleEditClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    toast.promise(
      axios.post('https://free-gifts.co.uk/api/template/generate-template-edit-url', {
        template_id: post.id
      }, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ANGEL_GIFT_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }),
      {
        pending: 'Opening template editor, please wait...',
        success: {
          render({ data }) {
            if (data?.data?.data?.signed_url) {
              setShowConfirmationDialog(true);
              window.open(data.data?.data.signed_url, '_blank', 'width=1400,height=900,left=100,top=50,scrollbars=yes,resizable=yes');
              return 'Template editor opened successfully in a window.';
            }
            return 'Failed to open template editor. Please try again.';
          }
        },
        error: {
          render({ data }) {
            console.error('Error message:', data?.message);
            return 'Failed to open template editor. Please try again.';
          }
        }
      },
      {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      }
    );
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false);
    
    toast.promise(
      axios.delete(`/knowledge-base/article/${post.id}`),
      {
        pending: 'Deleting article...',
        success: 'Article deleted successfully!',
        error: {
          render({ data }) {
            console.error('Error deleting article:', data);
            return 'Failed to delete article. Please try again.';
          }
        }
      },
      {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      }
    ).then(() => {
      if (onDelete) {
        onDelete(post.id);
      }
    }).catch(() => {
      // Error is already handled by toast.promise
    });
  };

  return (

    <article className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 group relative">
        <div className="flex items-center gap-x-3">
          <div className="">
            <h3 className="font-semibold text-gray-900 dark:text-dark-100 truncate">
              <div className="focus:outline-none">
                <span className="absolute inset-0" />
                {post.client_name}
              </div>
            </h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-dark-300 line-clamp-1 mt-2">{post.product_name}</p>
      </div>
      <div className="flex items-center gap-x-4 text-xs text-gray-500 dark:text-dark-400 ml-4 flex-shrink-0">
        <p>Template ID: <span className="font-medium text-gray-600 dark:text-dark-100 pl-1">{post.id}</span></p>
        <div className="border-l border-gray-200 dark:border-dark-700 h-4" />
        <time dateTime={post.created_at}>Created: { new Date(post.created_at).toLocaleString('en-GB')}</time>
        { post.updated_at && post.updated_at !== post.created_at && (
          <>
            <div className="border-l border-gray-200 dark:border-dark-700 h-4" />
            <time dateTime={post.updated_at}>Last Updated: { new Date(post.updated_at).toLocaleString('en-GB')}</time>
          </>
        )}
        <div className="border-l border-gray-200 dark:border-dark-700 h-4" />
        <div className="flex items-center gap-x-2">
          <button
            onClick={handleEditClick}
            className="relative p-1 text-gray-500 hover:text-gray-600 dark:text-dark-400 dark:hover:text-dark-300 transition-colors duration-200"
            title={`Edit "${post.title}"`}
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {/* {hasPermission("pulse_delete_articles") && (
            <button
              onClick={handleDeleteClick}
              className="relative p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
              title={`Delete "${post.title}"`}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )} */}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        title="Editing Template"
        description={`The template editor has opened in a new window. When you're finished editing, click 'Done' to reload and see your changes.`}
        isYes={refetch}
        type="info"
        yesText="Done"
        cancelText="Cancel"
      />
    </article>
  );
};

export default function Feed({ searchTerm, activeTab, refreshTrigger }) {
  const { configurations, isLoading, isLoaded, refetch } = useFetchConfigurations(refreshTrigger);

  // Get the layout configuration for the current tab
  const layoutConfig = LAYOUT_CONFIG[activeTab] || LAYOUT_CONFIG.default;

  // Handle article deletion
  const handleConfigurationDelete = (deletedId) => {
    // Refetch articles to update the list
    refetch();
  };

  const formattedConfigurations = useMemo(() => configurations.map((configuration) => ({
    id: configuration.id,
    client_name: configuration.client_name,
    product_name: configuration.product_name,
    created_at: configuration.created_at ? new Date(configuration.created_at).toISOString('EN-uk') : null,
    updated_at: configuration.updated_at ? new Date(configuration.updated_at).toISOString('EN-uk') : null,
  })), [configurations]);

  // State for filters - initialize as empty array
  const [filters, setFilters] = useState([]);

  // Initialize filters when configurations are loaded for the first time
  useEffect(() => {
    if (formattedConfigurations.length > 0 && filters.length === 0) {
      // Get unique product names and client names for filters
      const uniqueProductNames = [...new Set(formattedConfigurations.map(config => config.product_name))].sort();
      const uniqueClientNames = [...new Set(formattedConfigurations.map(config => config.client_name))].sort();

      const initialFilters = [
        {
          id: 'product_name',
          name: 'Product Name',
          label: 'Product Name',
          expression: (item) => (value) => item.product_name === value,
          options: uniqueProductNames.map(name => ({
            label: name,
            value: name,
            checked: false
          }))
        },
        {
          id: 'client_name',
          name: 'Client Name',
          label: 'Client Name',
          expression: (item) => (value) => item.client_name === value,
          options: uniqueClientNames.map(name => ({
            label: name,
            value: name,
            checked: false
          }))
        }
      ];
      
      setFilters(initialFilters);
    }
  }, [formattedConfigurations.length]);

  // Filter configurations based on search term
  const searchFilteredConfigurations = formattedConfigurations.filter((config) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      config.client_name.toLowerCase().includes(searchLower) ||
      config.product_name.toLowerCase().includes(searchLower)
    );
  });

  // Apply filters to the search-filtered configurations
  const filteredConfigurations = applyFilters(searchFilteredConfigurations, filters);

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
      {isLoading && !isLoaded && (
        <div className="flex flex-col items-center min-h-svh justify-center w-full pb-72">
          <div className="flex gap-3 justify-center">
            <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader"></div>
            <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader animation-delay-200"></div>
            <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader animation-delay-[400ms]"></div>
          </div>
        </div>
      )}
      { isLoaded && (
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
                    {filteredConfigurations.map((config) => (
                      <motion.div
                        key={config.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="bg-white dark:bg-dark-900"
                      >
                        <ArticleCondensed post={config} config={layoutConfig} onDelete={handleConfigurationDelete} refetch={refetch} />
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
                    {filteredConfigurations.map((config) => (
                      <motion.li
                        key={config.id}
                        layout
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="flex justify-between gap-x-6 py-2 bg-white dark:bg-dark-900"
                      >
                        <ArticleCard post={config} config={layoutConfig} onDelete={handleConfigurationDelete} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}