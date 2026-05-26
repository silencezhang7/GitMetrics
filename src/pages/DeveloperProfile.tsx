import { TrendingUp, Shrink, Flame, GitCommit, Folder } from 'lucide-react';

export const DeveloperProfile = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const opacities = ['bg-surface-container-high', 'bg-secondary/20', 'bg-secondary/50', 'bg-secondary/80', 'bg-secondary'];
    const punchCardRows = days.map((day, dayIndex) => ({
        day,
        hours: Array.from({ length: 24 }, (_, hour) => {
            const isWeekend = day === 'Sat' || day === 'Sun';
            const seed = (dayIndex * 24 + hour) * 9301 + 49297;
            const value = seed % 233280;

            if (!isWeekend && hour > 8 && hour < 18) return (value % 4) + 1;
            if (!isWeekend && hour > 18 && hour < 22) return value % 2;
            if (isWeekend && hour > 10 && hour < 16) return value % 3;
            return 0;
        }),
    }));

    return (
        <main className="flex-1 overflow-y-auto p-margin-md">
            <div className="max-w-[1200px] mx-auto space-y-gutter">
                {/* Bento Grid Row 1: Profile & Key Stats */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                    {/* Bio Card (4 cols) */}
                    <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-margin-sm card-hover-ambient flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-surface-container mb-4">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoB0hOw_UaVpZWb6rrQxAfwPLV8OwBHHf3EWeGbcyqqfPylC6CAN6IcfNjlg6Mh_o1Bt7wMIabj8c5xjtmrcWFz0kZdDh82I8xxiZlNhpImcNl8R87hOiU1My3o_SA1tPoMAkNsNO--kQnct4ijioJw79uOET8veSGmcafTzsfyAuieN-7UrkiBGOtHhTPeWxtj2EiiajvP8hrOTofnvZ08wmZ8wVVOudfgwOaagc4mH8Brne3Y85N9TKlTKPXoiq1jJsJAyY4vDw" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="font-headline-md text-headline-md text-primary mb-1">Alex Chen</h2>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-4">Senior Data Architect</p>
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                            <span className="px-2 py-1 bg-surface-container rounded text-body-sm font-body-sm text-on-surface-variant border border-outline-variant">Python</span>
                            <span className="px-2 py-1 bg-surface-container rounded text-body-sm font-body-sm text-on-surface-variant border border-outline-variant">Go</span>
                            <span className="px-2 py-1 bg-surface-container rounded text-body-sm font-body-sm text-on-surface-variant border border-outline-variant">Rust</span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-surface-container w-full">
                            <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                                <span>Joined</span>
                                <span className="text-primary">Oct 2021</span>
                            </div>
                        </div>
                    </div>

                    {/* Key Stats Grid (8 cols) */}
                    <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-gutter">
                        {/* Stat 1 */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-margin-sm card-hover-ambient flex flex-col justify-between">
                            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Total Commits (YTD)</h3>
                            <div className="flex items-end justify-between">
                                <span className="font-headline-lg text-headline-lg text-primary">2,491</span>
                                <span className="text-secondary font-body-sm text-body-sm flex items-center"><TrendingUp size={14} className="mr-1" /> 12%</span>
                            </div>
                        </div>

                        {/* Stat 2 */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-margin-sm card-hover-ambient flex flex-col justify-between">
                            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Avg PR Size</h3>
                            <div className="flex items-end justify-between">
                                <span className="font-headline-lg text-headline-lg text-primary">+142 <span className="text-on-surface-variant text-body-lg">lines</span></span>
                                <Shrink size={20} className="text-outline-variant" />
                            </div>
                        </div>

                        {/* Stat 3 */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-margin-sm card-hover-ambient flex flex-col justify-between col-span-2 md:col-span-1">
                            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Code Reviews</h3>
                            <div className="flex items-end justify-between">
                                <span className="font-headline-lg text-headline-lg text-primary">384</span>
                                <span className="text-on-surface-variant font-body-sm text-body-sm flex items-center">This year</span>
                            </div>
                        </div>

                        {/* Mini Activity Chart (Spans across stats row) */}
                        <div className="col-span-2 md:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-lg p-margin-sm flex items-center justify-between card-hover-ambient">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center">
                                    <Flame size={20} />
                                </div>
                                <div>
                                    <h4 className="font-headline-sm text-headline-sm text-primary">42 Day Streak</h4>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">Active consecutive days</p>
                                </div>
                            </div>
                            <div className="flex items-end gap-1 h-8">
                                <div className="w-2 bg-surface-container-high h-full rounded-t"></div>
                                <div className="w-2 bg-surface-container-high h-4 rounded-t"></div>
                                <div className="w-2 bg-surface-container-high h-6 rounded-t"></div>
                                <div className="w-2 bg-surface-container-high h-3 rounded-t"></div>
                                <div className="w-2 bg-surface-container-high h-8 rounded-t"></div>
                                <div className="w-2 bg-secondary h-full rounded-t"></div>
                                <div className="w-2 bg-secondary h-5 rounded-t"></div>
                                <div className="w-2 bg-secondary h-7 rounded-t"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bento Grid Row 2: Deep Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                    {/* Punch Card (8 cols) */}
                    <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg card-hover-ambient">
                        <div className="border-b border-outline-variant p-4">
                            <h3 className="font-label-caps text-label-caps text-primary">Commit Frequency (By Hour & Day)</h3>
                        </div>
                        <div className="p-margin-sm overflow-x-auto">
                            <div className="min-w-[600px]">
                                <div className="flex justify-between text-on-surface-variant font-label-caps text-label-caps mb-2 pl-8">
                                    <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span>
                                </div>
                                <div className="flex flex-col gap-1 text-body-sm font-body-sm text-on-surface-variant">
                                    {punchCardRows.map((row) => (
                                        <div key={row.day} className="flex items-center gap-1">
                                            <span className="w-8 text-right pr-2">{row.day}</span>
                                            {row.hours.map((activityLevel, hour) => (
                                                <div
                                                    key={hour}
                                                    className={`w-4 h-4 rounded-sm ${opacities[activityLevel]} border border-outline-variant/30`}
                                                    title={`${row.day} ${hour}:00 activity level ${activityLevel}`}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-end gap-2 mt-4 text-body-sm font-body-sm text-on-surface-variant">
                                    <span>Less</span>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded-sm bg-surface-container-high"></div>
                                        <div className="w-3 h-3 rounded-sm bg-secondary/20"></div>
                                        <div className="w-3 h-3 rounded-sm bg-secondary/50"></div>
                                        <div className="w-3 h-3 rounded-sm bg-secondary/80"></div>
                                        <div className="w-3 h-3 rounded-sm bg-secondary"></div>
                                    </div>
                                    <span>More</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Involvement (4 cols) */}
                    <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col card-hover-ambient">
                        <div className="border-b border-outline-variant p-4">
                            <h3 className="font-label-caps text-label-caps text-primary">Project Distribution</h3>
                        </div>
                        <div className="p-margin-sm flex-1 flex flex-col items-center justify-center">
                            <div className="relative w-40 h-40 rounded-full bg-surface-container flex items-center justify-center mb-6" style={{ background: 'conic-gradient(#006e2c 0deg 180deg, #3781f3 180deg 280deg, #e0e3e5 280deg 360deg)' }}>
                                <div className="w-28 h-28 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center border border-outline-variant/20 shadow-inner">
                                    <span className="font-headline-sm text-headline-sm text-primary">12</span>
                                    <span className="font-label-caps text-label-caps text-on-surface-variant">Repos</span>
                                </div>
                            </div>
                            <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-body-sm font-body-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-[#006e2c]"></div>
                                        <span className="text-on-surface">core-api</span>
                                    </div>
                                    <span className="text-on-surface-variant font-code-md text-code-md">50%</span>
                                </div>
                                <div className="flex items-center justify-between text-body-sm font-body-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-[#3781f3]"></div>
                                        <span className="text-on-surface">data-pipeline</span>
                                    </div>
                                    <span className="text-on-surface-variant font-code-md text-code-md">28%</span>
                                </div>
                                <div className="flex items-center justify-between text-body-sm font-body-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-surface-container-highest"></div>
                                        <span className="text-on-surface">Others (10)</span>
                                    </div>
                                    <span className="text-on-surface-variant font-code-md text-code-md">22%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Commits Feed (Full Width) */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg">
                    <div className="border-b border-outline-variant p-4 flex justify-between items-center">
                        <h3 className="font-label-caps text-label-caps text-primary">Recent Commits</h3>
                        <button className="font-body-sm text-body-sm text-on-tertiary-container hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-outline-variant/50">
                        {/* Commit Item 1 */}
                        <div className="p-4 hover:bg-surface-container-low transition-colors flex items-start gap-4">
                            <GitCommit className="text-outline mt-1" size={20} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <a href="#" className="font-body-md text-body-md text-on-surface font-semibold hover:text-on-tertiary-container">Optimize data ingestion batch sizing</a>
                                    <span className="font-body-sm text-body-sm text-on-surface-variant">2 hours ago</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-body-sm font-body-sm text-on-surface-variant">
                                    <span className="font-code-md text-code-md text-primary bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant">a1b2c3d</span>
                                    <span className="flex items-center gap-1"><Folder size={14} /> data-pipeline</span>
                                    <div className="flex items-center gap-2 font-code-md text-code-md ml-auto">
                                        <span className="text-secondary">+145</span>
                                        <span className="text-error">-23</span>
                                        <div className="flex gap-0.5 w-10">
                                            <div className="h-2 flex-1 bg-secondary rounded-l-sm"></div>
                                            <div className="h-2 flex-1 bg-secondary"></div>
                                            <div className="h-2 flex-1 bg-secondary"></div>
                                            <div className="h-2 flex-1 bg-secondary"></div>
                                            <div className="h-2 flex-1 bg-error rounded-r-sm"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Commit Item 2 */}
                        <div className="p-4 hover:bg-surface-container-low transition-colors flex items-start gap-4">
                            <GitCommit className="text-outline mt-1" size={20} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <a href="#" className="font-body-md text-body-md text-on-surface font-semibold hover:text-on-tertiary-container">Fix race condition in caching layer</a>
                                    <span className="font-body-sm text-body-sm text-on-surface-variant">Yesterday</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-body-sm font-body-sm text-on-surface-variant">
                                    <span className="font-code-md text-code-md text-primary bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant">e4f5g6h</span>
                                    <span className="flex items-center gap-1"><Folder size={14} /> core-api</span>
                                    <div className="flex items-center gap-2 font-code-md text-code-md ml-auto">
                                        <span className="text-secondary">+12</span>
                                        <span className="text-error">-15</span>
                                        <div className="flex gap-0.5 w-10">
                                            <div className="h-2 flex-1 bg-secondary rounded-l-sm"></div>
                                            <div className="h-2 flex-1 bg-surface-container-high"></div>
                                            <div className="h-2 flex-1 bg-surface-container-high"></div>
                                            <div className="h-2 flex-1 bg-error"></div>
                                            <div className="h-2 flex-1 bg-error rounded-r-sm"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Commit Item 3 */}
                        <div className="p-4 hover:bg-surface-container-low transition-colors flex items-start gap-4">
                            <GitCommit className="text-outline mt-1" size={20} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <a href="#" className="font-body-md text-body-md text-on-surface font-semibold hover:text-on-tertiary-container">Update dependencies and resolve vulnerabilities</a>
                                    <span className="font-body-sm text-body-sm text-on-surface-variant">2 days ago</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-body-sm font-body-sm text-on-surface-variant">
                                    <span className="font-code-md text-code-md text-primary bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant">j7k8l9m</span>
                                    <span className="flex items-center gap-1"><Folder size={14} /> core-api</span>
                                    <div className="flex items-center gap-2 font-code-md text-code-md ml-auto">
                                        <span className="text-secondary">+845</span>
                                        <span className="text-error">-620</span>
                                        <div className="flex gap-0.5 w-10">
                                            <div className="h-2 flex-1 bg-secondary rounded-l-sm"></div>
                                            <div className="h-2 flex-1 bg-secondary"></div>
                                            <div className="h-2 flex-1 bg-secondary"></div>
                                            <div className="h-2 flex-1 bg-error"></div>
                                            <div className="h-2 flex-1 bg-error rounded-r-sm"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};
