import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Role, Permission } from '../../types';
import { LoadingState } from '../Common';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Info, 
  CheckCircle2, 
  ShieldAlert,
  Edit,
  Plus,
  Trash2,
  Settings,
  ChevronDown,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminRolesTabProps {
  roles: Role[];
  permissions: Permission[];
  onReload: () => void;
}

export function AdminRolesTab({ roles, permissions, onReload }: AdminRolesTabProps) {
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  const getModuleLabel = (module: string) => {
    switch (module) {
      case 'users': return 'إدارة الأعضاء';
      case 'admins': return 'إدارة الصلاحيات';
      case 'content': return 'إدارة المحتوى';
      case 'settings': return 'إعدادات المنصة';
      case 'security': return 'الأمان والرقابة';
      case 'audit_logs': return 'سجل العمليات';
      default: return module;
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-2xl font-heading font-black text-stone-900 flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-[#36533D]" />
          الأدوار وصلاحيات الوصول (RBAC)
        </h2>
        <p className="text-sm text-stone-500 mt-1">تحديد ما يمكن لكل دور إداري القيام به داخل المنصة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roles List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-stone-800 text-sm">الأدوار الحالية</h3>
            <button className="px-3 py-1.5 bg-[#36533D] text-white text-[10px] font-black rounded-lg flex items-center gap-2 shadow-sm">
              <Plus className="w-3 h-3" />
              <span>إنشاء دور جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {roles.map((role) => (
              <div 
                key={role.id} 
                className={`bg-white border rounded-2xl transition-all overflow-hidden ${
                  expandedRole === role.id ? 'border-[#36533D] shadow-md' : 'border-stone-200 shadow-sm'
                }`}
              >
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                      role.name === 'Super Admin' ? 'bg-amber-50 text-amber-600' : 'bg-stone-50 text-stone-600'
                    }`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{role.name}</h4>
                      <p className="text-xs text-stone-500">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-black bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                      <Key className="w-3 h-3" />
                      <span>{role.permissions.length} صلاحية</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${expandedRole === role.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedRole === role.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-stone-100 bg-stone-50/50"
                    >
                      <div className="p-6">
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((permName) => {
                            const perm = permissions.find(p => p.name === permName);
                            return (
                              <div 
                                key={permName}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-xl shadow-xs group"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-[11px] font-bold text-stone-700">{perm?.description || permName}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-stone-200 flex justify-end gap-3">
                          <button className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            <span>حذف الدور</span>
                          </button>
                          <button className="px-4 py-2 bg-[#36533D] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md">
                            <Edit className="w-4 h-4" />
                            <span>تعديل الصلاحيات</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Dictionary */}
        <div className="space-y-4">
          <h3 className="font-bold text-stone-800 text-sm">قاموس الصلاحيات</h3>
          <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-xs text-stone-600 font-bold leading-relaxed">
                يتم توزيع هذه الصلاحيات على الأدوار المختلفة للتحكم في مستوى الوصول.
              </p>
            </div>

            <div className="space-y-6">
              {Array.from(new Set(permissions.map(p => p.module))).map(module => (
                <div key={module} className="space-y-2">
                  <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-3 h-3" />
                    {getModuleLabel(module)}
                  </h4>
                  <div className="space-y-1.5">
                    {permissions.filter(p => p.module === module).map(perm => (
                      <div key={perm.id} className="group cursor-help">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#36533D]/30 group-hover:bg-[#36533D] transition-colors" />
                          <span className="text-xs font-bold text-stone-800">{perm.description}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mr-3.5 font-mono">{perm.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
            <h4 className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              نصيحة أمنية
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              دائماً استخدم مبدأ **"أقل امتياز ممكن"** (Least Privilege). لا تمنح صلاحية الحذف أو تعديل الأدوار إلا للأشخاص الموثوقين تماماً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
