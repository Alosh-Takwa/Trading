import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
  Calendar,
  UserCheck
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../../types/erp';

export const TasksView: React.FC = () => {
  const {
    tasks,
    suppliers,
    orders,
    shipments,
    addTask,
    toggleTaskStatus,
    deleteTask,
    language,
    showToast,
  } = useERP();

  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Task Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: 'Alosh Takwa',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    relatedEntityType: 'supplier' as 'supplier' | 'product' | 'order' | 'shipment',
    relatedEntityId: suppliers[0]?.id || '',
    relatedEntityTitle: suppliers[0]?.nameEn || '',
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    addTask({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      assignedTo: formData.assignedTo,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: formData.status,
      relatedEntityType: formData.relatedEntityType,
      relatedEntityId: formData.relatedEntityId,
      relatedEntityTitle: formData.relatedEntityTitle,
    });

    setIsAddModalOpen(false);
    setFormData({
      title: '',
      description: '',
      assignedTo: 'Alosh Takwa',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      status: 'todo',
      relatedEntityType: 'supplier',
      relatedEntityId: suppliers[0]?.id || '',
      relatedEntityTitle: suppliers[0]?.nameEn || '',
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedPriority === 'all') return true;
    return t.priority === selectedPriority;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-rose-600" />
            <span>{language === 'ar' ? 'المهام والمتابعات والتنبيهات' : 'Procurement Tasks & Reminders'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'متابعة المصانع الصينية، التفاوض، فحص الجودة، واعتمادات الدفع والتخليص'
              : 'Actionable follow-ups for supplier communication, payments, and container milestones'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إضافة مهمة جديدة' : 'Add New Task'}</span>
        </button>
      </div>

      {/* Filter by Priority */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'urgent', 'high', 'medium', 'low'].map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPriority(p)}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all shrink-0 ${
              selectedPriority === p
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isDone = task.status === 'completed';

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                isDone
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleTaskStatus(task.id)}
                  className="w-4 h-4 mt-1 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {task.title}
                    </h3>
                    <span
                      className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {task.relatedEntityTitle && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium inline-block">
                      🔗 {task.relatedEntityTitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs">
                <div className="text-end font-mono">
                  <span className="text-slate-500 block">📅 {task.dueDate}</span>
                  <span className="text-[10px] text-slate-400 font-sans">{task.assignedTo}</span>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 rounded-lg text-slate-300 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e1e1e]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'إضافة مهمة أو متابعة جديدة' : 'Add New Follow-up Task'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'عنوان المهمة *' : 'Task Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="متابعة جاهزية الشحنة، تحويل الدفعة، طلب الكتالوج..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'الوصف والتفاصيل' : 'Details'}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'درجة الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="urgent">Urgent (عاجل جداً)</option>
                    <option value="high">High (مرتفع)</option>
                    <option value="medium">Medium (متوسط)</option>
                    <option value="low">Low (عادي)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'ar' ? 'الشخص المسؤول عن المتابعة' : 'Assigned To'}
                </label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  {language === 'ar' ? 'حفظ المهمة' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
