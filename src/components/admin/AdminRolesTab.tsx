import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  ChevronRight,
  Lock,
  Unlock,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { User, Role, Permission } from '../../types';

export const AdminRolesTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'users'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        api.admin.getRoles(),
        api.admin.getPermissions(),
        api.admin.getUsers()
      ]);
      setRoles(rolesRes.roles);
      setPermissions(permsRes.permissions);
      setUsers(usersRes.users);
    } catch (err) {
      showToast('فشل في تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: '',
        description: '',
        permissions: []
      });
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name) {
      showToast('اسم الصلاحية مطلوب', 'error');
      return;
    }

    try {
      if (editingRole) {
        await api.admin.updateRole(editingRole.id, roleForm);
        showToast('تم تحديث الصلاحية بنجاح', 'success');
      } else {
        await api.admin.createRole(roleForm);
        showToast('تم إضافة الصلاحية بنجاح', 'success');
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'فشل في حفظ الصلاحية', 'error');
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصلاحية؟ سيتم إزالة كافة المستخدمين المرتبطين بها.')) return;

    try {
      await api.admin.deleteRole(id);
      showToast('تم حذف الصلاحية بنجاح', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'فشل في حذف الصلاحية', 'error');
    }
  };

  const handleUpdateUserRole = async (userId: number, roleId: number | null) => {
    try {
      await api.admin.updateUserRole(userId, roleId);
      showToast('تم تحديث رتبة المستخدم بنجاح', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'فشل في تحديث رتبة المستخدم', 'error');
    }
  };

  const togglePermission = (permName: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...prev.permissions, permName]
    }));
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const permissionsByModule = permissions.reduce((acc, perm) => {
    const module = perm.module || 'عام';
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">إدارة الصلاحيات والرتب</h2>
          <p className="text-stone-500 mt-1">منح وصحب الصلاحيات للمديرين والأعضاء</p>
        </div>
        
        <div className="flex gap-2 bg-stone-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'roles' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Shield className="w-4 h-4 inline-block ml-2" />
            الرتب (Roles)
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Users className="w-4 h-4 inline-block ml-2" />
            تعيين المستخدمين
          </button>
        </div>
      </div>

      {activeSubTab === 'roles' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-700">الرتب الحالية</h3>
              <button 
                onClick={() => handleOpenRoleModal()}
                className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg flex items-center hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة رتبة
              </button>
            </div>
            
            <div className="space-y-3">
              {roles.map((role) => (
                <motion.div
                  key={role.id}
                  layout
                  className="bg-white border border-stone-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800">{role.name}</h4>
                        <p className="text-sm text-stone-500">{role.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenRoleModal(role)}
                        className="p-2 text-stone-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {![1, 2, 3].includes(role.id) && (
                        <button 
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {role.permissions?.map((perm) => (
                      <span key={perm} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px] font-medium border border-stone-200">
                        {perm}
                      </span>
                    ))}
                    {(!role.permissions || role.permissions.length === 0) && (
                      <span className="text-xs text-stone-400 italic">لا توجد صلاحيات محددة</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 h-fit sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-stone-800">تنبيهات الأمان</h3>
            </div>
            <ul className="space-y-3 text-sm text-stone-600">
              <li className="flex gap-2 italic">
                <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                الرتب (Super Admin, Admin, Editor) هي رتب أساسية لا يمكن حذفها لضمان استقرار النظام.
              </li>
              <li className="flex gap-2">
                <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                أي تغيير في صلاحيات الرتبة سيطبق فوراً على كافة المستخدمين المنتمين لها.
              </li>
              <li className="flex gap-2">
                <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                يرجى توخي الحذر عند منح صلاحيات مثل (users.delete) أو (admins.edit).
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="البحث عن مستخدم بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
            <div className="text-sm text-stone-500">
              إجمالي المستخدمين: <span className="font-bold text-stone-800">{users.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-stone-600">المستخدم</th>
                  <th className="px-6 py-4 text-sm font-bold text-stone-600">الرتبة الحالية</th>
                  <th className="px-6 py-4 text-sm font-bold text-stone-600">تعديل الرتبة</th>
                  <th className="px-6 py-4 text-sm font-bold text-stone-600">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-stone-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-stone-800">{user.name}</div>
                          <div className="text-xs text-stone-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        user.role === 'SUPER_ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        user.role === 'EDITOR' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        'bg-stone-50 text-stone-600 border-stone-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role_id || ''}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value ? parseInt(e.target.value) : null)}
                        disabled={user.role === 'SUPER_ADMIN'}
                        className="bg-white border border-stone-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                      >
                        <option value="">عضو عادي (USER)</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRoleModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-800">
                  {editingRole ? `تعديل رتبة: ${editingRole.name}` : 'إضافة رتبة جديدة'}
                </h3>
                <button 
                  onClick={() => setIsRoleModalOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">اسم الرتبة</label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      placeholder="مثال: مدير تقني، محرر مساعد"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">وصف الصلاحية</label>
                    <textarea
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      placeholder="اشرح الغرض من هذه الرتبة..."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-3">الصلاحيات الممنوحة</label>
                  <div className="space-y-6">
                    {Object.entries(permissionsByModule).map(([module, modulePerms]) => (
                      <div key={module} className="space-y-2">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">{module}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modulePerms.map((perm) => (
                            <button
                              key={perm.id}
                              onClick={() => togglePermission(perm.name)}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all text-right ${
                                roleForm.permissions.includes(perm.name)
                                  ? 'bg-primary/5 border-primary text-primary'
                                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{perm.name}</span>
                                <span className="text-[10px] opacity-70">{perm.description}</span>
                              </div>
                              {roleForm.permissions.includes(perm.name) ? (
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                                  <Check className="w-3 h-3" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-stone-300" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-6 py-2 text-stone-600 hover:bg-stone-200 rounded-xl transition-colors font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveRole}
                  className="px-8 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 font-bold"
                >
                  {editingRole ? 'تحديث الرتبة' : 'إنشاء الرتبة'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
