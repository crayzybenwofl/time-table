import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Calendar as CalendarIcon, Clock, MapPin, User, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface TimetableEntry {
  id: string;
  courseId: string;
  courseName: string;
  classId: string;
  className: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

export function Timetable() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const classesUnsubscribe = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'classes'));

    let q = query(collection(db, 'timetable'), orderBy('startTime'));
    
    if (profile?.role === 'teacher') {
      q = query(collection(db, 'timetable'), where('teacherId', '==', profile.uid), orderBy('startTime'));
    }

    const timetableUnsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry));
      setEntries(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'timetable'));

    return () => {
      classesUnsubscribe();
      timetableUnsubscribe();
    };
  }, [profile]);

  const filteredEntries = filterClass === 'all' 
    ? entries 
    : entries.filter(e => e.classId === filterClass);

  const getEntriesForSlot = (day: string, hour: string) => {
    return filteredEntries.filter(e => {
      const startHour = parseInt(e.startTime.split(':')[0]);
      const currentHour = parseInt(hour.split(':')[0]);
      return e.dayOfWeek === day && startHour === currentHour;
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Timetable</h1>
          <p className="text-gray-500 mt-1">View and manage your academic schedule.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[160px]"
            >
              <option value="all">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-gray-100">
              <div className="p-4 bg-gray-50/50" />
              {DAYS.map(day => (
                <div key={day} className="p-4 text-center border-l border-gray-100 bg-gray-50/50">
                  <span className="text-sm font-bold text-gray-900">{day}</span>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="relative">
              {HOURS.map((hour, hourIdx) => (
                <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-gray-50 group">
                  <div className="p-4 text-right pr-6">
                    <span className="text-xs font-bold text-gray-400">{hour}</span>
                  </div>
                  {DAYS.map(day => {
                    const slotEntries = getEntriesForSlot(day, hour);
                    return (
                      <div key={`${day}-${hour}`} className="p-2 border-l border-gray-50 min-h-[100px] relative">
                        {slotEntries.map(entry => (
                          <div
                            key={entry.id}
                            className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs shadow-sm hover:shadow-md transition-shadow cursor-default"
                          >
                            <p className="font-bold text-indigo-900 mb-1 truncate">{entry.courseName}</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-indigo-600/70">
                                <Clock className="w-3 h-3" />
                                <span>{entry.startTime} - {entry.endTime}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-indigo-600/70">
                                <MapPin className="w-3 h-3" />
                                <span>{entry.room}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-indigo-600/70">
                                <User className="w-3 h-3" />
                                <span className="truncate">{entry.className}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
