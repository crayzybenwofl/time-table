import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Users, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface Stats {
  courses: number;
  classes: number;
  todayClasses: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ courses: 0, classes: 0, todayClasses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const classesSnap = await getDocs(collection(db, 'classes'));
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        
        let todayQuery;
        if (profile?.role === 'teacher') {
          todayQuery = query(collection(db, 'timetable'), where('dayOfWeek', '==', today), where('teacherId', '==', profile.uid));
        } else {
          todayQuery = query(collection(db, 'timetable'), where('dayOfWeek', '==', today));
        }
        
        const todaySnap = await getDocs(todayQuery);

        setStats({
          courses: coursesSnap.size,
          classes: classesSnap.size,
          todayClasses: todaySnap.size
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  const cards = [
    { name: 'Total Courses', value: stats.courses, icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Total Classes', value: stats.classes, icon: Users, color: 'bg-purple-500' },
    { name: "Today's Schedule", value: stats.todayClasses, icon: Clock, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile?.displayName}</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your schedule today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className={`${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-gray-100`}>
              <card.icon className="text-white w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-500">{card.name}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Link 
              to="/timetable"
              className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">View Full Timetable</p>
                  <p className="text-sm text-gray-500">Check your weekly schedule</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-colors" />
            </Link>
            
            {profile?.role === 'admin' && (
              <Link 
                to="/admin"
                className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Manage System</p>
                    <p className="text-sm text-gray-500">Add courses, classes, and schedules</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </Link>
            )}
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">System Status</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-sm text-gray-600 font-medium">Database Connection: Active</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-sm text-gray-600 font-medium">Auth Service: Online</p>
            </div>
            <div className="pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400 leading-relaxed">
                Welcome to the Time Table Management System. This platform is designed to provide real-time updates and easy access to academic schedules.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Settings(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
