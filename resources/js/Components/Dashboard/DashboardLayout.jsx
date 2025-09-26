import React from 'react';

const DashboardLayout = ({ greetingWidget = [], heroWidgets = [], mainWidgets = [], secondaryWidgets = [], tertiaryWidgets = [] }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
            {/* Dashboard Container - Full Width */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                
                {/* Greeting Section - Full Width at Top */}
                {greetingWidget.length > 0 && (
                    <div className="mb-8">
                        <div className="grid grid-cols-12 gap-4 lg:gap-6">
                            {greetingWidget.map((widget, index) => {
                                const WidgetComponent = widget.component;
                                return (
                                    <div key={index} className={widget.span}>
                                        <WidgetComponent {...widget.props} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hero Section - Top Row */}
                {heroWidgets.length > 0 && (
                    <div className="mb-8">
                        <div className="grid grid-cols-12 gap-4 lg:gap-6">
                            {heroWidgets.map((widget, index) => {
                                const WidgetComponent = widget.component;
                                return (
                                    <div key={index} className={widget.span}>
                                        <WidgetComponent {...widget.props} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content Section */}
                {mainWidgets.length > 0 && (
                    <div className="mb-8">
                        <div className="grid grid-cols-12 gap-4 lg:gap-6">
                            {mainWidgets.map((widget, index) => {
                                const WidgetComponent = widget.component;
                                return (
                                    <div key={index} className={widget.span}>
                                        <WidgetComponent {...widget.props} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Secondary Content Section */}
                {secondaryWidgets.length > 0 && (
                    <div className="mb-8">
                        <div className="grid grid-cols-12 gap-4 lg:gap-6">
                            {secondaryWidgets.map((widget, index) => {
                                const WidgetComponent = widget.component;
                                return (
                                    <div key={index} className={widget.span}>
                                        <WidgetComponent {...widget.props} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tertiary Content Section */}
                {tertiaryWidgets.length > 0 && (
                    <div className="mb-8">
                        <div className="grid grid-cols-12 gap-4 lg:gap-6">
                            {tertiaryWidgets.map((widget, index) => {
                                const WidgetComponent = widget.component;
                                return (
                                    <div key={index} className={widget.span}>
                                        <WidgetComponent {...widget.props} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;
