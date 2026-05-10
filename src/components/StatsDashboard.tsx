import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieIcon, BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Resident } from '../types';
import { calculateAge, getAgeCategory } from '../lib/utils';

interface StatsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ isOpen, onClose, residents }) => {
  const stats = useMemo(() => {
    const ageGroups: Record<string, number> = {};
    const genderDist: Record<string, number> = { 'Laki-laki': 0, 'Perempuan': 0 };
    let totalAge = 0;

    residents.forEach(r => {
      const age = calculateAge(r.birthDate);
      const cat = getAgeCategory(age);
      ageGroups[cat] = (ageGroups[cat] || 0) + 1;
      
      if (r.gender === 'Laki-laki') genderDist['Laki-laki']++;
      else genderDist['Perempuan']++;
      
      totalAge += age;
    });

    const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value })).sort((a,b) => {
        // Sort by age range start
        const getStart = (s: string) => parseInt(s.match(/\d+/)?.at(0) || '0');
        return getStart(a.name) - getStart(b.name);
    });

    const genderData = [
      { name: 'Laki-laki', value: genderDist['Laki-laki'] },
      { name: 'Perempuan', value: genderDist['Perempuan'] }
    ];

    return {
      ageData,
      genderData,
      avgAge: residents.length > 0 ? (totalAge / residents.length).toFixed(1) : 0,
      total: residents.length
    };
  }, [residents]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white leading-none">Statistik Penduduk</h2>
                <p className="text-sm text-slate-400 mt-1">Analisis demografi berdasarkan usia dan kategori</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Penduduk</p>
                  <p className="text-3xl font-black text-white">{stats.total}</p>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rata-rata Usia</p>
                  <p className="text-3xl font-black text-white">{stats.avgAge} <span className="text-xs font-normal text-slate-500">Tahun</span></p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kategori Terbanyak</p>
                  <p className="text-xl font-black text-white line-clamp-1">
                    {stats.ageData.length > 0 ? stats.ageData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart: Gender */}
              <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <PieIcon size={18} className="text-indigo-400" /> Distribusi Gender
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#ec4899'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Age Groups */}
              <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-400" /> Kategori Usia
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {stats.ageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
