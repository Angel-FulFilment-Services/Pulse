import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../Components/Reporting/ReportingStyles.css';
import Header from '../../Components/KnowledgeBase/Header.jsx';
import Feed from '../../Components/KnowledgeBase/Feed.jsx';

const Reporting = () => {
    const { apexId, showCreateForm, presetData } = usePage().props;
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(showCreateForm || false);
    const [editArticle, setEditArticle] = useState(null);

    // Get current URL to determine active tab
    const currentPath = window.location.pathname;

    const tabs = [
        { id: 'technical-support', label: 'Technical Support', path: '/knowledge-base/technical-support', current: true },
        { id: 'call-hub', label: 'Call Hub', path: '/knowledge-base/call-hub', current: true },
    ];

    const activeTab = tabs.find((tab) => currentPath.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        router.visit(path);
    };

    const handlePostCreated = (newPost) => {
        // Trigger refresh of the feed
        setRefreshTrigger(prev => prev + 1);
        // Close create modal
        setShowCreateModal(false);
        setEditArticle(null);
    };

    const handlePostUpdated = (updatedPost) => {
        // Trigger refresh of the feed
        setRefreshTrigger(prev => prev + 1);
        // Close edit modal
        setShowCreateModal(false);
        setEditArticle(null);
    };

    const handleEditArticle = async (article) => {        
        try {
            // Fetch the complete article data including soundfiles using the dedicated edit endpoint
            const response = await axios.get(`/knowledge-base/article/${article.id}/edit`);
            const fullArticle = response.data.article;

            // Merge the basic article data with the full data
            const completeArticle = {
                ...article,
                ...fullArticle,
                content: fullArticle.body, // Map body to content for consistency
                soundfiles: fullArticle.soundfiles || []
            };
            
            setEditArticle(completeArticle);
            setShowCreateModal(true);
        } catch (error) {
            console.error('Error fetching article for edit:', error);
            toast.error('Error loading article for editing');
        }
    };

    const handleModalClose = () => {
        setShowCreateModal(false);
        setEditArticle(null);
    };

    useEffect(() => {
        switch (activeTab) {
            case 'rota':
                break;
            case 'assets':
                break;
            case 'system':
                break;
            case 'site':
                break;
            default:
                break;
        }
    }, [activeTab]);

    return (
        <div className="w-full flex flex-col h-dvh bg-white dark:bg-dark-900">
            <div id="reporting_header" className="z-30">
                <div className="z-30">
                    <Header
                        tabs={tabs}
                        activeTab={activeTab}
                        handleTabClick={handleTabClick}
                        search={search}
                        setSearch={setSearch}
                        onPostCreated={handlePostCreated}
                        onPostUpdated={handlePostUpdated}
                        showCreateModal={showCreateModal}
                        setShowCreateModal={setShowCreateModal}
                        onModalClose={handleModalClose}
                        apexId={apexId}
                        presetData={presetData}
                        editArticle={editArticle}
                    />
                </div>
            </div>
            <Feed 
                searchTerm={search} 
                activeTab={activeTab} 
                refreshTrigger={refreshTrigger}
                onEditArticle={handleEditArticle}
            />
        </div>
    );
};

export default Reporting;