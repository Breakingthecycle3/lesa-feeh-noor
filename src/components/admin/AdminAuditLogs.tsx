import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AuditLog } from '../../types';
import { LoadingState } from '../Common';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowRight,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { motion, AnimatePresence } from 'motion/react';

interface AdminAuditLogsProps {
  logs: AuditLog[];
  loading: boolean;
  onReload: () => void;
}

export function AdminAuditLogs({ logs, loading, onReload }: AdminAuditLogsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'create': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'update': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'delete': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-stone-50 text-stone-700 border-stone-100';
    }
  };

  if (loading) return <LoadingState message="جارٍ جلب سجل العمليات..." />;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black text-stone-900 flex items-center gap-3">
            <History className="w-7 h-7 text-[#36533D]" />
            سجل العمليات والرقابة (Audit Logs)
          </h2>
          <p className="text-sm text-stone-500 mt-1">تتبع كافة العمليات الحساسة التي يقوم بها المديرون والمحررون</p>
        </div>
        <button 
          onClick={onReload}
          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all"
        >
          تحديث السجل
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="البحث بالاسم، العملية، أو نوع المصدر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 focus:border-[#36533D] transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#36533D]/20 transition-all font-bold"
          >
            <option value="ALL">جميع العمليات</option>
            <option value="login">تسجيل الدخول</option>
            <option value="create">إنشاء جديد</option>
            <option value="update">تعديل بيانات</option>
            <option value="delete">حذف نهائي</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">العملية</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">الهدف</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">التاريخ والوقت</th>
                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-stone-900">{log.user_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-700">{log.resource_type}</span>
                      {log.resource_id && <span className="text-[10px] text-stone-400 font-mono">ID: {log.resource_id}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.status === 'success' ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ناجحة</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>فاشلة</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(log.created_at), 'PPP p', { locale: ar })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-2 hover:bg-[#36533D]/10 text-[#36533D] rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-stone-50 border border-stone-100 flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-stone-400 font-bold">لم يتم العثور على أي سجلات مطابقة</p>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200"
          >
            <div className="bg-[#1C1917] p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-amber-300" />
                <h3 className="text-lg font-heading font-bold">تفاصيل العملية الإدارية</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">المستخدم المنفذ</label>
                  <p className="font-bold text-stone-900">{selectedLog.user_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">العملية</label>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getActionBadge(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">نوع المصدر</label>
                  <p className="font-bold text-stone-900">{selectedLog.resource_type}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">معرف المصدر (ID)</label>
                  <p className="font-mono text-stone-900">{selectedLog.resource_id || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-stone-100">
                <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">تفاصيل البيانات المتأثرة (Data Payload)</label>
                <div className="bg-stone-950 p-6 rounded-2xl overflow-x-auto shadow-inner">
                  <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                    {selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : 'لا توجد بيانات إضافية'}
                  </pre>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span className="text-xs font-bold text-stone-600">
                    {format(new Date(selectedLog.created_at), 'PPPP p', { locale: ar })}
                  </span>
                </div>
                {selectedLog.ip_address && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-stone-400" />
                    <span className="text-xs font-mono text-stone-600">IP: {selectedLog.ip_address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-stone-800 transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
