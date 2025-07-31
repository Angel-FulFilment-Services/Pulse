import React from 'react';
import UserIcon from '../User/UserIcon';
import { motion, AnimatePresence } from 'framer-motion';

const posts = [
  {
    id: 1,
    title: 'How to Use the Knowledge Base',
    href: '#',
    description:
      'Learn how to navigate and make the most out of our knowledge base. Tips, tricks, and best practices for finding the information you need.',
    date: 'Jul 31, 2025',
    datetime: '2025-07-31',
    tags: ['Getting Started', 'Help', 'Navigation'],
  },
  {
    id: 2,
    title: 'Submitting a New Article',
    href: '#',
    description:
      'A step-by-step guide on how to submit new articles to the knowledge base, including formatting and approval process.',
    date: 'Jul 30, 2025',
    datetime: '2025-07-30',
    tags: ['Contributing', 'Writing', 'Approval'],
  },
  {
    id: 3,
    title: 'Popular Search Queries',
    href: '#',
    description:
      'Discover what other users are searching for most frequently and how to optimize your own searches.',
    date: 'Jul 29, 2025',
    datetime: '2025-07-29',
    tags: ['Insights', 'Search', 'Trends'],
  },
];

export default function Feed() {
  return (
    <div className="bg-white dark:bg-dark-900">
      <div className="mx-auto max-w-full w-full px-6 lg:px-8">
        <div className="mx-auto max-w-full w-full">
          <div className="mt-2 w-full space-y-4">
            <motion.ul  
                className="overflow-y-auto no-scrollbar divide-y divide-gray-200" 
                layout
            >
                <AnimatePresence>
                    {posts.map((post) => (
                        <motion.li
                            key={post.id}
                            layout
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="flex justify-between gap-x-6 py-2 shadow-md bg-white dark:bg-dark-900"
                        >
                            <article key={post.id} className="flex max-w-full flex-col items-start justify-between pt-4">
                                <div className="flex items-center gap-x-4 text-xs">
                                  <time dateTime={post.datetime} className="text-gray-500">
                                    {post.date}
                                  </time>
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
                                </div>
                                <div className="group relative">
                                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                                    <a href={post.href}>
                                      <span className="absolute inset-0" />
                                      {post.title}
                                    </a>
                                  </h3>
                                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{post.description}</p>
                                </div>
                            </article>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </motion.ul>
          </div>
        </div>
      </div>
    </div>
  );
}