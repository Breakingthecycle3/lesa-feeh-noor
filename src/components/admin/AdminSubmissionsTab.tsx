import React from 'react';
import { 
  MessageSquareHeart, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import { Submission } from '../../types';

interface AdminSubmissionsTabProps {
  submissions: Submission[];
  onUpdateStatus: (id: number, status: 'approved' | 'rejected' | 'published') => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function AdminSubmissionsTab({ 
  submissions, 
  onUpdateStatus, 
  onDelete 
}: AdminSubmissionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-xl text-stone-900 mb-1">
            مساحة "احكي لنا" (فضفضات القلوب)
          </h2>
          <p className="text-xs text-stone-500">مراجعة وإدارة المشاركات والرسائل الواردة من الجمهور</p>
        </div>
        <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">
            {submissions.filter(s => s.status === 'pending').length} مشاركات بانتظار المراجعة
          </span>
        </div>
      </div>

      <div className="bg-white border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E7E2D8]">
                <th className="px-6 py-4 font-black text-stone-600">المحتوى</th>
                <th className="px-6 py-4 font-black text-stone-600">الحالة</th>
                <th className="px-6 py-4 font-black text-stone-600">التاريخ</th>
                <th className="px-6 py-4 font-black text-stone-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2D8]">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-stone-400 italic">
                    لا توجد فضفضات حالياً..
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-stone-800 leading-relaxed line-clamp-3 italic">"{sub.message}"</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-stone-400">بواسطة:</span>
                          <span className="text-[10px] font-bold text-[#36533D]">
                            {sub.user_name || 'فاعل خير'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        sub.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        sub.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        sub.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {sub.status === 'pending' ? 'بانتظار المراجعة' : 
                         sub.status === 'approved' ? 'تمت الموافقة' : 
                         sub.status === 'published' ? 'منشور للعامة' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(sub.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {sub.status !== 'published' && (
                          <button
                            onClick={() => onUpdateStatus(sub.id, 'published')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="نشر للجمهور"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {sub.status === 'pending' && (
                          <button
                            onClick={() => onUpdateStatus(sub.id, 'rejected')}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="رفض المشاركة"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(sub.id)}
                          className="p-1.5 bg-stone-50 text-stone-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
