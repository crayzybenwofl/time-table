import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Plus, Trash2, Edit2, BookOpen, Users, Calendar, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'courses' | 'classes' | 'timetable' | 'users';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('courses');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Manage system data and configurations.</p>
      </header>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        {[
          { id: 'courses', name: 'Courses', icon: BookOpen },
          { id: 'classes', name: 'Classes', icon: Users },
          { id: 'timetable', name: 'Timetable', icon: Calendar },
          { id: 'users', name: 'Users', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'courses' && <CourseManager />}
        {activeTab === 'classes' && <ClassManager />}
        {activeTab === 'timetable' && <TimetableManager />}
        {activeTab === 'users' && <UserManager />}
      </div>
    </div>
  );
}

function CourseManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTeachers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(u => u.role === 'teacher'));
    });
    return () => { unsubCourses(); unsubTeachers(); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !selectedTeacher) return;
    setLoading(true);
    try {
      const teacher = teachers.find(t => t.id === selectedTeacher);
      await addDoc(collection(db, 'courses'), {
        name: newName,
        teacherId: selectedTeacher,
        teacherName: teacher?.displayName || 'Unknown'
      });
      setNewName('');
      setSelectedTeacher('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'courses');
    }
  };

  return (
    <div className="p-8">
      <form onSubmit={handleAdd} className="flex flex-wrap gap-4 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Course Name</label>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Teacher</label>
          <select
            value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Course
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {courses.map(course => (
          <div key={course.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-gray-100 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{course.name}</p>
                <p className="text-sm text-gray-500">Teacher: {course.teacherName}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(course.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassManager() {
  const [classes, setClasses] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [count, setCount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: newName,
        studentCount: parseInt(count) || 0
      });
      setNewName('');
      setCount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'classes');
    }
  };

  return (
    <div className="p-8">
      <form onSubmit={handleAdd} className="flex flex-wrap gap-4 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Class Name</label>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Grade 12A"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Student Count</label>
          <input
            type="number"
            value={count}
            onChange={e => setCount(e.target.value)}
            placeholder="e.g. 30"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-end">
          <button
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Class
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {classes.map(cls => (
          <div key={cls.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-gray-100 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{cls.name}</p>
                <p className="text-sm text-gray-500">{cls.studentCount} Students</p>
              </div>
            </div>
            <button onClick={() => handleDelete(cls.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimetableManager() {
  const [entries, setEntries] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    courseId: '',
    classId: '',
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    room: ''
  });

  useEffect(() => {
    const unsubEntries = onSnapshot(collection(db, 'timetable'), (snap) => {
      setEntries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubEntries(); unsubCourses(); unsubClasses(); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.classId || !form.room) return;
    setLoading(true);
    try {
      const course = courses.find(c => c.id === form.courseId);
      const cls = classes.find(c => c.id === form.classId);
      await addDoc(collection(db, 'timetable'), {
        ...form,
        courseName: course?.name || '',
        className: cls?.name || '',
        teacherId: course?.teacherId || ''
      });
      setForm({ ...form, room: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'timetable', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'timetable');
    }
  };

  return (
    <div className="p-8">
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Course</label>
          <select
            value={form.courseId}
            onChange={e => setForm({ ...form, courseId: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Class</label>
          <select
            value={form.classId}
            onChange={e => setForm({ ...form, classId: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Day</label>
          <select
            value={form.dayOfWeek}
            onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Time</label>
          <input
            type="time"
            value={form.startTime}
            onChange={e => setForm({ ...form, startTime: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">End Time</label>
          <input
            type="time"
            value={form.endTime}
            onChange={e => setForm({ ...form, endTime: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Room</label>
          <input
            type="text"
            value={form.room}
            onChange={e => setForm({ ...form, room: e.target.value })}
            placeholder="e.g. Room 302"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Timetable Entry
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-gray-100 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{entry.courseName} - {entry.className}</p>
                <p className="text-sm text-gray-500">{entry.dayOfWeek}, {entry.startTime} - {entry.endTime} ({entry.room})</p>
              </div>
            </div>
            <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserManager() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  return (
    <div className="p-8">
      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-gray-100 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{user.displayName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <select
              value={user.role}
              onChange={e => handleRoleChange(user.id, e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
