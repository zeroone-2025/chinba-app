import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { analyzeMutipleTimetableImages, testGeminiAPI, type ExtractedTimetableData } from '@/lib/geminiAPI';

interface TimetableUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted: (data: ExtractedTimetableData) => void;
}

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

export default function TimetableUploadModal({ isOpen, onClose, onDataExtracted }: TimetableUploadModalProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedTimetableData | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setUploadState('idle');
    setErrorMessage('');
    setExtractedData(null);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('업로드할 파일을 선택해주세요.');
      return;
    }

    setUploadState('analyzing');
    setErrorMessage('');

    try {
      console.log('시간표 분석 시작:', selectedFiles.length, '개 파일');

      // 먼저 Gemini API 연결 테스트
      const apiTest = await testGeminiAPI();
      if (!apiTest) {
        throw new Error('Gemini API 연결에 실패했습니다. API 키를 확인해주세요.');
      }

      const data = await analyzeMutipleTimetableImages(selectedFiles);
      console.log('분석 결과:', data);

      if (!data.participants || data.participants.length === 0) {
        throw new Error('시간표에서 참가자 정보를 찾을 수 없습니다. 이미지가 명확한지 확인해주세요.');
      }

      setExtractedData(data);
      setUploadState('success');
    } catch (error) {
      console.error('시간표 분석 오류:', error);
      const errorMsg = error instanceof Error ? error.message : '시간표 분석에 실패했습니다.';
      setErrorMessage(`분석 실패: ${errorMsg}`);
      setUploadState('error');
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setUploadState('idle');
    setSelectedFiles([]);
    setErrorMessage('');
    setExtractedData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">시간표 업로드</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 파일 업로드 영역 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시간표 이미지 파일 선택
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="timetable-files"
            />
            <label
              htmlFor="timetable-files"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              클릭하여 파일 선택
            </label>
            <p className="text-sm text-gray-500 mt-2">
              이미지 파일을 여러 개 선택할 수 있습니다 (JPG, PNG)
            </p>
          </div>
        </div>

        {/* 선택된 파일 목록 */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              선택된 파일 ({selectedFiles.length}개)
            </h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상태별 UI */}
        {uploadState === 'analyzing' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <Loader2 className="animate-spin h-5 w-5 text-blue-600 mr-3" />
              <span className="text-blue-800">AI가 시간표를 분석하고 있습니다...</span>
            </div>
          </div>
        )}

        {uploadState === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <span className="text-red-800">{errorMessage}</span>
            </div>
          </div>
        )}

        {uploadState === 'success' && extractedData && (
          <div className="mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-green-800">
                  시간표 분석이 완료되었습니다! {extractedData.participants.length}명의 시간표를 찾았습니다.
                </span>
              </div>
            </div>

            {/* 추출된 데이터 미리보기 */}
            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">추출된 시간표 미리보기</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {extractedData.participants.map((participant, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm text-gray-900 mb-2">
                      {participant.name} (ID: {participant.id})
                    </div>
                    <div className="text-xs text-gray-600">
                      {participant.timetable.length}개 수업:
                      {participant.timetable.slice(0, 3).map((entry, i) => (
                        <span key={i} className="ml-1">
                          {entry.day} {entry.time} {entry.subject}
                          {i < Math.min(participant.timetable.length, 3) - 1 ? ',' : ''}
                        </span>
                      ))}
                      {participant.timetable.length > 3 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            취소
          </button>

          {uploadState === 'success' && extractedData ? (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              팀원 목록에 추가
            </button>
          ) : (
            <button
              onClick={handleAnalyze}
              disabled={selectedFiles.length === 0 || uploadState === 'analyzing'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploadState === 'analyzing' ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                  분석 중...
                </>
              ) : (
                'AI 분석 시작'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}