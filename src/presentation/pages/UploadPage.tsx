import { useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { medicalService } from '../../infrastructure/medical/medicalService';
import { Chatbot } from '../components/Chatbot';
import type { MedicalFile } from '../../shared/types';

interface UploadPageProps {
  user: any;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const UploadPage = ({ user }: UploadPageProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('File quá lớn. Tối đa 50MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setSuccess(false);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setSuccess(false);
    setLoading(true);

    const fields = {
      userId: user.cccd,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      notes: description || '',
    };

    try {
      await medicalService.uploadFile(file, fields);
      setSuccess(true);
      setFile(null);
      setDescription('');

      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Upload className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Upload Medical Files</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Upload your medical records, lab results, prescriptions, or any other health-related
            documents. Supported formats: PDF, JPG, PNG (Max 50MB)
          </p>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>File uploaded successfully!</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                  required
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileText className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-blue-600 font-medium hover:underline">
                    Click to browse files
                  </span>
                  <span className="text-sm text-gray-500 mt-2">
                    PDF up to 50MB
                  </span>
                </label>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium text-lg flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>{loading ? 'Uploading...' : 'Upload File'}</span>
            </button>
          </form>

          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Notes</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• All files are encrypted and stored securely</li>
              <li>• You can view all uploaded files in your Profile page</li>
              <li>• Medical professionals will have access to your files during appointments</li>
              <li>• Please ensure files are clear and readable</li>
            </ul>
          </div>
        </div>
      </div>

      <Chatbot user={user}/>
    </div>
  );
};
