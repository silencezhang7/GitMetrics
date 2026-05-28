import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, Users, User, BookOpen, HelpCircle, Code, Sparkles } from 'lucide-react';

export const Sidebar = () => {
    return (
        <aside className="hidden md:flex flex-col h-full py-margin-md px-4 border-r border-outline-variant bg-surface-container-low dark:bg-surface-dim fixed left-0 top-0 w-sidebar-width z-40">
            <div className="mb-margin-lg px-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-linear-to-tr from-primary to-primary-fixed text-on-primary flex items-center justify-center font-headline-sm font-bold shadow-[0_2px_8px_rgba(14,165,233,0.25)]">
                    <Code size={18} />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-on-surface tracking-tight leading-tight">GitMetrics</h1>
                    <p className="text-[10.5px] text-on-surface-variant font-medium">研发效能分析引擎</p>
                </div>
            </div>
            
            <nav className="flex-1 flex flex-col gap-1.5">
                <NavLink 
                    to="/" 
                    className={({isActive}) => `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-200 group border-l-[3px] ${
                        isActive 
                            ? 'bg-primary/10 border-primary text-primary-fixed shadow-sm' 
                            : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 hover:translate-x-1'
                    }`}
                >
                    {({isActive}) => (
                        <>
                            <LayoutDashboard size={18} className={`transition-transform duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:scale-105'}`}/>
                            <span>全局大屏总览</span>
                        </>
                    )}
                </NavLink>

                <NavLink 
                    to="/project-insights" 
                    className={({isActive}) => `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-200 group border-l-[3px] ${
                        isActive 
                            ? 'bg-primary/10 border-primary text-primary-fixed shadow-sm' 
                            : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 hover:translate-x-1'
                    }`}
                >
                    {({isActive}) => (
                        <>
                            <LineChart size={18} className={`transition-transform duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:scale-105'}`}/>
                            <span>项目深度洞察</span>
                        </>
                    )}
                </NavLink>

                <NavLink 
                    to="/contributor-analytics" 
                    className={({isActive}) => `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-200 group border-l-[3px] ${
                        isActive 
                            ? 'bg-primary/10 border-primary text-primary-fixed shadow-sm' 
                            : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 hover:translate-x-1'
                    }`}
                >
                    {({isActive}) => (
                        <>
                            <Users size={18} className={`transition-transform duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:scale-105'}`}/>
                            <span>团队贡献效率</span>
                        </>
                    )}
                </NavLink>

                <NavLink 
                    to="/developer-profile" 
                    className={({isActive}) => `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-200 group border-l-[3px] ${
                        isActive 
                            ? 'bg-primary/10 border-primary text-primary-fixed shadow-sm' 
                            : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 hover:translate-x-1'
                    }`}
                >
                    {({isActive}) => (
                        <>
                            <User size={18} className={`transition-transform duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:scale-105'}`}/>
                            <span>开发者个人详情</span>
                        </>
                    )}
                </NavLink>

                <NavLink 
                    to="/ai-code-analytics" 
                    className={({isActive}) => `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-200 group border-l-[3px] ${
                        isActive 
                            ? 'bg-primary/10 border-primary text-primary-fixed shadow-sm' 
                            : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 hover:translate-x-1'
                    }`}
                >
                    {({isActive}) => (
                        <>
                            <Sparkles size={18} className={`transition-transform duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:scale-105'}`}/>
                            <span>AI辅助效能评估</span>
                        </>
                    )}
                </NavLink>
            </nav>

            <div className="mt-auto space-y-2 pt-4 border-t border-outline-variant">
                <a href="#" className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/30 text-[12.5px] font-medium transition-all group duration-200">
                    <BookOpen size={16} className="text-on-surface-variant group-hover:translate-x-0.5 duration-150" />
                    <span>系统使用文档</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/30 text-[12.5px] font-medium transition-all group duration-200">
                    <HelpCircle size={16} className="text-on-surface-variant group-hover:translate-x-0.5 duration-150" />
                    <span>在线系统支持</span>
                </a>
            </div>
        </aside>
    );
};
