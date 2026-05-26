import { Users, Zap, TrendingUp, Minus, TrendingDown, ChevronDown, Calendar, Filter, ChevronRight, ArrowUp } from 'lucide-react';

export const ContributorAnalytics = () => {
    return (
        <main className="flex-1 p-margin-sm md:p-margin-md lg:p-margin-lg bg-background">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-margin-md">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Contributor Analytics</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Compare team member velocity, code impact, and overall engagement.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface font-body-sm text-body-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-on-tertiary-container focus:ring-1 focus:ring-on-tertiary-container hover:bg-surface-container-low transition-colors cursor-pointer">
                            <option>All Projects</option>
                            <option>Core Platform</option>
                            <option>Mobile App</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface font-body-sm text-body-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-on-tertiary-container focus:ring-1 focus:ring-on-tertiary-container hover:bg-surface-container-low transition-colors cursor-pointer">
                            <option>Last 30 Days</option>
                            <option>Last Quarter</option>
                            <option>Year to Date</option>
                        </select>
                        <Calendar size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                    <button className="bg-surface-container-lowest border border-outline-variant text-on-surface p-2 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center">
                        <Filter size={14} className="text-on-surface-variant" />
                    </button>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin-sm mb-margin-sm">
                {/* KPI Cards (Bento style) */}
                <div className="col-span-1 lg:col-span-4 flex flex-col gap-margin-sm">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover-ambient-shadow transition-shadow flex flex-col justify-between flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-label-caps text-label-caps text-on-surface-variant">Active Contributors</span>
                            <Users size={14} className="text-on-surface-variant" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="font-headline-lg text-headline-lg text-on-surface">24</span>
                            <span className="font-body-sm text-body-sm text-secondary flex items-center mb-1">
                                <ArrowUp size={14} /> 12%
                            </span>
                        </div>
                    </div>
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover-ambient-shadow transition-shadow flex flex-col justify-between flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-label-caps text-label-caps text-on-surface-variant">Avg Engagement Score</span>
                            <Zap size={14} className="text-on-surface-variant" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="font-headline-lg text-headline-lg text-on-surface">8.4</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">/ 10</span>
                        </div>
                    </div>
                </div>

                {/* Engagement Score Trend Chart */}
                <div className="col-span-1 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col hover-ambient-shadow transition-shadow overflow-hidden min-h-[250px]">
                    <div className="border-b border-outline-variant px-4 py-3 flex justify-between items-center bg-surface-bright">
                        <h3 className="font-label-caps text-label-caps text-on-surface">Team Engagement Trend</h3>
                        <div className="flex gap-2">
                            <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                                <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span> Score
                            </span>
                        </div>
                    </div>
                    <div className="p-4 flex-1 relative min-h-[160px]">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 120">
                            <line className="chart-grid-line" x1="0" x2="800" y1="120" y2="120"></line>
                            <line className="chart-grid-line" x1="0" x2="800" y1="60" y2="60"></line>
                            <line className="chart-grid-line" x1="0" x2="800" y1="0" y2="0"></line>
                            <path d="M0,80 Q100,50 200,60 T400,30 T600,40 T800,20 L800,120 L0,120 Z" fill="rgba(55, 129, 243, 0.05)"></path>
                            <path d="M0,80 Q100,50 200,60 T400,30 T600,40 T800,20" fill="none" stroke="#3781f3" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                            <circle cx="200" cy="60" fill="#ffffff" r="3" stroke="#3781f3" strokeWidth="2"></circle>
                            <circle cx="400" cy="30" fill="#ffffff" r="3" stroke="#3781f3" strokeWidth="2"></circle>
                            <circle cx="600" cy="40" fill="#ffffff" r="3" stroke="#3781f3" strokeWidth="2"></circle>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Leaderboard / Impact Table */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl hover-ambient-shadow transition-shadow overflow-hidden">
                <div className="border-b border-outline-variant px-4 py-3 flex justify-between items-center bg-surface-bright">
                    <h3 className="font-label-caps text-label-caps text-on-surface">Contributor Leaderboard</h3>
                    <div className="flex gap-3 font-body-sm text-body-sm text-on-surface-variant">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[#216e39]"></div> Additions</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-surface-variant"></div> Modifications</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-error-container"></div> Deletions</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-outline-variant bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant">
                                <th className="px-4 py-3 font-medium w-16 text-center">Rank</th>
                                <th className="px-4 py-3 font-medium">Developer</th>
                                <th className="px-4 py-3 font-medium">Engagement</th>
                                <th className="px-4 py-3 font-medium w-[40%]">Code Impact Distribution</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="font-body-md text-body-md divide-y divide-outline-variant">
                            {/* Row 1 */}
                            <tr className="hover:bg-surface-container-lowest transition-colors group">
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-on-secondary font-label-caps text-label-caps">1</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-headline-sm font-bold text-sm">AS</div>
                                        <div>
                                            <p className="font-medium text-on-surface leading-tight">Alex Sterling</p>
                                            <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">alex.s@gitmetrics.io</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-code-md text-code-md text-on-surface">9.8</span>
                                        <TrendingUp size={14} className="text-secondary" />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-variant">
                                        <div className="h-full bg-[#2ea44f]" style={{ width: '65%' }}></div>
                                        <div className="h-full bg-outline-variant" style={{ width: '25%' }}></div>
                                        <div className="h-full bg-error" style={{ width: '10%' }}></div>
                                    </div>
                                    <div className="mt-1 font-code-md text-code-md text-on-surface-variant text-[10px] flex justify-between">
                                        <span>+4,210</span><span>~1,600</span><span>-640</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                        <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                            {/* Row 2 */}
                            <tr className="hover:bg-surface-container-lowest transition-colors group">
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-variant text-on-surface-variant font-label-caps text-label-caps">2</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-headline-sm font-bold text-sm">MR</div>
                                        <div>
                                            <p className="font-medium text-on-surface leading-tight">Maria Rodriguez</p>
                                            <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">m.rodriguez@gitmetrics.io</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-code-md text-code-md text-on-surface">8.5</span>
                                        <Minus size={14} className="text-outline" />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-variant">
                                        <div className="h-full bg-[#216e39]" style={{ width: '40%' }}></div>
                                        <div className="h-full bg-outline-variant" style={{ width: '50%' }}></div>
                                        <div className="h-full bg-error" style={{ width: '10%' }}></div>
                                    </div>
                                    <div className="mt-1 font-code-md text-code-md text-on-surface-variant text-[10px] flex justify-between">
                                        <span>+2,100</span><span>~2,600</span><span>-520</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                        <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                            {/* Row 3 */}
                            <tr className="hover:bg-surface-container-lowest transition-colors group">
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-variant text-on-surface-variant font-label-caps text-label-caps">3</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-headline-sm font-bold text-sm">JC</div>
                                        <div>
                                            <p className="font-medium text-on-surface leading-tight">James Chen</p>
                                            <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">j.chen@gitmetrics.io</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-code-md text-code-md text-on-surface">7.2</span>
                                        <TrendingDown size={14} className="text-error" />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-variant">
                                        <div className="h-full bg-[#40c463]" style={{ width: '20%' }}></div>
                                        <div className="h-full bg-outline-variant" style={{ width: '30%' }}></div>
                                        <div className="h-full bg-error" style={{ width: '50%' }}></div>
                                    </div>
                                    <div className="mt-1 font-code-md text-code-md text-on-surface-variant text-[10px] flex justify-between">
                                        <span>+850</span><span>~1,200</span><span>-2,100</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                        <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};
