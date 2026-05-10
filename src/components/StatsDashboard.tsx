import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieIcon, BarChart3, TrendingUp, Users, Calendar, Briefcase } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell as RechartsCell
} from 'recharts';
import { Resident } from '../types';
import { calculateAge, getAgeCategory } from '../lib/utils';

interface StatsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
}

const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ isOpen, onClose, residents }) => {
  const stats = useMemo(() => {
    const ageGroupsCount: Record<string, number> = {};
    const pyramidGroups: Record<string, { male: number; female: number }> = {};
    const genderDist: Record<string, number> = { 'Laki-laki': 0, 'Perempuan': 0 };
    const occupationDist: Record<string, number> = {};
    const productiveDist = { 'Belum Produktif (0-14)': 0, 'Produktif (15-64)': 0, 'Tidak Produktif (>64)': 0 };
    let totalAge = 0;
    let minAge = Infinity;
    let maxAge = -Infinity;

    // Pre-initialize categories for cleaner pyramid
    ['0-5 Thn', '6-12 Thn', '13-18 Thn', '19-45 Thn', '46-65 Thn', '>65 Thn'].forEach(cat => {
      pyramidGroups[cat] = { male: 0, female: 0 };
    });

    residents.forEach(r => {
      const age = calculateAge(r.birthDate);
      const cat = getAgeCategory(age);
      ageGroupsCount[cat] = (ageGroupsCount[cat] || 0) + 1;
      
      if (!pyramidGroups[cat]) pyramidGroups[cat] = { male: 0, female: 0 };

      if (r.gender === 'Laki-laki') {
        genderDist['Laki-laki']++;
        pyramidGroups[cat].male++;
      } else {
        genderDist['Perempuan']++;
        pyramidGroups[cat].female++;
      }
      
      // Productive calculations
      if (age < 15) productiveDist['Belum Produktif (0-14)']++;
      else if (age <= 64) productiveDist['Produktif (15-64)']++;
      else productiveDist['Tidak Produktif (>64)']++;

      const occ = r.occupation || 'Tidak Ada Data';
      occupationDist[occ] = (occupationDist[occ] || 0) + 1;
      
      totalAge += age;
      if (age < minAge) minAge = age;
      if (age > maxAge) maxAge = age;
    });

    const ageData = Object.entries(ageGroupsCount).map(([name, value]) => ({ name, value })).sort((a,b) => {
        const getStart = (s: string) => parseInt(s.match(/\d+/)?.at(0) || '0');
        return getStart(a.name) - getStart(b.name);
    });

    const pyramidMax = Math.max(...Object.values(pyramidGroups).map(g => Math.max(g.male, g.female)), 1);

    const pyramidData = Object.entries(pyramidGroups).map(([name, counts]) => ({
      name,
      male: -counts.male,
      female: counts.female,
    })).sort((a,b) => {
        const getStart = (s: string) => parseInt(s.match(/\d+/)?.at(0) || '0');
        return getStart(a.name) - getStart(b.name);
    });

    const productiveData = Object.entries(productiveDist).map(([name, value]) => ({ name, value }));

    const genderData = [
      { name: 'Laki-laki', value: genderDist['Laki-laki'] },
      { name: 'Perempuan', value: genderDist['Perempuan'] }
    ];

    const occupationData = Object.entries(occupationDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Show top 8 for space

    return {
      ageData,
      pyramidData,
      pyramidMax,
      genderData,
      occupationData,
      productiveData,
      minAge: residents.length > 0 ? minAge : 0,
      maxAge: residents.length > 0 ? maxAge : 0,
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

          <motion.div 
            className="flex-1 overflow-y-auto p-8 custom-scrollbar"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <motion.div variants={itemVariants} className="group bg-slate-800/40 p-6 rounded-3xl border border-white/5 flex items-center gap-5 hover:bg-slate-800/60 transition-all duration-300">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Penduduk</p>
                  <p className="text-3xl font-black text-white">{stats.total}</p>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="group bg-slate-800/40 p-6 rounded-3xl border border-white/5 flex items-center gap-5 hover:bg-slate-800/60 transition-all duration-300">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rata-rata Usia</p>
                  <p className="text-3xl font-black text-white">{stats.avgAge} <span className="text-xs font-normal text-slate-500">Tahun</span></p>
                </div>
              </motion.div>
 
              <motion.div variants={itemVariants} className="group bg-slate-800/40 p-6 rounded-3xl border border-white/5 flex items-center gap-5 hover:bg-slate-800/60 transition-all duration-300">
                <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform duration-300">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kategori Terbanyak</p>
                  <p className="text-xl font-black text-white line-clamp-1">
                    {stats.ageData.length > 0 ? stats.ageData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : '-'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Age Analysis Title */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6 mt-10">
              <div className="w-10 h-1 bg-indigo-500 rounded-full" />
              <h3 className="text-xl font-black text-white">Analisis Demografi Usia</h3>
            </motion.div>
 
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
               <div className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Usia Terkecil</p>
                <p className="text-2xl font-black text-white">{stats.minAge} <span className="text-xs font-normal text-slate-500">Tahun</span></p>
              </div>
              <div className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Usia Tertua</p>
                <p className="text-2xl font-black text-white">{stats.maxAge} <span className="text-xs font-normal text-slate-500">Tahun</span></p>
              </div>
              <div className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 backdrop-blur-sm col-span-2">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Kelompok Usia Produktif (15-64)</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-emerald-400">
                    {((stats.productiveData.find(d => d.name.includes('Produktif (15-64)'))?.value || 0) / (stats.total || 1) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs font-medium text-slate-500 pb-1">dari total penduduk</p>
                </div>
              </div>
            </motion.div>
 
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Pie Chart: Productive Groups */}
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <PieIcon size={18} className="text-emerald-400" /> Rasio Ketergantungan
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.productiveData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.productiveData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#94a3b8', '#10b981', '#f43f5e'][index % 3]} />
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

              {/* Pyramid Chart: Age Groups */}
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-400" /> Piramida Penduduk
                  </h3>
                  <div className="hidden sm:flex gap-4 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-slate-400 font-black uppercase tracking-tighter">Laki-laki</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      <span className="text-slate-400 font-black uppercase tracking-tighter">Perempuan</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical" 
                      data={stats.pyramidData} 
                      stackOffset="sign"
                      margin={{ left: 0, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis 
                        type="number" 
                        domain={[-stats.pyramidMax, stats.pyramidMax]}
                        tickFormatter={(v: number) => Math.abs(v).toString()} 
                        stroke="#94a3b8" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        width={65}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                        formatter={(value, name) => [Math.abs(value as number), name === 'male' ? 'Laki-laki' : 'Perempuan']}
                      />
                      <Bar dataKey="male" stackId="stack" fill="#6366f1" radius={[4, 0, 0, 4]} />
                      <Bar dataKey="female" stackId="stack" fill="#ec4899" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
 
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6 mt-10">
              <div className="w-10 h-1 bg-indigo-500 rounded-full" />
              <h3 className="text-xl font-black text-white">Distribusi Lainnya</h3>
            </motion.div>
 
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
              {/* Pie Chart: Gender */}
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-colors" />
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
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
 
              {/* Bar Chart: Occupations */}
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 lg:col-span-1 overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-400" /> Pekerjaan Teratas
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={stats.occupationData.slice(0, 5)} margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#94a3b8" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {stats.occupationData.slice(0, 5).map((entry, index) => (
                          <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
