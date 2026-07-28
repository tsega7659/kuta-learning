import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { PlayIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/courses/${id}`)
            .then(res => setCourse(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!course) {
        return <div className="p-8 text-center text-gray-400 font-bold">Course not found</div>;
    }

    const chapters = (course.chapters || []).sort((a, b) => a.order - b.order);

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Header */}
            <div className="bg-kidPrimary rounded-b-[40px] px-6 pt-12 pb-16 relative shadow-lg text-center">
                <button onClick={() => navigate(-1)} className="absolute top-6 left-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/30 backdrop-blur-sm">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h2 className="text-white/80 font-bold tracking-widest text-sm mb-2 uppercase">Kuta Learning</h2>
                <h1 className="text-4xl font-black text-white mb-3">{course.title}</h1>
                <p className="text-white/90 text-sm font-medium mb-4">{course.description}</p>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Grade {course.gradeLevel}</span>
            </div>

            {/* Chapters */}
            <div className="px-6 -mt-8 relative z-10 space-y-4 pb-12">
                {chapters.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 shadow-soft text-center">
                        <span className="text-4xl block mb-3">📭</span>
                        <p className="font-bold text-gray-400">No chapters yet. Check back soon!</p>
                    </div>
                ) : (
                    chapters.map((chapter, idx) => {
                        const topics = (chapter.topics || []).sort((a, b) => a.order - b.order);
                        return (
                            <div key={chapter.id}>
                                <div
                                    className={`bg-white rounded-3xl p-5 shadow-soft border-2 ${idx === 0 ? 'border-kidOrange' : 'border-gray-100'} cursor-pointer`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                            {idx === 0 ? (
                                                <PlayIcon className="w-8 h-8 text-kidOrange" />
                                            ) : (
                                                <span className="font-bold text-gray-400">{chapter.order}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Chapter {chapter.order}</span>
                                            <h3 className="font-extrabold text-kidText text-lg">{chapter.title}</h3>
                                            <p className="text-xs text-gray-400 font-medium">{topics.length} topic{topics.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>

                                    {/* Topics inside chapter */}
                                    {topics.length > 0 && (
                                        <div className="mt-4 pl-4 space-y-2">
                                            {topics.map((topic) => {
                                                const lessons = (topic.lessons || []).sort((a, b) => a.order - b.order);
                                                return (
                                                    <div key={topic.id}>
                                                        <p className="text-sm font-bold text-kidText mb-1">📌 {topic.title}</p>
                                                        {lessons.map((lesson) => (
                                                            <div
                                                                key={lesson.id}
                                                                onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                                                                className="ml-4 py-2 px-3 bg-gray-50 rounded-xl mb-1 cursor-pointer hover:bg-orange-50 transition flex items-center gap-2"
                                                            >
                                                                <span className="text-sm">📝</span>
                                                                <span className="text-sm font-medium text-kidText">{lesson.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Visual connector line between chapters */}
                                {idx < chapters.length - 1 && (
                                    <div className="w-1 h-6 bg-gray-200 mx-auto rounded-full" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
