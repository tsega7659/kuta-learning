import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function StudentLayout() {
    return (
        <div className="bg-[#ede8df] min-h-screen flex justify-center selection:bg-orange-200">
            <div className="w-full max-w-md bg-kuta-pattern min-h-screen relative overflow-x-hidden shadow-2xl flex flex-col">
                <div className="flex-1 pb-24 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </div>
                <BottomNav />
            </div>
        </div>
    );
}


