import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, Users, User, ArrowRightLeft, BookOpen, HelpCircle, Code } from 'lucide-react';

export const Sidebar = () => {
    return (
        <aside className="hidden md:flex flex-col h-full py-margin-md px-4 border-r border-outline-variant bg-surface-container-low dark:bg-surface-dim fixed left-0 top-0 w-sidebar-width z-40">
            <div className="mb-margin-lg px-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary text-on-primary flex items-center justify-center font-headline-sm font-bold"><Code size={18} /></div>
                <div>
                    <h1 className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed tracking-tight">分析工作台</h1>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Git 度量分析引擎</p>
                </div>
            </div>
            
            <button className="w-full mb-6 bg-surface-container-highest hover:bg-surface-variant text-on-surface flex items-center justify-between px-3 py-2 rounded border border-outline-variant transition-colors group">
                <span className="font-body-sm text-body-sm font-medium">项目快速切换</span>
                <ArrowRightLeft size={18} className="group-hover:translate-y-px transition-transform"/>
            </button>
            <nav className="flex-1 flex flex-col gap-1">
                <NavLink to="/" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg font-label-caps text-label-caps transition-all group duration-200 ${isActive ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}>
                    {({isActive}) => (
                        <>
                            <LayoutDashboard size={20} className={isActive ? '' : 'group-hover:translate-x-1 duration-200'}/>
                            <span>全局大屏总览</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/project-insights" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg font-label-caps text-label-caps transition-all group duration-200 ${isActive ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}>
                    {({isActive}) => (
                        <>
                            <LineChart size={20} className={isActive ? '' : 'group-hover:translate-x-1 duration-200'}/>
                            <span>项目深度洞察</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/contributor-analytics" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg font-label-caps text-label-caps transition-all group duration-200 ${isActive ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}>
                    {({isActive}) => (
                        <>
                            <Users size={20} className={isActive ? '' : 'group-hover:translate-x-1 duration-200'}/>
                            <span>团队贡献效率</span>
                        </>
                    )}
                </NavLink>
                <NavLink to="/developer-profile" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg font-label-caps text-label-caps transition-all group duration-200 ${isActive ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'}`}>
                    {({isActive}) => (
                        <>
                            <User size={20} className={isActive ? '' : 'group-hover:translate-x-1 duration-200'}/>
                            <span>开发者画像</span>
                        </>
                    )}
                </NavLink>
            </nav>
            <div className="mt-auto space-y-4 pt-4 border-t border-outline-variant">
                <div className="space-y-1">
                    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-colors group">
                        <BookOpen size={18} className="group-hover:translate-x-1 duration-200" />
                        <span>帮助与开发文档</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-colors group">
                        <HelpCircle size={18} className="group-hover:translate-x-1 duration-200" />
                        <span>技术支持与反馈</span>
                    </a>
                </div>
            </div>
        </aside>
    );
};
