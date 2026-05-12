import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PieChart as PieIcon, BarChart3, TrendingUp, Users, User, Calendar, Briefcase, Database, Mars, Venus, Fingerprint, GraduationCap, Baby, Skull, UserPlus, UserMinus, History, Home } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell as RechartsCell,
  LineChart, Line
} from 'recharts';
import { Resident, Mutation, MutationType } from '../types';
import { calculateAge, getAgeCategory } from '../lib/utils';

interface StatsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  mutations: Mutation[];
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

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ isOpen, onClose, residents, mutations }) => {
  const stats = useMemo(() => {
    const ageGroupsCount: Record<string, number> = {};
    const pyramidGroups: Record<string, { male: number; female: number }> = {};
    const genderDist: Record<string, number> = { 'Laki-laki': 0, 'Perempuan': 0 };
    const occupationDist: Record<string, number> = {};
    const familyPositionDist: Record<string, number> = {};
    const educationDist: Record<string, number> = {};
    const residenceDist: Record<string, number> = {};
    const religionDist: Record<string, number> = {};
    const maritalDist: Record<string, number> = {};
    const bloodDist: Record<string, number> = {};
    const productiveDist = { 'Belum Produktif (0-14)': 0, 'Produktif (15-64)': 0, 'Tidak Produktif (>64)': 0 };
    const categoryDist: Record<string, { total: number; male: number; female: number }> = {
      'Balita': { total: 0, male: 0, female: 0 },
      'Anak-anak': { total: 0, male: 0, female: 0 },
      'Remaja': { total: 0, male: 0, female: 0 },
      'Dewasa': { total: 0, male: 0, female: 0 },
      'Lansia': { total: 0, male: 0, female: 0 }
    };
    let totalAge = 0;
    let minAge = Infinity;
    let maxAge = -Infinity;

    // Mutation Stats
    const mutationCounts = {
      [MutationType.BIRTH]: 0,
      [MutationType.DEATH]: 0,
      [MutationType.COMING]: 0,
      [MutationType.MOVING]: 0
    };

    mutations.forEach(m => {
      if (mutationCounts[m.type] !== undefined) {
        mutationCounts[m.type]++;
      }
    });

    // Mutation Trend (Last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        month: months[d.getMonth()],
        year: d.getFullYear(),
        timestamp: d.getTime(),
        births: 0,
        deaths: 0,
        migration: 0
      };
    }).reverse();

    mutations.forEach(m => {
      const mutDate = new Date(m.date);
      const mIdx = last6Months.findIndex(l => l.month === months[mutDate.getMonth()] && l.year === mutDate.getFullYear());
      if (mIdx !== -1) {
        if (m.type === MutationType.BIRTH) last6Months[mIdx].births++;
        if (m.type === MutationType.DEATH) last6Months[mIdx].deaths++;
        if (m.type === MutationType.COMING) last6Months[mIdx].migration++;
        if (m.type === MutationType.MOVING) last6Months[mIdx].migration--;
      }
    });

    // Pre-initialize standard 5-year categories for a proper pyramid shape
    const PYRAMID_CATEGORIES = [
      '70+', '65-69', '60-64', '55-59', '50-54', '45-49', '40-44', '35-39', 
      '30-34', '25-29', '20-24', '15-19', '10-14', '5-9', '0-4'
    ];
    
    PYRAMID_CATEGORIES.forEach(cat => {
      pyramidGroups[cat] = { male: 0, female: 0 };
    });

    residents.forEach(r => {
      const age = calculateAge(r.birthDate);
      
      // Categorical groups for the categories chart
      let catName = '';
      if (age <= 5) catName = 'Balita';
      else if (age <= 12) catName = 'Anak-anak';
      else if (age <= 17) catName = 'Remaja';
      else if (age <= 59) catName = 'Dewasa';
      else catName = 'Lansia';
      
      categoryDist[catName].total++;
      if (r.gender === 'Laki-laki') {
        categoryDist[catName].male++;
      } else {
        categoryDist[catName].female++;
      }
      
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

      const edu = r.education || 'Tidak Sekolah';
      educationDist[edu] = (educationDist[edu] || 0) + 1;

      const status = r.residenceStatus || 'Lainnya';
      if (r.familyPosition === 'Kepala Keluarga') {
        residenceDist[status] = (residenceDist[status] || 0) + 1;
      }

      const religion = r.religion || 'Lainnya';
      religionDist[religion] = (religionDist[religion] || 0) + 1;

      const marital = r.maritalStatus || 'Lainnya';
      maritalDist[marital] = (maritalDist[marital] || 0) + 1;

      const blood = r.bloodType || 'Tidak Tahu';
      bloodDist[blood] = (bloodDist[blood] || 0) + 1;

      const pos = r.familyPosition || 'Lainnya';
      familyPositionDist[pos] = (familyPositionDist[pos] || 0) + 1;
      
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

    const categoryData = Object.entries(categoryDist).map(([name, data]) => ({ 
      name, 
      value: data.total,
      male: data.male,
      female: data.female
    }));

    const genderData = [
      { name: 'Laki-laki', value: genderDist['Laki-laki'] },
      { name: 'Perempuan', value: genderDist['Perempuan'] }
    ];

    const occupationData = Object.entries(occupationDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Show top 8 for space

    const educationData = Object.entries(educationDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const order = ['Tidak Sekolah', 'SD', 'SMP', 'SMA/SMK', 'Diploma', 'S1', 'S2', 'S3'];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });

    const residenceData = Object.entries(residenceDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const religionData = Object.entries(religionDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const maritalData = Object.entries(maritalDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const bloodData = Object.entries(bloodDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      ageData,
      pyramidData,
      pyramidMax,
      genderData,
      occupationData,
      educationData,
      residenceData,
      religionData,
      maritalData,
      bloodData,
      productiveData,
      categoryData,
      headOfFamilyCount: familyPositionDist['Kepala Keluarga'] || 0,
      minAge: residents.length > 0 ? minAge : 0,
      maxAge: residents.length > 0 ? maxAge : 0,
      avgAge: residents.length > 0 ? (totalAge / residents.length).toFixed(1) : 0,
      total: residents.length,
      mutationCounts,
      mutationTrend: last6Months
    };
  }, [residents, mutations]);

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
            {/* Demographic Overview */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="bg-slate-950/40 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Database size={120} className="text-indigo-500" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                  Ikhtisar Demografi
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-3">Statistik Utama</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-sm text-slate-400">Total Penduduk Terdaftar</span>
                          <span className="text-xl font-black text-white">{stats.total} <span className="text-[10px] font-normal text-slate-500">Jiwa</span></span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-sm text-slate-400">Total Kepala Keluarga</span>
                          <span className="text-xl font-black text-white">{stats.headOfFamilyCount} <span className="text-[10px] font-normal text-slate-500">KK</span></span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-sm text-slate-400">Rasio Jenis Kelamin (L:P)</span>
                          <span className="text-xl font-black text-white">{stats.genderData[0].value}:{stats.genderData[1].value}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] mb-3">Distribusi Gender</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-500/10">
                          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Laki-laki</p>
                          <p className="text-2xl font-black text-white">{stats.genderData[0].value}</p>
                          <p className="text-[10px] text-slate-500">{Math.round((stats.genderData[0].value / (stats.total || 1)) * 100)}% dari total</p>
                        </div>
                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-pink-500/10">
                          <p className="text-[9px] font-bold text-pink-400 uppercase tracking-widest mb-1">Perempuan</p>
                          <p className="text-2xl font-black text-white">{stats.genderData[1].value}</p>
                          <p className="text-[10px] text-slate-500">{Math.round((stats.genderData[1].value / (stats.total || 1)) * 100)}% dari total</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-[0.2em] mb-3">Kategori Usia (Regulasi ID)</h4>
                    <div className="space-y-2">
                      {stats.categoryData.map((cat, idx) => (
                        <div key={idx} className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: ['#60a5fa', '#fbbf24', '#f472b6', '#818cf8', '#34d399'][idx % 5] }} />
                            <div>
                              <p className="text-sm font-bold text-slate-200">{cat.name}</p>
                              <p className="text-[9px] text-slate-500 uppercase tracking-tighter">
                                {cat.name === 'Balita' && '0 - 5 Tahun'}
                                {cat.name === 'Anak-anak' && '6 - 12 Tahun'}
                                {cat.name === 'Remaja' && '13 - 17 Tahun'}
                                {cat.name === 'Dewasa' && '18 - 59 Tahun'}
                                {cat.name === 'Lansia' && '60+ Tahun'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-white leading-none">{cat.value}</p>
                            <div className="flex items-center gap-2 justify-end mt-1">
                              <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1 rounded flex items-center gap-0.5">
                                <Mars size={8} /> {cat.male}
                              </span>
                              <span className="text-[8px] font-bold text-pink-400 bg-pink-500/10 px-1 rounded flex items-center gap-0.5">
                                <Venus size={8} /> {cat.female}
                              </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mt-1">{Math.round((cat.value / (stats.total || 1)) * 100)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                      <p className="text-[10px] text-indigo-300 leading-relaxed italic">
                        * Klasifikasi merujuk pada standar kategorisasi penduduk Indonesia (BPS & Kemenkes).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Vital Statistics (Population Dynamics) */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="bg-slate-950/40 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <History size={120} className="text-emerald-500" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                  Dinamika Penduduk (Vital Statistics)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 mb-8">
                  <div className="bg-slate-900/60 p-5 rounded-3xl border border-emerald-500/10 hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                        <Baby size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kelahiran</span>
                    </div>
                    <p className="text-3xl font-black text-white tracking-tighter">{stats.mutationCounts[MutationType.BIRTH]}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Total bayi lahir terdaftar</p>
                  </div>

                  <div className="bg-slate-900/60 p-5 rounded-3xl border border-rose-500/10 hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                        <Skull size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kematian</span>
                    </div>
                    <p className="text-3xl font-black text-white tracking-tighter">{stats.mutationCounts[MutationType.DEATH]}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Total laporan kematian</p>
                  </div>

                  <div className="bg-slate-900/60 p-5 rounded-3xl border border-indigo-500/10 hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <UserPlus size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pindah Datang</span>
                    </div>
                    <p className="text-3xl font-black text-white tracking-tighter">{stats.mutationCounts[MutationType.COMING]}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Penduduk baru masuk</p>
                  </div>

                  <div className="bg-slate-900/60 p-5 rounded-3xl border border-amber-500/10 hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                        <UserMinus size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pindah Keluar</span>
                    </div>
                    <p className="text-3xl font-black text-white tracking-tighter">{stats.mutationCounts[MutationType.MOVING]}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Penduduk pindah alamat</p>
                  </div>
                </div>

                <div className="h-[200px] w-full bg-slate-900/40 rounded-3xl p-4 border border-white/5">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 px-2">Tren Perubahan (6 Bulan Terakhir)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.mutationTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                      />
                      <Line type="monotone" dataKey="births" name="Lahir" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                      <Line type="monotone" dataKey="deaths" name="Mati" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e' }} />
                      <Line type="monotone" dataKey="migration" name="Net Migrasi" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Gender Distribution Pie Chart */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <PieIcon size={18} className="text-indigo-400" /> Distribusi Gender
                </h3>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                  <div className="h-[220px] w-[220px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#6366f1" />
                          <Cell fill="#ec4899" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '1rem',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Total</p>
                      <p className="text-2xl font-black text-white leading-none mt-1">{stats.total}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    {stats.genderData.map((entry, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-2xl border border-white/5 min-w-[160px] flex items-center gap-4 group/item hover:bg-white/10 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-pink-500/10 text-pink-400'} border border-current/10`}>
                          {index === 0 ? <Mars size={20} /> : <Venus size={20} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{entry.name}</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-xl font-black text-white leading-none">{entry.value}</p>
                            <p className="text-xs font-bold text-slate-400">{Math.round((entry.value / (stats.total || 1)) * 100)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

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
                          domain={[0, Math.ceil(stats.pyramidMax * 1.1)]} 
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
                        />
                        <Bar 
                          dataKey="male" 
                          fill="#6366f1" 
                          radius={[4, 0, 0, 4]} 
                          barSize={16}
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
                          domain={[0, Math.ceil(stats.pyramidMax * 1.1)]} 
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
                        />
                        <Bar 
                          dataKey="female" 
                          fill="#ec4899" 
                          radius={[0, 4, 4, 0]} 
                          barSize={16}
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

            {/* Residence Status Section */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Home size={18} className="text-blue-400" /> Status Tempat Tinggal
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.residenceData.map((data, idx) => (
                    <div key={idx} className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 hover:bg-slate-900/60 transition-colors group/res">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                          <Home size={16} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                          {Math.round((data.value / (stats.headOfFamilyCount || 1)) * 100)}%
                        </span>
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{data.name}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-white leading-none">{data.value}</p>
                        <p className="text-xs font-bold text-slate-500">KK</p>
                      </div>
                      
                      <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.value / (stats.headOfFamilyCount || 1)) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Summary Card */}
                  <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 p-6 rounded-3xl border border-blue-500/20 flex flex-col justify-center">
                    <p className="text-sm font-bold text-blue-300 mb-2 italic">Analisis Kepemilikan</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Mayoritas keluarga memiliki status tempat tinggal <span className="text-white font-bold">{stats.residenceData[0]?.name}</span> dengan persentase <span className="text-white font-bold">{Math.round((stats.residenceData[0]?.value / (stats.headOfFamilyCount || 1)) * 100)}%</span>.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
 
            {/* Donut Chart: Dependency Ratio */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <PieIcon size={18} className="text-emerald-400" /> Rasio Ketergantungan (Dependency Ratio)
                </h3>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-12">
                  <div className="h-[220px] w-[220px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.productiveData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#94a3b8" /> {/* Belum Produktif */}
                          <Cell fill="#10b981" /> {/* Produktif */}
                          <Cell fill="#f43f5e" /> {/* Tidak Produktif */}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '1rem',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Total</p>
                      <p className="text-2xl font-black text-white leading-none mt-1">{stats.total}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    {stats.productiveData.map((entry, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-2xl border border-white/5 min-w-[200px] flex items-center gap-4 group/item hover:bg-white/10 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === 0 ? 'bg-slate-500/10 text-slate-400' : index === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} border border-current/10 font-black text-[10px]`}>
                          {index === 0 ? 'BP' : index === 1 ? 'P' : 'TP'}
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                            {index === 0 ? 'Belum Produktif' : index === 1 ? 'Produktif' : 'Tidak Produktif'}
                          </p>
                          <div className="flex items-baseline justify-between">
                            <p className="text-lg font-black text-white leading-none">{entry.value}</p>
                            <p className="text-[10px] font-bold text-slate-400">{Math.round((entry.value / (stats.total || 1)) * 100)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                       <p className="text-[9px] text-indigo-300 leading-tight">
                         Angka ketergantungan mengukur beban ekonomi penduduk produktif terhadap non-produktif.
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
 
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6 mt-10">
              <div className="w-10 h-1 bg-indigo-500 rounded-full" />
              <h3 className="text-xl font-black text-white">Distribusi Lainnya</h3>
            </motion.div>
 
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
              {/* Education Distribution Simplified List */}
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group flex flex-col">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <GraduationCap size={18} className="text-emerald-400" /> Distribusi Tingkat Pendidikan
                </h3>
                
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                  <div className="xl:col-span-3 space-y-4">
                    {stats.educationData.map((entry, index) => (
                      <div key={index} className="group/edu">
                        <div className="flex justify-between items-end mb-1.5">
                          <p className="text-xs font-bold text-slate-300 group-hover/edu:text-white transition-colors">{entry.name}</p>
                          <p className="text-xs font-black text-white">{entry.value} <span className="text-slate-500 font-normal">Jiwa ({Math.round((entry.value / (stats.total || 1)) * 100)}%)</span></p>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(entry.value / (Math.max(...stats.educationData.map(e => e.value)) || 1)) * 100}%` }}
                            transition={{ duration: 1.2, delay: index * 0.1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="xl:col-span-2 flex flex-col justify-center gap-6">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl relative overflow-hidden">
                      <div className="absolute -top-6 -right-6 text-emerald-500/10">
                         <GraduationCap size={80} strokeWidth={1} />
                      </div>
                      <p className="text-xs font-black uppercase text-emerald-400 tracking-widest mb-3">Analisis Pendidikan</p>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Tingkat pendidikan dominan di wilayah ini adalah <span className="text-white font-bold">{stats.educationData[0]?.name || '-'}</span>.
                        Data menunjukkan keberagaman profil kompetensi akademik penduduk yang menjadi potensi pengembangan sumber daya manusia desa.
                      </p>
                      <div className="mt-4 pt-4 border-t border-emerald-500/10 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-tighter">Update Berdasarkan Data Terbaru</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simplified Top Occupations List */}
              <div className="relative bg-slate-800/30 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group flex flex-col">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Briefcase size={18} className="text-cyan-400" /> Pekerjaan Teratas
                </h3>
                
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                  <div className="xl:col-span-3 space-y-4">
                    {stats.occupationData.slice(0, 5).map((entry, index) => (
                      <div key={index} className="group/occ">
                        <div className="flex justify-between items-end mb-1.5">
                          <p className="text-xs font-bold text-slate-300 group-hover/occ:text-white transition-colors">{entry.name}</p>
                          <p className="text-xs font-black text-white">{entry.value} <span className="text-slate-500 font-normal">Jiwa ({Math.round((entry.value / (stats.total || 1)) * 100)}%)</span></p>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(entry.value / (Math.max(...stats.occupationData.map(e => e.value)) || 1)) * 100}%` }}
                            transition={{ duration: 1.2, delay: index * 0.1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="xl:col-span-2 flex flex-col justify-center gap-6">
                    <div className="bg-cyan-500/5 border border-cyan-500/10 p-6 rounded-3xl relative overflow-hidden">
                      <div className="absolute -top-6 -right-6 text-cyan-500/10">
                         <Briefcase size={80} strokeWidth={1} />
                      </div>
                      <p className="text-xs font-black uppercase text-cyan-400 tracking-widest mb-3">Analisis Ekonomi</p>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Sektor pekerjaan terbesar didominasi oleh <span className="text-white font-bold">{stats.occupationData[0]?.name || '-'}</span>.
                        Hal ini mencerminkan basis ekonomi utama warga yang sangat dipengaruhi oleh karakteristik geografis dan potensi lokal wilayah tersebut.
                      </p>
                      <div className="mt-4 pt-4 border-t border-cyan-500/10 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-tighter">Struktur Mata Pencaharian</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social & Health Stats Section */}
              <div className="lg:col-span-2 mt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Religion Distribution */}
                  <div className="bg-slate-800/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full" />
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-4 flex items-center gap-2">
                       Agama
                    </h4>
                    <div className="space-y-3">
                      {stats.religionData.map((data, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">{data.name}</span>
                            <span className="text-white">{data.value} <span className="text-slate-500 font-normal">({Math.round((data.value / (stats.total || 1)) * 100)}%)</span></span>
                          </div>
                          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${(data.value / (stats.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marital Status Distribution */}
                  <div className="bg-slate-800/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-pink-500/5 blur-3xl rounded-full" />
                    <h4 className="text-xs font-black uppercase text-pink-400 tracking-widest mb-4 flex items-center gap-2">
                       Status Perkawinan
                    </h4>
                    <div className="space-y-3">
                      {stats.maritalData.map((data, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">{data.name}</span>
                            <span className="text-white">{data.value} <span className="text-slate-500 font-normal">({Math.round((data.value / (stats.total || 1)) * 100)}%)</span></span>
                          </div>
                          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-pink-500 rounded-full" 
                              style={{ width: `${(data.value / (stats.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blood Type Distribution */}
                  <div className="bg-slate-800/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-500/5 blur-3xl rounded-full" />
                    <h4 className="text-xs font-black uppercase text-rose-400 tracking-widest mb-4 flex items-center gap-2">
                       Golongan Darah
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {stats.bloodData.map((data, idx) => (
                        <div key={idx} className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                           <div className="flex justify-between items-baseline mb-1">
                             <span className="text-sm font-black text-white">{data.name}</span>
                             <span className="text-[9px] font-bold text-rose-400">{Math.round((data.value / (stats.total || 1)) * 100)}%</span>
                           </div>
                           <p className="text-[10px] text-slate-500">{data.value} Jiwa</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
