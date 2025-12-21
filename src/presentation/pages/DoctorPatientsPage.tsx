import { useState, useEffect } from 'react';
import { Users, Search, Eye, Calendar, X } from 'lucide-react';
import { doctorService, type PatientBooking } from '../../infrastructure/doctor/doctorService';
import { useToast } from '../contexts/ToastContext';

interface DoctorPatientsPageProps {
  user: any;
}

interface PatientSummary {
  fullName: string;
  email: string;
  phone: string;
  visitCount: number;
  lastVisitDate: string;
  lastVisitId: string;
}

export const DoctorPatientsPage = ({ user }: DoctorPatientsPageProps) => {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientBooking[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const doctorName = user?.fullname || user?.user_metadata?.full_name || user?.name || '';

  useEffect(() => {
    if (doctorName) {
      loadPatients();
    }
  }, [doctorName]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      // Load all bookings for this doctor
      const result = await doctorService.getDoctorBookings(doctorName, {});
      const bookings = result.bookings || [];

      // Group by patient and calculate summary
      const patientMap = new Map<string, PatientSummary>();

      bookings.forEach((booking) => {
        const key = booking.email || booking.phone || booking.full_name || booking.fullname;
        if (!key) return;

        if (!patientMap.has(key)) {
          patientMap.set(key, {
            fullName: booking.full_name || booking.fullname || '',
            email: booking.email || '',
            phone: booking.phone || '',
            visitCount: 0,
            lastVisitDate: '',
            lastVisitId: '',
          });
        }

        const patient = patientMap.get(key)!;
        patient.visitCount += 1;

        // Update last visit
        const bookingDate = booking.appointment_date || '';
        if (!patient.lastVisitDate || bookingDate > patient.lastVisitDate) {
          patient.lastVisitDate = bookingDate;
          patient.lastVisitId = booking.submission_id || booking.id || '';
        }
      });

      setPatients(Array.from(patientMap.values()));
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách bệnh nhân', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setShowHistoryModal(true);
    
    try {
      const result = await doctorService.getDoctorBookings(doctorName, {});
      const allBookings = result.bookings || [];
      
      // Filter bookings for this patient
      const history = allBookings.filter(
        (b) => (b.email === patient.email && patient.email) ||
               (b.phone === patient.phone && patient.phone) ||
               ((b.full_name || b.fullname) === patient.fullName)
      ).sort((a, b) => {
        const dateA = a.appointment_date || '';
        const dateB = b.appointment_date || '';
        return dateB.localeCompare(dateA); // Newest first
      });

      setPatientHistory(history);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải lịch sử', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const filteredPatients = patients.filter((patient) => {
    const search = searchTerm.toLowerCase();
    return (
      patient.fullName.toLowerCase().includes(search) ||
      patient.email.toLowerCase().includes(search) ||
      patient.phone.includes(search)
    );
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
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Danh Sách Bệnh Nhân</h1>
          </div>
          <p className="text-gray-600">Tra cứu nhanh bệnh nhân đã từng khám</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, hoặc số điện thoại..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lần khám
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lần gần nhất
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {searchTerm ? 'Không tìm thấy bệnh nhân' : 'Chưa có bệnh nhân nào'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{patient.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{patient.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-600">{patient.visitCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{formatDate(patient.lastVisitDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewHistory(patient)}
                          className="inline-flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Modal */}
        {showHistoryModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Lịch sử khám bệnh</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedPatient.fullName}</p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {patientHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có lịch sử khám bệnh</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientHistory.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => {
                          const bookingId = booking.submission_id || booking.id;
                          window.location.href = `/booking/${bookingId}`;
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <span className="font-semibold text-gray-900">
                                {formatDate(booking.appointment_date)} - {booking.appointment_time}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {booking.status === 'completed' ? 'Đã hoàn thành' :
                                 booking.status === 'confirmed' ? 'Đã xác nhận' :
                                 booking.status === 'pending' ? 'Chờ khám' : 'Đã hủy'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Khoa:</span> {booking.department}
                            </p>
                            {booking.reason && (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Lý do:</span> {booking.reason}
                              </p>
                            )}
                            {booking.medical_record && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                <span className="font-medium">Hồ sơ:</span> {booking.medical_record.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                          <Eye className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
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
