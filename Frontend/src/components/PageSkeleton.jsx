const PageSkeleton = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header Skeleton */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse"></div>
                    <div className="w-32 h-4 rounded bg-slate-200 animate-pulse"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
                {/* Title skeleton */}
                <div className="space-y-2">
                    <div className="w-48 h-6 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="w-72 h-3.5 bg-slate-200 rounded animate-pulse"></div>
                </div>

                {/* Cards skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse"></div>
                            <div className="w-20 h-4 bg-slate-100 rounded animate-pulse"></div>
                            <div className="w-28 h-7 bg-slate-200 rounded-lg animate-pulse"></div>
                        </div>
                    ))}
                </div>

                {/* Main Table/Panel skeleton */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <div className="w-36 h-5 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-24 h-8 bg-slate-100 rounded-xl animate-pulse"></div>
                    </div>
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageSkeleton;
