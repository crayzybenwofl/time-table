import React from 'react';
import { useAuth } from '../App';
import { Calendar, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
          <Calendar className="text-white w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-10">Sign in to manage your time table and stay organized.</p>

        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-200 transition-all group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          <span>Sign in with Google</span>
        </button>

        <div className="mt-10 pt-8 border-t border-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Time Table Management System
          </p>
        </div>
      </motion.div>
    </div>
  );
}
