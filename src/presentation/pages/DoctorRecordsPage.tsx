import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Eye, Printer, X } from 'lucide-react';
import { doctorService, type PatientBooking } from '../../infrastructure/doctor/doctorService';
import { useToast } from '../contexts/ToastContext';

interface DoctorRecordsPageProps {
  user: any;
}

export const DoctorRecordsPage = ({ user }: DoctorRecordsPageProps) => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PatientBooking | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('');

  const doctorName = user?.fullname || user?.user_metadata?.full_name || user?.name || '';

  useEffect(() => {
    if (doctorName) {
      loadRecords();
    }
  }, [doctorName, dateFilter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const filters: any = { status: 'completed' }; // Chỉ lấy các lịch đã hoàn thành (có hồ sơ)
      if (dateFilter) {
        filters.dateFrom = dateFilter;
        filters.dateTo = dateFilter;
      }
      const result = await doctorService.getDoctorBookings(doctorName, filters);
      const bookings = result.bookings || [];
      
      // Chỉ lấy những booking có medical_record
      const recordsWithData = bookings.filter(b => b.medical_record);
      setRecords(recordsWithData);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải hồ sơ bệnh án', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (record: PatientBooking) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    showToast('Chức năng xuất PDF đang được phát triển', 'info');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Parse medical record (format: symptoms|diagnosis|prescription|notes)
  const parseMedicalRecord = (record: string) => {
    const parts = record.split('|');
    return {
      symptoms: parts[0] || '',
      diagnosis: parts[1] || '',
      prescription: parts[2] || '',
      notes: parts[3] || '',
    };
  };

  // Sort by date (newest first)
  const sortedRecords = [...records].sort((a, b) => {
    const dateA = a.appointment_date || '';
    const dateB = b.appointment_date || '';
    return dateB.localeCompare(dateA);
  });

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Hồ Sơ Bệnh Án</h1>
              </div>
              <p className="text-gray-600">Danh sách hồ sơ bệnh án theo thời gian</p>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Lọc theo ngày"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Records List */}
        {sortedRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có hồ sơ bệnh án nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRecords.map((record) => {
              const parsed = parseMedicalRecord(record.medical_record || '');
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                  onClick={() => handleViewRecord(record)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900 text-lg">
                          {formatDate(record.appointment_date)}
                        </span>
                        <span className="text-gray-600">{record.appointment_time}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Bệnh nhân</p>
                          <p className="font-semibold text-gray-900">
                            {record.full_name || record.fullname}
                          </p>
                        </div>
                        {parsed.diagnosis && (
                          <div>
                            <p className="text-sm text-gray-600">Chẩn đoán</p>
                            <p className="text-gray-900">{parsed.diagnosis}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Xem</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Record Detail Modal */}
        {showRecordModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chi tiết hồ sơ bệnh án</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedRecord.appointment_date)} - {selectedRecord.appointment_time}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất PDF</span>
                  </button>
                  <button
                    onClick={() => setShowRecordModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition ml-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Patient Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin bệnh nhân</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Họ và tên:</span> {selectedRecord.full_name || selectedRecord.fullname}</p>
                    <p><span className="font-medium">Email:</span> {selectedRecord.email}</p>
                    <p><span className="font-medium">Số điện thoại:</span> {selectedRecord.phone}</p>
                    <p><span className="font-medium">Khoa:</span> {selectedRecord.department}</p>
                  </div>
                </div>

                {/* Medical Record */}
                {selectedRecord.medical_record && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hồ sơ khám bệnh</h3>
                    {(() => {
                      const parsed = parseMedicalRecord(selectedRecord.medical_record);
                      return (
                        <div className="space-y-4">
                          {parsed.symptoms && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Triệu chứng</p>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap">{parsed.symptoms}</p>
                              </div>
                            </div>
                          )}
                          {parsed.diagnosis && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Chẩn đoán</p>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap">{parsed.diagnosis}</p>
                              </div>
                            </div>
                          )}
                          {parsed.prescription && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Đơn thuốc</p>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap">{parsed.prescription}</p>
                              </div>
                            </div>
                          )}
                          {parsed.notes && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Ghi chú</p>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap">{parsed.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
