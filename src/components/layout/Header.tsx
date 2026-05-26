import { Menu, Search, Bell, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Header = () => {
    const location = useLocation();

    // Just to mock some dynamic breadcrumb
    const pathName = {
        '/': 'Global Dashboard',
        '/project-insights': 'frontend-framework',
        '/contributor-analytics': 'Contributor Analytics',
        '/developer-profile': 'Developer Profile',
    }[location.pathname] || 'Dashboard';

    return (
        <header className="flex justify-between items-center w-full px-margin-md h-16 sticky top-0 z-30 bg-surface-container-lowest dark:bg-inverse-surface border-b border-outline-variant dark:border-outline">
            {/* Brand / Search (Left) */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <button className="md:hidden text-on-surface-variant hover:bg-surface-container p-2 rounded transition-colors">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2 font-headline-sm text-headline-sm text-primary dark:text-inverse-primary tracking-tight hidden md:flex">
                    <span>GitMetrics</span>
                    {location.pathname === '/project-insights' && (
                        <>
                            <span className="text-on-surface-variant text-body-sm font-normal">/</span>
                            <span className="font-code-md text-code-md text-primary bg-surface-container px-2 py-0.5 rounded text-sm">frontend-framework</span>
                        </>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative hidden sm:block ml-4">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="text" placeholder="Search..." className="w-64 bg-surface-container-low border border-outline-variant rounded pl-9 pr-3 py-1.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-on-tertiary-container focus:ring-1 focus:ring-on-tertiary-container transition-all" />
                </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-2">
                <button className="text-on-surface-variant dark:text-on-surface-variant p-2 rounded-full hover:bg-surface-container dark:hover:bg-surface-container-high transition-colors cursor-pointer active:opacity-80">
                    <Bell size={20} />
                </button>
                <button className="text-on-surface-variant dark:text-on-surface-variant p-2 rounded-full hover:bg-surface-container dark:hover:bg-surface-container-high transition-colors cursor-pointer active:opacity-80">
                    <Settings size={20} />
                </button>
                <div className="w-8 h-8 rounded-full ml-2 bg-surface-variant border border-outline-variant overflow-hidden cursor-pointer">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9o2JVNQu9jUYH22wIIMYK8DHrMM5j6mJTdqE1DibYRG9HjEC0NQ6TB9iCkWTLvKym9nahv-ZIDBflFH9kTFY-Z0L4LbH7SV4Y23l4989c59Q0LMGK66mINRd3mnxBulptHQPLKuf7Y2bU-qzT9KA1qnIgU35O68hXLyNBnAZklzDH2vv1xtARm4krPOHdTI2PY82QdJxZJiVVbglHpyzh05n_mzf18xxpiGs9sOtGFc1QpQ9zWBKD0mHeLAhHiGGccy45VlwlRqU" alt="User Avatar" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>
    );
};
