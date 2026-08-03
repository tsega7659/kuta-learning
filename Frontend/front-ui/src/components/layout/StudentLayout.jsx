import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function StudentLayout() {
    return (
        <div className="bg-gray-100 min-h-screen flex justify-center">
            <div className="w-full max-w-md bg-kidBg min-h-screen relative overflow-x-hidden shadow-2xl flex flex-col">
                <div className="flex-1 pb-24 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </div>
                <BottomNav />

            </div>
        </div>
    );
}
