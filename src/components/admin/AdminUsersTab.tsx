import React from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Circle
} from 'lucide-react';
import { User as UserType } from '../../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AdminUsersTabProps {
  users: UserType[];
  currentUser: UserType | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onAddUser: () => void;
  onEditUser: (user: UserType) => void;
  onDeleteUser: (user: UserType) => void;
  onRoleChange: (user: UserType, role: any) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  stats: {
    total: number;
    admins: number;
    editors: number;
    regular: number;
  };
}

export function AdminUsersTab({
  users,
  currentUser,
  isAdmin,
  isSuperAdmin,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onRoleChange,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  stats
}: AdminUsersTabProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'ADMIN': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'EDITOR': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-stone-50 text-stone-700 border-stone-100';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'مدير عام أعلى';
      case 'ADMIN': return 'مدير عام';
      case 'EDITOR': return 'محرر محتوى';
      case 'USER': return 'عضو مسجل';
      default: return role;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black text-stone-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-[#36533D]" />
            إدارة الأعضاء والوصول
          </h2>
          <p className="text-sm text-stone-500 mt-1">التحكم في هويات الفريق، الرتب، وحالات الحسابات</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={onAddUser}
            className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة عضو جديد</span>
          </button>
        )}
      </div>

      {/* Member Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">إجمالي الأعضاء</span>
          </div>
          <span className="font-heading font-black text-2xl text-stone-900">{stats.total}</span>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">المدراء</span>
          </div>
          <span className="font-heading font-black text-2xl text-amber-700">{stats.admins}</span>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">المحررون</span>
          </div>
          <span className="font-heading font-black text-2xl text-[#36533D]">{stats.editors}</span>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">الأعضاء</span>
          </div>
          <span className="font-heading font-black text-2xl text-stone-600">{stats.regular}</span>
        </div>
      </div>

      {/* Search and Role Filter */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 focus:border-[#36533D] transition-all"
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 transition-all font-bold"
        >
          <option value="ALL">جميع الرتب</option>
          <option value="SUPER_ADMIN">مدير عام أعلى</option>
          <option value="ADMIN">مدير عام</option>
          <option value="EDITOR">محرر محتوى</option>
          <option value="USER">عضو مسجل</option>
        </select>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">العضو</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">الرتبة</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">آخر ظهور</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => {
                const isCurrentUser = u.id === currentUser?.id;
                const isTargetSuperAdmin = u.role === 'SUPER_ADMIN';
                
                return (
                  <tr key={u.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} 
                          alt={u.name}
                          className="w-10 h-10 rounded-xl border border-stone-100 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900">{u.name}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] px-2 py-0.5 bg-[#36533D] text-white rounded-full font-black">أنت</span>
                            )}
                          </div>
                          <span className="text-xs text-stone-400 font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-1.5 text-[11px] font-bold ${u.status === 'suspended' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        <Circle className={`w-2 h-2 fill-current ${u.status === 'suspended' ? 'animate-pulse' : ''}`} />
                        <span>{u.status === 'suspended' ? 'موقوف' : 'نشط'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {u.last_login ? format(new Date(u.last_login), 'p - d MMMM', { locale: ar }) : 'غير متوفر'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditUser(u)}
                          disabled={isTargetSuperAdmin && !isSuperAdmin}
                          className={`p-2 rounded-xl transition-all ${
                            isTargetSuperAdmin && !isSuperAdmin 
                            ? 'text-stone-300 cursor-not-allowed' 
                            : 'text-[#36533D] hover:bg-[#36533D]/10'
                          }`}
                          title="تعديل البيانات"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteUser(u)}
                          disabled={isCurrentUser || (isTargetSuperAdmin && !isSuperAdmin)}
                          className={`p-2 rounded-xl transition-all ${
                            isCurrentUser || (isTargetSuperAdmin && !isSuperAdmin)
                              ? 'text-stone-200 cursor-not-allowed'
                              : 'text-rose-500 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Advisory */}
      <div className="bg-[#1C1917] rounded-3xl p-6 text-white flex items-center gap-6 overflow-hidden relative">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">تحذير أمني</span>
          </div>
          <p className="text-sm text-stone-300 leading-relaxed font-medium">
            أي تغيير في صلاحيات المستخدمين سيتم تسجيله في **سجل العمليات** بشكل دائم. يرجى مراجعة الصلاحيات بعناية قبل التأكيد.
          </p>
        </div>
        <ShieldCheck className="w-24 h-24 text-white/5 absolute -left-4 -bottom-4" />
      </div>
    </div>
  );
}
