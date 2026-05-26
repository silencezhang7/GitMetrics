import { FolderOpen, Download, CalendarDays, LineChart, Medal, Activity, GitBranch, CheckCircle, Clock, XCircle, MoreHorizontal } from 'lucide-react';
import { useMemo } from 'react';

export const ProjectInsights = () => {
    const colors = ['bg-surface-container', 'bg-secondary-fixed', 'bg-secondary-fixed-dim', 'bg-secondary', 'bg-on-secondary-fixed-variant'];
    const heatmapCells = useMemo(() => {
        return Array.from({ length: 52 * 7 }, (_, index) => {
            const seed = (index * 9301 + 49297) % 233280;
            const normalized = seed / 233280;
            let activityLevel = 0;
            if (normalized > 0.6) activityLevel = 1;
            if (normalized > 0.85) activityLevel = 2;
            if (normalized > 0.95) activityLevel = 3;
            if (normalized > 0.98) activityLevel = 4;

            return { activityLevel, commits: Math.floor(normalized * 20) };
        });
    }, []);

    return (
        <main className="flex-1 p-margin-md md:p-margin-lg lg:p-10 max-w-7xl mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-primary mb-2 flex items-center gap-3">
                        <FolderOpen size={32} className="text-on-surface-variant" />
                        frontend-framework
                    </h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                        Core UI component library and design system implementation for enterprise applications.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-surface-container border border-outline-variant text-on-surface-variant">
                        <span className="w-2 h-2 rounded-full bg-secondary mr-2"></span> Active
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary-fixed-dim">
                        TypeScript
                    </span>
                    <button className="bg-surface-container-lowest border border-outline-variant text-primary font-body-sm text-body-sm px-4 py-2 rounded shadow-sm hover:bg-surface-container transition-all flex items-center gap-2">
                        <Download size={18} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Commit Heatmap (Full Width) */}
                <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-sm shadow-sm hover:shadow-md hover-ambient-shadow transition-shadow">
                    <div className="border-b border-outline-variant pb-3 mb-4 flex justify-between items-center">
                        <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                            <CalendarDays size={16} />
                            Commit Activity (Last 12 Months)
                        </h3>
                        <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-4">
                            <span>2,845 Commits</span>
                            <div className="flex items-center gap-1 text-[10px]">
                                Less
                                <div className="w-3 h-3 rounded-[2px] bg-surface-container"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-secondary-fixed"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-secondary-fixed-dim"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-secondary"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-on-secondary-fixed-variant"></div>
                                More
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto pb-2">
                        <div className="grid grid-rows-[repeat(7,1fr)] grid-flow-col auto-cols-min gap-[3px]">
                            {heatmapCells.map((cell, index) => (
                                <div
                                    key={index}
                                    className={`w-[10px] h-[10px] rounded-[2px] transition-transform hover:scale-125 cursor-pointer border border-outline-variant/10 ${colors[cell.activityLevel]}`}
                                    title={`${cell.commits} commits on this day`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Line Growth Chart (2/3 Width) */}
                <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-sm shadow-sm hover-ambient-shadow transition-shadow flex flex-col">
                    <div className="border-b border-outline-variant pb-3 mb-4 flex justify-between items-center">
                        <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                            <LineChart size={16} />
                            Codebase Growth (Additions vs Deletions)
                        </h3>
                        <select className="bg-surface-container-lowest border-outline-variant text-body-sm font-body-sm rounded py-1 px-2 text-on-surface-variant focus:ring-secondary focus:border-secondary">
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                            <option>All Time</option>
                        </select>
                    </div>
                    <div className="flex-1 relative min-h-[250px] w-full flex items-end pt-4">
                        <div className="absolute inset-0 pl-10 pb-6 pointer-events-none">
                            <div className="w-full h-1/4 border-t border-surface-container-highest"></div>
                            <div className="w-full h-1/4 border-t border-surface-container-highest"></div>
                            <div className="w-full h-1/4 border-t border-surface-container-highest"></div>
                            <div className="w-full h-1/4 border-t border-surface-container-highest border-b"></div>
                        </div>
                        <div className="absolute left-0 top-4 bottom-6 w-8 flex flex-col justify-between text-[10px] text-on-surface-variant text-right pr-2">
                            <span>15k</span><span>10k</span><span>5k</span><span>0</span>
                        </div>
                        <svg className="w-full h-full ml-10 mb-6 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="additionsGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#88fb9a" stopOpacity="0.2"></stop>
                                    <stop offset="100%" stopColor="#88fb9a" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d="M0,90 Q10,80 20,85 T40,60 T60,40 T80,30 T100,10 L100,100 L0,100 Z" fill="url(#additionsGradient)"></path>
                            <path d="M0,90 Q10,80 20,85 T40,60 T60,40 T80,30 T100,10" fill="none" stroke="#006e2c" strokeWidth="2"></path>
                            <path d="M0,95 Q15,90 30,92 T60,85 T100,80" fill="none" opacity="0.6" stroke="#ba1a1a" strokeDasharray="4 4" strokeWidth="1.5"></path>
                        </svg>
                        <div className="absolute bottom-0 left-10 right-0 flex justify-between text-[10px] text-on-surface-variant pt-2">
                            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
                        </div>
                    </div>
                </div>

                {/* Top Contributors (1/3 Width) */}
                <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-sm shadow-sm hover-ambient-shadow transition-shadow">
                    <div className="border-b border-outline-variant pb-3 mb-4">
                        <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                            <Medal size={16} />
                            Top Contributors
                        </h3>
                    </div>
                    <ul className="flex flex-col gap-4">
                        <li className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant relative">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbdX16ER06J1NFwHVusZbjZJHAdi42_mmZGKMD4DKFoEgDSNJWKGmUn_OFuESAUPjTPv5iIE7vzftHJ8geo4JXs0Fg4RTwR-ZE-Jn-9quTzJuxyX2Co8FFQVS7cw9vPjAyzGc8zZpiU_eOV7sdo8M_u_B0W00AoqbBVzDGBP_mkwzEbIdyCGVzT3o3Vns1IgFXM3N91fQ_E-MY0X47LvkuPZ4lFscKPa1fLTUwgLzbL-OkngP-_m3uQlT02WtDi5EMJ-0HizWwfwI" alt="Avatar" className="w-full h-full object-cover" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface-container-lowest rounded-full flex items-center justify-center">
                                        <span className="text-[10px]">🥇</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-body-md text-body-md font-medium text-primary group-hover:text-tertiary-container transition-colors cursor-pointer">Sarah Chen</p>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">@schen_dev</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-code-md text-code-md font-medium text-primary">1,204</p>
                                <p className="font-label-caps text-[9px] text-on-surface-variant">COMMITS</p>
                            </div>
                        </li>
                        <li className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant relative">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0w8wxkiQDgW-9iuJWw9Oc3XPeR-D1UjalhOgTVl2j1QGEv5NN07AhxZW047P4iTzaM-F6MKmaqHONI44EpRYUjCyi32y68RPwQ3tW4pxFVl1CeJuBHdI_i9X8YiNW5miD7aorEVmA_4n-wphuLbMiHAsI_AfAfnAmW5vvHYjCUm_eIxiFplnEPm_pA1UnJUEYscXdygbKxcOO4W2bcuYT8lW1BVlquIaGOsWVL9IQ-jLOpD9X_7JNNg6V-dXNHFQIvInxMszvTQ0" alt="Avatar" className="w-full h-full object-cover" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface-container-lowest rounded-full flex items-center justify-center">
                                        <span className="text-[10px]">🥈</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-body-md text-body-md font-medium text-primary group-hover:text-tertiary-container transition-colors cursor-pointer">Alex Rivera</p>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">@arivera</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-code-md text-code-md font-medium text-primary">856</p>
                                <p className="font-label-caps text-[9px] text-on-surface-variant">COMMITS</p>
                            </div>
                        </li>
                        <li className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant relative">
                                    <div className="w-full h-full flex items-center justify-center bg-tertiary-container text-on-tertiary font-bold text-sm">JD</div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface-container-lowest rounded-full flex items-center justify-center">
                                        <span className="text-[10px]">🥉</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-body-md text-body-md font-medium text-primary group-hover:text-tertiary-container transition-colors cursor-pointer">Jamie Doe</p>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">@jdoe99</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-code-md text-code-md font-medium text-primary">432</p>
                                <p className="font-label-caps text-[9px] text-on-surface-variant">COMMITS</p>
                            </div>
                        </li>
                        <li className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant relative">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgXIR_SItDcaISzBuVuKeMl-u7Iymf-kvTOe-PwrE0uE873Eq8dEf1oqkkNaWIMbCozd-Y-Q-hwe-Px8oe5Ks_KDj1B8Nnl3kOHfmo-6bPepAxjXggrwroZOSa7QJOJKCINJgGyOVKxc5m0PVNT5GmY8vLFwsWJgE_HNo3vEz2I68Rz7Y3tfiBCHjlJIMEGxwNO7Uso8Kj968SjJsMmLcHDYtnq_3Om15HQVssg_6abmzozZ4Xig0nC1kD_hgxXSHilnl6wW5tVbY" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="font-body-md text-body-md font-medium text-primary group-hover:text-tertiary-container transition-colors cursor-pointer">Taylor Smith</p>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">@tsmith</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-code-md text-code-md font-medium text-primary">218</p>
                                <p className="font-label-caps text-[9px] text-on-surface-variant">COMMITS</p>
                            </div>
                        </li>
                    </ul>
                    <button className="w-full mt-4 py-2 font-body-sm text-body-sm font-medium text-secondary hover:bg-surface-container rounded transition-colors text-center">
                        View All Contributors
                    </button>
                </div>

                {/* Branch Activity (Full Width List) */}
                <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-sm shadow-sm hover-ambient-shadow transition-shadow">
                    <div className="border-b border-outline-variant pb-3 mb-4 flex justify-between items-center">
                        <h3 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
                            <GitBranch size={16} />
                            Active Branches
                        </h3>
                        <button className="font-body-sm text-body-sm font-medium text-secondary hover:underline">View All Branches</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-surface-container-highest">
                                    <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant font-normal">Branch Name</th>
                                    <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant font-normal">Status</th>
                                    <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant font-normal">Last Commit</th>
                                    <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="font-body-sm text-body-sm">
                                <tr className="border-b border-surface-container hover:bg-surface-bright transition-colors group">
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={16} className="text-tertiary-container" />
                                            <span className="font-code-md font-medium text-primary">main</span>
                                            <span className="bg-surface-container text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded border border-outline-variant">Default</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className="inline-flex items-center gap-1 text-secondary">
                                            <CheckCircle size={14} /> Passing
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-on-surface-variant">
                                        2 hours ago by <span className="font-medium text-primary">@schen_dev</span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <button className="text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                                <tr className="border-b border-surface-container hover:bg-surface-bright transition-colors group">
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={16} className="text-on-surface-variant" />
                                            <span className="font-code-md text-primary">feat/new-bento-components</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className="inline-flex items-center gap-1 text-[#b8860b]">
                                            <Clock size={14} /> In Review
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-on-surface-variant">
                                        5 hours ago by <span className="font-medium text-primary">@arivera</span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <button className="text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-surface-bright transition-colors group">
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={16} className="text-on-surface-variant" />
                                            <span className="font-code-md text-primary">fix/sidebar-mobile-overflow</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className="inline-flex items-center gap-1 text-error">
                                            <XCircle size={14} /> Failing
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-on-surface-variant">
                                        1 day ago by <span className="font-medium text-primary">@jdoe99</span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <button className="text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
};
