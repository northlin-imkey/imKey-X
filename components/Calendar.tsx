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
    if (!item.content) return;
    
    item.content.forEach(group => {
      // 只有當該組日期中有推文被標記為 'published' 時，才顯示在月曆上
      const hasPublishedTweet = group.tweets && group.tweets.some(t => t.status === 'published');
      
      if (hasPublishedTweet) {
        // 嘗試從字串中找出所有數字
        const matches = group.date.match(/(\d+)/g);
        if (matches && matches.length > 0) {
          // 尋找可能的日期 (1-31)
          // 從後往前找，通常日期在後面。優先找 1-2 位數的數字（排除年份）
          let dayNum = -1;
          for (let i = matches.length - 1; i >= 0; i--) {
            const n = parseInt(matches[i], 10);
            if (n >= 1 && n <= 31 && matches[i].length <= 2) {
              dayNum = n;
              break;
            }
          }
          
          // 如果沒找到符合條件的，就取最後一個數字試試
          if (dayNum === -1) {
            dayNum = parseInt(matches[matches.length - 1], 10);
          }

          if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
            tweetDates.add(dayNum.toString());
          }
        } else {
          // 如果 group.date 沒數字，則回退到使用該紀錄的建立日期
          const date = new Date(item.created_at);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            tweetDates.add(date.getDate().toString());
          }
        }
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
