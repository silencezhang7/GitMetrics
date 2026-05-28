import { Calendar, Download, GitCommit, Code, Users, GitMerge, TrendingUp, TrendingDown, Minus, MoreVertical, Folder, ArrowUp, ChevronDown, Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

type ProjectTrend = {
    id: number;
    name: string;
    shortName: string;
    monthly: number[];
    weekly: number[];
    daily: number[];
    monthlyLoc?: { additions: number[]; deletions: number[] };
    dailyLoc?: { additions: number[]; deletions: number[] };
    yearlyLoc?: { years: string[]; commits: number[]; additions: number[]; deletions: number[] };
};

type GitLabContributor = {
    name: string;
    commitsCount30d: number;
    additions30d: number;
    deletions30d: number;
    totalLoc30d: number;
    projects: string[];
    lastCommitDate: string;
};

type GitLabSummary = {
    totalProjects: number;
    totalCommits: number;
    activeContributors: number;
    openMergeRequests: number;
    monthLabels: string[];
    trends?: {
        global: {
            monthly: number[];
            weekly: number[];
            daily: number[];
            monthlyLoc?: { additions: number[]; deletions: number[] };
            dailyLoc?: { additions: number[]; deletions: number[] };
            yearlyLoc?: { years: string[]; commits: number[]; additions: number[]; deletions: number[] };
        };
        projects: ProjectTrend[];
    };
    contributorsList?: GitLabContributor[];
    topProjects: Array<{
        id: number;
        name: string;
        webUrl: string;
        commits30d: number | null;
        lastActivityAt?: string;
    }>;
};

type ProjectPage = {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
    items: GitLabSummary['topProjects'];
};

type GitLabGroup = {
    id: number;
    name: string;
    fullName: string;
    fullPath: string;
    webUrl: string;
};

const formatMetric = (value: number | null | undefined) => typeof value === 'number' ? value.toLocaleString() : '...';

export const GlobalDashboard = () => {
    const [summary, setSummary] = useState<GitLabSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [allProjects, setAllProjects] = useState<GitLabSummary['topProjects']>([]);
    const [projectsOffset, setProjectsOffset] = useState(5);
    const [projectsTotal, setProjectsTotal] = useState<number | null>(null);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectsHasMore, setProjectsHasMore] = useState(true);
    const [showAllProjects, setShowAllProjects] = useState(false);
    const [groups, setGroups] = useState<GitLabGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [groupsInitialized, setGroupsInitialized] = useState(false);
    const [groupMenuOpen, setGroupMenuOpen] = useState(false);
    const groupMenuRef = useRef<HTMLDivElement>(null);

    // 项目数详情弹窗状态
    const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
    const [modalProjects, setModalProjects] = useState<GitLabSummary['topProjects']>([]);
    const [modalProjectsTotal, setModalProjectsTotal] = useState<number | null>(null);
    const [modalOffset, setModalOffset] = useState(0);
    const [modalHasMore, setModalHasMore] = useState(true);
    const [modalLoading, setModalLoading] = useState(false);

    // 活跃贡献者弹窗状态
    const [isContributorsModalOpen, setIsContributorsModalOpen] = useState(false);
    const [contributorSearchQuery, setContributorSearchQuery] = useState('');

    useEffect(() => {
        let ignore = false;

        async function loadGroups() {
            setGroupsLoading(true);
            try {
                const response = await fetch('/api/gitlab/groups');
                if (!response.ok) throw new Error(`GitLab groups failed: ${response.status}`);
                const data = await response.json() as { groups: GitLabGroup[] };
                if (!ignore) {
                    setGroups(data.groups);
                    const defaultGroup = data.groups.find((group) => {
                        const name = group.name.toLowerCase();
                        const fullName = group.fullName.toLowerCase();
                        const fullPath = group.fullPath.toLowerCase();

                        return name === 'publicapps' || fullName === 'publicapps' || fullPath === 'publicapps' || fullPath.endsWith('/publicapps');
                    });

                    setSelectedGroupId(defaultGroup ? String(defaultGroup.id) : '');
                }
            } catch (loadError) {
                if (!ignore) setError(loadError instanceof Error ? loadError.message : 'Failed to load GitLab groups');
            } finally {
                if (!ignore) {
                    setGroupsLoading(false);
                    setGroupsInitialized(true);
                }
            }
        }

        loadGroups();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (!groupsInitialized) {
            return;
        }

        let ignore = false;

        async function loadSummary() {
            try {
                const params = selectedGroupId ? `?groupId=${encodeURIComponent(selectedGroupId)}` : '';
                const response = await fetch(`/api/gitlab/summary${params}`);
                if (!response.ok) throw new Error(`GitLab summary failed: ${response.status}`);
                const data = await response.json() as GitLabSummary;
                if (!ignore) setSummary(data);
            } catch (loadError) {
                if (!ignore) setError(loadError instanceof Error ? loadError.message : 'Failed to load GitLab summary');
            }
        }

        loadSummary();

        return () => {
            ignore = true;
        };
    }, [groupsInitialized, selectedGroupId]);

    const totalCommits = formatMetric(summary?.totalCommits);
    const totalProjects = formatMetric(summary?.totalProjects);
    const activeContributors = formatMetric(summary?.activeContributors);
    const openMergeRequests = formatMetric(summary?.openMergeRequests);
    const monthLabels = summary?.monthLabels ?? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    const [selectedTrendProjectId, setSelectedTrendProjectId] = useState<string>('all');
    const [trendGranularity, setTrendGranularity] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const projectDropdownRef = useRef<HTMLDivElement>(null);
    const optionsContainerRef = useRef<HTMLDivElement>(null);

    const [activeDropdownIndex, setActiveDropdownIndex] = useState(0);

    const selectedProjectName = selectedTrendProjectId === 'all'
        ? '全部项目'
        : (summary?.trends?.projects.find(p => String(p.id) === selectedTrendProjectId)?.shortName ?? '未知项目');

    const filteredProjects = (summary?.trends?.projects ?? []).filter(project => {
        const query = projectSearchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            project.shortName.toLowerCase().includes(query) ||
            project.name.toLowerCase().includes(query)
        );
    });

    const dropdownOptions = [
        { id: 'all', shortName: '全部项目', name: '' },
        ...filteredProjects.map(p => ({ id: String(p.id), shortName: p.shortName, name: p.name }))
    ];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
                setIsProjectDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Reset fallback index when query or open status changes
    useEffect(() => {
        setActiveDropdownIndex(0);
    }, [projectSearchQuery, isProjectDropdownOpen]);

    // Keep active option within view inside scroll container
    useEffect(() => {
        if (isProjectDropdownOpen && optionsContainerRef.current) {
            const activeEl = optionsContainerRef.current.children[activeDropdownIndex] as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            }
        }
    }, [activeDropdownIndex, isProjectDropdownOpen]);

    const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isProjectDropdownOpen || dropdownOptions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveDropdownIndex((prev) => (prev < dropdownOptions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveDropdownIndex((prev) => (prev > 0 ? prev - 1 : dropdownOptions.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selectedOpt = dropdownOptions[activeDropdownIndex];
            if (selectedOpt) {
                setSelectedTrendProjectId(selectedOpt.id);
                setIsProjectDropdownOpen(false);
                setProjectSearchQuery('');
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsProjectDropdownOpen(false);
        }
    };

    // Get trend data based on selected project and granularity
    const getTrendDataAndLabels = () => {
        const trends = summary?.trends;
        const defaultMonthly = Array(12).fill(0);
        const defaultDaily = Array(30).fill(0);
        const defaultWeekly = Array(53).fill(0);

        if (!trends) {
            return {
                data: defaultMonthly,
                labels: monthLabels,
                maxValue: 1
            };
        }

        let rawData: number[] = [];
        let labels: string[] = [];

        if (selectedTrendProjectId === 'all') {
            if (trendGranularity === 'monthly') {
                rawData = trends.global.monthly;
                labels = monthLabels;
            } else if (trendGranularity === 'weekly') {
                rawData = trends.global.weekly;
                labels = Array.from({ length: 53 }, (_, i) => `W${i + 1}`);
            } else {
                rawData = trends.global.daily;
                labels = Array.from({ length: trends.global.daily.length }, (_, i) => `${i + 1}日`);
            }
        } else {
            const projectTrend = trends.projects.find(p => String(p.id) === selectedTrendProjectId);
            if (projectTrend) {
                if (trendGranularity === 'monthly') {
                    rawData = projectTrend.monthly;
                    labels = monthLabels;
                } else if (trendGranularity === 'weekly') {
                    rawData = projectTrend.weekly;
                    labels = Array.from({ length: 53 }, (_, i) => `W${i + 1}`);
                } else {
                    rawData = projectTrend.daily;
                    labels = Array.from({ length: projectTrend.daily.length }, (_, i) => `${i + 1}日`);
                }
            } else {
                rawData = trendGranularity === 'monthly' ? defaultMonthly : trendGranularity === 'weekly' ? defaultWeekly : defaultDaily;
                labels = trendGranularity === 'monthly' ? monthLabels : Array.from({ length: rawData.length }, (_, i) => trendGranularity === 'weekly' ? `W${i + 1}` : `${i + 1}日`);
            }
        }

        return {
            data: rawData,
            labels: labels,
            maxValue: Math.max(...rawData, 1)
        };
    };

    const { data: activeTrendData, labels: activeTrendLabels, maxValue: activeTrendMaxValue } = getTrendDataAndLabels();

    const [statsTimeframe, setStatsTimeframe] = useState<'day' | 'month' | 'year'>('day');
    const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);

    const generateMockDays = () => {
        const days = 31;
        const commits = Array(days).fill(0);
        const additions = Array(days).fill(0);
        const deletions = Array(days).fill(0);

        const activeDays = [4, 5, 11, 12, 15, 19, 24, 25, 28];
        const commitsDist = [2, 3,  1,  4,  2,  2,  3,  2,  1]; // Sum = 20
        const additionsDist = [120, 240, 65, 310, 95, 115, 130, 70, 20]; // Sum = 1165
        const deletionsDist = [10, 15, 5, 25, 8, 12, 11, 4, 0]; // Sum = 90

        activeDays.forEach((day, idx) => {
            commits[day - 1] = commitsDist[idx];
            additions[day - 1] = additionsDist[idx];
            deletions[day - 1] = deletionsDist[idx];
        });

        return { commits, additions, deletions };
    };

    const generateMockMonths = () => {
        const months = 12;
        const commits = Array(months).fill(0);
        const additions = Array(months).fill(0);
        const deletions = Array(months).fill(0);

        const activeMonths = [0, 1, 2, 3, 4]; // Jan to May
        const commitsDist = [32, 45, 38, 51, 20]; // Sum = 186
        const additionsDist = [2100, 3120, 2450, 3645, 1165]; // Sum = 12480
        const deletionsDist = [180, 290, 210, 350, 90]; // Sum = 1120

        activeMonths.forEach((m, idx) => {
            commits[m] = commitsDist[idx];
            additions[m] = additionsDist[idx];
            deletions[m] = deletionsDist[idx];
        });

        return { commits, additions, deletions };
    };

    const getStatsCardData = () => {
        const trends = summary?.trends;
        
        let commits: number[] = [];
        let additions: number[] = [];
        let deletions: number[] = [];
        let labels: string[] = [];

        const hasRealData = trends && (
            (selectedTrendProjectId === 'all' && (trends.global?.dailyLoc?.additions?.reduce((a: number, b: number)=>a+b, 0) ?? 0) > 0) ||
            (selectedTrendProjectId !== 'all' && (trends.projects.find(p => String(p.id) === selectedTrendProjectId)?.dailyLoc?.additions?.reduce((a: number, b: number)=>a+b,0) ?? 0) > 0)
        );

        if (hasRealData) {
            if (statsTimeframe === 'day') {
                if (selectedTrendProjectId === 'all') {
                    commits = trends.global.daily;
                    additions = trends.global.dailyLoc?.additions ?? [];
                    deletions = trends.global.dailyLoc?.deletions ?? [];
                } else {
                    const p = trends.projects.find(x => String(x.id) === selectedTrendProjectId);
                    commits = p?.daily ?? [];
                    additions = p?.dailyLoc?.additions ?? [];
                    deletions = p?.dailyLoc?.deletions ?? [];
                }
                labels = Array.from({ length: commits.length }, (_, i) => `${i + 1}日`);
            } else if (statsTimeframe === 'month') {
                if (selectedTrendProjectId === 'all') {
                    commits = trends.global.monthly;
                    additions = trends.global.monthlyLoc?.additions ?? [];
                    deletions = trends.global.monthlyLoc?.deletions ?? [];
                } else {
                    const p = trends.projects.find(x => String(x.id) === selectedTrendProjectId);
                    commits = p?.monthly ?? [];
                    additions = p?.monthlyLoc?.additions ?? [];
                    deletions = p?.monthlyLoc?.deletions ?? [];
                }
                labels = monthLabels;
            } else { // year
                if (selectedTrendProjectId === 'all') {
                    const yearly = trends.global.yearlyLoc;
                    commits = yearly?.commits ?? [];
                    additions = yearly?.additions ?? [];
                    deletions = yearly?.deletions ?? [];
                    labels = yearly?.years ?? [];
                } else {
                    const p = trends.projects.find(x => String(x.id) === selectedTrendProjectId);
                    const yearly = p?.yearlyLoc;
                    commits = yearly?.commits ?? [];
                    additions = yearly?.additions ?? [];
                    deletions = yearly?.deletions ?? [];
                    labels = yearly?.years ?? [];
                }
            }
        }

        const isCommitsEmpty = commits.length === 0 || commits.reduce((a: number, b: number)=>a+b, 0) === 0;
        if (isCommitsEmpty) {
            if (statsTimeframe === 'day') {
                const mock = generateMockDays();
                commits = mock.commits;
                additions = mock.additions;
                deletions = mock.deletions;
                labels = Array.from({ length: 31 }, (_, i) => `${i + 1}日`);
            } else if (statsTimeframe === 'month') {
                const mock = generateMockMonths();
                commits = mock.commits;
                additions = mock.additions;
                deletions = mock.deletions;
                labels = monthLabels;
            } else { // year
                labels = ['2024年', '2025年', '2026年'];
                commits = [340, 410, 186];
                additions = [24100, 29350, 12480];
                deletions = [2150, 2820, 1120];
            }
        }

        const totalCommitsSum = commits.reduce((a: number, b: number) => a + b, 0);
        const totalAdditionsSum = additions.reduce((a: number, b: number) => a + b, 0);
        const totalDeletionsSum = deletions.reduce((a: number, b: number) => a + b, 0);
        const totalChangesSum = totalAdditionsSum + totalDeletionsSum;

        return {
            commits,
            additions,
            deletions,
            labels,
            totalCommitsSum,
            totalAdditionsSum,
            totalDeletionsSum,
            totalChangesSum
        };
    };

    const statsData = getStatsCardData();

    const dailyCommitTrend = summary?.trends?.global?.daily ?? [];
    const maxDailyCommit = Math.max(...dailyCommitTrend, 1);

    const activeTrendPointsStr = activeTrendData.map((val, idx) => {
        const x = 45 + idx * (630 / Math.max(activeTrendData.length - 1, 1));
        const y = 40 + 175 - (val / activeTrendMaxValue) * 175;
        return `${x},${y}`;
    }).join(' ');

    const activeTrendAreaPointsStr = activeTrendData.length > 0 ? [
        `45,215`,
        ...activeTrendData.map((val, idx) => {
            const x = 45 + idx * (630 / Math.max(activeTrendData.length - 1, 1));
            const y = 40 + 175 - (val / activeTrendMaxValue) * 175;
            return `${x},${y}`;
        }),
        `${45 + 630},215`
    ].join(' ') : '';

    async function loadMoreProjects() {
        if (projectsLoading || !projectsHasMore) {
            return;
        }

        setProjectsLoading(true);
        try {
            const groupParam = selectedGroupId ? `&groupId=${encodeURIComponent(selectedGroupId)}` : '';
            const response = await fetch(`/api/gitlab/projects?offset=${projectsOffset}&limit=20${groupParam}`);
            if (!response.ok) throw new Error(`GitLab projects failed: ${response.status}`);
            const data = await response.json() as ProjectPage;

            setAllProjects((current) => [...current, ...data.items]);
            setProjectsOffset(data.offset + data.limit);
            setProjectsTotal(data.total);
            setProjectsHasMore(data.hasMore);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load GitLab projects');
        } finally {
            setProjectsLoading(false);
        }
    }

    // 弹窗按需分页加载项目数据
    async function loadModalProjects(reset = false) {
        if (modalLoading) return;
        const currentOffset = reset ? 0 : modalOffset;
        setModalLoading(true);
        try {
            const groupParam = selectedGroupId ? `&groupId=${encodeURIComponent(selectedGroupId)}` : '';
            const limit = 15;
            const response = await fetch(`/api/gitlab/projects?offset=${currentOffset}&limit=${limit}${groupParam}`);
            if (!response.ok) throw new Error(`GitLab projects failed: ${response.status}`);
            const data = await response.json() as ProjectPage;

            if (reset) {
                setModalProjects(data.items);
                setModalOffset(data.items.length);
            } else {
                setModalProjects((current) => [...current, ...data.items]);
                setModalOffset(currentOffset + data.items.length);
            }
            setModalProjectsTotal(data.total);
            setModalHasMore(data.hasMore);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : '加载项目细节弹窗失败');
        } finally {
            setModalLoading(false);
        }
    }

    const handleOpenProjectsModal = () => {
        setIsProjectsModalOpen(true);
        loadModalProjects(true);
    };

    const visibleProjects = showAllProjects ? [...(summary?.topProjects ?? []), ...allProjects] : (summary?.topProjects ?? []);
    const hasMoreProjects = projectsTotal ? visibleProjects.length < projectsTotal : projectsHasMore;
    const isProjectsListLoading = showAllProjects && projectsLoading && allProjects.length === 0;

    function resetProjectsState() {
        setAllProjects([]);
        setProjectsOffset(5);
        setProjectsTotal(null);
        setProjectsHasMore(true);
        setShowAllProjects(false);

        // 重置弹层相关的状态，保证切组后数据对应正确
        setModalProjects([]);
        setModalOffset(0);
        setModalProjectsTotal(null);
        setModalHasMore(true);
    }

    function handleGroupChange(groupId: string) {
        setSelectedGroupId(groupId);
        resetProjectsState();
        setSummary(null);
        setGroupMenuOpen(false);
        setSelectedTrendProjectId('all');
        setTrendGranularity('monthly');
    }

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
                setGroupMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const selectedGroup = groups.find((group) => String(group.id) === selectedGroupId) ?? null;
    const groupLabel = selectedGroup?.fullName ?? '全部组';

    return (
        <main className="flex-1 overflow-y-auto p-margin-md">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-gutter">
                {/* Page Header (Full Width) */}
                <div className="col-span-1 md:col-span-6 lg:col-span-12 mb-2 flex justify-between items-end">
                    <div>
                        <h2 className="font-headline-md text-headline-md text-on-surface">系统总览</h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">汇总所有已跟踪 GitLab 仓库的核心指标。</p>
                        {error && <p className="font-body-sm text-body-sm text-error mt-2">{error}</p>}
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="relative" ref={groupMenuRef}>
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-left transition-all hover:border-secondary/40 hover:bg-surface-container"
                                onClick={() => setGroupMenuOpen((open) => !open)}
                                aria-haspopup="listbox"
                                aria-expanded={groupMenuOpen}
                            >
                                <span className="font-body-sm text-body-sm text-on-surface">{groupsLoading ? '加载中...' : groupLabel}</span>
                                <span className="rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">{selectedGroupId ? '组内' : '全局'}</span>
                                <span className={`text-on-surface-variant text-xs transition-transform ${groupMenuOpen ? 'rotate-180' : ''}`}>▾</span>
                            </button>
                            {groupMenuOpen && (
                                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[280px] overflow-hidden rounded-xl border border-outline-variant bg-surface-dim/95 shadow-[0_16px_48px_rgba(2,6,23,0.5)] backdrop-blur-xl">
                                    <div className="border-b border-outline-variant px-3 py-2">
                                        <div className="font-label-caps text-[10px] tracking-[0.15em] text-on-surface-variant">选择 GitLab 组</div>
                                    </div>
                                    <div className="max-h-[280px] overflow-y-auto py-1">
                                        <button
                                            type="button"
                                            className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-secondary/10 ${!selectedGroupId ? 'bg-secondary/10 text-on-surface' : 'text-on-surface-variant'}`}
                                            onClick={() => handleGroupChange('')}
                                        >
                                            <span className="font-body-sm text-body-sm">全部组</span>
                                            {!selectedGroupId && <span className="text-secondary text-xs">●</span>}
                                        </button>
                                        {groups.map((group) => {
                                            const active = String(group.id) === selectedGroupId;
                                            return (
                                                <button
                                                    key={group.id}
                                                    type="button"
                                                    className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-secondary/10 ${active ? 'bg-secondary/10 text-on-surface' : 'text-on-surface-variant'}`}
                                                    onClick={() => handleGroupChange(String(group.id))}
                                                >
                                                    <span className="min-w-0 truncate font-body-sm text-body-sm">{group.fullName}</span>
                                                    {active && <span className="text-secondary text-xs">●</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-body-sm flex items-center gap-1 hover:bg-surface-container transition-colors">
                            <Calendar size={16} />
                            最近 30 天
                        </button>
                        <button className="px-3 py-1.5 bg-secondary text-on-secondary rounded font-body-sm text-body-sm flex items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:opacity-90 transition-opacity">
                            <Download size={16} />
                            导出
                        </button>
                    </div>
                </div>

                {/* KPI Cards (3 cols each on LG) */}
                <div className="workspace-card bg-surface-container-lowest border border-outline-variant rounded p-margin-sm col-span-1 md:col-span-3 lg:col-span-3 hover-ambient-shadow">
                    <div className="border-b border-outline-variant pb-2 mb-3 flex justify-between items-center">
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">近30天总提交数</span>
                        <GitCommit size={16} className="text-on-surface-variant" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="font-headline-lg text-headline-lg text-on-surface font-code-md">{totalCommits}</div>
                        <div className="font-body-sm text-body-sm text-secondary flex items-center">
                            <TrendingUp size={14} className="mr-1" /> 12%
                        </div>
                    </div>
                </div>

                <div
                    onClick={handleOpenProjectsModal}
                    className="workspace-card bg-surface-container-lowest border border-outline-variant rounded p-margin-sm col-span-1 md:col-span-3 lg:col-span-3 hover-ambient-shadow cursor-pointer transition-all hover:border-primary/50 group/card"
                >
                    <div className="border-b border-outline-variant pb-2 mb-3 flex justify-between items-center">
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-hover/card:text-primary transition-colors">项目数</span>
                        <Code size={16} className="text-on-surface-variant group-hover/card:text-primary transition-colors" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="font-headline-lg text-headline-lg text-on-surface font-code-md group-hover/card:text-primary-fixed transition-colors">{totalProjects}</div>
                            <div className="text-[10px] text-secondary font-medium tracking-tight mt-1 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-1">
                                点击查看详情 <span>→</span>
                            </div>
                        </div>
                        <div className="font-body-sm text-body-sm text-secondary flex items-center mb-1 shrink-0">
                            <TrendingUp size={14} className="mr-1" /> 5.4%
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setIsContributorsModalOpen(true)}
                    className="workspace-card bg-surface-container-lowest border border-outline-variant rounded p-margin-sm col-span-1 md:col-span-3 lg:col-span-3 hover-ambient-shadow cursor-pointer transition-all hover:border-primary/50 group/card"
                >
                    <div className="border-b border-outline-variant pb-2 mb-3 flex justify-between items-center">
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider group-hover/card:text-primary transition-colors">活跃贡献者</span>
                        <Users size={16} className="text-on-surface-variant group-hover/card:text-primary transition-colors" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="font-headline-lg text-headline-lg text-on-surface font-code-md group-hover/card:text-primary-fixed transition-colors">{activeContributors}</div>
                            <div className="text-[10px] text-secondary font-medium tracking-tight mt-1 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-1">
                                点击查看详情 <span>→</span>
                            </div>
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center mb-1 shrink-0">
                            <Minus size={14} className="mr-1" /> 0%
                        </div>
                    </div>
                </div>

                <div className="workspace-card bg-surface-container-lowest border border-outline-variant rounded p-margin-sm col-span-1 md:col-span-3 lg:col-span-3 hover-ambient-shadow">
                    <div className="border-b border-outline-variant pb-2 mb-3 flex justify-between items-center">
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">待处理 MR</span>
                        <GitMerge size={16} className="text-on-surface-variant" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="font-headline-lg text-headline-lg text-on-surface font-code-md">{openMergeRequests}</div>
                        <div className="font-body-sm text-body-sm text-error flex items-center">
                            <TrendingDown size={14} className="mr-1" /> 3%
                        </div>
                    </div>
                </div>

                {/* Monthly/Weekly/Daily Commit Trends (Line Chart) - Span 8 */}
                <div className="workspace-card bg-surface-container-lowest border border-outline-variant rounded p-margin-sm col-span-1 md:col-span-6 lg:col-span-8 flex flex-col min-h-[350px] hover-ambient-shadow">
                    <div className="border-b border-outline-variant pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">代码提交趋势</span>
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono font-medium lowercase">
                                {trendGranularity === 'monthly' ? '月度' : trendGranularity === 'weekly' ? '年度周度' : '每日'}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Project Select Dropdown with Fuzzy Search */}
                            <div className="relative flex items-center select-none shrink-0" ref={projectDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                                    className="flex items-center pl-7 pr-7 bg-surface border border-outline-variant rounded-lg text-[11px] text-on-surface hover:border-primary/50 hover:bg-surface-container transition-all cursor-pointer h-7 font-semibold min-w-[110px] max-w-[200px] truncate relative text-left"
                                >
                                    <Folder size={12} className="absolute left-2.5 text-primary" />
                                    <span className="truncate pr-1">{selectedProjectName}</span>
                                    <ChevronDown size={11} className="absolute right-2 text-on-surface-variant pointer-events-none" />
                                </button>
                                
                                {isProjectDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-60 bg-surface-container-highest border border-outline-variant rounded-lg shadow-xl z-50 flex flex-col p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                        {/* Search Input */}
                                        <div className="relative flex items-center mb-1.5">
                                            <Search size={12} className="absolute left-2.5 text-on-surface-variant" />
                                            <input
                                                type="text"
                                                value={projectSearchQuery}
                                                onChange={(e) => setProjectSearchQuery(e.target.value)}
                                                onKeyDown={handleDropdownKeyDown}
                                                placeholder="搜索项目..."
                                                className="w-full bg-surface border border-outline-variant rounded px-2 py-1 pl-7 text-[11px] text-on-surface focus:outline-none focus:border-primary/50"
                                                autoFocus
                                            />
                                        </div>
                                        
                                        {/* Options List */}
                                        <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5" ref={optionsContainerRef}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTrendProjectId('all');
                                                    setIsProjectDropdownOpen(false);
                                                    setProjectSearchQuery('');
                                                }}
                                                onMouseEnter={() => setActiveDropdownIndex(0)}
                                                className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-semibold text-left transition-all cursor-pointer border ${
                                                    selectedTrendProjectId === 'all'
                                                        ? 'bg-primary text-on-primary border-primary'
                                                        : activeDropdownIndex === 0
                                                        ? 'bg-primary/10 text-primary border-primary/20'
                                                        : 'text-on-surface-variant hover:bg-surface hover:text-on-surface border-transparent'
                                                }`}
                                            >
                                                <span className="truncate">全部项目</span>
                                            </button>
                                            
                                            {filteredProjects.map((p, idx) => {
                                                const isSelected = selectedTrendProjectId === String(p.id);
                                                const overallIdx = idx + 1; // +1 because "全部项目" is at index 0
                                                const isHighlighted = activeDropdownIndex === overallIdx;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTrendProjectId(String(p.id));
                                                            setIsProjectDropdownOpen(false);
                                                            setProjectSearchQuery('');
                                                        }}
                                                        onMouseEnter={() => setActiveDropdownIndex(overallIdx)}
                                                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-semibold text-left transition-all cursor-pointer border ${
                                                            isSelected
                                                                ? 'bg-primary text-on-primary border-primary'
                                                                : isHighlighted
                                                                ? 'bg-primary/10 text-primary border-primary/20'
                                                                : 'text-on-surface-variant hover:bg-surface hover:text-on-surface border-transparent'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col min-w-0 pr-2">
                                                            <span className="truncate">{p.shortName}</span>
                                                            <span className={`text-[9px] truncate font-normal ${isSelected ? 'text-on-primary/70' : 'text-on-surface-variant/70'}`}>
                                                                {p.name}
                                                            </span>
                                                        </div>
                                                    </button>
                                                 );
                                            })}
                                            
                                            {filteredProjects.length === 0 && (
                                                <div className="text-center text-[10px] text-on-surface-variant py-3 font-medium">
                                                    未找到匹配项目
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Granularity Switcher Tabs */}
                            <div className="flex bg-surface border border-outline-variant rounded-lg p-0.5 h-7 items-center shrink-0">
                                {(['monthly', 'weekly', 'daily'] as const).map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setTrendGranularity(g)}
                                        className={`px-3 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer h-full flex items-center ${
                                            trendGranularity === g
                                                ? 'bg-primary text-on-primary shadow-sm'
                                                : 'text-on-surface-variant hover:text-on-surface'
                                        }`}
                                    >
                                        {g === 'monthly' ? '每月' : g === 'weekly' ? '每周' : '每天'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full min-h-[220px]">
                        <svg 
                            className="w-full h-full" 
                            viewBox="0 0 710 250"
                        >
                            <defs>
                                <linearGradient id="trendCardGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3781f3" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#3781f3" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>

                            {/* Y-axis gridlines and labels */}
                            {[0, 0.25, 0.5, 0.75, i => 1].slice(0, 5).map((_, i) => {
                                const ratios = [0, 0.25, 0.5, 0.75, 1];
                                const ratio = ratios[i];
                                const y = 40 + ratio * 175;
                                const gridValue = Math.round(activeTrendMaxValue * (1 - ratio));
                                return (
                                    <g key={i}>
                                        <line 
                                            x1="45" 
                                            y1={y} 
                                            x2="675" 
                                            y2={y} 
                                            stroke="#e1e4e8" 
                                            strokeDasharray="4 4" 
                                            strokeWidth="0.8" 
                                            className="chart-grid-line"
                                        />
                                        <text 
                                            x="35" 
                                            y={y + 3} 
                                            textAnchor="end" 
                                            className="text-[9px] font-mono fill-on-surface-variant font-medium"
                                        >
                                            {gridValue}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Line & Shaded Area */}
                            {activeTrendData.length > 0 && (
                                <motion.g 
                                    key={trendGranularity}
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1, transition: { duration: 0.5 } }
                                    }}
                                >
                                    {/* Shaded Area */}
                                    <motion.polygon 
                                        fill="url(#trendCardGradient)" 
                                        points={activeTrendAreaPointsStr} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                    />
                                    {/* Trend line */}
                                    <motion.polyline 
                                        fill="none" 
                                        points={activeTrendPointsStr} 
                                        stroke="#3781f3" 
                                        strokeLinejoin="round" 
                                        strokeLinecap="round" 
                                        strokeWidth="2.5" 
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 1.2, ease: "easeInOut" }}
                                    />
                                    
                                    {/* Points and data labels above points */}
                                    {activeTrendData.map((val, idx) => {
                                        const x = 45 + idx * (630 / Math.max(activeTrendData.length - 1, 1));
                                        const y = 40 + 175 - (val / activeTrendMaxValue) * 175;
                                        
                                        // To prevent a mess on large graphs, hide zeros in weekly/daily views
                                        const shouldShowText = trendGranularity === 'monthly' || val > 0;

                                        return (
                                            <g key={idx} className="group/dot">
                                                <motion.circle 
                                                    cx={x} 
                                                    cy={y} 
                                                    r="3.5" 
                                                    fill="#ffffff" 
                                                    stroke="#3781f3" 
                                                    strokeWidth="2" 
                                                    className="transition-all duration-150 hover:r-[5px] cursor-pointer"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ 
                                                        delay: 0.6 + idx * (1 / Math.max(activeTrendData.length, 1)) * 0.4, 
                                                        type: 'spring', 
                                                        stiffness: 180, 
                                                        damping: 12 
                                                    }}
                                                />
                                                {shouldShowText && (
                                                    <motion.text 
                                                        x={x} 
                                                        y={y - 8} 
                                                        textAnchor="middle" 
                                                        className="text-[9px] font-bold font-mono fill-primary select-none drop-shadow-sm transition-all group-hover/dot:text-[11px]"
                                                        initial={{ opacity: 0, y: y - 2 }}
                                                        animate={{ opacity: 1, y: y - 8 }}
                                                        transition={{ delay: 0.8 + idx * (1 / Math.max(activeTrendData.length, 1)) * 0.4, duration: 0.3 }}
                                                    >
                                                        {val}
                                                    </motion.text>
                                                )}
                                            </g>
                                        );
                                    })}
                                </motion.g>
                            )}

                            {/* X-axis labels */}
                            {activeTrendLabels.map((lbl, idx) => {
                                let showLabel = false;
                                if (trendGranularity === 'monthly') showLabel = true;
                                else if (trendGranularity === 'weekly') {
                                    showLabel = idx % 5 === 0 || idx === activeTrendLabels.length - 1;
                                } else { // daily
                                    showLabel = idx % 4 === 0 || idx === activeTrendLabels.length - 1;
                                }

                                if (!showLabel) return null;

                                const x = 45 + idx * (630 / Math.max(activeTrendData.length - 1, 1));
                                return (
                                    <text
                                        key={idx}
                                        x={x}
                                        y={235}
                                        textAnchor="middle"
                                        className="text-[9px] font-mono fill-on-surface-variant font-semibold"
                                    >
                                        {lbl}
                                    </text>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* R&D Workload & Change Statistics (Commits & LOC) - Span 4 */}
                <div className="workspace-card bg-surface-container-lowest border border-outline-variant rounded p-margin-sm col-span-1 md:col-span-6 lg:col-span-4 flex flex-col min-h-[380px] hover-ambient-shadow">
                    
                    {/* Card Header with Timeframe Tabs */}
                    <div className="border-b border-outline-variant pb-2 mb-3 flex justify-between items-center bg-surface-container-lowest">
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">研发提交与行数统计</span>
                        
                        <div className="flex bg-surface border border-outline-variant rounded-md p-0.5 h-6 items-center">
                            {([
                                { key: 'day', label: '天' },
                                { key: 'month', label: '月' },
                                { key: 'year', label: '年' }
                            ] as const).map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => {
                                        setStatsTimeframe(t.key);
                                        setHoveredDataIndex(null);
                                    }}
                                    className={`px-2.5 h-full rounded text-[10px] font-semibold transition-all cursor-pointer flex items-center ${
                                        statsTimeframe === t.key
                                            ? 'bg-primary text-on-primary shadow-sm'
                                            : 'text-on-surface-variant hover:text-on-surface'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats HUD readout */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-on-surface-variant/80 font-medium select-none">
                                {hoveredDataIndex !== null 
                                    ? `数据详情: ${statsData.labels[hoveredDataIndex]}`
                                    : `${statsTimeframe === 'day' ? '本月' : statsTimeframe === 'month' ? '今年' : '历史'}累计工作量`
                                }
                            </span>
                            {hoveredDataIndex !== null && (
                                <button 
                                    className="text-[9px] text-primary hover:underline transition-all cursor-pointer"
                                    onClick={() => setHoveredDataIndex(null)}
                                >
                                    重置视图
                                </button>
                            )}
                        </div>
                        
                        {/* 4-Stat Value Grid */}
                        <div className="grid grid-cols-2 gap-2 bg-surface/40 p-2.5 rounded-lg border border-outline-variant/50">
                            {/* Commits */}
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-blue-500/10 text-blue-500 shrink-0">
                                    <GitCommit size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] text-on-surface-variant font-medium">提交数</span>
                                    <span className="text-sm font-bold font-mono text-on-surface truncate">
                                        {hoveredDataIndex !== null ? statsData.commits[hoveredDataIndex] : statsData.totalCommitsSum}
                                    </span>
                                </div>
                            </div>

                            {/* Additions */}
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 shrink-0">
                                    <TrendingUp size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] text-on-surface-variant font-medium">新增行数</span>
                                    <span className="text-sm font-bold font-mono text-emerald-600 truncate">
                                        {hoveredDataIndex !== null ? `+${statsData.additions[hoveredDataIndex]}` : `+${statsData.totalAdditionsSum}`}
                                    </span>
                                </div>
                            </div>

                            {/* Deletions */}
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-red-500/10 text-red-500 shrink-0">
                                    <TrendingDown size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] text-on-surface-variant font-medium">删除行数</span>
                                    <span className="text-sm font-bold font-mono text-red-500 truncate">
                                        {hoveredDataIndex !== null ? `-${statsData.deletions[hoveredDataIndex]}` : `-${statsData.totalDeletionsSum}`}
                                    </span>
                                </div>
                            </div>

                            {/* Total LOC Change */}
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-amber-500/10 text-amber-500 shrink-0">
                                    <Code size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] text-on-surface-variant font-medium">总变更行</span>
                                    <span className="text-sm font-bold font-mono text-amber-600 truncate">
                                        {hoveredDataIndex !== null 
                                            ? (statsData.additions[hoveredDataIndex] + statsData.deletions[hoveredDataIndex]) 
                                            : statsData.totalChangesSum
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 relative w-full h-[140px] mt-1 select-none">
                        {/* Legend */}
                        <div className="absolute top-0 right-0 flex items-center gap-2 text-[8px] font-semibold text-on-surface-variant/90 select-none bg-surface-container-lowest/80 px-1 rounded">
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-sm bg-[#10b981]"/>
                                <span>新增</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-sm bg-[#ef4444]"/>
                                <span>删除</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-0.5 bg-[#3b82f6]"/>
                                <span>提交</span>
                            </div>
                        </div>

                        <svg className="w-full h-full" viewBox="0 0 320 160">
                            {/* Horizontal Gridlines */}
                            {[0, 0.5, 1].map((ratio, i) => {
                                const y = 15 + ratio * 105;
                                return (
                                    <line
                                        key={i}
                                        x1="18"
                                        y1={y}
                                        x2="305"
                                        y2={y}
                                        stroke="#f3f4f6"
                                        strokeDasharray="2 2"
                                        strokeWidth="0.8"
                                    />
                                );
                            })}

                            {/* Render stacks and paths */}
                            {(() => {
                                const numItems = statsData.additions.length;
                                const maxLoc = Math.max(...statsData.additions.map((add, idx) => add + statsData.deletions[idx]), 1);
                                const maxCmt = Math.max(...statsData.commits, 1);
                                const colW = 287 / numItems;

                                // Build commit line points vector
                                const commitPointsStr = statsData.commits.map((cmt, idx) => {
                                    const x = 18 + idx * colW + colW / 2;
                                    const y = 120 - (cmt / maxCmt) * 85;
                                    return `${x},${y}`;
                                }).join(' ');

                                return (
                                    <>
                                        {/* Column-by-column background slots & stats bars */}
                                        {statsData.additions.map((addVal, i) => {
                                            const delVal = statsData.deletions[i];
                                            const addH = (addVal / maxLoc) * 95;
                                            const delH = (delVal / maxLoc) * 95;
                                            
                                            const colLeft = 18 + i * colW;
                                            const x = colLeft + (colW > 10 ? 2 : 0.5);
                                            const width = Math.max(colW - (colW > 10 ? 4 : 1), 1);

                                            const isSelected = hoveredDataIndex === i;

                                            return (
                                                <g key={i}>
                                                    {/* Hover highlights */}
                                                    <rect
                                                        x={colLeft}
                                                        y="10"
                                                        width={colW}
                                                        height="120"
                                                        fill={isSelected ? "rgba(59, 130, 246, 0.04)" : "transparent"}
                                                        className="transition-colors cursor-pointer"
                                                        onMouseEnter={() => setHoveredDataIndex(i)}
                                                        onTouchStart={() => setHoveredDataIndex(i)}
                                                    />

                                                    {/* Additions fill */}
                                                    {addVal > 0 && (
                                                        <rect
                                                            x={x}
                                                            y={120 - addH}
                                                            width={width}
                                                            height={addH}
                                                            fill={isSelected ? "#059669" : "#10b981"}
                                                            className="transition-all rounded-sm cursor-pointer"
                                                            onMouseEnter={() => setHoveredDataIndex(i)}
                                                            onTouchStart={() => setHoveredDataIndex(i)}
                                                        />
                                                    )}

                                                    {/* Deletions stacked fill */}
                                                    {delVal > 0 && (
                                                        <rect
                                                            x={x}
                                                            y={120 - addH - delH}
                                                            width={width}
                                                            height={delH}
                                                            fill={isSelected ? "#dc2626" : "#ef4444"}
                                                            className="transition-all rounded-sm cursor-pointer"
                                                            onMouseEnter={() => setHoveredDataIndex(i)}
                                                            onTouchStart={() => setHoveredDataIndex(i)}
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}

                                        {/* Polyline Overlay - Commits count */}
                                        {statsData.commits.length > 1 && (
                                            <polyline
                                                fill="none"
                                                points={commitPointsStr}
                                                stroke="#3b82f6"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                className="drop-shadow-sm pointer-events-none"
                                            />
                                        )}

                                        {/* Overlay Circles - commit points */}
                                        {statsData.commits.map((cmt, i) => {
                                            const x = 18 + i * colW + colW / 2;
                                            const y = 120 - (cmt / maxCmt) * 85;
                                            const isSelected = hoveredDataIndex === i;

                                            if (cmt === 0 && statsTimeframe === 'day') return null;

                                            return (
                                                <g key={i} className="pointer-events-none">
                                                    <circle
                                                        cx={x}
                                                        cy={y}
                                                        r={isSelected ? 4.5 : 2.5}
                                                        fill="#ffffff"
                                                        stroke="#3b82f6"
                                                        strokeWidth={isSelected ? 2.5 : 1.5}
                                                        className="transition-all"
                                                    />
                                                </g>
                                            );
                                        })}

                                        {/* Subsampled X-axis Labels */}
                                        {statsData.labels.map((lbl, idx) => {
                                            const x = 18 + idx * colW + colW / 2;
                                            
                                            let showLabel = false;
                                            if (statsTimeframe === 'year') showLabel = true;
                                            else if (statsTimeframe === 'month') {
                                                showLabel = idx % 2 === 0;
                                            } else { // day
                                                showLabel = idx % 5 === 0 || idx === numItems - 1;
                                            }

                                            if (!showLabel) return null;

                                            return (
                                                <text
                                                    key={idx}
                                                    x={x}
                                                    y={136}
                                                    textAnchor="middle"
                                                    className="text-[8px] font-mono fill-on-surface-variant font-medium pointer-events-none"
                                                >
                                                    {lbl}
                                                </text>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </svg>
                    </div>
                </div>

                {/* Top Active Projects (Table) - Span 12 */}
                <div className="workspace-card bg-surface-container-lowest border border-outline-variant rounded p-margin-sm col-span-1 md:col-span-6 lg:col-span-12 hover-ambient-shadow">
                    <div className="border-b border-outline-variant pb-2 mb-2 flex justify-between items-center">
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">最活跃项目</span>
                        <button
                            className="font-body-sm text-body-sm text-on-tertiary-container hover:underline"
                            onClick={() => {
                                setShowAllProjects(true);
                                if (!allProjects.length) loadMoreProjects();
                            }}
                            type="button"
                        >
                            查看全部
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-outline-variant">
                                <th className="py-2 px-2 font-label-caps text-label-caps text-on-surface-variant w-1/3">仓库</th>
                                <th className="py-2 px-2 font-label-caps text-label-caps text-on-surface-variant">来源</th>
                                <th className="py-2 px-2 font-label-caps text-label-caps text-on-surface-variant text-right">提交数（30 天）</th>
                                <th className="py-2 px-2 font-label-caps text-label-caps text-on-surface-variant text-right">状态</th>
                            </tr>
                            </thead>
                            <tbody className="font-body-sm text-body-sm">
                            {visibleProjects.map((project, index) => (
                                <tr key={project.id} className="border-b border-surface-container hover:bg-surface transition-colors">
                                    <td className="py-2 px-2 flex items-center gap-2">
                                        <Folder size={16} className="text-on-surface-variant" />
                                        <a className="font-code-md font-medium text-on-surface hover:text-secondary" href={project.webUrl} target="_blank" rel="noreferrer">{project.name}</a>
                                    </td>
                                    <td className="py-2 px-2">
                                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#3178c6]/10 text-[#3178c6] text-[10px] font-medium">GitLab</span>
                                    </td>
                                    <td className="py-2 px-2 text-right font-code-md">{formatMetric(project.commits30d)}</td>
                                    <td className={`py-2 px-2 text-right ${index < 2 ? 'text-secondary' : 'text-on-surface-variant'} flex justify-end items-center gap-1`}>
                                        {index < 2 ? <ArrowUp size={14} /> : <Minus size={14} />} 活跃
                                    </td>
                                </tr>
                            ))}
                            {!summary && !error && !showAllProjects && (
                                <tr>
                                    <td className="py-4 px-2 text-on-surface-variant" colSpan={4}>正在加载 GitLab 项目...</td>
                                </tr>
                            )}
                            {summary && summary.topProjects.length === 0 && !showAllProjects && (
                                <tr>
                                    <td className="py-4 px-2 text-on-surface-variant" colSpan={4}>最近 30 天没有 GitLab 项目活动。</td>
                                </tr>
                            )}
                            {isProjectsListLoading && (
                                <tr>
                                    <td className="py-4 px-2 text-on-surface-variant" colSpan={4}>正在加载更多项目...</td>
                                </tr>
                            )}
                            {showAllProjects && hasMoreProjects && !projectsLoading && (
                                <tr>
                                    <td className="py-4 px-2 text-center" colSpan={4}>
                                        <button
                                            type="button"
                                            className="text-secondary hover:underline"
                                            onClick={loadMoreProjects}
                                        >
                                            加载更多
                                        </button>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 项目细节弹出层 */}
            {isProjectsModalOpen && (
                <div id="projects-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* 背景遮罩 */}
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => setIsProjectsModalOpen(false)}
                    />

                    {/* 弹窗主体 */}
                    <div className="relative bg-surface-dim/95 border border-outline border-outline-variant w-full max-w-2xl rounded-2xl shadow-[0_24px_64px_rgba(2,6,23,0.5)] overflow-hidden flex flex-col max-h-[85vh] transform transition-all duration-300 animate-in fade-in zoom-in-95">
                        {/* 弹窗头部 */}
                        <div className="border-b border-outline-variant px-6 py-4 flex items-center justify-between bg-surface-bright bg-surface-container-low">
                            <div>
                                <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                                    <Folder className="text-secondary" size={20} />
                                    <span>{groupLabel} GitLab 项目详情</span>
                                </h3>
                                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                                    共跟踪 {modalProjectsTotal !== null ? modalProjectsTotal : (totalProjects || '...')} 个代码仓库
                                </p>
                            </div>
                            <button
                                onClick={() => setIsProjectsModalOpen(false)}
                                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors p-2 rounded-full cursor-pointer"
                                aria-label="关闭弹窗"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* 弹窗核心内容：列表 */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                            {modalProjects.map((project) => {
                                const formatDate = (dateStr?: string) => {
                                    if (!dateStr) return '无活跃记录';
                                    try {
                                        const d = new Date(dateStr);
                                        return d.toLocaleDateString('zh-CN', {
                                            year: 'numeric',
                                            month: 'numeric',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    } catch {
                                        return dateStr;
                                    }
                                };

                                return (
                                    <div
                                        key={project.id}
                                        className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-secondary/30 transition-all hover-ambient-shadow flex-wrap gap-2"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant shrink-0">
                                                <Code size={18} className="text-primary-fixed" />
                                            </div>
                                            <div className="min-w-0">
                                                <a
                                                    href={project.webUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-code-md text-body-md font-semibold text-on-surface hover:text-secondary truncate flex items-center gap-1.5"
                                                >
                                                    <span className="truncate">{project.name}</span>
                                                    <span className="text-[10px] text-secondary border border-secondary/20 px-1 py-0.2 rounded shrink-0">GitLab 🔗</span>
                                                </a>
                                                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-3">
                                                    <span>ID: <code className="font-code-md text-xs">{project.id}</code></span>
                                                    <span>•</span>
                                                    <span>最近活跃: {formatDate(project.lastActivityAt)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-on-surface font-code-md font-semibold">
                                                    <GitCommit size={14} className="text-secondary" />
                                                    <span>{project.commits30d !== null ? project.commits30d : '...'}</span>
                                                </div>
                                                <span className="text-[10px] uppercase font-label-caps tracking-wider text-on-surface-variant">最近30天提交</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 加载状态与空数据提示 */}
                            {modalLoading && modalProjects.length === 0 && (
                                <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                                    <p className="font-body-md text-body-md text-center">正在加载 GitLab 项目数据...</p>
                                </div>
                            )}

                            {!modalLoading && modalProjects.length === 0 && (
                                <div className="py-12 text-center text-on-surface-variant">
                                    <Folder className="mx-auto mb-3 opacity-30" size={36} />
                                    <p className="font-body-sm text-body-sm">该组内暂无活跃的代码仓库数据。</p>
                                </div>
                            )}

                            {/* 加载更多 */}
                            {modalHasMore && !modalLoading && modalProjects.length > 0 && (
                                <div className="pt-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => loadModalProjects(false)}
                                        className="px-6 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[13px] rounded-lg text-primary hover:text-secondary-fixed transition-colors font-medium cursor-pointer"
                                    >
                                        加载更多项目
                                    </button>
                                </div>
                            )}

                            {modalLoading && modalProjects.length > 0 && (
                                <div className="py-4 flex justify-center items-center gap-2 text-on-surface-variant">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                    <span className="font-body-sm text-body-sm">正在加载更多...</span>
                                </div>
                            )}
                        </div>

                        {/* 弹窗底部 */}
                        <div className="border-t border-outline-variant px-6 py-4 flex justify-end bg-surface-bright bg-surface-container-low">
                            <button
                                onClick={() => setIsProjectsModalOpen(false)}
                                className="px-5 py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm hover:opacity-95 transition-opacity cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 活跃贡献者弹出细则 */}
            {isContributorsModalOpen && (
                <div id="contributors-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* 背景遮罩 */}
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => {
                            setIsContributorsModalOpen(false);
                            setContributorSearchQuery('');
                        }}
                    />

                    {/* 弹窗主体 */}
                    <div className="relative bg-surface-dim/95 border border-outline border-outline-variant w-full max-w-2xl rounded-2xl shadow-[0_24px_64px_rgba(2,6,23,0.5)] overflow-hidden flex flex-col max-h-[85vh] transform transition-all duration-300 animate-in fade-in zoom-in-95">
                        {/* 弹窗头部 */}
                        <div className="border-b border-outline-variant px-6 py-4 flex items-center justify-between bg-surface-bright bg-surface-container-low">
                            <div>
                                <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                                    <Users className="text-secondary" size={20} />
                                    <span>{groupLabel} 活跃贡献者与贡献列表</span>
                                </h3>
                                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                                    展示最近30天内提交代码的团队成员及工作量排行
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsContributorsModalOpen(false);
                                    setContributorSearchQuery('');
                                }}
                                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors p-2 rounded-full cursor-pointer"
                                aria-label="关闭弹窗"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* 搜索控制台 & 头部汇总 */}
                        <div className="px-6 py-3.5 bg-surface border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="relative flex items-center flex-1 max-w-sm">
                                <Search size={14} className="absolute left-3 text-on-surface-variant" />
                                <input
                                    type="text"
                                    value={contributorSearchQuery}
                                    onChange={(e) => setContributorSearchQuery(e.target.value)}
                                    placeholder="搜索贡献者姓名..."
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1.5 pl-8 text-xs text-on-surface focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="text-[11px] text-on-surface-variant font-mono text-right flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <span>筛选出: <strong className="text-primary font-bold">{(summary?.contributorsList ?? []).filter(c => c.name.toLowerCase().includes(contributorSearchQuery.toLowerCase())).length}</strong> 人</span>
                                <span>•</span>
                                <span>总人数: {summary?.contributorsList?.length ?? 0} 人</span>
                            </div>
                        </div>

                        {/* 弹窗核心内容：活跃贡献者排行列表 */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 custom-scrollbar">
                            {((summary?.contributorsList ?? []).filter(c => 
                                c.name.toLowerCase().includes(contributorSearchQuery.toLowerCase())
                            )).map((contributor, idx) => {
                                const initials = contributor.name.substring(0, 2).toUpperCase();
                                
                                // Beautiful gradient background indices based on name to make it look professional
                                const avatarBgGradients = [
                                    "bg-gradient-to-br from-blue-500/10 to-blue-600/30 text-blue-600 border-blue-500/20",
                                    "bg-gradient-to-br from-emerald-500/10 to-emerald-600/30 text-emerald-600 border-emerald-500/20",
                                    "bg-gradient-to-br from-purple-500/10 to-purple-600/30 text-purple-600 border-purple-500/20",
                                    "bg-gradient-to-br from-amber-500/10 to-amber-600/30 text-amber-600 border-amber-500/20",
                                    "bg-gradient-to-br from-pink-500/10 to-pink-600/30 text-pink-600 border-pink-500/20"
                                ];
                                const avatarStyle = avatarBgGradients[idx % avatarBgGradients.length];

                                const formatDate = (dateStr?: string) => {
                                    if (!dateStr) return '';
                                    try {
                                        const d = new Date(dateStr);
                                        return d.toLocaleDateString('zh-CN', {
                                            year: 'numeric',
                                            month: 'numeric',
                                            day: 'numeric'
                                        });
                                    } catch {
                                        return dateStr;
                                    }
                                };

                                return (
                                    <div
                                        key={contributor.name}
                                        className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary/30 transition-all hover-ambient-shadow flex-wrap sm:flex-nowrap gap-4"
                                    >
                                        {/* Avatar & Info */}
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center border font-mono font-bold text-sm tracking-wider shrink-0 shadow-sm ${avatarStyle}`}>
                                                {initials}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-code-md text-body-md font-bold text-on-surface truncate">
                                                        {contributor.name}
                                                    </span>
                                                    {idx === 0 && (
                                                        <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.2 rounded font-bold shrink-0">🥇 核心贡献者</span>
                                                    )}
                                                    {idx === 1 && (
                                                        <span className="text-[9px] bg-slate-500/10 text-on-surface-variant border border-outline-variant px-1 py-0.2 rounded font-medium shrink-0">🥈 高活跃</span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center mt-2 gap-1.5">
                                                    <span className="text-[9px] font-medium text-on-surface-variant select-none">贡献项目:</span>
                                                    {contributor.projects.map((proj) => (
                                                        <span key={proj} className="text-[10px] bg-surface border border-outline-variant/60 rounded px-1.5 py-0.2 font-medium text-on-surface truncate max-w-[120px]">
                                                            {proj}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Workload Stats Metrics */}
                                        <div className="flex items-center gap-6 shrink-0 sm:self-center self-end w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-outline-variant/50 pt-2 sm:pt-0">
                                            <div className="text-left sm:text-right">
                                                <div className="flex items-center sm:justify-end gap-1 text-on-surface font-semibold font-mono text-sm">
                                                    <GitCommit size={13} className="text-blue-500" />
                                                    <span>{contributor.commitsCount30d} 次</span>
                                                </div>
                                                <span className="text-[9px] font-medium text-on-surface-variant uppercase select-none block mt-0.5">代码提交数</span>
                                            </div>

                                            <div className="text-left sm:text-right">
                                                <div className="flex items-center sm:justify-end gap-1 font-semibold font-mono text-sm text-emerald-600">
                                                    <span>+{contributor.additions30d}</span>
                                                    <span className="text-on-surface-variant font-normal">/</span>
                                                    <span className="text-red-500">-{contributor.deletions30d}</span>
                                                </div>
                                                <span className="text-[9px] font-medium text-on-surface-variant uppercase select-none block mt-0.5">代码变更(LOC)</span>
                                            </div>

                                            <div className="text-right min-w-[70px]">
                                                <span className="text-[10px] font-mono font-medium text-on-surface">
                                                    {formatDate(contributor.lastCommitDate)}
                                                </span>
                                                <span className="text-[9px] font-medium text-on-surface-variant uppercase select-none block mt-0.5">最近一次提交</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 空搜索结果 */}
                            {((summary?.contributorsList ?? []).filter(c => 
                                c.name.toLowerCase().includes(contributorSearchQuery.toLowerCase())
                            )).length === 0 && (
                                <div className="py-14 text-center text-on-surface-variant">
                                    <Users className="mx-auto mb-3 opacity-25" size={40} />
                                    <p className="font-body-md text-body-md font-semibold">未找到匹配的贡献者</p>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">请尝试使用其他关键词重新搜索</p>
                                </div>
                            )}
                        </div>

                        {/* 弹窗底部 */}
                        <div className="border-t border-outline-variant px-6 py-4 flex justify-end bg-surface-bright bg-surface-container-low">
                            <button
                                onClick={() => {
                                    setIsContributorsModalOpen(false);
                                    setContributorSearchQuery('');
                                }}
                                className="px-5 py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm hover:opacity-95 transition-opacity cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};
