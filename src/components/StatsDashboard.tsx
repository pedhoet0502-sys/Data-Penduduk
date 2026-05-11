import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieIcon, BarChart3, TrendingUp, Users, User, Calendar, Briefcase, Database, Mars, Venus } from 'lucide-react';
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
    const categoryDist: Record<string, number> = {
      'Balita': 0,
      'Anak-anak': 0,
      'Remaja': 0,
      'Dewasa': 0,
      'Lansia': 0
    };
    let totalAge = 0;
    let minAge = Infinity;
    let maxAge = -Infinity;

    // Pre-initialize standard 5-year categories for a proper pyramid shape
    const PYRAMID_CATEGORIES = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', 
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70+'
    ];
    
    PYRAMID_CATEGORIES.forEach(cat => {
      pyramidGroups[cat] = { male: 0, female: 0 };
    });

    residents.forEach(r => {
      const age = calculateAge(r.birthDate);
      
      // Categorical groups for the categories chart
      if (age <= 5) categoryDist['Balita']++;
      else if (age <= 12) categoryDist['Anak-anak']++;
      else if (age <= 17) categoryDist['Remaja']++;
      else if (age <= 59) categoryDist['Dewasa']++;
      else categoryDist['Lansia']++;
      
      // Determine pyramid category
      let pyramidCat = '';
      if (age >= 70) pyramidCat = '70+';
      else {
        const floor = Math.floor(age / 5) * 5;
        pyramidCat = `${floor}-${floor + 4}`;
      }
      
      if (!pyramidGroups[pyramidCat]) pyramidGroups[pyramidCat] = { male: 0, female: 0 };

      if (r.gender === 'Laki-laki') {
        genderDist['Laki-laki']++;
        pyramidGroups[pyramidCat].male++;
      } else {
        genderDist['Perempuan']++;
        pyramidGroups[pyramidCat].female++;
      }
      
      // Age group for general stats (legacy mapping for simplicity)
      const cat = getAgeCategory(age);
      ageGroupsCount[cat] = (ageGroupsCount[cat] || 0) + 1;
      
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

    const pyramidData = PYRAMID_CATEGORIES.map(name => ({
      name,
      male: pyramidGroups[name]?.male || 0,
      female: pyramidGroups[name]?.female || 0,
    }));

    const productiveData = Object.entries(productiveDist).map(([name, value]) => ({ name, value }));

    const categoryData = Object.entries(categoryDist).map(([name, value]) => ({ name, value }));

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
      categoryData,
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
            <div className="grid grid-cols-2 gap-4 mb-10">
              {/* Row 1: Total & Avg Age */}
              <motion.div variants={itemVariants} className="group bg-slate-800/40 p-5 rounded-3xl border border-white/5 flex items-center gap-5 hover:bg-slate-800/60 transition-all duration-300">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform duration-300">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-tight mb-1">Total Penduduk</p>
                  <p className="text-3xl font-black text-white tracking-tighter">{stats.total} <span className="text-xs font-normal text-slate-500 ml-1">Jiwa</span></p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="group bg-slate-800/40 p-5 rounded-3xl border border-white/5 flex items-center gap-5 hover:bg-slate-800/60 transition-all duration-300">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-tight mb-1">Rata-rata Usia</p>
                  <p className="text-3xl font-black text-white tracking-tighter">{stats.avgAge} <span className="text-xs font-normal text-slate-500 ml-1">Thn</span></p>
                </div>
              </motion.div>
              
              {/* Row 2: Male & Female */}
              <motion.div variants={itemVariants} className="group bg-slate-900/40 p-5 rounded-3xl border border-indigo-500/10 flex items-center gap-5 hover:bg-slate-900/60 transition-all duration-300">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform duration-300">
                  <Mars size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-tight mb-1">Laki-laki</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-black text-white tracking-tighter">{stats.genderData[0].value}</p>
                    <span className="text-xs font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{Math.round((stats.genderData[0].value / (stats.total || 1)) * 100)}%</span>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="group bg-slate-900/40 p-5 rounded-3xl border border-pink-500/10 flex items-center gap-5 hover:bg-slate-900/60 transition-all duration-300">
                <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 border border-pink-500/10 group-hover:scale-110 transition-transform duration-300">
                  <Venus size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest leading-tight mb-1">Perempuan</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-black text-white tracking-tighter">{stats.genderData[1].value}</p>
                    <span className="text-xs font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{Math.round((stats.genderData[1].value / (stats.total || 1)) * 100)}%</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Age Category Bar Chart */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 size={18} className="text-amber-400" /> Distribusi Kategori Usia
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categoryData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: 'rgba(255,255,255,0.1)', 
                          borderRadius: '1rem',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[10, 10, 0, 0]} 
                        animationDuration={1500}
                      >
                        {stats.categoryData.map((entry, index) => (
                          <RechartsCell 
                            key={`cell-${index}`} 
                            fill={[
                              '#60a5fa', // Blue (Balita)
                              '#fbbf24', // Amber (Anak)
                              '#f472b6', // Pink (Remaja)
                              '#818cf8', // Indigo (Dewasa)
                              '#34d399'  // Emerald (Lansia)
                            ][index % 5]} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

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
            </motion.div>

            {/* Pyramid Chart: Age Groups */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database size={18} className="text-indigo-400" /> Piramida Penduduk
                  </h3>
                  <div className="flex gap-6 text-[10px] font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      <span className="text-slate-400 uppercase tracking-widest text-[9px]">Laki-laki</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                      <span className="text-slate-400 uppercase tracking-widest text-[9px]">Perempuan</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-stretch justify-center h-[550px] w-full gap-1 sm:gap-2 lg:gap-4 mt-6">
                  {/* Left: Male Chart */}
                  <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical" 
                        data={stats.pyramidData} 
                        margin={{ left: 10, right: 0, top: 0, bottom: 0 }}
                      >
                        <XAxis 
                          type="number" 
                          domain={[0, stats.pyramidMax]} 
                          reversed 
                          hide
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          hide 
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '1rem',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number) => [Math.abs(value), 'Laki-laki']}
                          labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        />
                        <Bar 
                          dataKey="male" 
                          fill="#6366f1" 
                          radius={[4, 0, 0, 4]} 
                          barSize={24}
                          animationDuration={1500}
                        >
                          {stats.pyramidData.map((entry, index) => (
                            <RechartsCell key={`cell-m-${index}`} fill="#6366f1" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Center: Age Labels */}
                  <div className="flex flex-col justify-between py-1 w-14 md:w-20 bg-slate-900/20 rounded-xl border border-white/5 shadow-inner">
                    {stats.pyramidData.map((cat, idx) => (
                      <div key={idx} className="flex-1 flex items-center justify-center">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-tighter">
                          {cat.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Right: Female Chart */}
                  <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical" 
                        data={stats.pyramidData} 
                        margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
                      >
                        <XAxis 
                          type="number" 
                          domain={[0, stats.pyramidMax]} 
                          hide
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          hide 
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '1rem',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number) => [value, 'Perempuan']}
                          labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        />
                        <Bar 
                          dataKey="female" 
                          fill="#ec4899" 
                          radius={[0, 4, 4, 0]} 
                          barSize={24}
                          animationDuration={1500}
                        >
                          {stats.pyramidData.map((entry, index) => (
                            <RechartsCell key={`cell-f-${index}`} fill="#ec4899" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Scale Indicators */}
                <div className="flex justify-between mt-6 px-2 text-[8px] font-bold uppercase tracking-widest text-slate-600">
                  <span>Maks: {stats.pyramidMax} Orang</span>
                  <span className="text-slate-500">Rentang Usia (Tahun)</span>
                  <span>Maks: {stats.pyramidMax} Orang</span>
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
                
                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div className="bg-slate-950/40 border border-white/10 p-5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/stats">
                    <div className="flex flex-col gap-4 relative z-10">
                      {/* Laki-laki Large Row */}
                      <div className="flex items-center justify-between bg-slate-900/60 p-5 rounded-3xl border border-white/5 group/row hover:bg-slate-900/80 transition-colors">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-xl group-hover/row:scale-110 transition-transform">
                            <Mars size={32} className="text-indigo-400" strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em] leading-none">Laki-laki</p>
                              <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                {Math.round((stats.genderData.find(g => g.name === 'Laki-laki')?.value || 0) / (stats.total || 1) * 100)}%
                              </span>
                            </div>
                            <p className="text-5xl font-black text-white leading-none tracking-tighter">
                              {stats.genderData.find(g => g.name === 'Laki-laki')?.value || 0}
                              <span className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-widest">Jiwa</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Perempuan Large Row */}
                      <div className="flex items-center justify-between bg-slate-900/60 p-5 rounded-3xl border border-white/5 group/row hover:bg-slate-900/80 transition-colors">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-500/20 shadow-xl group-hover/row:scale-110 transition-transform">
                            <Venus size={32} className="text-pink-400" strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-xs font-black uppercase text-pink-400 tracking-[0.2em] leading-none">Perempuan</p>
                              <span className="text-[10px] font-black text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                                {Math.round((stats.genderData.find(g => g.name === 'Perempuan')?.value || 0) / (stats.total || 1) * 100)}%
                              </span>
                            </div>
                            <p className="text-5xl font-black text-white leading-none tracking-tighter">
                              {stats.genderData.find(g => g.name === 'Perempuan')?.value || 0}
                              <span className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-widest">Jiwa</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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
