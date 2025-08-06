import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import '../../Components/Reporting/ReportingStyles.css';
import Article from '../../Components/KnowledgeBase/Article.jsx';

const Post = ({ article, questions, resolutions }) => {
    return (
        <div className="relative flex flex-col h-screen bg-white dark:bg-dark-900">
            <Article
                article={article}
                questions={questions}
                resolutions={resolutions}
            />
        </div>
    );
};

export default Post;