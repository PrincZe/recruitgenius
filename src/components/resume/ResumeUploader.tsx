'use client';

import React, { useState, useRef } from 'react';
import { Loader2, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf } from '@/lib/utils/pdfUtils';

interface ResumeUploaderProps {
  jobPostingId: string;
  onUploadComplete: (resumeIds: string[]) => void;
}

interface FileWithPreview {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  uploadProgress?: number;
  error?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

export default function ResumeUploader({ jobPostingId, onUploadComplete }: ResumeUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create a ref to store the actual File objects
  const fileObjectsRef = useRef<Record<string, File>>({});

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    }
  };

  // Validate and add files to state
  const addFiles = (newFiles: File[]) => {
    console.log('Adding files:', newFiles);
    
    const validFiles = newFiles.filter(file => {
      // Check if file has all required properties
      if (!file || !file.name || typeof file.name !== 'string') {
        console.warn('Invalid file object detected:', file);
        return false;
      }
      
      const isPDF = file.type === 'application/pdf';
      const isUnderSizeLimit = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isPDF) {
        console.warn('Non-PDF file rejected:', file.name);
      }
      
      if (!isUnderSizeLimit) {
        console.warn('File too large rejected:', file.name, file.size);
      }
      
      return isPDF && isUnderSizeLimit;
    });

    const invalidFiles = newFiles.filter(file => !validFiles.includes(file));
    
    if (invalidFiles.length > 0) {
      alert(`${invalidFiles.length} file(s) were rejected. Only PDF files under 10MB are allowed.`);
    }

    // Store the raw file blobs separately to preserve them
    const fileStore: Record<string, File> = {};
    
    const filesWithPreview = validFiles.map(file => {
      console.log('Creating preview for file:', file.name);
      const id = uuidv4();
      
      // Store the original file object in our map
      fileStore[id] = file;
      
      // Create a simplified object for state (without the File methods/properties)
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending' as const,
        uploadProgress: 0,
        // We don't include the actual File object here as it doesn't serialize well
      };
    });

    // Store the file objects in a ref for later use
    fileObjectsRef.current = {...fileObjectsRef.current, ...fileStore};
    
    setFiles(prev => [...prev, ...filesWithPreview]);
  };

  // Remove a file from the list
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    fileObjectsRef.current = {}; // Clear the file objects ref
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Handle file upload to Supabase
  const uploadFiles = async () => {
    if (files.length === 0) {
      alert('Please select at least one file to upload.');
      return;
    }

    // Check authentication first
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Authentication error:', sessionError);
      alert('Authentication error: Please make sure you are logged in.');
      return;
    }
    
    const session = sessionData?.session;
    
    if (!session) {
      console.error('No active session found. Please log in.');
      alert('Not authenticated: Please log in before uploading files.');
      return;
    }
    
    console.log('User is authenticated:', {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      authProvider: session.user.app_metadata?.provider || 'unknown'
    });

    setUploading(true);
    const uploadedResumeIds: string[] = [];
    
    try {
      // Update status of all files to uploading
      setFiles(prev => 
        prev.map(file => ({
          ...file,
          status: 'uploading',
          uploadProgress: 0
        }))
      );

      // Upload each file in sequence
      for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        const originalFile = fileObjectsRef.current[fileInfo.id];
        
        if (!originalFile) {
          console.error('Original file not found in ref:', fileInfo);
          setFiles(prev => 
            prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, status: 'error', error: 'Original file lost' } 
                : f
            )
          );
          continue; // Skip this file
        }
        
        const resumeId = uuidv4();
        
        // Get file name from our preserved info
        const fileName = fileInfo.name;
        
        console.log('Retrieved original file object:', {
          name: originalFile.name,
          size: originalFile.size,
          type: originalFile.type,
          hasSlice: typeof originalFile.slice === 'function'
        });
        
        // Make sure we have a valid filename
        if (!fileName) {
          console.error('File name is missing or undefined', fileInfo);
          setFiles(prev => 
            prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, status: 'error', error: 'File name is missing' } 
                : f
            )
          );
          continue; // Skip this file and proceed with the next one
        }
        
        // Create a safe filename without special characters that might cause issues
        const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${resumeId}/${safeFileName}`;
        
        console.log(`Processing file: ${safeFileName}, size: ${originalFile.size}, type: ${originalFile.type}`);
        
        // Update current file progress
        setFiles(prev => 
          prev.map(f => 
            f.id === fileInfo.id 
              ? { ...f, uploadProgress: 10 } 
              : f
          )
        );

        // Extract text from PDF
        let contentText = '';
        try {
          contentText = await extractTextFromPdf(originalFile);
          console.log(`Extracted ${contentText.length} characters of text from PDF`);
          
          // Update file progress after extraction
          setFiles(prev => 
            prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, uploadProgress: 30 } 
                : f
            )
          );
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
          // Continue with upload even if text extraction fails
          contentText = 'Failed to extract text from PDF';
        }

        // 1. Upload file to Storage
        console.log('Uploading file to path:', `${filePath}`);
        try {
          // Use the original file object directly
          const { data: storageData, error: storageError } = await supabase.storage
            .from('resumes')
            .upload(`${filePath}`, originalFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (storageError) {
            console.error('Storage upload error details:', {
              message: storageError.message,
              details: storageError,
              path: `${filePath}`,
              bucket: 'resumes'
            });
            throw new Error(`Storage error: ${storageError.message}`);
          }

          console.log('File uploaded successfully to storage', storageData);
          
          // Update file progress
          setFiles(prev => 
            prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, uploadProgress: 50 } 
                : f
            )
          );

          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(`${filePath}`);
          
          const fileUrl = publicUrlData.publicUrl;
          console.log('Generated public URL for file:', fileUrl);

          // 2. Create entry in resumes table
          try {
            const { data: resumeData, error: resumeError } = await supabase
              .from('resumes')
              .insert([
                {
                  id: resumeId,
                  file_url: fileUrl,
                  file_name: fileName,
                  file_size: originalFile.size,
                  content_text: contentText,
                  job_posting_id: jobPostingId
                }
              ])
              .select();

            if (resumeError) {
              console.error('Database insertion error:', resumeError);
              throw new Error(`Database error: ${resumeError.message}`);
            }

            console.log('Resume entry created in database:', resumeData);
            
            // 3. Update file status to success
            setFiles(prev => 
              prev.map(f => 
                f.id === fileInfo.id 
                  ? { ...f, status: 'success', uploadProgress: 100 } 
                  : f
              )
            );

            // Add to list of successfully uploaded resume IDs
            uploadedResumeIds.push(resumeId);
          } catch (dbError) {
            console.error('Error creating database entry:', dbError);
            setFiles(prev => 
              prev.map(f => 
                f.id === fileInfo.id 
                  ? { ...f, status: 'error', error: dbError instanceof Error ? dbError.message : 'Database error' } 
                  : f
              )
            );
          }
        } catch (uploadError) {
          console.error('Error uploading file to storage:', uploadError);
          setFiles(prev => 
            prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, status: 'error', error: uploadError instanceof Error ? uploadError.message : 'Upload error' } 
                : f
            )
          );
        }
      }

      // 4. Call the onUploadComplete callback with the IDs of uploaded resumes
      if (uploadedResumeIds.length > 0) {
        console.log(`Successfully uploaded ${uploadedResumeIds.length} resumes`, uploadedResumeIds);
        onUploadComplete(uploadedResumeIds);
        
        // 5. Clear files after short delay
        setTimeout(() => {
          clearFiles();
        }, 2000);
      } else {
        console.warn('No files were successfully uploaded');
      }

    } catch (error: any) {
      console.error('Error in upload process:', error);
      
      // Update file status for any files that failed
      setFiles(prev => 
        prev.map(file => 
          file.status === 'uploading' 
            ? { ...file, status: 'error', error: error.message } 
            : file
        )
      );
      
      alert(`Error uploading files: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Drag and drop zone */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
        <p className="mb-2 font-medium">Drag & drop resume files here</p>
        <p className="text-sm text-gray-500 mb-4">or click to browse files (PDF only, max 10MB)</p>
        
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        <button 
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          disabled={uploading}
        >
          Select Files
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">{files.length} file(s) selected</h3>
            <button 
              onClick={clearFiles}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={uploading}
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div className="flex items-center flex-1 pr-3">
                  <div className="mr-3">
                    {file.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {file.error && <span className="text-red-500 ml-2">{file.error}</span>}
                    </p>
                    {file.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${file.uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={uploadFiles}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              disabled={uploading || files.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${files.length} file(s)`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 