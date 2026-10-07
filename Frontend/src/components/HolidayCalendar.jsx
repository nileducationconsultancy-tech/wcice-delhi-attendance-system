import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const HolidayCalendar = ({ holidays, onDateClick, onHolidayClick, currentMonth, currentYear, onMonthChange, onYearChange }) => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

    // Adjust for Monday start (if desired, let's stick to Sunday start for simplicity or Monday start as per usual Indian standard)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday start
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            onMonthChange(11);
            onYearChange(currentYear - 1);
        } else {
            onMonthChange(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            onMonthChange(0);
            onYearChange(currentYear + 1);
        } else {
            onMonthChange(currentMonth + 1);
        }
    };

    const handleToday = () => {
        const today = new Date();
        onMonthChange(today.getMonth());
        onYearChange(today.getFullYear());
    };

    // Helper to get holiday for a specific date
    const getHolidaysForDate = (dateStr) => {
        return holidays.filter(h => h.date === dateStr);
    };

    const generateDays = () => {
        const days = [];
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Empty cells before start of month
        for (let i = 0; i < startOffset; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 border-b border-r border-slate-100 bg-slate-50/50"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayHolidays = getHolidaysForDate(dateStr);
            const isToday = dateStr === todayStr;
            const currentDayOfWeek = new Date(currentYear, currentMonth, d).getDay();
            const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;

            days.push(
                <div 
                    key={d} 
                    onClick={() => dayHolidays.length > 0 ? onHolidayClick(dayHolidays[0]) : onDateClick(dateStr)}
                    className={`min-h-[4rem] sm:min-h-[8rem] h-auto border-b border-r border-slate-100 p-1 sm:p-2 cursor-pointer transition-all hover:bg-blue-50 relative flex flex-col items-center sm:items-start ${isWeekend && !dayHolidays.length ? 'bg-slate-50/50' : 'bg-white'}`}
                >
                    <div className="flex justify-center sm:justify-between w-full items-start">
                        <span className={`text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md' : isWeekend ? 'text-slate-400' : 'text-slate-700'}`}>
                            {d}
                        </span>
                    </div>

                    {/* Desktop view badges */}
                    <div className="hidden sm:block mt-1 space-y-1 overflow-y-auto max-h-[80px] w-full no-scrollbar">
                        {dayHolidays.map((holiday, idx) => (
                            <div 
                                key={idx} 
                                className={`text-[10px] leading-tight px-1.5 py-0.5 rounded truncate border ${
                                    holiday.type === 'National Holiday' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    holiday.type === 'Company Holiday' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    holiday.type === 'Festival Working Day' ? 'bg-amber-50 text-amber-800 border-amber-300 font-medium' :
                                    'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                                title={holiday.name}
                            >
                                <span className="font-semibold block truncate">
                                    {holiday.type === 'Festival Working Day' ? '🎉 ' : ''}{holiday.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Mobile view dots */}
                    <div className="flex sm:hidden gap-1 mt-1 flex-wrap justify-center w-full">
                        {dayHolidays.map((holiday, idx) => (
                            <div 
                                key={idx} 
                                className={`w-1.5 h-1.5 rounded-full ${
                                    holiday.type === 'National Holiday' ? 'bg-red-500' : 
                                    holiday.type === 'Company Holiday' ? 'bg-green-500' : 
                                    holiday.type === 'Festival Working Day' ? 'bg-amber-500' :
                                    'bg-purple-500'
                                }`}
                                title={holiday.name}
                            />
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center bg-slate-50 gap-4">
                <div className="flex items-center space-x-4">
                    <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <h2 className="text-lg font-bold text-slate-800 min-w-[150px] text-center">
                        {monthNames[currentMonth]} {currentYear}
                    </h2>
                    
                    <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <button onClick={handleToday} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        Today
                    </button>
                    
                    <select 
                        value={currentMonth}
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>

                    <select 
                        value={currentYear}
                        onChange={(e) => onYearChange(Number(e.target.value))}
                        className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 border-b border-slate-200">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-100 last:border-r-0 bg-slate-50/50">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 border-l border-t border-slate-100">
                {generateDays()}
            </div>
            
            {/* Legend */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-400 mr-2"></span> National Holiday</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span> Company Holiday</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-400 mr-2"></span> Optional Holiday</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-400 mr-2"></span> 🎉 Festival / Occasion (Working Day)</span>
            </div>
        </div>
    );
};

export default HolidayCalendar;
