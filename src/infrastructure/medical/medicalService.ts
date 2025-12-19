import { apiClient } from '../../config/api';
import type { MedicalFile } from '../../shared/types';

export const medicalService = {
  async uploadFile(file: File, fields: {
    userId: string;
    fullname?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }): Promise<MedicalFile> {
    const response = await apiClient.uploadFile<{ file: MedicalFile }>(
      '/medical/upload',
      file,
      {
        user_id: fields.userId,
        full_name: fields.fullname,
        email: fields.email,
        phone: fields.phone,
        notes: fields.notes || '',
      }
    );

    // SỬA: Kiểm tra và trả về dữ liệu
    if (!response.data?.file) {
      throw new Error('Upload failed: No file data returned');
    }

    // Trả về đối tượng file để thỏa mãn kiểu Promise<MedicalFile>
    return response.data.file;
  },

  async getUserFiles(userId: string): Promise<MedicalFile[]> {
    const response = await apiClient.get<{ files: MedicalFile[] }>(
      `/medical-files/user/${userId}`
    );
    // Lưu ý: getUserFiles đã viết đúng logic lấy data
    return response.data?.files || [];
  },

  async deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`/medical-files/${fileId}`);
  },
};