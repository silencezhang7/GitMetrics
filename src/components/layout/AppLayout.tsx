import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="bg-background text-on-background font-body-md text-body-md min-h-screen flex antialiased">
            <Sidebar />
            <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen w-full">
                <Header />
                {children}
            </div>
        </div>
    );
};
