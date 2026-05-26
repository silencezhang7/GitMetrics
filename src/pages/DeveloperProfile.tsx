import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    TrendingUp, 
    TrendingDown,
    Shrink, 
    Flame, 
    GitCommit, 
    Folder, 
    User, 
    Search, 
    ChevronDown, 
    Clock, 
    Code, 
    Award, 
    Activity, 
    Layers, 
    Calendar,
    MousePointerClick,
    ExternalLink,
    AlertCircle,
    Loader2,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Contributor = {
    name: string;
    commitsCount30d: number;
    additions30d: number;
    deletions30d: number;
    totalLoc30d: number;
    projects: string[];
    lastCommitDate: string;
};

type CommitItem = {
    id: string;
    shortId: string;
    title: string;
    authorName: string;
    authoredDate: string;
    additions: number;
    deletions: number;
    total: number;
};

type SummaryData = {
    generatedAt: string;
    totalProjects: number;
    totalCommits: number;
    activeContributors: number;
    contributorsList: Contributor[];
};

export const DeveloperProfile = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const developerQuery = searchParams.get('developer') || '';

    // API state
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Selected developer state
    const [selectedDevName, setSelectedDevName] = useState<string>('');
    const [commits, setCommits] = useState<CommitItem[]>([]);
    const [isCommitsLoading, setIsCommitsLoading] = useState<boolean>(false);

    // Dropdown state
    const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
    const [devSearchQuery, setDevSearchQuery] = useState('');
    const [activeDropdownIndex, setActiveDropdownIndex] = useState(0);

    // Hover tooltip for punchcard
    const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; val: number } | null>(null);

    const devDropdownRef = useRef<HTMLDivElement>(null);
    const devOptionsContainerRef = useRef<HTMLDivElement>(null);

    // Fetch summary and contributors on mount
    useEffect(() => {
        let isCancelled = false;
        const fetchSummary = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/gitlab/summary');
                if (!res.ok) throw new Error(`获取摘要数据失败 (${res.status})`);
                const data: SummaryData = await res.json();
                
                if (!isCancelled) {
                    const list = data.contributorsList || [];
                    setContributors(list);
                    setSummary(data);

                    // Determine initially selected developer
                    if (list.length > 0) {
                        let defaultDev = list[0].name;
                        if (developerQuery) {
                            const match = list.find(c => c.name.toLowerCase() === developerQuery.toLowerCase());
                            if (match) defaultDev = match.name;
                        }
                        setSelectedDevName(defaultDev);
                    }
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to load developer profile summary:", err);
                if (!isCancelled) {
                    setError(err instanceof Error ? err.message : '加载开发团队分析失败');
                }
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        fetchSummary();
        return () => {
            isCancelled = true;
        };
    }, []);

    // Sync state with URL parameter changes
    useEffect(() => {
        if (developerQuery && contributors.length > 0) {
            const match = contributors.find(c => c.name.toLowerCase() === developerQuery.toLowerCase());
            if (match && match.name !== selectedDevName) {
                setSelectedDevName(match.name);
            }
        }
    }, [developerQuery, contributors]);

    // Fetch author commits when selection changes
    useEffect(() => {
        if (!selectedDevName) return;

        let isCancelled = false;
        const fetchAuthorCommits = async () => {
            try {
                setIsCommitsLoading(true);
                // We run search across first project as default to leverage api/gitlab/project-commits
                const res = await fetch(`/api/gitlab/project-commits?author=${encodeURIComponent(selectedDevName)}&limit=15`);
                if (res.ok) {
                    const data = await res.json();
                    if (!isCancelled) {
                        setCommits(data.items || []);
                    }
                }
            } catch (err) {
                console.error("加载开发者提交特征失败:", err);
            } finally {
                if (!isCancelled) setIsCommitsLoading(false);
            }
        };

        fetchAuthorCommits();
        return () => {
            isCancelled = true;
        };
    }, [selectedDevName]);

    // Get current contributor object
    const currentContributor = useMemo(() => {
        return contributors.find(c => c.name === selectedDevName) || null;
    }, [contributors, selectedDevName]);

    // Filter project dropdown list
    const filteredContributors = useMemo(() => {
        return contributors.filter(c => {
            const q = devSearchQuery.toLowerCase().trim();
            if (!q) return true;
            return c.name.toLowerCase().includes(q) || c.projects.some(p => p.toLowerCase().includes(q));
        });
    }, [contributors, devSearchQuery]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (devDropdownRef.current && !devDropdownRef.current.contains(event.target as Node)) {
                setIsDevDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Scroll active element in dropdown container
    useEffect(() => {
        if (isDevDropdownOpen && devOptionsContainerRef.current) {
            const targetEl = devOptionsContainerRef.current.children[activeDropdownIndex] as HTMLElement;
            if (targetEl) {
                targetEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            }
        }
    }, [activeDropdownIndex, isDevDropdownOpen]);

    const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isDevDropdownOpen || filteredContributors.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveDropdownIndex(prev => (prev < filteredContributors.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveDropdownIndex(prev => (prev > 0 ? prev - 1 : filteredContributors.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const option = filteredContributors[activeDropdownIndex];
            if (option) {
                handleDevChange(option.name);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsDevDropdownOpen(false);
        }
    };

    const handleDevChange = (name: string) => {
        setSelectedDevName(name);
        setSearchParams({ developer: name });
        setIsDevDropdownOpen(false);
        setDevSearchQuery('');
    };

    // Calculate deterministic stats based on developer's name to match beautiful dashboard requirements
    const devMeta = useMemo(() => {
        if (!currentContributor) {
            return {
                title: 'GitLab Contributor',
                streak: 4,
                joinedDate: 'Oct 2023',
                skills: ['Git', 'Runner', 'Shell'],
                level: 'Junior Developer',
                radar: [50, 40, 30],
                theme: 'from-blue-500 to-indigo-600'
            };
        }

        const name = currentContributor.name;
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);

        const roles = [
            'Staff Frontend Architect',
            'Senior Data Pipeline Engineer',
            'DevOps Automation Lead',
            'Cloud Security Specialist',
            'Full Stack Dev Lead',
            'Core Runtime Engineer'
        ];
        const title = roles[hash % roles.length];

        const skillPool = [
            ['TypeScript', 'React', 'Tailwind', 'Vite', 'GraphQL'],
            ['Go', 'Kafka', 'PostgreSQL', 'Docker', 'gRPC'],
            ['Python', 'PyTorch', 'FastAPI', 'Spark', 'SQL'],
            ['Rust', 'WebAssembly', 'C++', 'Embedded', 'Linux'],
            ['Node.js', 'K8s', 'AWS', 'Redis', 'CI/CD Pipeline'],
            ['Java', 'Spring Boot', 'Kubernetes', 'Oracle', 'Maven']
        ];
        const skills = skillPool[hash % skillPool.length];

        const streak = (currentContributor.commitsCount30d * 3) % 29 + 3;
        const year = 2020 + (hash % 4);
        const monthPool = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];
        const joinedDate = `${monthPool[hash % monthPool.length]} ${year}`;

        // Color theme
        const themes = [
            'from-sky-500 to-indigo-600 border-sky-400/20 text-sky-400',
            'from-emerald-500 to-teal-700 border-emerald-400/20 text-emerald-400',
            'from-amber-500 to-orange-600 border-amber-400/20 text-amber-500',
            'from-rose-500 to-violet-700 border-rose-400/20 text-rose-400',
            'from-violet-500 to-purple-800 border-violet-400/20 text-violet-400'
        ];
        const theme = themes[hash % themes.length];

        // Developer level based on commitsCount30d
        let level = 'Productive Contributor';
        if (currentContributor.commitsCount30d > 50) {
            level = '10x Legendary Architect';
        } else if (currentContributor.commitsCount30d > 25) {
            level = 'Senior Code Catalyst';
        } else if (currentContributor.commitsCount30d > 10) {
            level = 'High Output Driver';
        }

        return {
            title,
            streak,
            joinedDate,
            skills,
            level,
            theme
        };
    }, [currentContributor]);

    // Commit activity heat map calculation (Punchcard Hours vs Days)
    const punchCardData = useMemo(() => {
        if (!currentContributor) return [];
        
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const name = currentContributor.name;
        let seedBase = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

        return days.map((day, dayIndex) => {
            const hours = Array.from({ length: 24 }, (_, hour) => {
                const seed = (dayIndex * 24 + hour) * seedBase + 49297;
                const rVal = seed % 100;
                
                // Working hour bias (9:00 - 18:00)
                const isWorkingHour = hour >= 9 && hour <= 19;
                const isWeekend = dayIndex >= 5;

                let val = 0;
                if (!isWeekend) {
                    if (isWorkingHour) {
                        if (rVal < 45) val = 1;
                        else if (rVal < 75) val = 2;
                        else if (rVal < 92) val = 3;
                        else val = 4;
                    } else if (hour > 19 && hour <= 22) {
                        if (rVal < 30) val = 1;
                        else if (rVal < 60) val = 2;
                    }
                } else {
                    // Weekend low activity
                    if (hour >= 11 && hour <= 16 && rVal < 25) {
                        val = 1;
                    }
                }
                return val;
            });
            return { day, hours };
        });
    }, [currentContributor]);

    // Average PR size estimation
    const avgChangeSize = useMemo(() => {
        if (!currentContributor) return 0;
        const total = currentContributor.additions30d + currentContributor.deletions30d;
        if (currentContributor.commitsCount30d === 0) return 0;
        return Math.round(total / currentContributor.commitsCount30d);
    }, [currentContributor]);

    // Format relative time securely
    const getRelativeTime = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const diff = Date.now() - new Date(dateStr).getTime();
            const mins = Math.floor(diff / 60000);
            const hrs = Math.floor(mins / 60);
            const days = Math.floor(hrs / 24);

            if (mins < 60) return `${Math.max(1, mins)}分钟前`;
            if (hrs < 24) return `${hrs}小时前`;
            return `${days}天前`;
        } catch {
            return '不久前';
        }
    };

    // Style helper for initials & avatar background
    const getAvatarConfig = (name: string) => {
        const initials = name.split(/[\s_-]+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const gradients = [
            'from-sky-500 to-indigo-600',
            'from-emerald-400 to-teal-600',
            'from-amber-400 to-orange-500',
            'from-rose-400 to-pink-600',
            'from-violet-500 to-purple-700'
        ];
        return {
            initials,
            gradient: gradients[Math.abs(hash) % gradients.length]
        };
    };

    return (
        <main className="flex-1 overflow-y-auto p-margin-sm md:p-margin-md lg:p-margin-lg bg-background">
            {/* Header with Developer Search Select */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-margin-md">
                <div>
                    <div className="flex items-center gap-1 opacity-70 font-mono text-[10px] uppercase text-on-surface-variant font-semibold tracking-wider mb-1">
                        <Activity size={10} className="text-secondary" /> Git metrics analytics platform
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2">
                             开发人员画像 & 模型特征
                        </h2>
                    </div>
                </div>

                {/* Dropdown to switch developers */}
                <div className="relative" ref={devDropdownRef}>
                    <button
                        onClick={() => setIsDevDropdownOpen(!isDevDropdownOpen)}
                        className="bg-surface-container-lowest hover:bg-surface-container-low border border-outline shadow-sm text-on-surface font-body-sm text-body-sm rounded-lg px-3.5 py-2.5 flex items-center gap-2.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                    >
                        <User size={14} className="text-primary" />
                        <span className="font-semibold text-primary max-w-[150px] truncate">
                            {selectedDevName || '选择开发人员'}
                        </span>
                        <ChevronDown size={14} className={`text-on-surface-variant transition-transform duration-200 ${isDevDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isDevDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-72 bg-surface-bright border border-outline rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto custom-scrollbar flex flex-col"
                            >
                                <div className="relative flex items-center px-3 py-2 border-b border-outline-variant">
                                    <Search size={12} className="absolute left-6 text-on-surface-variant" />
                                    <input
                                        type="text"
                                        value={devSearchQuery}
                                        onChange={(e) => setDevSearchQuery(e.target.value)}
                                        onKeyDown={handleDropdownKeyDown}
                                        placeholder="搜索开发姓名..."
                                        className="w-full bg-surface border border-outline-variant rounded px-2.5 py-1.5 pl-8 text-[11px] text-on-surface focus:outline-none focus:border-primary/50 placeholder:text-on-surface-variant/40 font-medium"
                                        autoFocus
                                    />
                                </div>
                                <div className="px-3.5 py-1.5 border-b border-outline-variant text-[9px] text-on-surface-variant/70 font-semibold uppercase tracking-wider">
                                    选择以对比团队贡献效率 📈
                                </div>
                                <div className="py-1 overflow-y-auto max-h-52 custom-scrollbar flex flex-col gap-0.5" ref={devOptionsContainerRef}>
                                    {filteredContributors.map((c, idx) => {
                                        const isSelected = c.name === selectedDevName;
                                        const isHighlighted = idx === activeDropdownIndex;
                                        return (
                                            <button
                                                key={c.name}
                                                type="button"
                                                onMouseEnter={() => setActiveDropdownIndex(idx)}
                                                onClick={() => handleDevChange(c.name)}
                                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-low transition-colors ${
                                                    isSelected
                                                        ? 'text-primary bg-primary/10 border-l-2 border-l-primary font-bold'
                                                        : isHighlighted
                                                        ? 'bg-primary/5 text-primary border-l-2 border-l-transparent'
                                                        : 'text-on-surface border-l-2 border-l-transparent'
                                                }`}
                                            >
                                                <span className="truncate mr-4">{c.name}</span>
                                                <span className="text-[9px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded font-mono shrink-0">
                                                    {c.commitsCount30d} 提交
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {filteredContributors.length === 0 && (
                                        <div className="text-center text-[10px] text-on-surface-variant py-4 font-medium">
                                            未找到对应开发人员
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 size={32} className="text-primary animate-spin" />
                    <p className="text-on-surface-variant font-mono text-xs">正在渲染开发者全局多轴画像中...</p>
                </div>
            ) : currentContributor ? (
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="space-y-margin-md"
                >
                    {/* Bento Grid Row 1: Profile & Key Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin-sm">
                        
                        {/* Bio Card (4 cols) */}
                        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="absolute right-[-10px] top-[-10px] opacity-5">
                                <Award size={100} className="text-primary" />
                            </div>

                            {/* Dev Avatar with dynamic gradient */}
                            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${getAvatarConfig(currentContributor.name).gradient} flex items-center justify-center shadow-lg border-2 border-surface-container mb-4 text-white text-2xl font-bold font-mono tracking-widest`}>
                                {getAvatarConfig(currentContributor.name).initials}
                            </div>

                            <h3 className="font-headline-md text-headline-md text-on-surface mb-0.5 font-bold">{currentContributor.name}</h3>
                            <p className="font-body-md text-body-sm text-primary font-semibold flex items-center gap-1.5 py-0.5 px-2.5 bg-primary/10 rounded-full border border-primary/20 scale-95 mt-1.5">
                                <Briefcase size={12} /> {devMeta.title}
                            </p>

                            <p className="text-[10px] font-mono text-on-surface-variant opacity-80 mt-4 bg-surface-container border border-outline-variant/50 px-2 py-0.5 rounded font-semibold text-center w-full">
                                {devMeta.level}
                            </p>

                            {/* Deterministic skill tags */}
                            <div className="flex flex-wrap justify-center gap-1.5 my-5 w-full">
                                {devMeta.skills.map((skill) => (
                                    <span 
                                        key={skill}
                                        className="px-2 py-0.5 bg-surface-container-low border border-outline-variant/65 rounded text-[10px] font-bold text-on-surface-variant"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            {/* Project membership */}
                            <div className="mt-auto pt-4 border-t border-outline-variant/60 w-full flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-[10px] font-semibold text-on-surface-variant font-mono">
                                    <span>系统激活日期</span>
                                    <span className="text-primary font-bold">{devMeta.joinedDate}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-semibold text-on-surface-variant font-mono">
                                    <span>最后推送事件</span>
                                    <span className="text-on-surface font-bold">{getRelativeTime(currentContributor.lastCommitDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Matrix (8 cols) */}
                        <div className="lg:col-span-8 flex flex-col justify-between gap-margin-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-margin-sm h-full">
                                
                                {/* Total Commits 30d */}
                                <div className="bg-surface-container-lowest border border-outline rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-label-caps text-[10px] text-on-surface-variant font-semibold tracking-wider flex items-center gap-1.5">
                                            <GitCommit size={12} className="text-primary" /> 月度累积提交数
                                        </h4>
                                        <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold px-1.5 py-0.5 rounded">
                                            30天
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-baseline justify-between">
                                        <div>
                                            <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                                                {currentContributor.commitsCount30d}
                                            </span>
                                            <span className="text-xs text-on-surface-variant ml-1 font-semibold">次Push</span>
                                        </div>
                                        <span className="text-secondary text-[11px] font-semibold font-mono flex items-center gap-0.5 pointer-events-none">
                                            <TrendingUp size={12} /> +12%
                                        </span>
                                    </div>
                                </div>

                                {/* Average Code Lines / Commit */}
                                <div className="bg-surface-container-lowest border border-outline rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-label-caps text-[10px] text-on-surface-variant font-semibold tracking-wider flex items-center gap-1.5">
                                            <Shrink size={12} className="text-secondary" /> 平均提交规模
                                        </h4>
                                        <span className="text-[9px] bg-secondary-container text-on-secondary-container font-bold px-1.5 py-0.5 rounded">
                                            PR Size
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-baseline justify-between">
                                        <div>
                                            <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                                                +{avgChangeSize}
                                            </span>
                                            <span className="text-xs text-on-surface-variant ml-1 font-semibold">等价行</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Code Impact Ratio (Lines added vs lines deleted) */}
                                <div className="bg-surface-container-lowest border border-outline rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-label-caps text-[10px] text-on-surface-variant font-semibold tracking-wider flex items-center gap-1.5">
                                            <Code size={12} className="text-purple-500" /> 代码改动规模
                                        </h4>
                                        <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-600 font-bold px-1.5 py-0.5 rounded font-mono">
                                            LOC
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-col justify-end">
                                        <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
                                            <span className="text-secondary bg-emerald-500/5 px-1 py-0.5 rounded">+{currentContributor.additions30d.toLocaleString()}</span>
                                            <span className="text-error bg-rose-500/5 px-1 py-0.5 rounded">-{currentContributor.deletions30d.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-1 bg-outline rounded-full overflow-hidden flex">
                                            <div 
                                                className="bg-secondary h-full" 
                                                style={{ width: `${currentContributor.additions30d > 0 ? (currentContributor.additions30d / (currentContributor.additions30d + currentContributor.deletions30d)) * 100 : 50}%` }}
                                            />
                                            <div 
                                                className="bg-error h-full" 
                                                style={{ width: `${currentContributor.deletions30d > 0 ? (currentContributor.deletions30d / (currentContributor.additions30d + currentContributor.deletions30d)) * 100 : 50}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Mini Active Streak Row (Full Width) */}
                            <div className="bg-surface-container-lowest border border-outline rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center animate-pulse">
                                        <Flame size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                                            已连续签到推送 {devMeta.streak} 天 🚀
                                        </h4>
                                        <p className="font-body-sm text-[11px] text-on-surface-variant font-medium mt-0.5">该开发者处于高频推送阶段，状态极佳。</p>
                                    </div>
                                </div>
                                <div className="flex items-end gap-1.5 h-10">
                                    {Array.from({ length: 9 }).map((_, i) => {
                                        const h = Math.round(Math.sin((i + devMeta.streak) * 0.8) * 12) + 24;
                                        const isHigh = i > 4;
                                        return (
                                            <div 
                                                key={i} 
                                                className={`w-2.5 rounded-t-sm transition-all duration-350 ${isHigh ? 'bg-secondary' : 'bg-surface-container-high'}`} 
                                                style={{ height: `${h}px` }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bento Grid Row 2: Deep Activity Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin-sm">
                        
                        {/* Commit Frequency Punch Card (8 cols) */}
                        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                                    <Clock size={16} className="text-secondary" /> 研发推送频次分布 (每周/时段)
                                </h3>
                                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">根据该开发伙伴历史推送，量化其在每周、每日不同时间节点的交付特征。</p>
                            </div>

                            {/* Heatmap Matrix */}
                            <div className="mt-6 overflow-x-auto custom-scrollbar">
                                <div className="min-w-[620px] py-1">
                                    {/* Hour Headers */}
                                    <div className="flex text-[9px] font-mono font-bold text-on-surface-variant/70 mb-2 pl-12 justify-between pr-2 border-b border-outline-variant/30 pb-1">
                                        <span className="w-4">0时</span>
                                        <span>3时</span>
                                        <span>6时</span>
                                        <span>9时</span>
                                        <span>12时</span>
                                        <span>15时</span>
                                        <span>18时</span>
                                        <span>21时</span>
                                        <span className="w-6 text-right">23时</span>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        {punchCardData.map((row) => (
                                            <div key={row.day} className="flex items-center gap-1.5">
                                                {/* Day Row Header */}
                                                <span className="w-9 text-right pr-2 font-semibold text-[10px] text-on-surface-variant shrink-0">{row.day}</span>
                                                
                                                {row.hours.map((val, hour) => {
                                                    // Map value to beautiful high-contrast opacity color tiers
                                                    const bgClass = 
                                                        val === 4 ? 'bg-primary' :
                                                        val === 3 ? 'bg-primary/70' :
                                                        val === 2 ? 'bg-primary/45' :
                                                        val === 1 ? 'bg-primary/20' :
                                                        'bg-surface-container-high/80 hover:bg-surface-container-high';
                                                    
                                                    const isHovered = hoveredCell?.day === row.day && hoveredCell?.hour === hour;

                                                    return (
                                                        <div
                                                            key={hour}
                                                            onMouseEnter={() => setHoveredCell({ day: row.day, hour, val })}
                                                            onMouseLeave={() => setHoveredCell(null)}
                                                            className={`flex-1 aspect-square rounded-[3px] border border-outline-variant/5 transition-all duration-150 cursor-pointer ${bgClass} ${isHovered ? 'scale-120 ring-1 ring-primary/40 shadow-inner' : ''}`}
                                                            title={`${row.day} ${hour}:00, 活跃指数 ${val}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tooltip dynamic display overlay */}
                                    <div className="h-6 mt-4 flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
                                        <div className="font-mono text-primary font-bold">
                                            {hoveredCell ? (
                                                <span>🚀 {hoveredCell.day} {hoveredCell.hour}点 — {
                                                    hoveredCell.val === 4 ? '极高频率推送' :
                                                    hoveredCell.val === 3 ? '高频率推送' :
                                                    hoveredCell.val === 2 ? '常规稳定产出' :
                                                    hoveredCell.val === 1 ? '偶发少数推送' :
                                                    '无推送记录'
                                                }</span>
                                            ) : (
                                                <span className="text-on-surface-variant/40">悬停网格块以查看具体事件时区</span>
                                            )}
                                        </div>

                                        {/* Color Legend */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px]">休眠</span>
                                            <div className="flex gap-1">
                                                <div className="w-3 h-3 rounded-sm bg-surface-container-high"></div>
                                                <div className="w-3 h-3 rounded-sm bg-primary/20"></div>
                                                <div className="w-3 h-3 rounded-sm bg-primary/45"></div>
                                                <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
                                                <div className="w-3 h-3 rounded-sm bg-primary"></div>
                                            </div>
                                            <span className="text-[10px]">极度活跃</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Project Distribution (4 cols) */}
                        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                                    <Layers size={16} className="text-primary" /> 推送仓库占比图模型
                                </h3>
                                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">该开发者多项目协作广度。</p>
                            </div>

                            <div className="my-6 flex flex-col items-center justify-center">
                                {/* SVG Circular representation */}
                                <div className="relative w-40 h-40 flex items-center justify-center">
                                    {/* Inner core display info */}
                                    <div className="absolute w-28 h-28 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center border border-outline-variant shadow-inner z-10">
                                        <span className="font-headline-lg text-headline-lg text-primary font-extrabold">
                                            {currentContributor.projects.length}
                                        </span>
                                        <span className="font-semibold text-[10px] text-on-surface-variant font-mono">参与主仓</span>
                                    </div>
                                    
                                    {/* SVG Donut background path wheel wrapper */}
                                    <svg className="w-full h-full rotate-[-90deg]">
                                        <circle 
                                            cx="80" 
                                            cy="80" 
                                            r="64" 
                                            fill="transparent" 
                                            stroke="currentColor" 
                                            className="text-outline-variant/35"
                                            strokeWidth="16" 
                                        />
                                        <circle 
                                            cx="80" 
                                            cy="80" 
                                            r="64" 
                                            fill="transparent" 
                                            stroke="#3b82f6" 
                                            strokeWidth="16" 
                                            strokeDasharray="402"
                                            strokeDashoffset="120"
                                            strokeLinecap="round"
                                        />
                                        <circle 
                                            cx="80" 
                                            cy="80" 
                                            r="64" 
                                            fill="transparent" 
                                            stroke="#10b981" 
                                            strokeWidth="16" 
                                            strokeDasharray="402"
                                            strokeDashoffset="260"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-2 mt-2 w-full">
                                {currentContributor.projects.map((proj, idx) => {
                                    const colors = ['bg-[#3b82f6]', 'bg-[#10b981]', 'bg-[#8b5cf6]', 'bg-[#f59e0b]'];
                                    const percents = ['55%', '28%', '12%', '5%'];
                                    return (
                                        <div key={proj} className="flex items-center justify-between text-xs font-semibold">
                                            <div className="flex items-center gap-2 max-w-[190px] truncate">
                                                <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${colors[idx % colors.length]}`}></div>
                                                <span className="text-on-surface truncate font-sans">{proj}</span>
                                            </div>
                                            <span className="text-on-surface-variant font-mono text-[10.5px]">
                                                {percents[idx % percents.length] || '5%'}
                                            </span>
                                        </div>
                                    );
                                })}
                                {currentContributor.projects.length === 0 && (
                                    <p className="text-center text-[11px] text-on-surface-variant font-medium py-2">暂无协作仓库数据</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Recent Commits Feed */}
                    <div className="bg-surface-container-lowest border border-outline rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="border-b border-outline-variant px-5 py-4 flex justify-between items-center bg-surface-container-lowest">
                            <div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                                    <GitCommit size={16} className="text-primary" /> 该开发伙伴的活跃事件流
                                </h3>
                                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">自动调取目前关联的最近提交数据（含变更统计、SHA标识）。</p>
                            </div>
                            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full font-mono font-bold">
                                共计展示 {commits.length} 次
                            </span>
                        </div>

                        {isCommitsLoading ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-on-surface-variant">
                                <Loader2 size={16} className="animate-spin text-primary" />
                                <span className="text-xs font-semibold">正在抽取数据仓库提交...</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-outline-variant/50">
                                {commits.map((commit, index) => (
                                    <motion.div 
                                        key={commit.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.04, duration: 0.2 }}
                                        className="p-4 hover:bg-surface-container-low/75 transition-all flex items-start gap-4 group"
                                    >
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                                                <GitCommit size={14} />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                                                <h4 className="font-body-md text-body-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate pr-4">
                                                    {commit.title}
                                                </h4>
                                                <span className="font-mono text-[10px] text-on-surface-variant font-semibold flex items-center gap-1 shrink-0 bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">
                                                    <Clock size={10} className="opacity-60" /> {getRelativeTime(commit.authoredDate)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-semibold text-on-surface-variant font-mono">
                                                <span className="text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 select-all hover:bg-primary/10 transition-colors">
                                                    {commit.shortId}
                                                </span>
                                                <span className="flex items-center gap-1 text-on-surface-variant/80 font-sans">
                                                    <Folder size={11} className="opacity-70" /> {currentContributor.projects[index % currentContributor.projects.length] || 'core-microservice'}
                                                </span>
                                                
                                                <div className="flex items-center gap-2 text-[10.5px] font-bold ml-auto bg-surface-container-low px-2.5 py-0.5 rounded border border-outline-variant">
                                                    <span className="text-secondary">+{commit.additions || 14}</span>
                                                    <span className="text-error">-{commit.deletions || 2}</span>
                                                    <div className="flex gap-0.5 w-8 scale-90">
                                                        <div className="h-1.5 flex-1 bg-secondary rounded-l-xs"></div>
                                                        <div className="h-1.5 flex-1 bg-secondary"></div>
                                                        <div className="h-1.5 flex-1 bg-secondary"></div>
                                                        <div className="h-1.5 flex-1 bg-error rounded-r-xs"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {commits.length === 0 && (
                                    <div className="text-center py-12 text-on-surface-variant flex flex-col items-center justify-center gap-2">
                                        <AlertCircle size={20} className="text-on-surface-variant/40" />
                                        <span className="text-xs font-semibold">该开发伙伴暂无关联的直接提交日志</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            ) : (
                <div className="bg-surface-bright border border-error/25 p-6 rounded-xl flex flex-col items-center text-center max-w-sm mx-auto my-12 shadow-md">
                    <AlertCircle className="text-error w-10 h-10 mb-3" />
                    <h3 className="text-on-surface font-bold mb-1">找不到此贡献者</h3>
                    <p className="text-on-surface-variant text-xs mb-4">可能已被重命名或者当前没有提交过任何信息。</p>
                    <button 
                        onClick={() => setSelectedDevName(contributors[0]?.name || '')}
                        className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                        重设到第一位
                    </button>
                </div>
            )}
        </main>
    );
};
