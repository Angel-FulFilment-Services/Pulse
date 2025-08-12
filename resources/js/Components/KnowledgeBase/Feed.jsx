import React from 'react';
import UserIcon from '../User/UserIcon';
import { motion, AnimatePresence } from 'framer-motion';
import useFetchArticles from '../Fetches/KnowledgeBase/useFetchArticles';
import { Link } from '@inertiajs/react'

export default function Feed({ searchTerm }) {
  // Filter posts based on search term, using the title, description, and tags

  const { articles, isLoading, isLoaded } = useFetchArticles();

  console.log('Articles fetched:', articles);

  const formattedPosts = articles.map((article) => ({
    id: article.id,
    title: article.title,
    description: article.description,
    date: new Date(article.published_at).toLocaleDateString('en-UK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    // Assuming article has a datetime field
    // If not, you can format it as needed
    datetime: article.published_at ? article.published_at : new Date().toISOString(),
    tags: JSON.parse(article.tags),
  }));

  const filteredPosts = formattedPosts.filter((post) => {
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

  return (
    <div className="bg-white dark:bg-dark-900">
      <div className="mx-auto max-w-full w-full px-6 lg:px-8">
        <div className="mx-auto max-w-full w-full">
          <div className="mt-2 w-full space-y-4">
            <motion.ul
              className="overflow-y-auto h-screen pb-96 no-scrollbar divide-y divide-gray-200"
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