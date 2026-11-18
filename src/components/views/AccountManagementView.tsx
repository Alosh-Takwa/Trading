import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { User, UserRole } from '../../types/erp';
import {
  UserCheck,
  Shield,
  Key,
  Mail,
  Phone,
  Building,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  UserPlus,
  RefreshCw,
  LogOut,
  Users,
  Eye,
  Sliders,
  Check,
  X,
  Search,
  Filter,
  Camera,
  BellRing,
  Sparkles,
  ArrowRightLeft,
  Cloud,
  CloudOff,
  ExternalLink,
  EyeOff,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

// Client-side image compressor & downscaler to produce clean, compact JPEG data URLs
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المختار ليس صورة صالحة'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 380;
        const MAX_HEIGHT = 380;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

interface PermissionOption {
  id: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

const SYSTEM_PERMISSIONS: PermissionOption[] = [
  {
    id: 'suppliers_manage',
    labelAr: 'إدارة وتعديل الموردين والمصانع',
    labelEn: 'Manage Suppliers & Factories',
    descriptionAr: 'إضافة وتعديل بيانات المصانع، جهات الاتصال، وتقييم الأداء',
    descriptionEn: 'Add/edit factory profiles, contacts, and scorecards',
  },
  {
    id: 'quotes_manage',
    labelAr: 'عروض الأسعار ومصفوفة المقارنة',
    labelEn: 'Quotations & Comparison',
    descriptionAr: 'تسجيل وتحليل عروض الأسعار FOB/CIF ومقارنتها',
    descriptionEn: 'Enter and analyze quotations, FOB/CIF pricing trends',
  },
  {
    id: 'orders_manage',
    labelAr: 'إصدار واعتماد أوامر الشراء (PO)',
    labelEn: 'Purchase Orders (PO)',
    descriptionAr: 'إنشاء طلبيات الشراء، التفاوض السعري، ومتابعة التصنيع',
    descriptionEn: 'Create POs, negotiate unit pricing, track manufacturing',
  },
  {
    id: 'invoices_manage',
    labelAr: 'الفواتير والاعتمادات البنكية T/T',
    labelEn: 'Invoices & Bank Transfers',
    descriptionAr: 'إدارة الفواتير التجارية وتسجيل دفعات T/T ومراجع سويفت',
    descriptionEn: 'Manage commercial invoices, T/T wires, and SWIFT tracking',
  },
  {
    id: 'shipments_manage',
    labelAr: 'الشحن البحري وتتبع الحاويات',
    labelEn: 'Shipments & Maritime Tracking',
    descriptionAr: 'متابعة بوالص الشحن BL، الحاويات، وخطوط الملاحة',
    descriptionEn: 'Track bills of lading, 40HQ containers, and shipping lines',
  },
  {
    id: 'landed_cost',
    labelAr: 'حساب التكلفة الفعلية للاستيراد',
    labelEn: 'Landed Cost Calculator',
    descriptionAr: 'توزيع مصاريف الشحن والجمارك على بنود الاستيراد',
    descriptionEn: 'Apportion freight, customs, and port clearance across items',
  },
  {
    id: 'samples_qc',
    labelAr: 'العينات وفحص الجودة قبل الشحن',
    labelEn: 'Samples & QC Inspections',
    descriptionAr: 'طلب العينات واعتماد تقارير فحص الجودة بالمصانع',
    descriptionEn: 'Request factory samples and approve pre-shipment QC reports',
  },
  {
    id: 'export_reports',
    labelAr: 'تصدير التقارير والبيانات (Excel/Word)',
    labelEn: 'Export Reports & Data',
    descriptionAr: 'تنزيل كشوفات الحسابات والبيانات بصيغ Excel و Word',
    descriptionEn: 'Export records and data sheets to Excel and Word',
  },
  {
    id: 'users_manage',
    labelAr: 'إدارة المستخدمين والصلاحيات (RBAC)',
    labelEn: 'Manage Users & Permissions',
    descriptionAr: 'إضافة وحذف المستخدمين وتعديل أدوارهم وصلاحياتهم',
    descriptionEn: 'Add/delete system users and define their role permissions',
  },
  {
    id: 'settings_manage',
    labelAr: 'إعدادات النظام والنسخ الاحتياطي',
    labelEn: 'System Settings & Backup',
    descriptionAr: 'تعديل هوية المنشأة، أسعار الصرف، واسترجاع قاعدة البيانات',
    descriptionEn: 'Modify company info, exchange rates, and database backup',
  },
];

export const AccountManagementView: React.FC = () => {
  const {
    currentUser,
    users,
    updateCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    switchUser,
    canManageUsers,
    language,
    activeRole,
    logout,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'matrix'>('profile');

  // Profile Form State (for current user editing their own data)
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileJobTitle, setProfileJobTitle] = useState(currentUser.jobTitle || '');
  const [profileDepartment, setProfileDepartment] = useState(currentUser.department || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatar || PRESET_AVATARS[0]);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState(false);

  // Sync local inputs when currentUser updates (e.g. from hydration or external sync)
  useEffect(() => {
    setProfileName(currentUser.name || '');
    setProfileEmail(currentUser.email || '');
    setProfilePhone(currentUser.phone || '');
    setProfileJobTitle(currentUser.jobTitle || '');
    setProfileDepartment(currentUser.department || '');
    if (currentUser.avatar) {
      setProfileAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  // Device file upload refs & states
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingModalImage, setIsUploadingModalImage] = useState(false);

  // Deletion modals state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSelfDeleteModalOpen, setIsSelfDeleteModalOpen] = useState(false);

  // Users Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add / Edit User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPassword, setModalPassword] = useState('123456');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [modalRole, setModalRole] = useState<UserRole>('procurement_manager');
  const [modalDepartment, setModalDepartment] = useState('');
  const [modalJobTitle, setModalJobTitle] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalStatus, setModalStatus] = useState<'active' | 'suspended'>('active');
  const [modalPermissions, setModalPermissions] = useState<string[]>([]);
  const [modalAvatar, setModalAvatar] = useState(PRESET_AVATARS[1]);
  const [modalNotes, setModalNotes] = useState('');

  // Handle local image file upload from device for current user
  const handleProfileFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingProfileImage(true);
      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        setProfileAvatar(dataUrl);
        // Automatically save immediately so user never loses their uploaded avatar!
        updateCurrentUser({ avatar: dataUrl });
      }
    } catch (err: any) {
      console.error('Failed to load image file', err);
    } finally {
      setIsUploadingProfileImage(false);
      if (profileFileInputRef.current) {
        profileFileInputRef.current.value = '';
      }
    }
  };

  // Handle local image file upload from device for modal (team member)
  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingModalImage(true);
      const dataUrl = await compressImageFile(file);
      setModalAvatar(dataUrl);
    } catch (err: any) {
      console.error('Failed to load modal image file', err);
    } finally {
      setIsUploadingModalImage(false);
      if (modalFileInputRef.current) {
        modalFileInputRef.current.value = '';
      }
    }
  };

  // Save current profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      jobTitle: profileJobTitle,
      department: profileDepartment,
      avatar: profileAvatar,
    });
  };

  // Change password simulation
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      updateCurrentUser({ password: newPassword });
      setPasswordSuccessMsg(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(false), 4000);
    }
  };

  // Open modal to add new user
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setModalName('');
    setModalEmail('');
    setModalPassword('123456');
    setShowModalPassword(false);
    setModalRole('procurement_manager');
    setModalDepartment('إدارة المشتريات والتعاقدات');
    setModalJobTitle('مسؤول مشتريات');
    setModalPhone('');
    setModalStatus('active');
    setModalPermissions(['suppliers_manage', 'quotes_manage', 'orders_manage']);
    setModalAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setModalNotes('');
    setIsUserModalOpen(true);
  };

  // Open modal to edit existing user
  const handleOpenEditUser = (user: User) => {
    setEditingUserId(user.id);
    setModalName(user.name);
    setModalEmail(user.email);
    setModalPassword(user.password || '123456');
    setShowModalPassword(false);
    setModalRole(user.role);
    setModalDepartment(user.department || '');
    setModalJobTitle(user.jobTitle || '');
    setModalPhone(user.phone || '');
    setModalStatus(user.status || 'active');
    setModalPermissions(user.customPermissions || []);
    setModalAvatar(user.avatar || PRESET_AVATARS[0]);
    setModalNotes(user.notes || '');
    setIsUserModalOpen(true);
  };

  // Save user from modal (Add or Edit)
  const handleSaveUserModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim() || !modalEmail.trim()) return;

    if (editingUserId) {
      updateUser(editingUserId, {
        name: modalName.trim(),
        email: modalEmail.trim(),
        password: modalPassword.trim() || '123456',
        role: modalRole,
        department: modalDepartment.trim(),
        jobTitle: modalJobTitle.trim(),
        phone: modalPhone.trim(),
        status: modalStatus,
        customPermissions: modalPermissions,
        avatar: modalAvatar,
        notes: modalNotes.trim(),
      });
    } else {
      addUser({
        name: modalName.trim(),
        email: modalEmail.trim(),
        password: modalPassword.trim() || '123456',
        role: modalRole,
        department: modalDepartment.trim(),
        jobTitle: modalJobTitle.trim(),
        phone: modalPhone.trim(),
        status: modalStatus,
        customPermissions: modalPermissions,
        avatar: modalAvatar,
        notes: modalNotes.trim(),
      });
    }

    setIsUserModalOpen(false);
  };

  // Toggle permission in modal
  const handleTogglePermission = (permId: string) => {
    setModalPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            {language === 'ar' ? 'مدير عام (Super Admin)' : 'Super Admin'}
          </span>
        );
      case 'procurement_manager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Briefcase className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            {language === 'ar' ? 'مدير المشتريات' : 'Procurement Lead'}
          </span>
        );
      case 'finance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Key className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            {language === 'ar' ? 'المدير المالي' : 'Finance Lead'}
          </span>
        );
      case 'shipping_manager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            <Sliders className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            {language === 'ar' ? 'مسؤول الشحن' : 'Shipping Lead'}
          </span>
        );
      case 'viewer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Eye className="w-3 h-3 text-slate-500" />
            {language === 'ar' ? 'مستعرض فقط' : 'Viewer'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => profileFileInputRef.current?.click()} title={language === 'ar' ? 'تغيير الصورة الشخصية من جهازك' : 'Change profile picture from device'}>
            <img
              src={currentUser.avatar || PRESET_AVATARS[0]}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#4393ab]/40 shadow-md group-hover:opacity-85 transition-opacity"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1e1e1e] flex items-center justify-center shadow-xs">
              <Check className="w-3 h-3 text-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white">
                {currentUser.name}
              </h1>
              {getRoleBadge(currentUser.role)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {currentUser.email}
              </span>
              {currentUser.department && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.department}
                </span>
              )}
              {currentUser.jobTitle && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.jobTitle}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canManageUsers && (
            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4393ab] hover:bg-[#36798e] text-white text-xs font-bold transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2a2a2a] pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-[#4393ab] text-white shadow-xs'
              : 'text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252525]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{language === 'ar' ? 'بيانات حسابي الشخصي' : 'My Account Profile'}</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'users'
              ? 'bg-[#4393ab] text-white shadow-xs'
              : 'text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252525]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'ar' ? 'إدارة المستخدمين وفريق العمل' : 'Team & Users Management'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-black dark:text-white">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-[#4393ab] text-white shadow-xs'
              : 'text-black dark:text-white hover:bg-slate-100 dark:hover:bg-[#252525]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{language === 'ar' ? 'مصفوفة الصلاحيات (RBAC)' : 'Permissions Matrix'}</span>
        </button>
      </div>

      {/* TAB 1: MY PROFILE (Allows ANY person to change their own account data) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2a2a] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#4393ab]/10 text-[#4393ab] flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-black dark:text-white">
                      {language === 'ar' ? 'تعديل البيانات الأساسية لحسابك' : 'Edit Account Information'}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'يمكنك هنا تحديث اسمك، بريدك، رقم هاتفك، وقسمك في الشركة' : 'Update your profile name, contact info, and department'}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4393ab] hover:bg-[#36798e] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Profile'}</span>
                </button>
              </div>

              {/* Avatar Selector with Device Upload */}
              <div className="space-y-3">
                <input
                  type="file"
                  ref={profileFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileFileUpload}
                />

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black dark:text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#4393ab]" />
                    <span>{language === 'ar' ? 'الصورة الشخصية للحساب' : 'Profile Avatar'}</span>
                  </label>
                  {profileAvatar.startsWith('data:') && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {language === 'ar' ? 'صورة مرفوعة من جهازك' : 'Uploaded from Device'}
                    </span>
                  )}
                </div>

                {/* Primary Upload Control from Device */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2a2a2a] flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={profileAvatar}
                      alt="current-avatar"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#4393ab]/50 shadow-md"
                    />
                    {isUploadingProfileImage && (
                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-start space-y-1">
                    <h4 className="text-xs font-bold text-black dark:text-white">
                      {language === 'ar' ? 'اختر صورة من ملفات جهازك' : 'Choose a photo from your computer/device'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar'
                        ? 'يدعم صور PNG, JPG, WEBP. يتم ضغط الصورة تلقائياً للحفاظ على الأداء وسرعة التحميل.'
                        : 'Supports PNG, JPG, WEBP. Automatically optimized for fast loading and offline sync.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id="upload-profile-image-btn"
                      onClick={() => profileFileInputRef.current?.click()}
                      disabled={isUploadingProfileImage}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4393ab] hover:bg-[#36798e] text-white text-xs font-bold transition-all shadow-md shadow-[#4393ab]/20 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {isUploadingProfileImage
                          ? language === 'ar' ? 'جارٍ المعالجة...' : 'Processing...'
                          : language === 'ar' ? 'رفع صورة من الجهاز' : 'Upload from Device'}
                      </span>
                    </button>

                    {profileAvatar.startsWith('data:') && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileAvatar(PRESET_AVATARS[0]);
                          updateCurrentUser({ avatar: PRESET_AVATARS[0] });
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs transition-colors"
                        title={language === 'ar' ? 'إلغاء والعودة للصورة الافتراضية' : 'Reset to default avatar'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Presets */}
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5">
                    {language === 'ar' ? 'أو اختر من الصور الرمزية الجاهزة:' : 'Or pick from preset avatars:'}
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PRESET_AVATARS.map((avatarUrl, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setProfileAvatar(avatarUrl);
                          updateCurrentUser({ avatar: avatarUrl });
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                          profileAvatar === avatarUrl
                            ? 'border-[#4393ab] ring-2 ring-[#4393ab]/40 scale-105'
                            : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={avatarUrl} alt="preset" className="w-full h-full object-cover" />
                        {profileAvatar === avatarUrl && (
                          <span className="absolute top-1 end-1 w-3.5 h-3.5 rounded-full bg-[#4393ab] text-white flex items-center justify-center">
                            <Check className="w-2 h-2" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Custom Link Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarInput.trim()) {
                        const newAv = customAvatarInput.trim();
                        setProfileAvatar(newAv);
                        updateCurrentUser({ avatar: newAv });
                        setCustomAvatarInput('');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-black dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700"
                  >
                    {language === 'ar' ? 'تطبيق رابط' : 'Apply Link'}
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'}
                  </label>
                  <input
                    type="tel"
                    placeholder="+966 50 123 4567"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    placeholder="Procurement Specialist"
                    value={profileJobTitle}
                    onChange={(e) => setProfileJobTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'القسم / الإدارة' : 'Department'}
                  </label>
                  <input
                    type="text"
                    placeholder="إدارة الاستيراد وسلاسل الإمداد"
                    value={profileDepartment}
                    onChange={(e) => setProfileDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>
              </div>
            </form>

            {/* Change Password & Security Card */}
            <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#2a2a2a] pb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-white">
                    {language === 'ar' ? 'الأمان وتغيير كلمة المرور' : 'Security & Password Update'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'حدّث رمز الأمان وكلمة المرور الخاصة بحسابك في أي وقت' : 'Change your account security password and PIN'}
                  </p>
                </div>
              </div>

              {passwordSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{language === 'ar' ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!'}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!newPassword || newPassword !== confirmPassword}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all disabled:opacity-40"
                >
                  {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Role & Permissions Summary Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#2a2a2a] pb-3">
                <Shield className="w-5 h-5 text-[#4393ab]" />
                <h3 className="text-sm font-bold text-black dark:text-white">
                  {language === 'ar' ? 'صلاحيات حسابك الحالية' : 'Your Assigned Permissions'}
                </h3>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'ar' ? 'الدور المعتمد لك في المنظومة:' : 'Your System Role:'}
                </p>
                <div className="mt-1">{getRoleBadge(currentUser.role)}</div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#2a2a2a]">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {language === 'ar' ? 'الصلاحيات المتاحة لدورك:' : 'Permissions Summary:'}
                </p>
                <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{language === 'ar' ? 'استعراض المنتجات وعروض الأسعار' : 'Browse products and quotes'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{language === 'ar' ? 'الاطلاع على حركة الشحنات والحاويات' : 'View shipments and containers'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{language === 'ar' ? 'تعديل وحفظ بيانات الحساب الشخصي' : 'Update personal profile details'}</span>
                  </li>
                  {currentUser.role === 'super_admin' && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{language === 'ar' ? 'إضافة وحذف المستخدمين وتحديد الصلاحيات' : 'Manage users and assign permissions'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{language === 'ar' ? 'صلاحيات مالية وتعاقدية كاملة' : 'Full financial and contract access'}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2a2a2a] text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'ar'
                  ? 'لتغيير دورك الوظيفي أو طلب صلاحيات إضافية، يرجى التواصل مع المدير العام للمنظومة.'
                  : 'To request role changes or additional permissions, please contact your Super Admin.'}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#2a2a2a] pb-3">
                <BellRing className="w-4 h-4 text-[#4393ab]" />
                <h3 className="text-sm font-bold text-black dark:text-white">
                  {language === 'ar' ? 'تفضيلات الإشعارات' : 'Notification Settings'}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-black dark:text-white">
                    {language === 'ar' ? 'إشعارات وصول الشحنات للميناء' : 'Shipment arrival alerts'}
                  </span>
                  <input type="checkbox" defaultChecked className="rounded accent-[#4393ab] w-4 h-4" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-black dark:text-white">
                    {language === 'ar' ? 'تنبيهات استحقاق فواتير المصانع T/T' : 'Payment due date reminders'}
                  </span>
                  <input type="checkbox" defaultChecked className="rounded accent-[#4393ab] w-4 h-4" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-black dark:text-white">
                    {language === 'ar' ? 'تقارير فحص الجودة الجاهزة' : 'QC report ready notifications'}
                  </span>
                  <input type="checkbox" defaultChecked className="rounded accent-[#4393ab] w-4 h-4" />
                </label>
              </div>
            </div>

            {/* Session Management & Logout Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#2a2a2a] pb-3">
                <LogOut className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-black dark:text-white">
                  {language === 'ar' ? 'جلسة الحساب وتسجيل الخروج' : 'Account Session & Sign Out'}
                </h3>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>
                  <strong className="text-black dark:text-white">{language === 'ar' ? 'الحساب النشط:' : 'Active User:'}</strong> {currentUser.name} ({currentUser.email})
                </p>
                <p>
                  <strong className="text-black dark:text-white">{language === 'ar' ? 'آخر تسجيل دخول:' : 'Last Login:'}</strong>{' '}
                  {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#252525] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333] hover:bg-slate-200 dark:hover:bg-[#2a2a2a] text-xs font-bold transition-all"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>{language === 'ar' ? 'تسجيل الخروج من المنظومة' : 'Sign Out of SinoTrack'}</span>
                </button>
              </div>

              {/* Danger Zone: Delete Personal Account */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#2a2a2a]">
                <button
                  type="button"
                  id="delete-personal-account-btn"
                  onClick={() => setIsSelfDeleteModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>{language === 'ar' ? 'حذف هذا الحساب نهائياً من المنظومة' : 'Permanently Delete This Account'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM & USERS MANAGEMENT (Manager adds users & defines permissions) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Cloud Database User Security Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50 to-teal-50/40 dark:from-[#1e1e1e] dark:via-[#1e1e1e] dark:to-[#142828] border border-slate-200 dark:border-[#2a2a2a] shadow-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-black dark:text-white">
                      {language === 'ar'
                        ? 'تأمين وحفظ حسابات المستخدمين في قاعدة البيانات السحابية'
                        : 'User Credentials Persisted in Cloud Database'}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {language === 'ar' ? 'سحابي دائم ومشفر' : 'Encrypted & Persistent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {language === 'ar'
                      ? 'يتم تخزين ومزامنة كافة حسابات الفريق، الصلاحيات، وكلمات المرور مباشرة في قاعدة البيانات السحابية المركزية (Cloud Firestore) دون الحاجة لأي خدمات خارجية.'
                      : 'All user accounts, roles, and granular permissions are stored permanently in Cloud Firestore.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] shadow-xs">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'البحث بالاسم، البريد، أو القسم...' : 'Search users by name, email, department...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none"
              >
                <option value="all">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
                <option value="super_admin">{language === 'ar' ? 'المدير العام' : 'Super Admin'}</option>
                <option value="procurement_manager">{language === 'ar' ? 'مدير المشتريات' : 'Procurement Manager'}</option>
                <option value="finance">{language === 'ar' ? 'المدير المالي' : 'Finance Lead'}</option>
                <option value="shipping_manager">{language === 'ar' ? 'مسؤول الشحن' : 'Shipping Manager'}</option>
                <option value="viewer">{language === 'ar' ? 'مستعرض' : 'Viewer'}</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none"
              >
                <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="suspended">{language === 'ar' ? 'معلق' : 'Suspended'}</option>
              </select>

              {canManageUsers && (
                <button
                  onClick={handleOpenAddUser}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4393ab] hover:bg-[#36798e] text-white text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إضافة مستخدم' : 'Add User'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Access Warning if not Super Admin */}
          {!canManageUsers && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>
                {language === 'ar'
                  ? 'أنت تستعرض قائمة فريق العمل بصلاحيات قراءة فقط. لإضافة مستخدمين جدد أو تعديل الصلاحيات، يرجى تسجيل الدخول بحساب المدير العام (Super Admin).'
                  : 'You are viewing the team in read-only mode. To add users or change permissions, switch to the Super Admin role.'}
              </span>
            </div>
          )}

          {/* Users Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const isRootAdmin = user.id === 'usr-001';

              return (
                <div
                  key={user.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isCurrent
                      ? 'border-[#4393ab] ring-1 ring-[#4393ab]/30 bg-white dark:bg-[#1e1e1e] shadow-sm'
                      : 'border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1e1e1e] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || PRESET_AVATARS[0]}
                        alt={user.name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-black dark:text-white leading-tight">
                            {user.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#4393ab]/20 text-[#4393ab]">
                              {language === 'ar' ? 'حسابك' : 'You'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (user.status || 'active') === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {(user.status || 'active') === 'active'
                        ? language === 'ar'
                          ? 'نشط'
                          : 'Active'
                        : language === 'ar'
                        ? 'معلق'
                        : 'Suspended'}
                    </span>
                  </div>

                  {/* Role & Dept */}
                  <div className="space-y-2 text-xs border-t border-b border-slate-100 dark:border-[#282828] py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'الدور الوظيفي:' : 'Role:'}</span>
                      <div>{getRoleBadge(user.role)}</div>
                    </div>
                    {user.jobTitle && (
                      <div className="flex items-center justify-between text-black dark:text-white">
                        <span className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'المسمى:' : 'Job Title:'}</span>
                        <span className="font-medium text-end truncate max-w-[160px]">{user.jobTitle}</span>
                      </div>
                    )}
                    {user.department && (
                      <div className="flex items-center justify-between text-black dark:text-white">
                        <span className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'القسم:' : 'Dept:'}</span>
                        <span className="font-medium text-end truncate max-w-[160px]">{user.department}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center justify-between text-black dark:text-white">
                        <span className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                        <span className="font-mono text-end">{user.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-black dark:text-white">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#4393ab]" />
                        <span>{language === 'ar' ? 'كلمة المرور:' : 'Password:'}</span>
                      </span>
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#252525] text-[#4393ab]">
                        {user.password || '123456'}
                      </span>
                    </div>

                    {/* Permissions summary */}
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                        {language === 'ar' ? 'الصلاحيات المخصصة:' : 'Permissions:'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {user.role === 'super_admin' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                            {language === 'ar' ? 'كامل الصلاحيات (Full Access)' : 'Full Access'}
                          </span>
                        ) : user.customPermissions && user.customPermissions.length > 0 ? (
                          user.customPermissions.slice(0, 3).map((p) => {
                            const opt = SYSTEM_PERMISSIONS.find((sp) => sp.id === p);
                            return (
                              <span
                                key={p}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {language === 'ar' ? opt?.labelAr.split(' ')[0] : opt?.labelEn.split(' ')[0]}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {language === 'ar' ? 'صلاحيات الدور الافتراضية' : 'Default Role Permissions'}
                          </span>
                        )}
                        {user.customPermissions && user.customPermissions.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            +{user.customPermissions.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Switch User Button */}
                    {!isCurrent && (
                      <button
                        onClick={() => switchUser(user.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#4393ab] text-slate-700 dark:text-slate-200 hover:text-[#4393ab] text-xs font-semibold transition-colors"
                        title={language === 'ar' ? 'تسجيل الدخول كـ هذا المستخدم' : 'Switch to this account'}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'تبديل الحساب' : 'Switch'}</span>
                      </button>
                    )}

                    {canManageUsers && (
                      <>
                        <button
                          onClick={() => handleOpenEditUser(user)}
                          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={language === 'ar' ? 'تعديل البيانات والصلاحيات' : 'Edit User & Permissions'}
                        >
                          <Edit2 className="w-4 h-4 text-[#4393ab]" />
                        </button>

                        {!isCurrent && (
                          <>
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={
                                (user.status || 'active') === 'active'
                                  ? language === 'ar'
                                    ? 'تعليق الحساب'
                                    : 'Suspend User'
                                  : language === 'ar'
                                  ? 'تنشيط الحساب'
                                  : 'Activate User'
                              }
                            >
                              <RefreshCw className="w-4 h-4 text-amber-500" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              data-testid={`delete-user-${user.id}`}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer delete-user-action-btn"
                              title={language === 'ar' ? 'حذف المستخدم' : 'Delete User'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS MATRIX (RBAC) */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2a2a] shadow-xs">
            <div className="mb-4">
              <h3 className="text-base font-bold text-black dark:text-white">
                {language === 'ar' ? 'مصفوفة الصلاحيات والأدوار في المنظومة (RBAC)' : 'System Role-Based Access Control Matrix'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar'
                  ? 'جدول يوضح الصلاحيات الممنوحة لكل دور وظيفي عبر مختلف وحدات SinoTrack ERP'
                  : 'Detailed breakdown of system capabilities across each predefined organizational role'}
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-[#181818] border-b border-slate-200 dark:border-slate-800 text-black dark:text-white">
                  <tr>
                    <th className="py-3 px-4 font-bold text-start">{language === 'ar' ? 'الوحدة / الصلاحية' : 'Module / Capability'}</th>
                    <th className="py-3 px-3 text-center font-bold text-purple-600 dark:text-purple-400">
                      {language === 'ar' ? 'مدير عام' : 'Super Admin'}
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                      {language === 'ar' ? 'مدير مشتريات' : 'Procurement'}
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {language === 'ar' ? 'مدير مالي' : 'Finance'}
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-cyan-600 dark:text-cyan-400">
                      {language === 'ar' ? 'مسؤول شحن' : 'Shipping'}
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'مستعرض' : 'Viewer'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-black dark:text-white">
                  {SYSTEM_PERMISSIONS.map((perm) => (
                    <tr key={perm.id} className="hover:bg-slate-50/50 dark:hover:bg-[#222222]">
                      <td className="py-3 px-4">
                        <span className="font-bold block">{language === 'ar' ? perm.labelAr : perm.labelEn}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'ar' ? perm.descriptionAr : perm.descriptionEn}
                        </span>
                      </td>

                      {/* Super Admin */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 items-center justify-center font-bold">
                          ✓
                        </span>
                      </td>

                      {/* Procurement */}
                      <td className="py-3 px-3 text-center">
                        {['suppliers_manage', 'quotes_manage', 'orders_manage', 'samples_qc', 'export_reports'].includes(perm.id) ? (
                          <span className="inline-flex w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 items-center justify-center font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                        )}
                      </td>

                      {/* Finance */}
                      <td className="py-3 px-3 text-center">
                        {['invoices_manage', 'landed_cost', 'export_reports', 'quotes_manage'].includes(perm.id) ? (
                          <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 items-center justify-center font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                        )}
                      </td>

                      {/* Shipping */}
                      <td className="py-3 px-3 text-center">
                        {['shipments_manage', 'landed_cost', 'export_reports'].includes(perm.id) ? (
                          <span className="inline-flex w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 items-center justify-center font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                        )}
                      </td>

                      {/* Viewer */}
                      <td className="py-3 px-3 text-center">
                        {perm.id === 'export_reports' ? (
                          <span className="inline-flex w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 items-center justify-center font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT USER MODAL (for managers) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-6 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-slate-200 dark:border-[#2a2a2a] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50/50 dark:bg-[#181818]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4393ab]/10 text-[#4393ab] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-white">
                    {editingUserId
                      ? language === 'ar'
                        ? 'تعديل بيانات وصلاحيات المستخدم'
                        : 'Edit User & Permissions'
                      : language === 'ar'
                      ? 'إضافة شخص / مستخدم جديد للمنظومة'
                      : 'Add New User to Platform'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'ar'
                      ? 'حدد بيانات المستخدم ودوره والصلاحيات الممنوحة له'
                      : 'Specify user details, role, and custom permission grants'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUserModal} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'اسم المستخدم *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-black dark:text-white">
                      {language === 'ar' ? 'كلمة المرور الخاصة بالمستخدم *' : 'User Password *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="text-[11px] text-[#4393ab] hover:underline flex items-center gap-1"
                    >
                      {showModalPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showModalPassword ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'إظهار' : 'Show')}</span>
                    </button>
                  </div>
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'ar' ? 'بيانات دخول مشفرة تُحفظ في قاعدة البيانات السحابية' : 'Encrypted credentials stored in Cloud Database'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'الدور الوظيفي الأساسي *' : 'System Role *'}
                  </label>
                  <select
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  >
                    <option value="super_admin">{language === 'ar' ? 'مدير عام (Super Admin - كامل الصلاحيات)' : 'Super Admin (Full Access)'}</option>
                    <option value="procurement_manager">{language === 'ar' ? 'مدير المشتريات (Procurement)' : 'Procurement Manager'}</option>
                    <option value="finance">{language === 'ar' ? 'المدير المالي (Finance)' : 'Finance Manager'}</option>
                    <option value="shipping_manager">{language === 'ar' ? 'مسؤول الشحن (Shipping Manager)' : 'Shipping Manager'}</option>
                    <option value="viewer">{language === 'ar' ? 'مستعرض فقط (Read-only Viewer)' : 'Read-only Viewer'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'حالة الحساب' : 'Account Status'}
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as 'active' | 'suspended')}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  >
                    <option value="active">{language === 'ar' ? 'نشط (مفعل)' : 'Active'}</option>
                    <option value="suspended">{language === 'ar' ? 'معلق (موقوف مؤقتاً)' : 'Suspended'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    value={modalJobTitle}
                    onChange={(e) => setModalJobTitle(e.target.value)}
                    placeholder="مثال: منسق استيراد وشحن"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'القسم / الإدارة' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={modalDepartment}
                    onChange={(e) => setModalDepartment(e.target.value)}
                    placeholder="المشتريات / المالية / اللوجستيات"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                  />
                </div>

                {/* User Avatar with Device File Upload */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#2a2a2a] space-y-3">
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleModalFileUpload}
                  />

                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-black dark:text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#4393ab]" />
                      <span>{language === 'ar' ? 'صورة المستخدم الشخصية' : 'User Avatar Photo'}</span>
                    </label>
                    {modalAvatar.startsWith('data:') && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {language === 'ar' ? 'صورة مرفوعة من جهازك' : 'Uploaded from Device'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={modalAvatar}
                        alt="modal-avatar"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#4393ab]/50 shadow-sm"
                      />
                      {isUploadingModalImage && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-start">
                      <button
                        type="button"
                        id="upload-modal-user-image-btn"
                        onClick={() => modalFileInputRef.current?.click()}
                        disabled={isUploadingModalImage}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#4393ab] hover:bg-[#36798e] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {isUploadingModalImage
                            ? language === 'ar' ? 'جارٍ التحميل...' : 'Uploading...'
                            : language === 'ar' ? 'رفع صورة من جهازك لهذا المستخدم' : 'Upload photo from device'}
                        </span>
                      </button>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {language === 'ar' ? 'اختر ملف صورة من حاسوبك أو هاتفك المحمول' : 'Choose an image file from your computer or phone'}
                      </p>
                    </div>

                    {/* Presets */}
                    <div className="flex gap-1.5 shrink-0">
                      {PRESET_AVATARS.slice(0, 5).map((img, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setModalAvatar(img)}
                          className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                            modalAvatar === img ? 'border-[#4393ab] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="av" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="border-t border-slate-100 dark:border-[#2a2a2a] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#4393ab]" />
                      <span>{language === 'ar' ? 'تحديد الصلاحيات التفصيلية للمستخدم' : 'Assign Granular Permissions'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar'
                        ? 'اختر الصلاحيات المحددة التي يمكن لهذا المستخدم الوصول إليها وإدارتها'
                        : 'Toggle specific features this user is authorized to perform'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (modalPermissions.length === SYSTEM_PERMISSIONS.length) {
                        setModalPermissions([]);
                      } else {
                        setModalPermissions(SYSTEM_PERMISSIONS.map((p) => p.id));
                      }
                    }}
                    className="text-[11px] font-bold text-[#4393ab] hover:underline"
                  >
                    {modalPermissions.length === SYSTEM_PERMISSIONS.length
                      ? language === 'ar'
                        ? 'إلغاء تحديد الكل'
                        : 'Deselect All'
                      : language === 'ar'
                      ? 'تحديد كل الصلاحيات'
                      : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = modalPermissions.includes(perm.id) || modalRole === 'super_admin';
                    const isSuper = modalRole === 'super_admin';

                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#4393ab]/10 border-[#4393ab]/40 text-black dark:text-white'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252525]'
                        } ${isSuper ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSuper}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="mt-0.5 rounded accent-[#4393ab] w-4 h-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold block leading-tight">
                            {language === 'ar' ? perm.labelAr : perm.labelEn}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-normal">
                            {language === 'ar' ? perm.descriptionAr : perm.descriptionEn}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-black dark:text-white mb-1">
                  {language === 'ar' ? 'ملاحظات إدارية عن المستخدم' : 'Administrative Notes'}
                </label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'مسؤول مشتريات خطوط التبريد والغسالات...' : 'Assigned to Ningbo & Foshan refrigeration lines...'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1a1a] text-black dark:text-white outline-none focus:border-[#4393ab]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4393ab] hover:bg-[#36798e] text-white text-xs font-bold transition-all shadow-sm"
                >
                  {editingUserId
                    ? language === 'ar'
                      ? 'حفظ التعديلات'
                      : 'Update User'
                    : language === 'ar'
                    ? 'إضافة المستخدم الآن'
                    : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DELETION CONFIRMATION MODAL (in-app modal, replaces broken window.confirm) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-3xl border border-red-200 dark:border-red-900/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-[#2a2a2a] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black dark:text-white">
                  {language === 'ar' ? 'تأكيد حذف المستخدم نهائياً' : 'Confirm User Deletion'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه' : 'This action is permanent and cannot be undone'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-[#2a2a2a] flex items-center gap-3">
              <img
                src={userToDelete.avatar || PRESET_AVATARS[0]}
                alt={userToDelete.name}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-black dark:text-white truncate">
                  {userToDelete.name}
                </h4>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  {userToDelete.email}
                </p>
                <div className="mt-1">
                  {getRoleBadge(userToDelete.role)}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'ar'
                ? `هل أنت متأكد من رغبتك في حذف حساب "${userToDelete.name}"؟ سيتم إلغاء وصوله للنظام وتحديث سجل الدخول وحفظ التعديلات في قاعدة البيانات السحابية.`
                : `Are you sure you want to permanently delete "${userToDelete.name}"? Their access will be revoked and cloud database updated.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                id="modal-confirm-delete-user-btn"
                onClick={() => {
                  const id = userToDelete.id;
                  setUserToDelete(null);
                  deleteUser(id);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'نعم، احذف المستخدم' : 'Yes, Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELF ACCOUNT DELETION CONFIRMATION MODAL */}
      {isSelfDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-3xl border border-red-300 dark:border-red-900/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-[#2a2a2a] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
                  {language === 'ar' ? 'حذف حسابك الشخصي نهائياً' : 'Delete Your Account Permanently'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'تحذير أمان: سيتم إنهاء جلستك وإزالة بياناتك' : 'Security notice: Session will terminate'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 space-y-1">
              <p className="font-bold">
                {language === 'ar' ? 'هل أنت متأكد تماماً من رغبتك في حذف حسابك؟' : 'Are you completely sure?'}
              </p>
              <p className="text-[11px]">
                {language === 'ar'
                  ? `سيتم حذف الحساب "${currentUser.name}" (${currentUser.email}) وتسجيل خروجك فوراً إلى شاشة الدخول.`
                  : `Account "${currentUser.name}" (${currentUser.email}) will be removed and you will be signed out.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsSelfDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'ar' ? 'تراجع وإلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                id="modal-confirm-delete-self-btn"
                onClick={() => {
                  setIsSelfDeleteModalOpen(false);
                  deleteUser(currentUser.id, true);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'تأكيد حذف حسابي' : 'Yes, Delete My Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
