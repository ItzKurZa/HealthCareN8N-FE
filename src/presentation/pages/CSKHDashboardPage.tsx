import { useState, useEffect } from 'react';

interface Stats {
  totalSurveys: number;
  totalResponses: number;
  responseRate: number;
  averageRating: number;
  totalAlerts: number;
  pendingAlerts: number;
  totalVoiceCalls: number;
  negativeVoiceCalls: number;
}

interface Alert {
  id: string;
  type: 'survey' | 'voice';
  patientName: string;
  rating?: number;
  sentiment?: string;
  summary: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

interface SurveyResponse {
  id: string;
  patientName: string;
  rating: number;
  comments: string;
  createdAt: string;
}

const API_BASE = 'http://localhost:5000';

export function CSKHDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalSurveys: 0,
    totalResponses: 0,
    responseRate: 0,
    averageRating: 0,
    totalAlerts: 0,
    pendingAlerts: 0,
    totalVoiceCalls: 0,
    negativeVoiceCalls: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'responses'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/api/surveys/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const data = statsData.data;
        if (data) {
          setStats({
            totalSurveys: data.surveys?.total || 0,
            totalResponses: data.surveys?.completed || 0,
            responseRate: data.surveys?.total > 0 
              ? ((data.surveys?.completed || 0) / data.surveys.total * 100) 
              : 0,
            averageRating: data.surveys?.averageScore || 0,
            totalAlerts: data.alerts?.total || 0,
            pendingAlerts: data.alerts?.pending || 0,
            totalVoiceCalls: data.voiceCalls?.total || 0,
            negativeVoiceCalls: data.voiceCalls?.total - (data.voiceCalls?.success || 0),
          });
        }
      }

      // Fetch alerts
      const alertsRes = await fetch(`${API_BASE}/api/alerts/list`);
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.data || []);
      }

      // Fetch recent responses
      const responsesRes = await fetch(`${API_BASE}/api/surveys/recent`);
      if (responsesRes.ok) {
        const responsesData = await responsesRes.json();
        setRecentResponses(responsesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/${alertId}/resolve`, {
        method: 'PUT',
      });
      if (res.ok) {
        setAlerts(alerts.map(a => 
          a.id === alertId ? { ...a, status: 'resolved' } : a
        ));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'bg-green-100 text-green-800';
    if (sentiment === 'neutral') return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Dashboard Chăm Sóc Khách Hàng
          </h1>
          <p className="mt-2 text-gray-600">
            Theo dõi và quản lý phản hồi từ bệnh nhân
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Surveys Sent */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Khảo sát đã gửi</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSurveys}</p>
              </div>
            </div>
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tỷ lệ phản hồi</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.responseRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Điểm trung bình</p>
                <p className={`text-2xl font-semibold ${getRatingColor(stats.averageRating)}`}>
                  {stats.averageRating.toFixed(1)}/5
                </p>
              </div>
            </div>
          </div>

          {/* Pending Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cảnh báo cần xử lý</p>
                <p className="text-2xl font-semibold text-red-600">{stats.pendingAlerts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Call Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📞 Thống kê Voice Call</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Tổng cuộc gọi</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalVoiceCalls}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phản hồi tiêu cực</p>
                <p className="text-2xl font-bold text-red-600">{stats.negativeVoiceCalls}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tỷ lệ hài lòng</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalVoiceCalls > 0 
                    ? ((1 - stats.negativeVoiceCalls / stats.totalVoiceCalls) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Thống kê Survey</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Đã gửi</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalSurveys}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Đã phản hồi</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalResponses}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Chờ phản hồi</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.totalSurveys - stats.totalResponses}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'alerts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🔔 Cảnh báo ({alerts.filter(a => a.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('responses')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'responses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 Phản hồi gần đây
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Tổng quan hệ thống</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📧</div>
                      <p className="text-sm text-gray-500">Flow 1: Survey Send</p>
                      <p className="text-lg font-semibold text-green-600">Hoạt động</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-sm text-gray-500">Flow 2: Survey Response</p>
                      <p className="text-lg font-semibold text-green-600">Hoạt động</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">📞</div>
                      <p className="text-sm text-gray-500">Flow 3: Voice Call</p>
                      <p className="text-lg font-semibold text-green-600">Hoạt động</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3">Hướng dẫn nhanh:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li><strong>Flow 1:</strong> Tự động gửi email khảo sát cho bệnh nhân sau khi khám</li>
                    <li><strong>Flow 2:</strong> Xử lý phản hồi khảo sát, phân tích AI và gửi cảnh báo nếu điểm thấp</li>
                    <li><strong>Flow 3:</strong> Xử lý kết quả cuộc gọi AI Voice và gửi cảnh báo nếu tiêu cực</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Cảnh báo cần xử lý</h3>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">✅</div>
                    <p>Không có cảnh báo nào cần xử lý</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${
                          alert.status === 'resolved' ? 'bg-gray-50 opacity-60' : 'bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                alert.type === 'survey' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {alert.type === 'survey' ? '📝 Survey' : '📞 Voice'}
                              </span>
                              {alert.rating && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(alert.rating)} bg-gray-100`}>
                                  ⭐ {alert.rating}/5
                                </span>
                              )}
                              {alert.sentiment && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(alert.sentiment)}`}>
                                  {alert.sentiment}
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {alert.status === 'pending' ? '⏳ Chờ xử lý' : '✅ Đã xử lý'}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900">{alert.patientName}</p>
                            <p className="text-gray-600 text-sm mt-1">{alert.summary}</p>
                            <p className="text-gray-400 text-xs mt-2">{formatDate(alert.createdAt)}</p>
                          </div>
                          {alert.status === 'pending' && (
                            <button
                              onClick={() => handleResolveAlert(alert.id)}
                              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              Đánh dấu đã xử lý
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Responses Tab */}
            {activeTab === 'responses' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Phản hồi gần đây</h3>
                {recentResponses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p>Chưa có phản hồi nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bệnh nhân</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhận xét</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentResponses.map((response) => (
                          <tr key={response.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {response.patientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${getRatingColor(response.rating)}`}>
                                ⭐ {response.rating}/5
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {response.comments || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(response.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Thao tác nhanh</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              🔄 Làm mới dữ liệu
            </button>
            <a
              href="https://n8n.kurza.id.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              🔗 Mở N8N Workflow
            </a>
            <button
              onClick={() => window.open(`${API_BASE}/api/surveys/export`, '_blank')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              📥 Xuất báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
