import { useState, useEffect } from 'react';
import { Calendar, Clock, Settings, Check, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface DoctorSchedulePageProps {
  user: any;
}

interface WorkSchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  enabled: boolean;
  timeSlots: {
    start: string;
    end: string;
    duration: number; // minutes (10-30)
  }[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Chủ Nhật' },
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
];

export const DoctorSchedulePage = ({ user }: DoctorSchedulePageProps) => {
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      // Initialize with default schedule (all days disabled)
      const defaultSchedules: WorkSchedule[] = DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day.value,
        enabled: false,
        timeSlots: [],
      }));
      setSchedules(defaultSchedules);
      // TODO: Load from backend API
    } catch (err: any) {
      showToast(err.message || 'Không thể tải lịch làm việc', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save to backend API
      showToast('Lưu lịch làm việc thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayOfWeek: number) => {
    setSchedules(schedules.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { ...s, enabled: !s.enabled }
        : s
    ));
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setSchedules(schedules.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { 
            ...s, 
            timeSlots: [...s.timeSlots, { start: '09:00', end: '09:30', duration: 30 }]
          }
        : s
    ));
  };

  const removeTimeSlot = (dayOfWeek: number, index: number) => {
    setSchedules(schedules.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { 
            ...s, 
            timeSlots: s.timeSlots.filter((_, i) => i !== index)
          }
        : s
    ));
  };

  const updateTimeSlot = (dayOfWeek: number, index: number, field: 'start' | 'end' | 'duration', value: string | number) => {
    setSchedules(schedules.map(s => 
      s.dayOfWeek === dayOfWeek 
        ? { 
            ...s, 
            timeSlots: s.timeSlots.map((slot, i) => 
              i === index ? { ...slot, [field]: value } : slot
            )
          }
        : s
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Settings className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Lịch Làm Việc</h1>
              </div>
              <p className="text-gray-600">Cấu hình ca khám, ngày làm việc và thời lượng</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Lưu cấu hình</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Schedule Configuration */}
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const schedule = schedules.find(s => s.dayOfWeek === day.value);
            if (!schedule) return null;

            return (
              <div key={day.value} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleDay(day.value)}
                      className={`w-12 h-6 rounded-full transition ${
                        schedule.enabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition ${
                          schedule.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">{day.label}</h3>
                    {schedule.enabled && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Bật
                      </span>
                    )}
                  </div>
                  {schedule.enabled && (
                    <button
                      onClick={() => addTimeSlot(day.value)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm ca</span>
                    </button>
                  )}
                </div>

                {schedule.enabled && (
                  <div className="space-y-3 mt-4">
                    {schedule.timeSlots.length === 0 ? (
                      <p className="text-gray-500 text-sm">Chưa có ca khám nào. Nhấn "Thêm ca" để thêm.</p>
                    ) : (
                      schedule.timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 flex-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(day.value, index, 'start', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-gray-600">đến</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(day.value, index, 'end', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Thời lượng:</label>
                            <select
                              value={slot.duration}
                              onChange={(e) => updateTimeSlot(day.value, index, 'duration', parseInt(e.target.value))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value={10}>10 phút</option>
                              <option value={15}>15 phút</option>
                              <option value={20}>20 phút</option>
                              <option value={30}>30 phút</option>
                            </select>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(day.value, index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
