import React from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  ArrowRight
} from 'lucide-react';
import { User as UserType } from '../../types';

interface AdminUsersTabProps {
  users: UserType[];
  currentUser: UserType | null;
  isAdmin: boolean;
  onAddUser: () => void;
  onEditUser: (user: UserType) => void;
  onDeleteUser: (user: UserType) => void;
  onRoleChange: (user: UserType, role: 'ADMIN' | 'EDITOR' | 'USER') => Promise<void>;
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
  return (
    <div className="space-y-6">
      {/* Header & Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D8]">
        <div>
          <h2 className="font-heading font-black text-xl text-stone-900">إدارة الأعضاء والتحكم في الصلاحيات</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            تحديد أدوار الفريق: مدير عام (ADMIN)، محرر محتوى (EDITOR)، عضو مسجل (USER)
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={onAddUser}
            className="px-4 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة عضو جديد</span>
          </button>
        )}
      </div>

      {/* Member Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl">
          <span className="text-[11px] font-bold text-stone-500 block mb-1">إجمالي الأعضاء</span>
          <span className="font-heading font-black text-xl text-stone-900">{stats.total}</span>
        </div>
        <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl">
          <span className="text-[11px] font-bold text-amber-800 block mb-1">مدراء عموم</span>
          <span className="font-heading font-black text-xl text-amber-900">{stats.admins}</span>
        </div>
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
          <span className="text-[11px] font-bold text-emerald-800 block mb-1">محررو محتوى</span>
          <span className="font-heading font-black text-xl text-[#36533D]">{stats.editors}</span>
        </div>
        <div className="p-3.5 bg-stone-100 border border-stone-200 rounded-xl">
          <span className="text-[11px] font-bold text-stone-600 block mb-1">أعضاء وزوار</span>
          <span className="font-heading font-black text-xl text-stone-800">{stats.regular}</span>
        </div>
      </div>

      {/* Search and Role Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl">
        <div className="sm:col-span-8 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            className="w-full pr-9 pl-3 py-2 bg-white border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
        </div>

        <div className="sm:col-span-4">
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-[#E7E2D8] rounded-xl text-xs font-medium focus:outline-none"
          >
            <option value="ALL">جميع الرتب والصلاحيات</option>
            <option value="ADMIN">المدراء العموم (ADMIN) فقط</option>
            <option value="EDITOR">محررو المحتوى (EDITOR) فقط</option>
            <option value="USER">الأعضاء الزائرون (USER) فقط</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto border border-[#E7E2D8] rounded-2xl bg-white shadow-sm">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] text-stone-700 border-b border-[#E7E2D8]">
              <th className="p-4 font-black">العضو</th>
              <th className="p-4 font-black">البريد الإلكتروني</th>
              <th className="p-4 font-black">الرتبة والصلاحية</th>
              <th className="p-4 font-black">تاريخ التسجيل</th>
              <th className="p-4 font-black text-left">إجراءات التحكم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E2D8]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-stone-400 italic">
                  لم يتم العثور على أي أعضاء يطابقون خيارات البحث.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isCurrentUser = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                    {/* Avatar & Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : u.role === 'EDITOR'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'ع'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{u.name}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] px-2 py-0.5 bg-[#36533D] text-white rounded-full font-black">
                                أنت
                              </span>
                            )}
                          </div>
                          {u.bio && (
                            <p className="text-[10px] text-stone-400 truncate max-w-xs">{u.bio}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 font-mono text-stone-500">
                      {u.email}
                    </td>

                    {/* Role & Quick Role Switcher */}
                    <td className="p-4 whitespace-nowrap">
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            onChange={(e: any) => onRoleChange(u, e.target.value)}
                            className={`py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer focus:outline-none ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : u.role === 'EDITOR'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                : 'bg-stone-50 border-stone-300 text-stone-600'
                            }`}
                          >
                            <option value="ADMIN">مدير عام (ADMIN)</option>
                            <option value="EDITOR">محرر محتوى (EDITOR)</option>
                            <option value="USER">عضو زائر (USER)</option>
                          </select>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-amber-50 text-amber-900' :
                          u.role === 'EDITOR' ? 'bg-emerald-50 text-emerald-900' :
                          'bg-stone-50 text-stone-600'
                        }`}>
                          {u.role}
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-stone-400 whitespace-nowrap">
                      {u.created_at?.slice(0, 10)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-left whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditUser(u)}
                          className="p-2 text-[#36533D] hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                          title="تعديل بيانات العضو"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteUser(u)}
                          disabled={isCurrentUser}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            isCurrentUser
                              ? 'text-stone-300 cursor-not-allowed opacity-50'
                              : 'text-rose-500 hover:bg-rose-50'
                          }`}
                          title={isCurrentUser ? 'لا يمكن حذف حسابك الحالي' : 'حذف حساب العضو نهائياً'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="text-[11px] text-stone-400 flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span>إدارة الصلاحيات والأمان - لسه في نور</span>
        </div>
        <span>عرض {users.length} مستخدم من قاعدة البيانات</span>
      </div>
    </div>
  );
}
