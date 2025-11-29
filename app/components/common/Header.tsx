import React from 'react';
import ThemeToggle from '../ThemeToggle';

const Header = () => {
    return (
        <div>
            <div className="flex justify-between mx-auto lg:w-[80%] md:w-[90%] w-[95%]  lg:py-6 py-4 items-center">
                <div className="text-2xl font-bold">Task Planner</div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
}

export default Header;
