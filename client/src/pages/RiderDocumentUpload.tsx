import React, { useState, useRef } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Upload, FileText, Trash2, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface RiderDocument {
  id: number;
  name: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  url: string;
}

export default function RiderDocumentUpload() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [documents, setDocuments] = useState<RiderDocument[]>([
    {
      id: 1,
      name: 'Standard Performance Rider',
      fileName: 'performance_rider_2026.pdf',
      fileSize: 245000,
      uploadedAt: '2026-02-01',
      url: '#',
    },
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || user.role !== 'artist') {
    navigate('/');
    return null;
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 200);

    // Simulate upload completion
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add new document to list
      const newDocument: RiderDocument = {
        id: documents.length + 1,
        name: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString().split('T')[0],
        url: '#',
      };

      setDocuments([...documents, newDocument]);
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rider Documents</h1>
          <p className="mt-2 text-gray-600">Upload and manage your performance riders for venues to review</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Rider</h3>
            <p className="text-gray-600 mb-4">Drag and drop your PDF or Word document here, or click to browse</p>
            <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Uploading...</p>
                <p className="text-sm text-gray-600">{Math.round(uploadProgress)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">What to Include</h4>
                <p className="text-sm text-blue-800 mt-1">Technical requirements, equipment needs, sound check times, and any special requests</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">Pro Tip</h4>
                <p className="text-sm text-green-800 mt-1">Update your rider regularly to reflect current requirements and equipment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents uploaded yet</p>
              <p className="text-sm text-gray-500 mt-1">Upload your first rider to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="w-8 h-8 text-purple-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                        <p className="text-sm text-gray-600">
                          {doc.fileName} • {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(doc.url)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-3">Tips for Creating an Effective Rider</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li>✓ Keep it concise and professional (1-2 pages)</li>
            <li>✓ Include specific technical requirements and equipment needs</li>
            <li>✓ List any dietary restrictions or accessibility needs</li>
            <li>✓ Specify sound check and setup time requirements</li>
            <li>✓ Include contact information for your technical team</li>
            <li>✓ Update it regularly as your needs change</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
