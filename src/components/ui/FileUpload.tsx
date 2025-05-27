import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileIcon, UploadCloud, X } from 'lucide-react';
import { Button } from './Button';
import { twMerge } from 'tailwind-merge';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  label?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  label = 'Upload files',
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept,
  className,
  error,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dropzoneError, setDropzoneError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setDropzoneError(null);
      
      if (files.length + acceptedFiles.length > maxFiles) {
        setDropzoneError(`You can only upload up to ${maxFiles} files`);
        return;
      }
      
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, maxFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesSelected(newFiles);
    setDropzoneError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    maxFiles,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection) {
        if (rejection.errors[0]?.code === 'file-too-large') {
          setDropzoneError(`File is too large. Max size is ${maxSize / 1024 / 1024}MB`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setDropzoneError('Invalid file type');
        } else {
          setDropzoneError(rejection.errors[0]?.message || 'Error uploading file');
        }
      }
    },
  });

  return (
    <div className={twMerge("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div
        {...getRootProps()}
        className={twMerge(
          "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-blue-400 bg-blue-50" 
            : "border-gray-300 hover:border-blue-400",
          (error || dropzoneError) && "border-red-500",
          "focus:outline-none focus:ring-2 focus:ring-blue-400"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-2">
          <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "Drop the files here"
              : "Drag and drop files here, or click to select files"}
          </p>
          <p className="text-xs text-gray-500">
            {`Maximum ${maxFiles} file${maxFiles !== 1 ? 's' : ''}, up to ${maxSize / 1024 / 1024}MB each`}
          </p>
        </div>
      </div>
      
      {(error || dropzoneError) && (
        <p className="mt-1 text-sm text-red-600">{error || dropzoneError}</p>
      )}
      
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li 
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <FileIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <Button 
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};