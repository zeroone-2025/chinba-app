import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY!);

/**
 * Gemini API 연결 테스트
 */
export async function testGeminiAPI(): Promise<boolean> {
  try {
    console.log('Gemini API 테스트 시작...');
    console.log('API 키 존재 여부:', !!import.meta.env.VITE_GEMINI_KEY);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("안녕하세요");
    const response = await result.response;
    const text = response.text();

    console.log('API 테스트 응답:', text);
    return text.length > 0;
  } catch (error) {
    console.error('Gemini API 테스트 실패:', error);
    return false;
  }
}

export interface TimetableEntry {
  day: string;
  time: string;
  subject: string;
  location: string;
}

export interface ExtractedTimetableData {
  participants: Array<{
    id: string;
    name: string;
    timetable: TimetableEntry[];
  }>;
}

/**
 * 이미지 파일을 base64로 변환
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64, 부분을 제거하고 순수 base64만 반환
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Gemini API를 사용하여 시간표 이미지를 분석하고 데이터를 추출
 */
export async function analyzeTimetableImage(file: File): Promise<ExtractedTimetableData> {
  try {
    console.log('시작: 파일 분석', file.name, file.type, file.size);

    // API 키 확인
    if (!import.meta.env.VITE_GEMINI_KEY) {
      throw new Error('VITE_GEMINI_KEY 환경변수가 설정되지 않았습니다.');
    }

    // 이미지를 base64로 변환
    const base64Data = await fileToBase64(file);
    console.log('Base64 변환 완료, 길이:', base64Data.length);

    // Gemini 모델 선택 (vision 기능을 위해 gemini-1.5-pro 사용)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `이 이미지를 분석해서 시간표 정보를 추출해주세요. 대학교 시간표가 있을 것입니다.

다음 JSON 형식으로만 응답해주세요:

{
  "participants": [
    {
      "id": "S001",
      "name": "학생이름",
      "timetable": [
        {
          "day": "월",
          "time": "09:00-11:00",
          "subject": "과목명",
          "location": "강의실위치"
        }
      ]
    }
  ]
}

규칙:
1. 요일은 월,화,수,목,금,토,일 중 하나
2. 시간은 HH:MM-HH:MM 형식
3. 학생 이름이 없으면 학생1로 설정
4. ID는 S001 형식
5. 순수 JSON만 응답 (마크다운 없이)

시간표에서 모든 수업을 찾아서 배열에 넣어주세요.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type
      }
    };

    console.log('Gemini API 호출 시작...');
    console.log('이미지 MIME 타입:', file.type);

    const result = await model.generateContent([prompt, imagePart]);
    console.log('API 호출 완료');

    const response = await result.response;
    const text = response.text();
    console.log('응답 길이:', text.length);

    // JSON 응답 파싱
    try {
      console.log('Gemini API 응답:', text); // 디버깅용

      // 응답에서 JSON 부분만 추출
      let jsonText = text.trim();

      // 마크다운 코드 블록 제거
      if (jsonText.includes('```json')) {
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
      } else if (jsonText.includes('```')) {
        const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
      }

      // JSON 객체만 추출
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      console.log('파싱할 JSON:', jsonText); // 디버깅용

      const parsedData = JSON.parse(jsonText.trim()) as ExtractedTimetableData;

      // 데이터 유효성 검증
      if (!parsedData.participants || !Array.isArray(parsedData.participants)) {
        throw new Error('Invalid data structure: participants array is missing');
      }

      // 각 참가자 데이터 검증 및 정규화
      parsedData.participants = parsedData.participants.map((participant, index) => {
        return {
          id: participant.id || `S${String(index + 1).padStart(3, '0')}`,
          name: participant.name || `학생${index + 1}`,
          timetable: (participant.timetable || []).map(entry => ({
            day: entry.day || '',
            time: entry.time || '',
            subject: entry.subject || '',
            location: entry.location || ''
          }))
        };
      });

      return parsedData;
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.log('응답 텍스트:', text);
      throw new Error(`시간표 데이터 파싱에 실패했습니다: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`);
    }

  } catch (error) {
    console.error('Gemini API 오류:', error);

    if (error instanceof Error) {
      // 구체적인 오류 메시지 제공
      if (error.message.includes('API key')) {
        throw new Error('Gemini API 키가 유효하지 않습니다. .env 파일의 VITE_GEMINI_KEY를 확인해주세요.');
      } else if (error.message.includes('quota')) {
        throw new Error('Gemini API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.message.includes('SAFETY')) {
        throw new Error('이미지가 안전 정책에 위배됩니다. 다른 이미지를 시도해주세요.');
      } else {
        throw new Error(`Gemini API 오류: ${error.message}`);
      }
    } else {
      throw new Error('시간표 분석 중 알 수 없는 오류가 발생했습니다.');
    }
  }
}

/**
 * 여러 이미지 파일을 순차적으로 분석
 */
export async function analyzeMutipleTimetableImages(files: File[]): Promise<ExtractedTimetableData> {
  const allParticipants: ExtractedTimetableData['participants'] = [];
  let participantIdCounter = 1;

  for (const file of files) {
    try {
      const result = await analyzeTimetableImage(file);

      // 참가자 ID를 재할당하여 중복 방지
      const processedParticipants = result.participants.map(participant => ({
        ...participant,
        id: `G${String(participantIdCounter++).padStart(3, '0')}`,
        name: participant.name || `학생${participantIdCounter - 1}`
      }));

      allParticipants.push(...processedParticipants);
    } catch (error) {
      console.error(`파일 ${file.name} 분석 실패:`, error);
      // 실패한 파일은 건너뛰고 계속 진행
    }
  }

  return {
    participants: allParticipants
  };
}