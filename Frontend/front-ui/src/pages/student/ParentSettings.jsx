import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaCrown, FaChartLine, FaShieldHalved, FaBell, FaLock } from 'react-icons/fa6';

const PREMIUM_FEATURES = [
    {
        icon: FaChartLine,
        title: 'Detailed Progress Reports',
        description: 'See weekly learning stats, quiz scores, and time spent on each topic.',
        locked: true,
    },
    {
        icon: FaShieldHalved,
        title: 'Screen Time Controls',
        description: 'Set daily limits and schedule learning windows for your child.',
        locked: true,
    },
    {
        icon: FaBell,
        title: 'Achievement Alerts',
        description: 'Get notified when your child completes a course or earns a badge.',
        locked: true,
    },
    {
        icon: FaCrown,
        title: 'Premium Content Access',
        description: 'Unlock advanced courses, mock exams, and bonus practice packs.',
        locked: true,
    },
];

export default function ParentSettings() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FFFDF9] pb-32">
            <div className="pt-12 px-6 pb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate('/student/profile')}
                    className="bg-gray-100 p-2.5 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                >
                    <FaChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-kidOrange font-bold tracking-widest text-sm uppercase">Parent Settings</h2>
                    <p className="text-gray-400 font-bold text-xs mt-0.5">Manage premium features</p>
                </div>
            </div>

            <div className="px-5 space-y-4">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[28px] p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <FaCrown className="w-8 h-8" />
                        <div>
                            <h1 className="text-xl font-extrabold">Kuta Premium</h1>
                            <p className="text-white/80 text-sm font-bold">Unlock the full parent experience</p>
                        </div>
                    </div>
                    <p className="text-white/90 text-sm font-medium leading-relaxed">
                        Premium gives you deeper insight into your child's learning journey and powerful parental controls.
                    </p>
                    <button
                        type="button"
                        className="mt-4 w-full bg-white text-orange-600 font-extrabold py-3.5 rounded-full shadow-md active:scale-95 transition-transform"
                    >
                        Upgrade to Premium
                    </button>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 px-1">Premium Features</h3>
                    {PREMIUM_FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="bg-white rounded-[24px] p-4 shadow-soft border border-gray-100 flex items-start gap-4"
                        >
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                                <feature.icon className="w-6 h-6 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-extrabold text-kidText text-[15px]">{feature.title}</h4>
                                    {feature.locked && (
                                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                            <FaLock className="w-2.5 h-2.5" /> Premium
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-[13px] font-medium leading-relaxed">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
