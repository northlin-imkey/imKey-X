import React from 'react';
import { type HistoryItem } from '../types';

interface CalendarProps {
  history: HistoryItem[];
}

const Calendar: React.FC<CalendarProps> = ({ history }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Extract dates from history
  const tweetDates = new Set<string>();
  history.forEach(item => {
    item.content.forEach(group => {
      // Try to parse the date from the group.date string
      // The format is usually "March 12" or similar from Gemini
      // Or it might be a full date string if we saved it differently
      // For simplicity, let's also check created_at
      const date = new Date(item.created_at);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        tweetDates.add(date.getDate().toString());
      }
      
      // Also check if group.date contains the day number
      const match = group.date.match(/(\d+)/);
      if (match) {
        tweetDates.add(match[1]);
      }
    });
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [];
  // Padding for first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`pad-${i}`} className="h-8 w-8"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = tweetDates.has(d.toString());
    days.push(
      <div 
        key={d} 
        className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
          isSelected 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110' 
            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
        }`}
      >
        {d}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
          Tweet Schedule
        </span>
      </div>
      
      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={`${day}-${idx}`} className="text-[10px] font-black text-gray-600">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-[10px] text-gray-400">已排程推文</span>
        </div>
        <span className="text-[10px] text-gray-500">
          本月共 {tweetDates.size} 天
        </span>
      </div>
    </div>
  );
};

export default Calendar;
