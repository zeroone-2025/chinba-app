import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 테스트 함수
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent("안녕하세요. 간단한 테스트입니다. '테스트 성공'이라고 답해주세요.");
    const response = await result.response;
    const text = response.text();

    console.log('Gemini API 테스트 응답:', text);
    return text.includes('테스트 성공') || text.length > 0;
  } catch (error) {
    console.error('Gemini API 테스트 실패:', error);
    return false;
  }
}

// 시간표 분석 테스트를 위한 Mock 데이터 생성
export function createMockTimetableData() {
  return {
    participants: [
      {
        id: "S001",
        name: "테스트학생1",
        timetable: [
          {
            day: "월",
            time: "09:00-11:00",
            subject: "테스트과목1",
            location: "테스트강의실1"
          },
          {
            day: "화",
            time: "13:00-15:00",
            subject: "테스트과목2",
            location: "테스트강의실2"
          }
        ]
      },
      {
        id: "S002",
        name: "테스트학생2",
        timetable: [
          {
            day: "수",
            time: "10:00-12:00",
            subject: "테스트과목3",
            location: "테스트강의실3"
          }
        ]
      }
    ]
  };
}