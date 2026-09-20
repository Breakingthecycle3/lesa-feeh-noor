import React from 'react';
import { 
  MessageCircle, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  ExternalLink
} from 'lucide-react';

interface AdminCommentsTabProps {
  comments: any[];
  onStatusUpdate: (id: number, status: string) => Promise<void>;
  onReload?: () => Promise<void>;
}

export function AdminCommentsTab({ 
  comments, 
  onStatusUpdate,
  onReload
}: AdminCommentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-xl text-stone-900 mb-1">
            إدارة التعليقات والآراء
          </h2>
          <p className="text-xs text-stone-500">مراجعة والتحكم في تعليقات الزوار على المقالات والمحتوى</p>
        </div>
      </div>

      <div className="bg-white border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E7E2D8]">
                <th className="px-6 py-4 font-black text-stone-600">المعلق والمحتوى</th>
                <th className="px-6 py-4 font-black text-stone-600">المقال</th>
                <th className="px-6 py-4 font-black text-stone-600">الحالة</th>
                <th className="px-6 py-4 font-black text-stone-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2D8]">
              {comments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-stone-400 italic">
                    لا توجد تعليقات للمراجعة حالياً..
                  </td>
                </tr>
              ) : (
                comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center">
                            <User className="w-3 h-3 text-stone-400" />
                          </div>
                          <span className="font-bold text-stone-900">{comment.user_name}</span>
                          <span className="text-[10px] text-stone-400">
                            ({new Date(comment.created_at).toLocaleDateString('ar-EG')})
                          </span>
                        </div>
                        <p className="text-stone-700 leading-relaxed max-w-sm">{comment.content}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[#36533D] font-bold">
                        <span className="truncate max-w-[150px]">{comment.article_title || 'مقال غير معروف'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        comment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        comment.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {comment.status === 'approved' ? 'تمت الموافقة' : 
                         comment.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {comment.status !== 'approved' && (
                          <button
                            onClick={() => onStatusUpdate(comment.id, 'approved')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="موافقة"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {comment.status !== 'rejected' && (
                          <button
                            onClick={() => onStatusUpdate(comment.id, 'rejected')}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="رفض"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
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
