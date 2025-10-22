import React from 'react';

const Wallboard = () => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-900">
            {/* Left iframe - 65% width */}
            <div className="w-[65%] h-full">
                <iframe 
                    src="https://wings.angelfs.co.uk"
                    className="w-full h-full border-0"
                    title="Main Display"
                />
            </div>
            
            {/* Right iframe - 35% width */}
            <div className="w-[35%] h-full">
                <iframe 
                    src="https://pulse.angelfs.co.uk/onsite/widgets/access-control"
                    className="w-full h-full border-0"
                    title="Secondary Display"
                />
            </div>
        </div>
    );
};

export default Wallboard;
