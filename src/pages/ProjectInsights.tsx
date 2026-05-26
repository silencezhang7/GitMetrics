import {
    FolderOpen,
    Download,
    CalendarDays,
    LineChart,
    Medal,
    Activity,
    GitBranch,
    CheckCircle,
    Clock,
    XCircle,
    MoreHorizontal,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

type ProjectItem = {
    id: string | number;
    name: string;
    commits30d?: number;
    lastActivityAt?: string;
};

type Contributor = {
    name: string;
    username: string;
    commits: number;
    seed?: string;
};

type Branch = {
    name: string;
    isDefault: boolean;
    status: 'Passing' | 'In Review' | 'Failing';
    lastCommitTime: string;
    lastCommitAuthor: string;
};

type ProjectInsightsType = {
    project: {
        id: number;
        name: string;
        fullName: string;
        description: string;
        isActive: boolean;
        starCount: number;
        visibility: string;
        language: string;
        topics: string[];
    };
    totalCommits: number;
    heatmapCells: Array<{
        date?: string;
        commits: number;
        activityLevel: number;
    }>;
    growth: {
        labels: string[];
        additions: number[];
        deletions: number[];
    };
    topContributors: Contributor[];
    branches: Branch[];
};

export const ProjectInsights = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    
    // Insights stats
    const [insights, setInsights] = useState<ProjectInsightsType | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter growth trend
    const [timeframe, setTimeframe] = useState('Last 6 Months');

    // Hover tooltip for growth line chart
    const [hoveredPoint, setHoveredPoint] = useState<{
        x: number;
        y: number;
        value: number;
        type: 'additions' | 'deletions';
        label: string;
    } | null>(null);

    // Contributor commits detail modal/drawer state
    const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
    const [contributorCommits, setContributorCommits] = useState<any[]>([]);
    const [commitsPage, setCommitsPage] = useState<number>(1);
    const [hasMoreCommits, setHasMoreCommits] = useState<boolean>(false);
    const [isCommitsLoading, setIsCommitsLoading] = useState<boolean>(false);
    const [commitsError, setCommitsError] = useState<string | null>(null);

    const fetchContributorCommits = async (contributorName: string, pageNum: number, append = false) => {
        if (!selectedProjectId) return;
        setIsCommitsLoading(true);
        setCommitsError(null);
        try {
            const limit = 6;
            const response = await fetch(
                `/api/gitlab/project-commits?projectId=${encodeURIComponent(selectedProjectId)}&author=${encodeURIComponent(contributorName)}&page=${pageNum}&limit=${limit}`
            );
            if (!response.ok) {
                throw new Error('获取开发者提交记录失败');
            }
            const data = await response.json();
            if (append) {
                setContributorCommits((prev) => [...prev, ...data.items]);
            } else {
                setContributorCommits(data.items);
            }
            setHasMoreCommits(data.hasMore);
            setCommitsPage(pageNum);
        } catch (err: any) {
            setCommitsError(err.message || '加载记录出错');
        } finally {
            setIsCommitsLoading(false);
        }
    };

    // Trigger when selected contributor changes
    useEffect(() => {
        if (selectedContributor) {
            setContributorCommits([]);
            fetchContributorCommits(selectedContributor.name, 1, false);
        } else {
            setContributorCommits([]);
        }
    }, [selectedContributor, selectedProjectId]);

    // Fallback sandbox list if API has no projects
    const fallbackProjects: ProjectItem[] = [
        { id: 'frontend-framework', name: 'frontend-framework' },
        { id: 'backend-api', name: 'backend-api' },
        { id: 'gateway-service', name: 'gateway-service' }
    ];

    // Fetch list of projects first
    useEffect(() => {
        let active = true;
        const loadProjects = async () => {
            try {
                const response = await fetch('/api/gitlab/projects?limit=100');
                if (!response.ok) {
                    throw new Error('获取项目列表失败');
                }
                const data = await response.json();
                if (active) {
                    if (data.items && data.items.length > 0) {
                        const items = data.items.map((p: any) => ({
                            id: String(p.id),
                            name: p.name.split('/').pop() || p.name,
                            commits30d: p.commits30d
                        }));
                        setProjects(items);
                    } else {
                        setProjects(fallbackProjects);
                    }
                }
            } catch (err) {
                console.warn("Could not fetch real projects, using sandbox defaults", err);
                if (active) {
                    setProjects(fallbackProjects);
                }
            } finally {
                if (active) {
                    setIsProjectsLoading(false);
                }
            }
        };

        loadProjects();
        return () => {
            active = false;
        };
    }, []);

    // Synchronize selectedProjectId with URL query parameters
    useEffect(() => {
        const queryId = searchParams.get('projectId');
        if (queryId) {
            setSelectedProjectId(queryId);
        } else if (projects.length > 0) {
            setSelectedProjectId(String(projects[0].id));
        } else if (!isProjectsLoading) {
            setSelectedProjectId('frontend-framework');
        }
    }, [searchParams, projects, isProjectsLoading]);

    // Fetch insights data whenever selectedProjectId changes
    useEffect(() => {
        if (!selectedProjectId) return;

        let active = true;
        const fetchInsights = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/gitlab/project-insights?projectId=${encodeURIComponent(selectedProjectId)}`);
                if (!res.ok) {
                    throw new Error('加载项目洞察详情失败');
                }
                const data = await res.json();
                if (active) {
                    setInsights(data);
                }
            } catch (err: any) {
                if (active) {
                    setError(err.message || '加载详情出错');
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        fetchInsights();
        return () => {
            active = false;
        };
    }, [selectedProjectId]);

    const handleProjectChange = (id: string) => {
        setSearchParams({ projectId: id });
        setSelectedProjectId(id);
        setIsProjectDropdownOpen(false);
    };

    const colors = ['bg-surface-container', 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20', 'bg-[#38bdf8]/30', 'bg-[#0ea5e9]', 'bg-[#1e1b4b]'];
    const heatmapColorClasses = [
        'bg-[#1e293b]',  // Level 0: low
        'bg-[#0ea5e9]/20', // Level 1
        'bg-[#0ea5e9]/45', // Level 2
        'bg-[#0ea5e9]/70', // Level 3
        'bg-[#0ea5e9]'    // Level 4: high
    ];

    // Compute dynamic growth trends for SVG
    const svgData = useMemo(() => {
        if (!insights || !insights.growth) return null;
        const { labels, additions, deletions } = insights.growth;
        
        let displayLabels = labels;
        let displayAdditions = additions;
        let displayDeletions = deletions;

        // Apply visual timeframe cropping if needed
        if (timeframe === 'Last 3 Months') {
            displayLabels = labels.slice(-3);
            displayAdditions = additions.slice(-3);
            displayDeletions = deletions.slice(-3);
        }

        const maxVal = Math.max(...displayAdditions, ...displayDeletions, 100);

        // Convert values to SVG coordinate points (X: 0~100, Y: 10~90)
        const additionPoints = displayAdditions.map((val, idx) => {
            const x = (idx / Math.max(displayAdditions.length - 1, 1)) * 100;
            const y = 90 - (val / maxVal) * 80;
            return { x, y, value: val };
        });

        const deletionPoints = displayDeletions.map((val, idx) => {
            const x = (idx / Math.max(displayDeletions.length - 1, 1)) * 100;
            const y = 90 - (val / maxVal) * 80;
            return { x, y, value: val };
        });

        const additionLine = additionPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const additionArea = additionPoints.length > 0 ? `${additionLine} L100,100 L0,100 Z` : '';

        const deletionLine = deletionPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const deletionArea = deletionPoints.length > 0 ? `${deletionLine} L100,100 L0,100 Z` : '';

        return {
            maxVal,
            labels: displayLabels,
            additionPoints,
            deletionPoints,
            additionLine,
            additionArea,
            deletionLine,
            deletionArea
        };
    }, [insights, timeframe]);

    // Find current active project details
    const activeProjectName = useMemo(() => {
        const found = projects.find(p => String(p.id) === selectedProjectId);
        return found ? found.name : selectedProjectId || 'frontend-framework';
    }, [projects, selectedProjectId]);

    return (
        <main id="project-insights-page" className="flex-1 p-margin-md md:p-margin-lg lg:p-10 max-w-7xl mx-auto w-full text-on-background">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-outline-variant/60 pb-6">
                <div className="relative flex-1 min-w-0">
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5 block">
                        项目深度多维分析 · Project Insights
                    </span>
                    
                    {/* Interactive Dropdown Selector */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="relative">
                            <button
                                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                                className="font-headline-lg text-headline-sm md:text-headline-lg text-primary mb-2 flex items-center gap-2 cursor-pointer hover:opacity-85 pr-6 relative focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-lg p-1"
                            >
                                <FolderOpen size={30} className="text-primary-fixed shrink-0" />
                                <span className="truncate max-w-[280px] md:max-w-md">{activeProjectName}</span>
                                <ChevronDown size={18} className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant shrink-0" />
                            </button>

                            {isProjectDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-72 bg-surface-bright border border-outline rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-3 duration-250">
                                    <div className="px-3.5 py-2 border-b border-outline-variant text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                                        选择分支或存储库项目
                                    </div>
                                    <div className="py-1">
                                        {projects.map((proj) => (
                                            <button
                                                key={proj.id}
                                                onClick={() => handleProjectChange(String(proj.id))}
                                                className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center justify-between border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-lowest transition-colors ${
                                                    String(proj.id) === selectedProjectId
                                                        ? 'text-primary bg-surface-container-lowest font-bold border-l-2 border-l-primary'
                                                        : 'text-on-surface hover:text-primary'
                                                }`}
                                            >
                                                <span className="truncate mr-4">{proj.name}</span>
                                                {proj.commits30d !== undefined && (
                                                    <span className="text-[9px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded font-mono shrink-0">
                                                        {proj.commits30d} 提交
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
                        {insights?.project?.description || "持续追踪项目的健康状态、主分支提交活跃序列、代码提交统计及热力分布情况。"}
                    </p>
                </div>

                {/* Sub status row */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-end mt-2 md:mt-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1e293b] border border-outline text-[#38bdf8]">
                        <span className="w-2 h-2 rounded-full bg-tertiary mr-2 animate-pulse"></span> 实时追踪中
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary-container">
                        {insights?.project?.language || 'TypeScript'}
                    </span>
                    <button 
                        onClick={() => {
                            if (!insights) return;
                            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(insights, null, 2))}`;
                            const downloadAnchor = document.createElement('a');
                            downloadAnchor.setAttribute("href", jsonString);
                            downloadAnchor.setAttribute("download", `gitlab-insights-${activeProjectName}.json`);
                            document.body.appendChild(downloadAnchor);
                            downloadAnchor.click();
                            downloadAnchor.remove();
                        }}
                        className="bg-surface-container-lowest border border-outline text-primary font-body-sm text-body-sm px-4 py-2 rounded shadow-sm hover:bg-surface-container transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Download size={16} />
                        导出本页报表
                    </button>
                </div>
            </div>

            {/* Loading / Error overlay wrapper */}
            {isLoading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4 text-on-surface-variant bg-surface-container-lowest border border-outline-variant/40 rounded-2xl animate-pulse">
                    <Loader2 size={36} className="animate-spin text-primary" />
                    <p className="font-body-md text-body-md text-center">正在加载项目多维动态分析指标数据，请稍后...</p>
                </div>
            ) : error ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4 text-error bg-surface-container-lowest border border-error-container/30 rounded-2xl p-6">
                    <XCircle size={44} />
                    <p className="font-body-md text-body-md font-semibold">数据获取遇到障碍</p>
                    <p className="text-xs text-on-surface-variant max-w-md text-center">{error}</p>
                    <button
                        onClick={() => setSelectedProjectId(selectedProjectId)}
                        className="px-4 py-2 bg-error text-on-error rounded-md text-xs font-semibold hover:bg-error/90 shrink-0 cursor-pointer"
                    >
                        重试加载
                    </button>
                </div>
            ) : !insights ? (
                <div className="h-96 flex flex-col items-center justify-center gap-3 text-on-surface-variant bg-surface-container-lowest border border-outline-variant/40 rounded-2xl">
                    <FolderOpen size={40} className="opacity-40" />
                    <p className="font-body-md text-body-md">请选择一个有效的项目进行评估</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in-60 duration-350">
                    
                    {/* Commit Heatmap (Full Width) */}
                    <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-sm shadow-sm hover-ambient-shadow transition-all relative overflow-hidden">
                        <div className="border-b border-outline-variant pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                                <CalendarDays size={16} className="text-secondary" />
                                滚动提交活度矩阵 (近一年天级热力分布)
                            </h3>
                            <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-4 shrink-0 flex-wrap">
                                <span className="font-mono text-primary font-semibold text-xs py-0.5 px-2 bg-surface border border-outline rounded">
                                    总提交：{insights.totalCommits || 0}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                    较少
                                    {heatmapColorClasses.map((bgClass, idx) => (
                                        <div key={idx} className={`w-3 h-3 rounded-[2px] ${bgClass}`} />
                                    ))}
                                    较频
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                            <div className="grid grid-rows-[repeat(7,1fr)] grid-flow-col auto-cols-min gap-[3.5px] min-w-[700px] p-1">
                                {insights.heatmapCells.map((cell, index) => (
                                    <div
                                        key={index}
                                        className={`w-[10.5px] h-[10.5px] rounded-[2px] transition-all hover:scale-130 cursor-crosshair border border-outline/10 ${heatmapColorClasses[cell.activityLevel]}`}
                                        title={cell.date ? `${cell.date}: 提交 ${cell.commits} 次` : `提交 ${cell.commits} 次`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Line Growth Chart (2/3 Width) */}
                    <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-sm shadow-sm hover-ambient-shadow transition-all flex flex-col">
                        <div className="border-b border-outline-variant pb-3 mb-4 flex justify-between items-center">
                            <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                                <LineChart size={16} className="text-secondary" />
                                源码演进热度图域 (代码增加 vs 代码移除)
                            </h3>
                            <select
                                value={timeframe}
                                onChange={(e) => setTimeframe(e.target.value)}
                                className="bg-surface border border-outline text-xs rounded py-1 px-2.5 text-on-surface focus:outline-none focus:border-secondary transition-all cursor-pointer"
                            >
                                <option>Last 6 Months</option>
                                <option>Last 3 Months</option>
                            </select>
                        </div>

                        {svgData ? (
                            <div className="flex-1 relative min-h-[260px] w-full flex items-end pt-4 pb-2">
                                {/* Grid reference lines */}
                                <div className="absolute inset-0 pl-12 pb-7 pointer-events-none">
                                    <div className="w-full h-1/4 border-t border-outline-variant/30"></div>
                                    <div className="w-full h-1/4 border-t border-outline-variant/30"></div>
                                    <div className="w-full h-1/4 border-t border-outline-variant/30"></div>
                                    <div className="w-full h-1/4 border-t border-outline-variant/30 border-b"></div>
                                </div>
                                
                                {/* Y-Axis scale tags */}
                                <div className="absolute left-0 top-3 bottom-7 w-10 flex flex-col justify-between text-[9px] text-on-surface-variant text-right font-mono pr-2">
                                    <span>{(svgData.maxVal).toLocaleString()}</span>
                                    <span>{Math.round(svgData.maxVal * 0.66).toLocaleString()}</span>
                                    <span>{Math.round(svgData.maxVal * 0.33).toLocaleString()}</span>
                                    <span>0</span>
                                </div>

                                {/* Main Plot Graph SVG */}
                                <div className="flex-1 h-[220px] ml-12 mb-7 relative">
                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <defs>
                                            <linearGradient id="addsGraphGrad" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"></stop>
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0"></stop>
                                            </linearGradient>
                                            <linearGradient id="delsGraphGrad" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15"></stop>
                                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0"></stop>
                                            </linearGradient>
                                        </defs>

                                        {/* Areas fill background */}
                                        {svgData.additionArea && (
                                            <path d={svgData.additionArea} fill="url(#addsGraphGrad)"></path>
                                        )}
                                        {svgData.deletionArea && (
                                            <path d={svgData.deletionArea} fill="url(#delsGraphGrad)"></path>
                                        )}

                                        {/* Interactive paths lines */}
                                        {svgData.additionLine && (
                                            <path d={svgData.additionLine} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"></path>
                                        )}
                                        {svgData.deletionLine && (
                                            <path d={svgData.deletionLine} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"></path>
                                        )}

                                        {/* Circle Dots markers for Additions */}
                                        {svgData.additionPoints.map((p, i) => (
                                            <g 
                                                key={`add-g-${i}`} 
                                                className="cursor-pointer group/dot"
                                                onMouseEnter={(e) => {
                                                    const target = e.currentTarget;
                                                    const rect = target.getBoundingClientRect();
                                                    const parentContainer = target.closest('.relative');
                                                    if (parentContainer) {
                                                        const parentRect = parentContainer.getBoundingClientRect();
                                                        setHoveredPoint({
                                                            x: ((rect.left + rect.right) / 2) - parentRect.left,
                                                            y: rect.top - parentRect.top - 8,
                                                            value: p.value,
                                                            type: 'additions',
                                                            label: svgData.labels[i] || ''
                                                        });
                                                    }
                                                }}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            >
                                                <circle cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" className="transition-all hover:scale-135"></circle>
                                                <circle cx={p.x} cy={p.y} r="8" fill="#10b981" opacity="0" className="opacity-0 hover:opacity-20 transition-opacity"></circle>
                                            </g>
                                        ))}

                                        {/* Circle Dots markers for Deletions */}
                                        {svgData.deletionPoints.map((p, i) => (
                                            <g 
                                                key={`del-g-${i}`} 
                                                className="cursor-pointer group/dot"
                                                onMouseEnter={(e) => {
                                                    const target = e.currentTarget;
                                                    const rect = target.getBoundingClientRect();
                                                    const parentContainer = target.closest('.relative');
                                                    if (parentContainer) {
                                                        const parentRect = parentContainer.getBoundingClientRect();
                                                        setHoveredPoint({
                                                            x: ((rect.left + rect.right) / 2) - parentRect.left,
                                                            y: rect.top - parentRect.top - 8,
                                                            value: p.value,
                                                            type: 'deletions',
                                                            label: svgData.labels[i] || ''
                                                        });
                                                    }
                                                }}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            >
                                                <circle cx={p.x} cy={p.y} r="3.5" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" className="transition-all hover:scale-135"></circle>
                                                <circle cx={p.x} cy={p.y} r="7.5" fill="#ef4444" opacity="0" className="opacity-0 hover:opacity-20 transition-opacity"></circle>
                                            </g>
                                        ))}
                                    </svg>

                                    {/* Real-time point hover tooltip display */}
                                    {hoveredPoint && (
                                        <div 
                                            className="absolute bg-[#1e293b] border border-outline px-3 py-1.5 rounded-lg shadow-xl text-[11px] font-mono pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 whitespace-nowrap text-on-surface"
                                            style={{ 
                                                left: `${hoveredPoint.x}px`, 
                                                top: `${hoveredPoint.y}px`,
                                                transform: 'translate(-50%, -105%)' 
                                            }}
                                        >
                                            <span className="text-on-surface-variant font-semibold text-[10px]">{hoveredPoint.label}</span>
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <span className={`w-1.5 h-1.5 rounded-full ${hoveredPoint.type === 'additions' ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
                                                {hoveredPoint.type === 'additions' ? '代码增加:' : '代码移除:'}
                                                <span className={hoveredPoint.type === 'additions' ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                                                    {hoveredPoint.type === 'additions' ? '+' : '-'}{hoveredPoint.value.toLocaleString()} 行
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* X-Axis Month Tags */}
                                <div className="absolute bottom-1 left-12 right-0 flex justify-between text-[10px] text-on-surface-variant pt-2.5 px-1 bg-surface-container-lowest font-mono">
                                    {svgData.labels.map((lbl, idx) => (
                                        <span key={idx}>{lbl}</span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-44 flex items-center justify-center text-xs text-on-surface-variant">
                                暂无成长走势计算数据
                            </div>
                        )}

                        <div className="flex items-center gap-6 text-[11px] font-medium text-on-surface-variant mx-12 mb-3 mt-1.5">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-1.5 rounded-full bg-[#10b981]"></span>
                                增加了的代码 LOC (Additions)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-1.5 rounded-full bg-[#ef4444] border-dashed border"></span>
                                移除了的代码 LOC (Deletions)
                            </span>
                        </div>
                    </div>

                    {/* Top Contributors (1/3 Width) */}
                    <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-sm shadow-sm hover-ambient-shadow transition-all flex flex-col">
                        <div className="border-b border-outline-variant pb-3 mb-4">
                            <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                                <Medal size={16} className="text-secondary" />
                                仓库提交排行榜贡献者
                            </h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto max-h-[290px] pr-1.5 custom-scrollbar">
                            <ul className="flex flex-col gap-3.5">
                                {insights.topContributors && insights.topContributors.map((c, idx) => {
                                    // Make avatars beautiful with consistent colored classes
                                    const devColors = [
                                        'bg-blue-500/10 text-blue-400 border-blue-500/30',
                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                                        'bg-purple-500/10 text-purple-400 border-purple-500/30',
                                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    ];
                                    const avatarClass = devColors[idx % devColors.length];
                                    const letter = c.name.substring(0, 1).toUpperCase();

                                    let trophy = '';
                                    if (idx === 0) trophy = '🥇';
                                    else if (idx === 1) trophy = '🥈';
                                    else if (idx === 2) trophy = '🥉';

                                    return (
                                        <li key={c.name} onClick={() => setSelectedContributor(c)} className="flex items-center justify-between p-2.5 hover:bg-surface-container-low rounded-lg border border-transparent hover:border-outline hover:shadow-xs transition-all group cursor-pointer" title="点击查看详细提交历史记录">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border font-mono font-bold text-xs shrink-0 shadow-inner ${avatarClass}`}>
                                                    {letter}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-body-md text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                                                            {c.name}
                                                        </p>
                                                        {trophy && <span className="text-[10px] select-none">{trophy}</span>}
                                                    </div>
                                                    <p className="font-body-sm text-[10px] text-on-surface-variant font-mono">@{c.username}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-code-md text-xs font-semibold text-primary font-mono">{c.commits}</p>
                                                <p className="font-label-caps text-[9px] text-on-surface-variant">COMMITS</p>
                                            </div>
                                        </li>
                                    );
                                })}

                                {(!insights.topContributors || insights.topContributors.length === 0) && (
                                    <div className="py-20 text-center text-xs text-on-surface-variant">
                                        暂无活跃贡献者列表相关数据
                                    </div>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Branch Activity (Full Width List) */}
                    <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-sm shadow-sm hover-ambient-shadow transition-all">
                        <div className="border-b border-outline-variant pb-3 mb-4 flex justify-between items-center">
                            <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                                <GitBranch size={16} className="text-secondary" />
                                仓库活跃分支健康状态
                            </h3>
                            <span className="font-body-sm text-xs text-on-surface-variant font-mono">
                                活跃的分支：{insights.branches ? insights.branches.length : 0}
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[650px] p-1">
                                <thead>
                                    <tr className="border-b border-outline">
                                        <th className="py-2.5 px-3.5 font-label-caps text-xs text-on-surface-variant font-semibold">分支名称 (Branch)</th>
                                        <th className="py-2.5 px-3.5 font-label-caps text-xs text-on-surface-variant font-semibold">健康状态 (Status)</th>
                                        <th className="py-2.5 px-3.5 font-label-caps text-xs text-on-surface-variant font-semibold">提交细节 (Last Commit)</th>
                                    </tr>
                                </thead>
                                <tbody className="font-body-sm text-xs">
                                    {insights.branches && insights.branches.map((b) => {
                                        let statusNode = null;
                                        if (b.status === 'Passing') {
                                            statusNode = (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                    <CheckCircle size={12} /> Passing
                                                </span>
                                            );
                                        } else if (b.status === 'In Review') {
                                            statusNode = (
                                                <span className="inline-flex items-center gap-1.5 text-amber-500 font-semibold uppercase text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                    <Clock size={12} /> In Review
                                                </span>
                                            );
                                        } else {
                                            statusNode = (
                                                <span className="inline-flex items-center gap-1.5 text-error font-semibold uppercase text-[10px] bg-error-container text-on-error-container px-2 py-0.5 rounded border border-error/20">
                                                    <XCircle size={12} /> Failing
                                                </span>
                                            );
                                        }

                                        const lastCommitDateFormatted = () => {
                                            try {
                                                const d = new Date(b.lastCommitTime);
                                                return d.toLocaleDateString('zh-CN', {
                                                    month: 'numeric',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });
                                            } catch {
                                                return b.lastCommitTime;
                                            }
                                        };

                                        return (
                                            <tr key={b.name} className="border-b border-outline-variant/45 last:border-0 hover:bg-surface-bright transition-colors group">
                                                <td className="py-3 px-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <GitBranch size={14} className="text-on-surface-variant shrink-0" />
                                                        <span className="font-mono font-bold text-primary group-hover:text-primary-fixed transition-colors truncate max-w-[220px]">
                                                            {b.name}
                                                        </span>
                                                        {b.isDefault && (
                                                            <span className="bg-surface border border-outline text-on-surface-variant text-[9px] px-1.5 py-0.2 rounded font-medium select-none">
                                                                默认主分支
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3.5">
                                                    {statusNode}
                                                </td>
                                                <td className="py-3 px-3.5 text-on-surface-variant font-medium">
                                                    <span className="font-mono text-[10px] opacity-75">{lastCommitDateFormatted()}</span>
                                                    <span> 由 </span>
                                                    <span className="font-bold text-on-surface text-[11px]">@{b.lastCommitAuthor}</span>
                                                    <span> 提交</span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {(!insights.branches || insights.branches.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-xs text-on-surface-variant">
                                                未发现任何活跃的分支
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </div>
             )}

            {/* Contributor Commits Slide-Over Modal Drawer */}
            {selectedContributor && (
                <div className="fixed inset-0 bg-[#020617]/70 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200">
                    {/* Backdrop Dismiss */}
                    <div className="absolute inset-0 cursor-pointer animate-none" onClick={() => setSelectedContributor(null)} />
                    
                    {/* Drawer Side Panel */}
                    <div className="relative w-full max-w-md bg-surface-container border-l border-outline/35 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Panel Header */}
                        <div className="px-6 py-5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/25 font-bold font-mono text-sm leading-none shrink-0">
                                    {selectedContributor.name.substring(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5 truncate">
                                        {selectedContributor.name}
                                        <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-medium leading-none whitespace-nowrap">
                                            {selectedContributor.commits} 次提交
                                        </span>
                                    </h4>
                                    <p className="font-body-sm text-[11px] text-on-surface-variant font-mono truncate">
                                        @{selectedContributor.username} · 项目贡献提交历史
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedContributor(null)}
                                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 hover:opacity-100"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>

                        {/* panel scrolling logs */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar space-y-5">
                            {contributorCommits.length > 0 ? (
                                <div className="relative border-l border-outline/25 pl-4 ml-2.5 space-y-5 pt-1">
                                    {contributorCommits.map((cmt) => {
                                        const cDate = new Date(cmt.authoredDate);
                                        const timeStr = cDate.toLocaleDateString('zh-CN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });

                                        return (
                                            <div key={cmt.id} className="relative group/item animate-in fade-in duration-150">
                                                {/* Timeline Marker Dot */}
                                                <div className="absolute -left-[24.5px] top-1.5 w-4 h-4 bg-surface-container border-2 border-primary rounded-full group-hover/item:scale-115 group-hover/item:bg-primary transition-all flex items-center justify-center shadow-xs">
                                                    <div className="w-1.5 h-1.5 bg-primary group-hover/item:bg-surface-container rounded-full" />
                                                </div>

                                                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3.5 shadow-xs hover:border-outline transition-all">
                                                    <span className="text-[10px] bg-surface-container-low text-on-surface-variant font-mono px-2 py-0.5 rounded font-semibold border border-outline-variant/35 select-none">
                                                        {cmt.shortId}
                                                    </span>
                                                    <h5 className="font-body-md text-xs font-bold text-on-surface mt-2.5 leading-relaxed group-hover/item:text-primary transition-colors">
                                                        {cmt.title}
                                                    </h5>
                                                    
                                                    {/* stats details */}
                                                    <div className="flex items-center justify-between mt-3.5 flex-wrap gap-2 text-[10px] font-mono border-t border-outline-variant/30 pt-2.5">
                                                        <span className="text-on-surface-variant/80">{timeStr}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#10b981] font-bold">+{cmt.additions}</span>
                                                            <span className="text-[#ef4444] font-bold">-{cmt.deletions}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : isCommitsLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-on-surface-variant pt-10">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <p className="text-[11px] text-on-surface-variant font-mono">正在敏捷调取提交中...</p>
                                </div>
                            ) : commitsError ? (
                                <div className="py-12 text-center text-error text-[11px] flex flex-col items-center gap-2">
                                    <span>{commitsError}</span>
                                    <button 
                                        onClick={() => fetchContributorCommits(selectedContributor.name, commitsPage, false)}
                                        className="text-primary hover:underline hover:opacity-85 text-xs font-medium"
                                    >
                                        重新尝试加载
                                    </button>
                                </div>
                            ) : (
                                <div className="py-24 text-center text-xs text-on-surface-variant font-mono">
                                    当前阶段暂无更多记录提交贡献
                                </div>
                            )}

                            {/* lazy view more logic */}
                            {hasMoreCommits && !isCommitsLoading && (
                                <div className="pt-2 pb-6 text-center">
                                    <button
                                        onClick={() => fetchContributorCommits(selectedContributor.name, commitsPage + 1, true)}
                                        className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer focus:outline-none"
                                    >
                                        <span>查看更多提交记录</span>
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            )}

                            {isCommitsLoading && contributorCommits.length > 0 && (
                                <div className="py-4 text-center flex justify-center">
                                    <Loader2 size={18} className="animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};
