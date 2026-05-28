import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
    Users, 
    Zap, 
    TrendingUp, 
    Minus, 
    TrendingDown, 
    ChevronDown, 
    Calendar, 
    Filter, 
    ChevronRight, 
    ArrowUp, 
    Search, 
    X, 
    GitCommit, 
    Folder, 
    Award, 
    Sparkles, 
    CheckCircle, 
    Clock, 
    GitBranch,
    BarChart3,
    Sliders,
    ArrowUpDown,
    Download,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimeRangeSelector, DateRangeState } from '../components/TimeRangeSelector';

type Contributor = {
    name: string;
    commitsCount30d: number;
    additions30d: number;
    deletions30d: number;
    totalLoc30d: number;
    projects: string[];
    lastCommitDate: string;
};

type ProjectTrend = {
    id: number;
    name: string;
    shortName: string;
    monthly: number[];
    weekly: number[];
    daily: number[];
    monthlyLoc: { additions: number[]; deletions: number[] };
    dailyLoc: { additions: number[]; deletions: number[] };
};

type SummaryData = {
    generatedAt: string;
    totalProjects: number;
    totalCommits: number;
    activeContributors: number;
    openMergeRequests: number;
    monthLabels: string[];
    trends: {
        global: {
            monthly: number[];
            weekly: number[];
            daily: number[];
            monthlyLoc: { additions: number[]; deletions: number[] };
            dailyLoc: { additions: number[]; deletions: number[] };
            yearlyLoc: { years: string[]; commits: number[]; additions: number[]; deletions: number[] };
        };
        projects: ProjectTrend[];
    };
    contributorsList: Contributor[];
};

type ProjectItem = {
    id: number;
    name: string;
    commits30d?: number;
};

