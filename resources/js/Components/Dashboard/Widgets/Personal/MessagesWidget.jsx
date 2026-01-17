import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { UserGroupIcon as UserGroupIconSolid } from '@heroicons/react/24/solid';
import { router } from '@inertiajs/react';
import { useNotifications } from '../../../Context/NotificationContext';
import { QUICK_REACTIONS } from '../../../../Config/EmojiConfig';
import UserIcon from '../../../Chat/UserIcon';
import ScrollHint from '../../../Hints/ScrollHint';
import { formatDistanceToNowStrict } from 'date-fns';

const MessagesWidget = ({ isExpanded, isPreview = false, onRefresh }) => {
    // Preview mode - return static dummy content
    if (isPreview) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="space-y-2">
                    {[
                        { name: 'John Smith', message: 'Hey, are you free for a quick...', time: '2m', isTeam: false },
                        { name: 'Jane Doe', message: 'Thanks for the update!', time: '6m', isTeam: false },
                        { name: 'Tech Support', message: 'John: Issue resolved ✓', time: '15m', isTeam: true },
                    ].map((item, i) => (
                        <div key={i} className="border border-gray-200 dark:border-dark-700 rounded-lg">
                            <div className="p-3">
                                <div className="flex items-start gap-3">
                                    {item.isTeam ? (
                                        <div className="w-9 h-9 rounded-lg bg-theme-500 dark:bg-theme-600 flex items-center justify-center flex-shrink-0">
                                            <UserGroupIconSolid className="w-6 h-6 text-white" />
                                        </div>
                                    ) : (
                                        <UserIcon size="small" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-medium text-sm text-gray-900 dark:text-dark-100 truncate">{item.name}</span>
                                            <span className="text-xs text-gray-400 dark:text-dark-500">{item.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-dark-400 truncate">{item.message}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-3 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-400 dark:text-dark-500 rounded-lg">
                                        Type a reply...
                                    </div>
                                    <div className="p-1.5 bg-gray-300 dark:bg-dark-600 text-white rounded-lg">
                                        <PaperAirplaneIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const { 
        shouldHidePreview, 
        addQuickReaction, 
        sendQuickReply,
        currentUser 
    } = useNotifications();
    
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const scrollRef = useRef(null);
    const initialLoadDone = useRef(false);

    // Fetch recent conversations
    const fetchConversations = useCallback(async () => {
        try {
            const response = await fetch('/api/chat/messages/recent?limit=' + (isExpanded ? 10 : 5), {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error fetching recent messages:', error);
        } finally {
            setIsLoading(false);
            initialLoadDone.current = true;
        }
    }, [isExpanded]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Listen for new messages via notification context
    useEffect(() => {
        if (!currentUser?.id || !window.Echo) return;

        const channel = window.Echo.private(`chat.user.${currentUser.id}`);
        
        const handleNewMessage = (data) => {
            // Refresh conversations when a new message arrives
            fetchConversations();
        };

        channel.listen('.NewChatMessage', handleNewMessage);

        return () => {
            channel.stopListening('.NewChatMessage');
        };
    }, [currentUser?.id, fetchConversations]);

    // Track if we've done the initial load
    const showSkeleton = !initialLoadDone.current && isLoading;

    const formatTime = (timestamp) => {
        try {
            return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: false });
        } catch {
            return '';
        }
    };

    const handleNavigateToChat = (chatType, chatId) => {
        const urlType = chatType === 'user' ? 'dm' : chatType;
        router.visit(`/chat?type=${urlType}&id=${chatId}`);
    };

    // Check if current user has already reacted with this emoji
    const hasUserReacted = (conversation, emoji) => {
        if (!conversation.reactions || !currentUser) return false;
        return conversation.reactions.some(r => r.emoji === emoji && r.user_id === currentUser.id);
    };

    const handleReact = async (e, messageId, chatId, chatType, emoji, name) => {
        e.stopPropagation();
        await addQuickReaction(messageId, emoji, name);
        // Refresh to show updated reactions
        fetchConversations();
    };

    const handleReply = async (chatId, chatType) => {
        if (!replyText.trim() || isSending) return;
        
        setIsSending(true);
        const success = await sendQuickReply(replyText.trim(), chatId, chatType);
        
        if (success) {
            setReplyText('');
            fetchConversations();
        }
        setIsSending(false);
    };

    const handleKeyDown = (e, chatId, chatType) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleReply(chatId, chatType);
        }
        if (e.key === 'Escape') {
            setReplyText('');
        }
    };

    // Loading skeleton
    if (showSkeleton) {
        return (
            <div className="space-y-2.5 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-7">
                        <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-dark-700"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-dark-700 rounded"></div>
                                <div className="h-3 w-32 bg-gray-100 dark:bg-dark-800 rounded"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty state - styled like ScheduleCard
    if (conversations.length === 0) {
        return (
            <div className="relative flex flex-col flex-1 min-h-0">
                {/* Ghost/placeholder messages */}
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-gray-200 dark:border-dark-700 rounded-lg p-3 py-7 opacity-30">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-dark-700 flex-shrink-0" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="h-4 w-24 bg-gray-200 dark:bg-dark-700 rounded" />
                                    <div className="h-3 w-36 bg-gray-100 dark:bg-dark-800 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Centered overlay text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="backdrop-blur-sm px-4 py-3 bg-white/70 dark:bg-dark-900/70 rounded-lg border border-gray-200 dark:border-dark-700 text-center">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 dark:text-dark-500 mx-auto mb-2" />
                        <p className="text-xl font-medium text-gray-600 dark:text-dark-200">No Messages</p>
                        <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Start a conversation in Pulse Chat</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
            {/* Messages List - scrollable */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2">
                {conversations.map((conversation) => {
                    const hidePreview = conversation.hide_preview;
                    const isHovered = hoveredMessageId === conversation.id;
                    
                    // Build contact object for UserIcon
                    const senderContact = {
                        id: conversation.sender_id,
                        name: conversation.sender_name,
                    };
                    
                    return (
                        <div 
                            key={`${conversation.chat_type}-${conversation.chat_id}-${conversation.id}`}
                            className="border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors relative"
                            onMouseEnter={() => setHoveredMessageId(conversation.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                        >
                            {/* Quick Reactions Pill - Top Right */}
                            {!hidePreview && isHovered && (
                                <div className="absolute -top-2.5 right-2 z-10">
                                    <div className="flex items-center gap-0.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-full shadow-sm px-1 py-0.5">
                                        {QUICK_REACTIONS.slice(0, 4).map((reaction) => {
                                            const userHasReacted = hasUserReacted(conversation, reaction.emoji);
                                            return (
                                                <button
                                                    key={reaction.emoji}
                                                    onClick={(e) => handleReact(e, conversation.id, conversation.chat_id, conversation.chat_type, reaction.emoji, reaction.name)}
                                                    className={`w-7 h-7 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors ${
                                                        userHasReacted ? 'bg-gray-200 dark:bg-dark-600' : ''
                                                    }`}
                                                    title={userHasReacted ? `Remove ${reaction.label}` : reaction.label}
                                                >
                                                    <span className="text-sm">{reaction.emoji}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            {/* Main content - clickable */}
                            <div 
                                className="p-3 cursor-pointer"
                                onClick={() => handleNavigateToChat(conversation.chat_type, conversation.chat_id)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon - Team or User */}
                                    {conversation.chat_type === 'team' ? (
                                        <div className="w-9 h-9 rounded-lg bg-theme-500 dark:bg-theme-600 flex items-center justify-center flex-shrink-0">
                                            <UserGroupIconSolid className="w-6 h-6 text-white" />
                                        </div>
                                    ) : (
                                        <div className="flex-shrink-0">
                                            <UserIcon 
                                                size="small" 
                                                contact={senderContact}
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Message Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-medium text-sm text-gray-900 dark:text-dark-100 truncate">
                                                {conversation.chat_type === 'team' 
                                                    ? conversation.chat_name 
                                                    : conversation.sender_name
                                                }
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-dark-500 flex-shrink-0">
                                                {formatTime(conversation.created_at)}
                                            </span>
                                        </div>
                                        
                                        {/* Message preview */}
                                        <p className="text-xs text-gray-500 dark:text-dark-400 line-clamp-2">
                                            {conversation.chat_type === 'team' && (
                                                <span className="font-medium">
                                                    {conversation.sender_name}:{' '}
                                                </span>
                                            )}
                                            {hidePreview ? (
                                                <span className="italic text-gray-400 dark:text-dark-500">
                                                    Message hidden
                                                </span>
                                            ) : (
                                                conversation.body || 'Sent an attachment'
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Reply Input - always visible */}
                            {!hidePreview && (
                                <div className="px-3 pb-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, conversation.chat_id, conversation.chat_type)}
                                            placeholder="Type a reply..."
                                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                                            disabled={isSending}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReply(conversation.chat_id, conversation.chat_type);
                                            }}
                                            disabled={!replyText.trim() || isSending}
                                            className="p-1.5 bg-theme-500 hover:bg-theme-600 disabled:bg-gray-300 dark:disabled:bg-dark-600 text-white rounded-lg transition-colors"
                                        >
                                            <PaperAirplaneIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* Scroll hint */}
            <ScrollHint scrollRef={scrollRef} />
        </div>
    );
};

export default MessagesWidget;