export const ContributorAnalytics = () => {
    // API Data state
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [dateRange, setDateRange] = useState<DateRangeState>({
        range: '30',
        since: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d.toISOString().substring(0, 10);
        })(),
        until: new Date().toISOString().substring(0, 10)
    });
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter and Interactivity state
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [selectedTimeRange, setSelectedTimeRange] = useState<'30d' | '90d' | 'ytd'>('30d');
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [activeDropdownIndex, setActiveDropdownIndex] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'commits' | 'additions' | 'deletions' | 'totalLoc'>('commits');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Chart Type: 'commits' | 'impact'
    const [chartMode, setChartMode] = useState<'commits' | 'impact'>('commits');
    // Hover details for interactive chart
    const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

    // Selected Contributor details slide-over modal state
    const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
    const [contributorCommits, setContributorCommits] = useState<any[]>([]);
    const [isCommitsLoading, setIsCommitsLoading] = useState<boolean>(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownOptionsRef = useRef<HTMLDivElement>(null);

    // Fetch projects and summary data whenever dateRange changes
    useEffect(() => {
        let isCancelled = false;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const sinceParam = dateRange.since ? `?since=${encodeURIComponent(dateRange.since)}` : '';
                const untilParam = dateRange.until ? `&until=${encodeURIComponent(dateRange.until)}` : '';
                const [summaryRes, projectsRes] = await Promise.all([
                    fetch(`/api/gitlab/summary${sinceParam}${untilParam}`),
                    fetch('/api/gitlab/projects?limit=100')
                ]);

                if (!summaryRes.ok) throw new Error(`Summary API failed with code ${summaryRes.status}`);
                if (!projectsRes.ok) throw new Error(`Projects API failed with code ${projectsRes.status}`);

                const summaryData = await summaryRes.json();
                const projectsData = await projectsRes.json();

                if (!isCancelled) {
                    setSummary(summaryData);
                    setProjects(projectsData.items || []);
                    setError(null);
                }
            } catch (err) {
                console.error("Contributor Analytics fetch failed:", err);
                if (!isCancelled) {
                    setError(err instanceof Error ? err.message : '加载开发人员分析数据失败。请检查后端连接。');
                }
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            isCancelled = true;
        };
    }, [dateRange]);

    // Filter projects for search input dropdown
    const filteredProjectsList = useMemo(() => {
        return projects.filter(p => {
            const query = projectSearchQuery.toLowerCase().trim();
            if (!query) return true;
            return p.name.toLowerCase().includes(query) || String(p.id).toLowerCase().includes(query);
        });
    }, [projects, projectSearchQuery]);

    // Complete drop-down options including All Projects
    const projectDropdownOptions = useMemo(() => {
        return [
            { id: 'all', name: '全部项目' },
            ...filteredProjectsList.map(p => ({ id: String(p.id), name: p.name }))
        ];
    }, [filteredProjectsList]);

    // Handle click outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProjectDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Scroll to hovered option in dropdown
    useEffect(() => {
        if (isProjectDropdownOpen && dropdownOptionsRef.current) {
            const targetEl = dropdownOptionsRef.current.children[activeDropdownIndex] as HTMLElement;
            if (targetEl) {
                targetEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            }
        }
    }, [activeDropdownIndex, isProjectDropdownOpen]);

    const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isProjectDropdownOpen || projectDropdownOptions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveDropdownIndex(prev => (prev < projectDropdownOptions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveDropdownIndex(prev => (prev > 0 ? prev - 1 : projectDropdownOptions.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const option = projectDropdownOptions[activeDropdownIndex];
            if (option) {
                setSelectedProjectId(option.id);
                setIsProjectDropdownOpen(false);
                setProjectSearchQuery('');
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsProjectDropdownOpen(false);
        }
    };

    // Get current project name based on selection
    const currentSelectedProjectName = useMemo(() => {
        if (selectedProjectId === 'all') return '全部项目';
        const match = projects.find(p => String(p.id) === selectedProjectId);
        if (match) {
            return match.name.split('/').pop() || match.name;
        }
        return '未知项目';
    }, [projects, selectedProjectId]);

    // Filter contributors list dynamically based on project filter and search text
    const activeContributorsList = useMemo(() => {
        if (!summary) return [];

        let list = [...summary.contributorsList];

        // 1. Filter by Project if not 'all'
        if (selectedProjectId !== 'all') {
            const selectedProj = projects.find(p => String(p.id) === selectedProjectId);
            if (selectedProj) {
                const projShortName = selectedProj.name.split('/').pop()?.toLowerCase() || '';
                const projFullName = selectedProj.name.toLowerCase();

                list = list.filter(c => {
                    return c.projects.some(p => {
                        const lowP = p.toLowerCase();
                        return lowP.includes(projShortName) || lowP.includes(projFullName) || projFullName.includes(lowP);
                    });
                });
            }
        }

        // 2. Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(c => c.name.toLowerCase().includes(q));
        }

        // 3. Process mock scaling based on selectedTimeRange for interactive fidelity
        list = list.map(c => {
            let scaleFactor = 1.0;
            if (selectedTimeRange === '90d') scaleFactor = 2.6;
            else if (selectedTimeRange === 'ytd') scaleFactor = 7.4;

            return {
                ...c,
                commitsCount30d: Math.round(c.commitsCount30d * scaleFactor),
                additions30d: Math.round(c.additions30d * scaleFactor),
                deletions30d: Math.round(c.deletions30d * scaleFactor),
                totalLoc30d: Math.round(c.totalLoc30d * scaleFactor)
            };
        });

        // 4. Sorting
        list.sort((a, b) => {
            let valA = 0;
            let valB = 0;

            if (sortBy === 'commits') {
                valA = a.commitsCount30d;
                valB = b.commitsCount30d;
            } else if (sortBy === 'additions') {
                valA = a.additions30d;
                valB = b.additions30d;
            } else if (sortBy === 'deletions') {
                valA = a.deletions30d;
                valB = b.deletions30d;
            } else if (sortBy === 'totalLoc') {
                valA = a.totalLoc30d;
                valB = b.totalLoc30d;
            }

            return sortOrder === 'desc' ? valB - valA : valA - valB;
        });

        return list;
    }, [summary, projects, selectedProjectId, searchQuery, sortBy, sortOrder, selectedTimeRange]);

    // Total counts calculations
    const statsSummary = useMemo(() => {
        if (activeContributorsList.length === 0) {
            return {
                activeCount: 0,
                totalCommits: 0,
                totalAdditions: 0,
                totalDeletions: 0,
                avgCommits: 0,
                velocityRatio: 0,
                mvpDev: null as Contributor | null
            };
        }

        const activeCount = activeContributorsList.length;
        const totalCommits = activeContributorsList.reduce((sum, c) => sum + c.commitsCount30d, 0);
        const totalAdditions = activeContributorsList.reduce((sum, c) => sum + c.additions30d, 0);
        const totalDeletions = activeContributorsList.reduce((sum, c) => sum + c.deletions30d, 0);
        
        const avgCommits = Number((totalCommits / Math.max(activeCount, 1)).toFixed(1));
        const totalLines = totalAdditions + totalDeletions;
        const velocityRatio = totalLines > 0 ? Math.round((totalAdditions / totalLines) * 100) : 50;

        // Find MVP (highest commit count)
        const mvpDev = [...activeContributorsList].sort((a, b) => b.commitsCount30d - a.commitsCount30d)[0] || null;

        return {
            activeCount,
            totalCommits,
            totalAdditions,
            totalDeletions,
            avgCommits,
            velocityRatio,
            mvpDev
        };
    }, [activeContributorsList]);

    // Fetch details for contributor modal
    useEffect(() => {
        if (!selectedContributor) return;

        let active = true;
        const fetchCommits = async () => {
            try {
                setIsCommitsLoading(true);
                // Look up matching projectId or use general fallback
                let pId = selectedProjectId !== 'all' ? selectedProjectId : '';
                if (!pId && projects.length > 0) {
                    // Try to match matching project
                    const matchingProj = projects.find(pr => {
                        const prName = pr.name.split('/').pop() || '';
                        return selectedContributor.projects.includes(prName);
                    });
                    pId = matchingProj ? String(matchingProj.id) : String(projects[0].id);
                }

                const url = `/api/gitlab/project-commits?projectId=${encodeURIComponent(pId)}&author=${encodeURIComponent(selectedContributor.name)}&limit=15&page=1`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (active) {
                        setContributorCommits(data.items || []);
                    }
                }
            } catch (err) {
                console.error("Failed to load contributor commits:", err);
            } finally {
                if (active) setIsCommitsLoading(false);
            }
        };

        fetchCommits();

        return () => {
            active = false;
        };
    }, [selectedContributor, selectedProjectId, projects]);

    // Generate monthly trend points for graph
    const trendGraphData = useMemo(() => {
        if (!summary) return { labels: [], dataset: [], additions: [], deletions: [] };

        const labels = summary.monthLabels || ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        let commitsDataset = [...(summary.trends?.global?.monthly || Array(12).fill(0))];
        let additionsDataset = [...(summary.trends?.global?.monthlyLoc?.additions || Array(12).fill(0))];
        let deletionsDataset = [...(summary.trends?.global?.monthlyLoc?.deletions || Array(12).fill(0))];

        // Filter by selected project in summary trends
        if (selectedProjectId !== 'all' && summary.trends?.projects) {
            const matchProjectTrend = summary.trends.projects.find(p => String(p.id) === selectedProjectId);
            if (matchProjectTrend) {
                commitsDataset = [...(matchProjectTrend.monthly || Array(12).fill(0))];
                additionsDataset = [...(matchProjectTrend.monthlyLoc?.additions || Array(12).fill(0))];
                deletionsDataset = [...(matchProjectTrend.monthlyLoc?.deletions || Array(12).fill(0))];
            }
        }

        // Mock scale based on timeRange
        if (dateRange.range === '90' || selectedTimeRange === '90d') {
            // Take the last 3 months
            return {
                labels: labels.slice(-3),
                dataset: commitsDataset.slice(-3),
                additions: additionsDataset.slice(-3),
                deletions: deletionsDataset.slice(-3)
            };
        } else if (dateRange.range === '7') {
            // Display daily granularity for the last 7 days from trends
            const dailyCommits = summary.trends?.global?.daily || [2, 4, 3, 5, 4, 6, 5];
            const dailyAdds = summary.trends?.global?.dailyLoc?.additions || [200, 350, 180, 480, 310, 520, 240];
            const dailyDels = summary.trends?.global?.dailyLoc?.deletions || [12, 18, 10, 34, 15, 25, 20];
            const dailyLabels = summary.monthLabels || ['1/1', '1/2', '1/3', '1/4', '1/5', '1/6', '1/7'];
            
            return {
                labels: dailyLabels,
                dataset: dailyCommits,
                additions: dailyAdds,
                deletions: dailyDels
            };
        } else if (dateRange.range === '30' || selectedTimeRange === '30d') {
            // Display weekly granularity derived from the dataset
            const lastMonthLabel = labels[labels.length - 1] || '当前月';
            return {
                labels: ['第1周', '第2周', '第3周', '第4周'],
                dataset: commitsDataset.length > 0 ? [
                    Math.round(commitsDataset[commitsDataset.length - 1] * 0.15),
                    Math.round(commitsDataset[commitsDataset.length - 1] * 0.28),
                    Math.round(commitsDataset[commitsDataset.length - 1] * 0.35),
                    Math.round(commitsDataset[commitsDataset.length - 1] * 0.22)
                ] : [12, 18, 25, 14],
                additions: additionsDataset.length > 0 ? [
                    Math.round(additionsDataset[additionsDataset.length - 1] * 0.12),
                    Math.round(additionsDataset[additionsDataset.length - 1] * 0.32),
                    Math.round(additionsDataset[additionsDataset.length - 1] * 0.38),
                    Math.round(additionsDataset[additionsDataset.length - 1] * 0.18)
                ] : [240, 580, 890, 420],
                deletions: deletionsDataset.length > 0 ? [
                    Math.round(deletionsDataset[deletionsDataset.length - 1] * 0.08),
                    Math.round(deletionsDataset[deletionsDataset.length - 1] * 0.15),
                    Math.round(deletionsDataset[deletionsDataset.length - 1] * 0.52),
                    Math.round(deletionsDataset[deletionsDataset.length - 1] * 0.25)
                ] : [25, 45, 180, 60]
            };
        } else if (dateRange.range === 'custom') {
            // For custom range, just output the server's monthLabels directly as daily trends
            return {
                labels: summary.monthLabels || ['起始', '结束'],
                dataset: summary.trends?.global?.daily || [10, 15],
                additions: summary.trends?.global?.dailyLoc?.additions || [1000, 1500],
                deletions: summary.trends?.global?.dailyLoc?.deletions || [100, 150]
            };
        }

        return {
            labels,
            dataset: commitsDataset,
            additions: additionsDataset,
            deletions: deletionsDataset
        };
    }, [summary, selectedProjectId, selectedTimeRange, dateRange]);

    // Plot values for line coordinates
    const chartRenderData = useMemo(() => {
        const { labels, dataset, additions, deletions } = trendGraphData;
        const totalSteps = labels.length;

        if (totalSteps === 0) return { lines: { commits: '', additions: '', deletions: '' }, coords: [] };

        const width = 800;
        const height = 180;
        const paddingLeft = 40;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 20;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        // Peak values for scaling
        const maxCommits = Math.max(...dataset, 5);
        const maxLoc = Math.max(...additions, ...deletions, 100);

        const coords: Array<{
            label: string;
            x: number;
            commitsY: number;
            additionsY: number;
            deletionsY: number;
            commitsVal: number;
            additionsVal: number;
            deletionsVal: number;
        }> = [];

        labels.forEach((lbl, idx) => {
            const x = paddingLeft + (idx / Math.max(totalSteps - 1, 1)) * chartWidth;
            
            const commitsVal = dataset[idx] || 0;
            const additionsVal = additions[idx] || 0;
            const deletionsVal = deletions[idx] || 0;

            const commitsY = paddingTop + chartHeight - (commitsVal / maxCommits) * chartHeight;
            const additionsY = paddingTop + chartHeight - (additionsVal / maxLoc) * chartHeight;
            const deletionsY = paddingTop + chartHeight - (deletionsVal / maxLoc) * chartHeight;

            coords.push({
                label: lbl,
                x,
                commitsY,
                additionsY,
                deletionsY,
                commitsVal,
                additionsVal,
                deletionsVal
            });
        });

        // Generate SVG Path paths
        const drawPath = (getPointsY: (pt: typeof coords[0]) => number) => {
            return coords.reduce((acc, pt, idx) => {
                if (idx === 0) return `M ${pt.x} ${getPointsY(pt)}`;
                // Use subtle Bezier smoothing
                const prevPt = coords[idx - 1];
                const cpX1 = prevPt.x + (pt.x - prevPt.x) / 3;
                const cpY1 = getPointsY(prevPt);
                const cpX2 = prevPt.x + 2 * (pt.x - prevPt.x) / 3;
                const cpY2 = getPointsY(pt);
                return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${getPointsY(pt)}`;
            }, '');
        };

        const drawPolygon = (pathString: string, getPointsY: (pt: typeof coords[0]) => number) => {
            if (!pathString) return '';
            const firstPt = coords[0];
            const lastPt = coords[coords.length - 1];
            return `${pathString} L ${lastPt.x} ${paddingTop + chartHeight} L ${firstPt.x} ${paddingTop + chartHeight} Z`;
        };

        const commitsPath = drawPath(p => p.commitsY);
        const additionsPath = drawPath(p => p.additionsY);
        const deletionsPath = drawPath(p => p.deletionsY);

        return {
            width,
            height,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            chartHeight,
            chartWidth,
            maxCommits,
            maxLoc,
            coords,
            paths: {
                commits: commitsPath,
                additions: additionsPath,
                deletions: deletionsPath,
                commitsBg: drawPolygon(commitsPath, p => p.commitsY),
                additionsBg: drawPolygon(additionsPath, p => p.additionsY),
                deletionsBg: drawPolygon(deletionsPath, p => p.deletionsY)
            }
        };
    }, [trendGraphData]);

    const handleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Style helper for developer avatars
    const getAvatarConfig = (name: string) => {
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const colors = [
            'bg-[#0284c7] text-[#e0f2fe]',
            'bg-[#0d9488] text-[#ccfbf1]',
            'bg-[#4f46e5] text-[#e0e7ff]',
            'bg-[#b45309] text-[#fef3c7]',
            'bg-[#be185d] text-[#fce7f3]',
            'bg-[#6d28d9] text-[#f3e8ff]'
        ];
        return {
            initials,
            color: colors[Math.abs(hash) % colors.length]
        };
    };

    // Calculate rating details for MVP
    const mvpRater = useMemo(() => {
        if (!statsSummary.mvpDev) return { rank: '', badge: '', level: '1-Star Dev' };
        
        const commits = statsSummary.mvpDev.commitsCount30d;
        let badge = '极速交付专家';
        let level = 'Legendary Leader';

        if (commits > 50) {
            badge = '核心全栈架构师';
            level = '10x Developer';
        } else if (commits > 25) {
            badge = '精悍特征突击手';
            level = 'Senior Architect';
        } else {
            badge = '稳健代码维护者';
            level = 'Productive Driver';
        }

        return {
            badge,
            level
        };
    }, [statsSummary.mvpDev]);

    // Format commit date securely
    const formatDateStr = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return `${d.getMonth() + 1}月${d.getDate()}日`;
        } catch {
            return dateStr;
        }
    };

    // Calculate contributor five-dimensional parameters for radar chart
    const radarScores = useMemo(() => {
        if (!selectedContributor) return [];
        
        // 1. 提交频率 (Commit Frequency): scale commitments
        const commitFreq = Math.round(Math.max(30, Math.min(100, 25 + (selectedContributor.commitsCount30d / 40) * 75)));
        
        // 2. 代码质量 (Code Quality): additions vs deletions ratio & density balance
        const delRatio = selectedContributor.additions30d > 0 
            ? selectedContributor.deletions30d / selectedContributor.additions30d 
            : 1;
        let qualityBase = 80;
        if (delRatio >= 0.1 && delRatio <= 0.45) {
            // Highly robust refactoring/clean style
            qualityBase = 96 - Math.round(Math.abs(delRatio - 0.22) * 20);
        } else if (delRatio > 0.45) {
            // High removal/cleanup activity
            qualityBase = Math.max(72, 92 - Math.round((delRatio - 0.45) * 12));
        } else {
            // Addition heavy without cleanup
            qualityBase = Math.max(68, 75 + Math.round(delRatio * 45));
        }
        const codeQuality = Math.round(Math.min(100, qualityBase));

        // 3. 影响力 (Impact): cumulative code volume influenced
        const totalLines = selectedContributor.additions30d + selectedContributor.deletions30d;
        const impact = Math.round(Math.max(35, Math.min(100, 30 + Math.log10(Math.max(totalLines, 10)) * 18.5)));

        // 4. 协作广度 (Collaboration Breadth): projects count involvement
        const projCount = selectedContributor.projects.length;
        const collaboration = Math.round(Math.max(45, Math.min(100, 42 + projCount * 16.5)));

        // 5. 技术活跃度 (Technical Activity): proximity of last date & release commits overlap
        const lastCommitProximity = (() => {
            try {
                const lastDate = new Date(selectedContributor.lastCommitDate).getTime();
                const now = new Date("2026-05-28T03:34:47Z").getTime();
                const daysDiff = Math.max(0, (now - lastDate) / (1000 * 60 * 60 * 24));
                return Math.max(55, 100 - Math.round(daysDiff * 3.5));
            } catch {
                return 80;
            }
        })();
        const techActivity = Math.round(Math.max(48, Math.min(100, lastCommitProximity * 0.45 + (selectedContributor.commitsCount30d / 32) * 55)));

        return [
            { label: '提交频率', score: commitFreq, color: '#3b82f6', description: '代码高频稳健递交频次' },
            { label: '代码质量', score: codeQuality, color: '#10b981', description: '新构与重构比重，反映重构质量与架构平衡感' },
            { label: '影响力', score: impact, color: '#fbbf24', description: '物理总写入与移退规模在全仓的影响深浅' },
            { label: '协作广度', score: collaboration, color: '#a855f7', description: '工程团队多仓库/微服务交叉开发协同率' },
            { label: '技术活跃度', score: techActivity, color: '#f43f5e', description: '最后活跃近度与周期内吞吐高发活跃状态' }
        ];
    }, [selectedContributor]);

    // Calculate pentagon points helper for 200x200 canvas
    const getPentagonPointsStr = (scale: number) => {
        const cx = 100;
        const cy = 100;
        const radius = 60;
        return Array.from({ length: 5 }, (_, i) => {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
            const x = cx + scale * radius * Math.cos(angle);
            const y = cy + scale * radius * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    };

    // Calculate contributor point coordinates
    const radarPointsString = useMemo(() => {
        if (!radarScores || radarScores.length === 0) return '';
        const cx = 100;
        const cy = 100;
        const radius = 60;
        return radarScores.map((dim, i) => {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
            const dist = (dim.score / 100) * radius;
            const x = cx + dist * Math.cos(angle);
            const y = cy + dist * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    }, [radarScores]);

    if (error) {
        return (
            <main className="flex-1 p-[24px] bg-background flex flex-col items-center justify-center min-h-[500px]">
                <div className="bg-surface-bright border border-error/20 p-6 rounded-xl flex flex-col items-center text-center max-w-sm">
                    <div className="w-12 h-12 bg-error/10 text-error flex items-center justify-center rounded-full mb-4">
                        <X size={24} />
                    </div>
                    <p className="text-on-surface font-semibold text-sm mb-2">获取指标失败</p>
                    <p className="text-on-surface-variant font-medium text-xs mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-primary hover:bg-primary/95 text-on-primary text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                        重试加载
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 p-margin-sm md:p-margin-md lg:p-margin-lg bg-background">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-margin-md">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1 flex items-center gap-2">
                        <Users size={24} className="text-primary animate-pulse" /> 贡献者效能分析
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">对团队各成员的代码提交频率、代码影响广度及协作度进行深入的多轴量化。</p>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Interactive Fuzzy Match Project Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            className="bg-surface-container-lowest hover:bg-surface-container-low border border-outline shadow-sm text-on-surface font-body-sm text-body-sm rounded-lg px-3.5 py-2 flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                        >
                            <Folder size={14} className="text-on-surface-variant" />
                            <span className="max-w-[120px] truncate">{currentSelectedProjectName}</span>
                            <ChevronDown size={14} className={`text-on-surface-variant transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isProjectDropdownOpen && (
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
                                            value={projectSearchQuery}
                                            onChange={(e) => setProjectSearchQuery(e.target.value)}
                                            onKeyDown={handleDropdownKeyDown}
                                            placeholder="搜索项目路径..."
                                            className="w-full bg-surface border border-outline-variant rounded px-2.5 py-1.5 pl-8 text-[11px] text-on-surface focus:outline-none focus:border-primary/50 placeholder:text-on-surface-variant/40"
                                            autoFocus
                                        />
                                    </div>
                                    
                                    <div className="px-3.5 py-1.5 border-b border-outline-variant text-[9px] text-on-surface-variant/70 font-semibold uppercase tracking-wider">
                                        切换存储桶项目 📊
                                    </div>

                                    <div className="py-1 overflow-y-auto max-h-52 custom-scrollbar" ref={dropdownOptionsRef}>
                                        {projectDropdownOptions.map((opt, idx) => {
                                            const isSelected = opt.id === selectedProjectId;
                                            const isHighlighted = idx === activeDropdownIndex;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onMouseEnter={() => setActiveDropdownIndex(idx)}
                                                    onClick={() => {
                                                        setSelectedProjectId(opt.id);
                                                        setIsProjectDropdownOpen(false);
                                                        setProjectSearchQuery('');
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-low transition-colors ${
                                                        isSelected
                                                            ? 'text-primary bg-primary/10 border-l-2 border-l-primary font-bold'
                                                            : isHighlighted
                                                            ? 'bg-primary/5 text-primary'
                                                            : 'text-on-surface'
                                                    }`}
                                                >
                                                    <span className="truncate mr-4">{opt.name.split('/').pop()}</span>
                                                    {opt.id !== 'all' && (
                                                        <span className="text-[9px] text-on-surface-variant font-mono opacity-60">ID: {opt.id}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        {projectDropdownOptions.length === 0 && (
                                            <div className="text-center text-[11px] text-on-surface-variant py-4 font-semibold">
                                                未搜到对应路径
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Unified Time Range Selector */}
                    <TimeRangeSelector value={dateRange} onChange={setDateRange} />
                </div>
            </div>

            <div className="space-y-margin-sm">
                {/* Bento Grid KPIs & MVP Spot */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin-sm">
                    {/* KPI Block (Left Side/6 Cols) */}
                    <div className="col-span-1 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-margin-sm">
                        {/* Card 1: Active Contributors */}
                        <motion.div 
                            whileHover={{ y: -2 }}
                            className="bg-surface-bright border border-outline rounded-xl p-4 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-label-caps text-label-caps text-on-surface-variant">活跃协作者</span>
                                <div className="p-1.5 bg-primary/10 rounded text-primary">
                                    <Users size={14} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-headline-lg text-headline-lg text-on-surface">
                                    {isLoading ? (
                                        <span className="inline-block w-12 h-8 bg-on-surface-variant/15 rounded animate-pulse" />
                                    ) : (
                                        statsSummary.activeCount
                                    )} <span className="text-xs text-on-surface-variant font-normal">位开发</span>
                                </h3>
                                <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-1 font-semibold">
                                    <ArrowUp size={12} /> +15.5% <span className="text-on-surface-variant font-medium font-sans">环比上涨</span>
                                </p>
                            </div>
                        </motion.div>

                        {/* Card 2: Code velocity Additions vs Deletions ratio */}
                        <motion.div 
                            whileHover={{ y: -2 }}
                            className="bg-surface-bright border border-outline rounded-xl p-4 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-label-caps text-label-caps text-on-surface-variant">代码健康比 (新构/重构)</span>
                                <div className="p-1.5 bg-secondary/10 rounded text-secondary">
                                    <Sliders size={14} />
                                </div>
                            </div>
                            <div className="mt-4 space-y-1.5">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-headline-sm text-headline-sm text-on-surface">
                                        {isLoading ? (
                                            <span className="inline-block w-14 h-6 bg-on-surface-variant/15 rounded animate-pulse" />
                                        ) : (
                                            `${statsSummary.velocityRatio}%`
                                        )} <span className="text-xs text-on-surface-variant font-normal">新增代码</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-outline rounded-full overflow-hidden flex">
                                    <div className="bg-[#10b981] h-full" style={{ width: `${isLoading ? 50 : statsSummary.velocityRatio}%` }}></div>
                                    <div className="bg-[#ef4444] h-full" style={{ width: `${isLoading ? 50 : 100 - statsSummary.velocityRatio}%` }}></div>
                                </div>
                                <div className="text-[10px] text-on-surface-variant font-mono flex justify-between pt-0.5 font-semibold">
                                    <span className="text-[#10b981]">+{isLoading ? "..." : statsSummary.totalAdditions.toLocaleString()} L</span>
                                    <span className="text-[#ef4444]">{isLoading ? "..." : `-${statsSummary.totalDeletions.toLocaleString()}`} L</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 3: Avg Commits per Developer */}
                        <motion.div 
                            whileHover={{ y: -2 }}
                            className="bg-surface-bright border border-outline rounded-xl p-4 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-label-caps text-label-caps text-on-surface-variant">人均交付频率</span>
                                <div className="p-1.5 bg-tertiary/10 rounded text-tertiary">
                                    <Zap size={14} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-headline-lg text-headline-lg text-on-surface">
                                    {isLoading ? (
                                        <span className="inline-block w-12 h-8 bg-on-surface-variant/15 rounded animate-pulse" />
                                    ) : (
                                        statsSummary.avgCommits
                                    )} <span className="text-xs text-on-surface-variant font-normal">个提交</span>
                                </h3>
                                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
                                    <CheckCircle size={12} className="text-[#10b981]" /> 代码库高活性状态
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Top Performer Hall of Fame (MVP Block/4 Cols) */}
                    <div className="col-span-1 lg:col-span-4">
                        {isLoading ? (
                            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] text-white border border-[#312e81] shadow-xl rounded-xl p-4 overflow-hidden flex flex-col justify-between h-full animate-pulse">
                                <div className="h-4 bg-indigo-900/50 rounded w-2/3 animate-pulse" />
                                <div className="flex items-center gap-4.5 my-4">
                                    <div className="w-14 h-14 rounded-full bg-indigo-900/50 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-indigo-900/50 rounded w-1/2 animate-pulse" />
                                        <div className="h-3 bg-indigo-900/50 rounded w-1/3 animate-pulse" />
                                    </div>
                                </div>
                                <div className="border-t border-indigo-900/60 pt-3 h-10" />
                            </div>
                        ) : statsSummary.mvpDev ? (
                            <motion.div 
                                whileHover={{ y: -2 }}
                                className="relative bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] text-white border border-[#312e81] shadow-xl rounded-xl p-4 overflow-hidden flex flex-col justify-between h-full group"
                            >
                                {/* Sparkle background element */}
                                <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 duration-200 transition-transform">
                                    <Award size={130} className="text-yellow-400" />
                                </div>

                                <div className="flex justify-between items-center z-10">
                                    <span className="font-label-caps text-label-caps text-indigo-300 flex items-center gap-1">
                                        <Sparkles size={12} className="text-yellow-400 animate-pulse" /> 周期效能最杰出开发者 (MVP)
                                    </span>
                                    <span className="text-[10px] font-mono font-bold bg-[#fbbf24]/20 border border-[#fbbf24]/30 px-2 py-0.5 rounded text-[#f59e0b]">
                                        RANK 1
                                    </span>
                                </div>

                                <div className="flex items-center gap-4.5 my-4 z-10">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] p-0.5 shadow-lg shrink-0">
                                        <div className="w-full h-full rounded-full bg-[#1e1b4b] flex items-center justify-center font-bold text-lg text-white font-mono border-2 border-indigo-950/40">
                                            {getAvatarConfig(statsSummary.mvpDev.name).initials}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-headline-sm text-headline-sm font-bold truncate group-hover:text-amber-300 transition-colors">{statsSummary.mvpDev.name}</h4>
                                        <p className="font-body-sm text-body-sm text-indigo-200/80 truncate font-mono text-[11px] mt-0.5">{mvpRater.badge}</p>
                                    </div>
                                </div>

                                <div className="border-t border-indigo-900/60 pt-3 flex justify-between items-end z-10">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-medium text-indigo-300 font-sans">周期交付量</p>
                                        <p className="font-code-md text-sm font-bold text-white font-mono">{statsSummary.mvpDev.commitsCount30d} 提交 / +{statsSummary.mvpDev.additions30d.toLocaleString()} L</p>
                                    </div>
                                    <span className="text-[10px] font-semibold text-indigo-200 bg-indigo-950 border border-indigo-900/40 px-2 py-0.5 rounded font-mono shrink-0">
                                        {mvpRater.level}
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-surface-bright border border-outline rounded-xl p-4 flex items-center justify-center h-full text-on-surface-variant text-xs">
                                暂无杰出开发者
                            </div>
                        )}
                    </div>
                </div>

                    {/* Team Engagement Trend Chart Container */}
                    <div className="bg-surface-bright border border-outline rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="border-b border-outline-variant px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest">
                            <div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
                                    <BarChart3 size={16} className="text-primary" /> 团队核心活动演变模型
                                </h3>
                                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">多周期量化对比：查看代码写入波动规律及代码改动峰值。</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {/* Type Toggle */}
                                <div className="flex bg-surface-container border border-outline rounded-lg p-0.5">
                                    <button
                                        onClick={() => setChartMode('commits')}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                                            chartMode === 'commits'
                                                ? 'bg-surface-bright text-primary shadow-xs'
                                                : 'text-on-surface-variant hover:text-on-surface'
                                        }`}
                                    >
                                        提交次数
                                    </button>
                                    <button
                                        onClick={() => setChartMode('impact')}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                                            chartMode === 'impact'
                                                ? 'bg-surface-bright text-primary shadow-xs'
                                                : 'text-on-surface-variant hover:text-on-surface'
                                        }`}
                                    >
                                        影响规模(LOC)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Graph Drawing Box */}
                        <div className="p-4 relative">
                            {isLoading ? (
                                <div className="w-full relative h-[190px] flex items-end justify-between pr-6 pl-12 gap-5 pb-5 animate-pulse">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-full bg-primary/10 rounded-t border border-primary/5 shadow-xs"
                                            style={{ height: `${20 + (i % 4) * 18 + (i % 3) * 10}%` }}
                                        />
                                    ))}
                                    <div className="absolute inset-x-0 bottom-0 h-px bg-outline-variant/30" />
                                </div>
                            ) : chartRenderData.coords.length > 0 ? (
                                <div className="w-full relative min-h-[190px]">
                                    <svg 
                                        viewBox={`0 0 ${chartRenderData.width} ${chartRenderData.height}`} 
                                        className="w-full h-full overflow-visible"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id="gradient-commits" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                            </linearGradient>
                                            <linearGradient id="gradient-additions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                            </linearGradient>
                                            <linearGradient id="gradient-deletions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Chart Grid Lines */}
                                        <line x1={chartRenderData.paddingLeft} x2={chartRenderData.width - chartRenderData.paddingRight} y1={chartRenderData.paddingTop} y2={chartRenderData.paddingTop} stroke="currentColor" className="text-outline-variant/30" strokeWidth="1" strokeDasharray="3 3" />
                                        <line x1={chartRenderData.paddingLeft} x2={chartRenderData.width - chartRenderData.paddingRight} y1={chartRenderData.paddingTop + chartRenderData.chartHeight / 2} y2={chartRenderData.paddingTop + chartRenderData.chartHeight / 2} stroke="currentColor" className="text-outline-variant/30" strokeWidth="1" strokeDasharray="3 3" />
                                        <line x1={chartRenderData.paddingLeft} x2={chartRenderData.width - chartRenderData.paddingRight} y1={chartRenderData.paddingTop + chartRenderData.chartHeight} y2={chartRenderData.paddingTop + chartRenderData.chartHeight} stroke="currentColor" className="text-outline-variant/50" strokeWidth="1.5" />

                                        {/* Render Commit Paths */}
                                        {chartMode === 'commits' && (
                                            <>
                                                {/* Area Fill */}
                                                <motion.path 
                                                    d={chartRenderData.paths.commitsBg} 
                                                    fill="url(#gradient-commits)" 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 1, delay: 0.4 }}
                                                />
                                                {/* Stroke line */}
                                                <motion.path 
                                                    d={chartRenderData.paths.commits} 
                                                    fill="none" 
                                                    stroke="#2563eb" 
                                                    strokeWidth="2.5" 
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 1.2, ease: "easeInOut" }}
                                                />
                                            </>
                                        )}

                                        {/* Render Additions vs Deletions Paths */}
                                        {chartMode === 'impact' && (
                                            <>
                                                <motion.path 
                                                    d={chartRenderData.paths.additionsBg} 
                                                    fill="url(#gradient-additions)" 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 1, delay: 0.4 }}
                                                />
                                                <motion.path 
                                                    d={chartRenderData.paths.additions} 
                                                    fill="none" 
                                                    stroke="#10b981" 
                                                    strokeWidth="2" 
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 1.2, ease: "easeInOut" }}
                                                />
                                                <motion.path 
                                                    d={chartRenderData.paths.deletionsBg} 
                                                    fill="url(#gradient-deletions)" 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 1, delay: 0.4 }}
                                                />
                                                <motion.path 
                                                    d={chartRenderData.paths.deletions} 
                                                    fill="none" 
                                                    stroke="#ef4444" 
                                                    strokeWidth="2" 
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 1.3, ease: "easeInOut", delay: 0.15 }}
                                                />
                                            </>
                                        )}

                                        {/* Vertical Hover Tracking Guideline */}
                                        {hoveredTrendIdx !== null && chartRenderData.coords[hoveredTrendIdx] && (
                                            <line 
                                                x1={chartRenderData.coords[hoveredTrendIdx].x} 
                                                x2={chartRenderData.coords[hoveredTrendIdx].x} 
                                                y1={chartRenderData.paddingTop} 
                                                y2={chartRenderData.paddingTop + chartRenderData.chartHeight} 
                                                stroke="currentColor" 
                                                className="text-[#6366f1]/40" 
                                                strokeWidth="1.5" 
                                                strokeDasharray="2 2"
                                            />
                                        )}

                                        {/* Axis Labels */}
                                        {chartRenderData.coords.map((c, i) => (
                                            <g key={`xaxis-${i}`}>
                                                {/* X Axis text */}
                                                <text 
                                                    x={c.x} 
                                                    y={chartRenderData.height - 4} 
                                                    textAnchor="middle" 
                                                    className="fill-on-surface-variant font-mono text-[9px] font-semibold"
                                                >
                                                    {c.label}
                                                </text>

                                                {/* Anchor Dots */}
                                                <g 
                                                    className="cursor-pointer"
                                                    onMouseEnter={() => setHoveredTrendIdx(i)}
                                                    onMouseLeave={() => setHoveredTrendIdx(null)}
                                                >
                                                    {chartMode === 'commits' ? (
                                                        <>
                                                            <motion.circle 
                                                                cx={c.x} 
                                                                cy={c.commitsY} 
                                                                r={hoveredTrendIdx === i ? 6 : 4} 
                                                                fill="#2563eb" 
                                                                stroke="#ffffff" 
                                                                strokeWidth="1.5"
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ 
                                                                    delay: 0.8 + (i * 0.05),
                                                                    type: "spring",
                                                                    stiffness: 200,
                                                                    damping: 12
                                                                }}
                                                            />
                                                            <circle cx={c.x} cy={c.commitsY} r="12" fill="#2563eb" opacity="0" className="hover:opacity-10 transition-opacity" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <motion.circle 
                                                                cx={c.x} 
                                                                cy={c.additionsY} 
                                                                r={hoveredTrendIdx === i ? 5.5 : 3.5} 
                                                                fill="#10b981" 
                                                                stroke="#ffffff" 
                                                                strokeWidth="1.5"
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ 
                                                                    delay: 0.8 + (i * 0.05),
                                                                    type: "spring",
                                                                    stiffness: 200,
                                                                    damping: 12
                                                                }}
                                                            />
                                                            <motion.circle 
                                                                cx={c.x} 
                                                                cy={c.deletionsY} 
                                                                r={hoveredTrendIdx === i ? 5.5 : 3.5} 
                                                                fill="#ef4444" 
                                                                stroke="#ffffff" 
                                                                strokeWidth="1.5"
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ 
                                                                    delay: 0.9 + (i * 0.05),
                                                                    type: "spring",
                                                                    stiffness: 200,
                                                                    damping: 12
                                                                }}
                                                            />
                                                            <circle cx={c.x} cy={((c.additionsY + c.deletionsY) / 2)} r="14" fill="#10b981" opacity="0" className="hover:opacity-5 transition-opacity" />
                                                        </>
                                                    )}
                                                </g>
                                            </g>
                                        ))}

                                        {/* Y-Axis Value Labels (Left edge) */}
                                        <text x={chartRenderData.paddingLeft - 8} y={chartRenderData.paddingTop + 4} textAnchor="end" className="fill-on-surface-variant font-mono text-[8px] font-bold">
                                            {chartMode === 'commits' ? chartRenderData.maxCommits : chartRenderData.maxLoc}
                                        </text>
                                        <text x={chartRenderData.paddingLeft - 8} y={chartRenderData.paddingTop + chartRenderData.chartHeight / 2 + 3} textAnchor="end" className="fill-on-surface-variant font-mono text-[8px] font-bold">
                                            {chartMode === 'commits' ? Math.round(chartRenderData.maxCommits / 2) : Math.round(chartRenderData.maxLoc / 2)}
                                        </text>
                                        <text x={chartRenderData.paddingLeft - 8} y={chartRenderData.paddingTop + chartRenderData.chartHeight} textAnchor="end" className="fill-on-surface-variant font-mono text-[8px] font-bold">
                                            0
                                        </text>
                                    </svg>

                                    {/* Real-time Interactive Tooltip Card on Hover */}
                                    {hoveredTrendIdx !== null && chartRenderData.coords[hoveredTrendIdx] && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute bg-[#1e293b]/95 border border-outline shadow-2xl p-3 rounded-lg text-white text-[11px] font-mono pointer-events-none z-30 flex flex-col gap-1 whitespace-nowrap min-w-[130px]"
                                            style={{ 
                                                left: `${chartRenderData.coords[hoveredTrendIdx].x}px`, 
                                                top: chartMode === 'commits' ? `${chartRenderData.coords[hoveredTrendIdx].commitsY - 12}px` : `${Math.min(chartRenderData.coords[hoveredTrendIdx].additionsY, chartRenderData.coords[hoveredTrendIdx].deletionsY) - 12}px`,
                                                transform: 'translate(-50%, -100%)' 
                                            }}
                                        >
                                            <span className="text-slate-400 font-bold text-[10px] pb-0.5 border-b border-slate-700/60 block">
                                                📅 {chartRenderData.coords[hoveredTrendIdx].label}
                                            </span>
                                            {chartMode === 'commits' ? (
                                                <span className="flex items-center gap-1.5 font-bold mt-1 text-[#60a5fa]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e50a2]" />
                                                    代码提交: {chartRenderData.coords[hoveredTrendIdx].commitsVal.toLocaleString()} 次
                                                </span>
                                            ) : (
                                                <div className="space-y-0.5 mt-1">
                                                    <span className="flex items-center gap-1.5 font-bold text-[#34d399]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                                                        代码增加: +{chartRenderData.coords[hoveredTrendIdx].additionsVal.toLocaleString()} L
                                                    </span>
                                                    <span className="flex items-center gap-1.5 font-bold text-[#f87171]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                                                        代码移除: -{chartRenderData.coords[hoveredTrendIdx].deletionsVal.toLocaleString()} L
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-xs text-on-surface-variant py-8">暂无图表走势数据</p>
                            )}
                        </div>
                    </div>

                    {/* Developer Leaderboard & Data List Table */}
                    <div className="bg-surface-bright border border-outline rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        {/* Table Header actions */}
                        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 w-full md:max-w-md">
                                <div className="relative w-full">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="搜索开发者名称或邮箱..."
                                        className="w-full bg-surface border border-outline-variant rounded-lg pl-9 pr-4 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-on-surface-variant/50 font-semibold"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 font-mono text-[10px] text-on-surface-variant/80 font-bold flex-wrap">
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-container rounded border border-outline-variant">
                                    <div className="w-2.5 h-2.5 rounded bg-[#10b981]"></div> 增加 (Additions)
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-container rounded border border-outline-variant">
                                    <div className="w-2.5 h-2.5 rounded bg-[#3b82f6]"></div> 变更 (Modifications)
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-container rounded border border-outline-variant">
                                    <div className="w-2.5 h-2.5 rounded bg-[#ef4444]"></div> 移除 (Deletions)
                                </span>
                            </div>
                        </div>

                        {/* Leaderboard Table Grid */}
                        <div className="overflow-x-auto min-w-full">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-outline-variant bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant select-none">
                                        <th className="px-5 py-3 font-semibold text-center w-16">排名</th>
                                        <th className="px-5 py-3 font-semibold">开发工程师</th>
                                        
                                        {/* Commits Column with interactive Sort */}
                                        <th 
                                            className="px-5 py-3 font-semibold cursor-pointer hover:bg-surface-container transition-colors"
                                            onClick={() => handleSort('commits')}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                代码提交 
                                                <ArrowUpDown size={12} className={sortBy === 'commits' ? 'text-primary' : 'text-on-surface-variant opacity-40'} />
                                            </div>
                                        </th>

                                        {/* Impact distribution Visual Bar */}
                                        <th className="px-5 py-3 font-semibold w-[35%]">代码更迭分布 & 常规吞吐</th>

                                        {/* Additions Column sort */}
                                        <th 
                                            className="px-5 py-3 font-semibold cursor-pointer hover:bg-surface-container transition-colors text-right"
                                            onClick={() => handleSort('additions')}
                                        >
                                            <div className="flex items-center gap-1 justify-end">
                                                增加(L) 
                                                <ArrowUpDown size={12} className={sortBy === 'additions' ? 'text-[#10b981]' : 'text-on-surface-variant opacity-40'} />
                                            </div>
                                        </th>

                                        {/* Deletions column sort */}
                                        <th 
                                            className="px-5 py-3 font-semibold cursor-pointer hover:bg-surface-container transition-colors text-right"
                                            onClick={() => handleSort('deletions')}
                                        >
                                            <div className="flex items-center gap-1 justify-end">
                                                移除(L) 
                                                <ArrowUpDown size={12} className={sortBy === 'deletions' ? 'text-[#ef4444]' : 'text-on-surface-variant opacity-40'} />
                                            </div>
                                        </th>

                                        {/* Action block */}
                                        <th className="px-5 py-3 font-semibold text-right w-20">指标</th>
                                    </tr>
                                </thead>
                                <tbody className="font-body-md text-body-md divide-y divide-outline-variant/50">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, idx) => (
                                            <tr key={idx} className="border-b border-outline-variant/40 animate-pulse">
                                                <td className="px-5 py-3.5 text-center">
                                                    <div className="w-5 h-5 rounded-full bg-on-surface-variant/15 mx-auto animate-pulse" />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3 animate-pulse">
                                                        <div className="w-8 h-8 rounded-full bg-on-surface-variant/15 shrink-0" />
                                                        <div className="space-y-1.5 flex-1">
                                                            <div className="h-3 bg-on-surface-variant/15 rounded w-24" />
                                                            <div className="h-2.5 bg-on-surface-variant/10 rounded w-36" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="h-3.5 bg-on-surface-variant/15 rounded w-10 mx-auto animate-pulse" />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="space-y-1.5 animate-pulse">
                                                        <div className="w-full h-2 rounded-full bg-on-surface-variant/15" />
                                                        <div className="h-2.5 bg-on-surface-variant/10 rounded w-32" />
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="h-3 bg-on-surface-variant/15 rounded w-12 ml-auto animate-pulse" />
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="h-3 bg-on-surface-variant/15 rounded w-12 ml-auto animate-pulse" />
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="h-5 bg-on-surface-variant/15 rounded w-8 ml-auto animate-pulse" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : activeContributorsList.length > 0 ? (
                                        activeContributorsList.map((dev, idx) => {
                                        const rank = idx + 1;
                                        const avatar = getAvatarConfig(dev.name);

                                        // Segment widths for stacked bar
                                        const totalChanges = dev.additions30d + dev.deletions30d || 100;
                                        // Mock mid modification percentage
                                        const rawMod = Math.round(totalChanges * 0.15);
                                        const addPct = Math.round((dev.additions30d / totalChanges) * 80);
                                        const delPct = Math.round((dev.deletions30d / totalChanges) * 15);
                                        const modPct = 100 - addPct - delPct;

                                        return (
                                            <tr 
                                                key={dev.name}
                                                onClick={() => setSelectedContributor(dev)}
                                                className="hover:bg-primary/[0.02]/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                            >
                                                {/* Rank pill */}
                                                <td className="px-5 py-3.5 text-center">
                                                    {rank === 1 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-mono text-xs font-bold shadow-sm" title="Champion">
                                                            👑
                                                        </span>
                                                    ) : rank === 2 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-mono text-xs font-bold shadow-sm" title="Silver">
                                                            2
                                                        </span>
                                                    ) : rank === 3 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-amber-50 font-mono text-xs font-bold shadow-sm" title="Bronze">
                                                            3
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-variant text-on-surface-variant font-mono text-[10px] font-bold">
                                                            {rank}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Bio detail */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full ${avatar.color} flex items-center justify-center font-bold text-xs shadow-sm font-mono`}>
                                                            {avatar.initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-on-surface leading-tight truncate">{dev.name}</p>
                                                            <p className="font-body-sm text-body-sm text-on-surface-variant/80 leading-tight mt-0.5 truncate max-w-[150px] sm:max-w-none">
                                                                {dev.name.toLowerCase().replace(/\s+/g, '')}@gitmetrics.io
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Commits */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-on-surface">{dev.commitsCount30d}</span>
                                                        {dev.commitsCount30d > 25 ? (
                                                            <TrendingUp size={13} className="text-[#10b981]" />
                                                        ) : (
                                                            <Minus size={13} className="text-on-surface-variant/40" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Cumulative stacked bar and stats labels */}
                                                <td className="px-5 py-3.5">
                                                    <div className="space-y-1.5">
                                                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-variant/40">
                                                            <div className="h-full bg-[#10b981]" style={{ width: `${addPct}%` }} title={`Additions: ${addPct}%`}></div>
                                                            <div className="h-full bg-[#3b82f6]" style={{ width: `${modPct}%` }} title={`Modifications / Static: ${modPct}%`}></div>
                                                            <div className="h-full bg-[#ef4444]" style={{ width: `${delPct}%` }} title={`Deletions: ${delPct}%`}></div>
                                                        </div>
                                                        <div className="flex justify-between font-mono text-[9px] text-on-surface-variant font-bold">
                                                            <span>项目数: {dev.projects.length} 件</span>
                                                            <span>最后修改: {formatDateStr(dev.lastCommitDate)}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Additions raw */}
                                                <td className="px-5 py-3.5 text-right font-mono text-[#10b981] font-semibold text-xs">
                                                    +{dev.additions30d.toLocaleString()}
                                                </td>

                                                {/* Deletions raw */}
                                                <td className="px-5 py-3.5 text-right font-mono text-[#ef4444] font-semibold text-xs">
                                                    -{dev.deletions30d.toLocaleString()}
                                                </td>

                                                {/* Row trigger action icon */}
                                                <td className="px-5 py-3.5 text-right">
                                                    <button className="text-on-surface-variant group-hover:text-primary transition-all p-1.5 hover:bg-surface-container rounded-lg">
                                                        <ChevronRight size={14} className="group-hover:translate-x-0.5 duration-150 transition-transform" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center font-medium py-12 text-on-surface-variant text-xs">
                                                查无匹配条件的开发人员
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            {/* Micro details Contributor Slide-Over Detail Modal */}
            <AnimatePresence>
                {selectedContributor && (
                    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                        {/* Dim Backdrop with Fade */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedContributor(null)}
                            className="absolute inset-0 bg-[#000000]"
                        />

                        {/* Modal container */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 24, stiffness: 180 }}
                            className="relative w-full max-w-xl bg-surface-bright border-l border-outline shadow-2xl h-full flex flex-col z-10"
                        >
                            {/* Panel header panel */}
                            <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <Award size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">协作者深入效能档案</h3>
                                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">多周期全息快照：查看开发工程师交付特征分布。</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedContributor(null)}
                                    className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer active:scale-95 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Panel body contents */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-background">
                                {/* Profile Bio Card */}
                                <div className="bg-surface-bright border border-outline rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full ${getAvatarConfig(selectedContributor.name).color} flex items-center justify-center text-lg font-bold shadow`}>
                                        {getAvatarConfig(selectedContributor.name).initials}
                                    </div>
                                    <div className="text-center sm:text-left flex-1 min-w-0">
                                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-extrabold truncate">{selectedContributor.name}</h4>
                                        <p className="text-xs text-on-surface-variant font-medium font-sans mt-0.5">{selectedContributor.name.toLowerCase().replace(/\s+/g, '')}@gitmetrics.io</p>
                                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mt-2">
                                            {selectedContributor.projects.map(proj => (
                                                <span 
                                                    key={proj}
                                                    className="px-2 py-0.5 bg-surface-container text-on-surface-variant border border-outline text-[9px] rounded font-semibold font-mono"
                                                >
                                                    {proj}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic style analysis & LOC stats stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-surface-bright border border-outline rounded-xl p-3 flex flex-col justify-between">
                                        <span className="text-[9px] font-bold text-on-surface-variant tracking-wider uppercase">交付提交</span>
                                        <span className="font-mono text-lg font-bold text-primary mt-1">{selectedContributor.commitsCount30d} <span className="text-[10px] font-sans text-on-surface-variant font-medium">次</span></span>
                                    </div>
                                    <div className="bg-surface-bright border border-outline rounded-xl p-3 flex flex-col justify-between">
                                        <span className="text-[9px] font-bold text-on-surface-variant tracking-wider uppercase">核心影响代码</span>
                                        <span className="font-mono text-lg font-bold text-[#10b981] mt-1">+{selectedContributor.additions30d.toLocaleString()} <span className="text-[10px] font-sans text-on-surface-variant font-medium">行</span></span>
                                    </div>

                                    {/* Contributor Style classification tag */}
                                    <div className="col-span-2 bg-[#1e293b] border border-outline shadow-inner rounded-xl p-3 flex items-start gap-3">
                                        <div className="p-1.5 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-lg text-[#fbbf24] mt-0.5 shrink-0">
                                            <Sparkles size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-300">工程师交付行为归类</p>
                                            <p className="text-[11px] text-white/90 font-medium leading-relaxed mt-1">
                                                {selectedContributor.additions30d > selectedContributor.deletions30d * 6 ? (
                                                    <span>该协作者为「急速特征突击手」。其行为特征表现为短周期、大规模新代码输出，承担多模块开发的主力交付职责。</span>
                                                ) : selectedContributor.deletions30d > selectedContributor.additions30d * 0.5 ? (
                                                    <span>该协作者为「资深代码优化师」。其偏好精益架构，在删除冗余、优化低效逻辑与提高行代码效能方面拥有显著的贡献比率。</span>
                                                ) : (
                                                    <span>该协作者为「全能型仓库主导工程师」。其完美平衡特性新增与技术债清理，代码分布合理，具有极其稳健的开发特征。</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Five-Dimensional Developer Performance Radar Chart Card */}
                                <div className="bg-surface-bright border border-outline rounded-xl p-4 space-y-4">
                                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-outline-variant/60">
                                        <div className="p-1.5 bg-[#6366f1]/10 text-[#6366f1] rounded-lg">
                                            <Activity size={15} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-on-surface">五维立体研发效能评价雷达</h4>
                                            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">多因子折射：客观量化开发工程师在该周期内的复合效能贡献。</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                                        {/* Radar SVG Visualizer Column (Span 5) */}
                                        <div className="md:col-span-5 flex justify-center items-center py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl relative">
                                            <svg 
                                                viewBox="0 0 200 200" 
                                                className="w-full max-w-[170px] h-auto overflow-visible select-none"
                                            >
                                                <defs>
                                                    <radialGradient id="radar-glow-radial" cx="50%" cy="50%" r="50%">
                                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                                    </radialGradient>
                                                </defs>

                                                {/* Background Pentagon Area Glow */}
                                                <polygon 
                                                    points={getPentagonPointsStr(1.0)} 
                                                    fill="url(#radar-glow-radial)" 
                                                    stroke="none"
                                                />

                                                {/* Concentric Pentagons Grid (25%, 50%, 75%, 100%) */}
                                                {[0.25, 0.5, 0.75, 1.0].map((scale) => (
                                                    <polygon 
                                                        key={scale}
                                                        points={getPentagonPointsStr(scale)}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        className="text-on-surface-variant/30"
                                                        strokeWidth={scale === 1.0 ? "1.2" : "0.7"}
                                                        strokeDasharray={scale < 1.0 ? "3 3" : "none"}
                                                    />
                                                ))}

                                                {/* Diagonal Axis Grid Reference Lines */}
                                                {Array.from({ length: 5 }).map((_, i) => {
                                                    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                                                    const radiusVal = 60;
                                                    const x = 100 + radiusVal * Math.cos(angle);
                                                    const y = 100 + radiusVal * Math.sin(angle);
                                                    return (
                                                        <line 
                                                            key={i} 
                                                            x1={100} 
                                                            y1={100} 
                                                            x2={x} 
                                                            y2={y} 
                                                            stroke="currentColor" 
                                                            className="text-on-surface-variant/30" 
                                                            strokeWidth="0.8" 
                                                            strokeDasharray="2 2" 
                                                        />
                                                    );
                                                })}

                                                {/* Render Main Area Score Polygon */}
                                                <polygon 
                                                    points={radarPointsString} 
                                                    fill="rgba(99, 102, 241, 0.25)" 
                                                    stroke="#6366f1" 
                                                    strokeWidth="2" 
                                                    className="transition-all duration-300"
                                                />

                                                {/* Target Data Vertex Points */}
                                                {radarScores.map((dim, i) => {
                                                    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                                                    const dist = (dim.score / 100) * 60;
                                                    const x = 100 + dist * Math.cos(angle);
                                                    const y = 100 + dist * Math.sin(angle);
                                                    return (
                                                        <g key={i}>
                                                            <circle 
                                                                cx={x} 
                                                                cy={y} 
                                                                r="4" 
                                                                fill="#ffffff" 
                                                                stroke={dim.color} 
                                                                strokeWidth="1.8" 
                                                                style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.25))' }}
                                                            />
                                                            <circle 
                                                                cx={x} 
                                                                cy={y} 
                                                                r="1.5" 
                                                                fill={dim.color} 
                                                            />
                                                        </g>
                                                    );
                                                })}

                                                {/* Axis label texts */}
                                                {radarScores.map((dim, i) => {
                                                    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                                                    const labelRadius = 60 + 13;
                                                    const x = 100 + labelRadius * Math.cos(angle);
                                                    const y = 100 + labelRadius * Math.sin(angle);
                                                    
                                                    let textAnchor = "middle";
                                                    if (Math.cos(angle) > 0.1) textAnchor = "start";
                                                    else if (Math.cos(angle) < -0.1) textAnchor = "end";

                                                    // Vertical alignment tweaks
                                                    let dy = "0.33em";
                                                    if (Math.sin(angle) < -0.8) dy = "-0.2em";   // Top label
                                                    else if (Math.sin(angle) > 0.8) dy = "0.75em"; // Bottom labels

                                                    return (
                                                        <g key={i}>
                                                            <text 
                                                                x={x} 
                                                                y={y} 
                                                                dy={dy}
                                                                textAnchor={textAnchor}
                                                                className="text-[9px] font-extrabold fill-on-surface"
                                                            >
                                                                {dim.label}
                                                            </text>
                                                            <text 
                                                                x={x} 
                                                                y={y + 8} 
                                                                dy={dy}
                                                                textAnchor={textAnchor}
                                                                className="text-[8px] font-mono font-extrabold"
                                                                style={{ fill: dim.color }}
                                                            >
                                                                {dim.score}%
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        </div>

                                        {/* Score Legend with Progress Bars (Span 7) */}
                                        <div className="md:col-span-7 space-y-2.5">
                                            {radarScores.map((dim, i) => (
                                                <div key={i} className="flex flex-col gap-0.5">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-semibold flex items-center gap-1.5 text-on-surface">
                                                            <span className="w-1.5 h-1.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: dim.color }} />
                                                            {dim.label}
                                                        </span>
                                                        <span className="font-mono font-extrabold text-[#6366f1]">{dim.score}%</span>
                                                    </div>
                                                    
                                                    {/* Custom progress bar */}
                                                    <div className="w-full h-1 bg-outline-variant/50 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-500 ease-out" 
                                                            style={{ width: `${dim.score}%`, backgroundColor: dim.color }} 
                                                        />
                                                    </div>
                                                    
                                                    <span className="text-[9.5px] text-on-surface-variant font-medium leading-normal">
                                                        {dim.description}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Commits timelines feed */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-on-surface flex items-center justify-between">
                                        <span>近期动态日志 ({selectedContributor.projects.length}个活跃主仓)</span>
                                        <span className="text-[9px] text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.2 rounded font-mono">LIVE FEED</span>
                                    </h4>

                                    {isCommitsLoading ? (
                                        <div className="flex justify-center items-center py-8">
                                            <Loader2 size={20} className="text-primary animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                            {contributorCommits.map((commit, cIdx) => (
                                                <div 
                                                    key={commit.id || cIdx} 
                                                    className="bg-surface-bright border border-outline rounded-lg p-3 hover:border-primary/30 transition-all flex items-start gap-2.5"
                                                >
                                                    <GitCommit size={14} className="text-on-surface-variant/60 mt-0.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-on-surface leading-tight truncate">{commit.title}</p>
                                                        <div className="flex items-center gap-2 mt-1.5 font-mono text-[9px] font-bold text-on-surface-variant">
                                                            <span className="text-primary bg-primary/10 px-1 py-0.2 rounded">{commit.shortId || 'hash'}</span>
                                                            <span className="flex items-center gap-0.5"><Clock size={10} /> {formatDateStr(commit.authoredDate)}</span>
                                                            <span className="ml-[auto] text-[#10b981]">+{commit.additions} L</span>
                                                            <span className="text-[#ef4444]">-{commit.deletions} L</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {contributorCommits.length === 0 && (
                                                <p className="text-center py-6 text-on-surface-variant/80 text-[10px] font-semibold bg-surface-bright border border-outline rounded-lg">
                                                    未抓取到近期物理提交
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Panel footer close button */}
                            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-2 shrink-0">
                                <button 
                                    onClick={() => setSelectedContributor(null)}
                                    className="bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shrink-0 active:opacity-90"
                                >
                                    关闭档案
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
};

const Loader2 = ({ size, className }: { size?: number; className?: string }) => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size || 24} 
            height={size || 24} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`lucide lucide-loader-2 ${className}`}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
};
