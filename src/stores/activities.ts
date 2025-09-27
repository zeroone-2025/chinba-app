import type { Activity } from '@/types';

// 이모지 매핑 테이블
const EMOJI_BY_NAME: Record<string, string> = {
  "스터디 그룹": "📚",
  "도서관 가기": "📖",
  "코딩 연습": "💻",
  "헬스장 운동": "💪",
  "농구": "🏀",
  "조깅": "🏃",
  "함께 점심": "🍽️",
  "함께 저녁": "🍽️",
  "카페 타임": "☕",
  "영화 감상": "🎬",
  "보드게임": "🎲",
  "음악 감상": "🎵",
  "동아리 모임": "👥",
  "프로젝트 회의": "📋",
  "낮잠": "😴",
  "명상": "🧘",
  "캠퍼스 산책": "🌿",
  "꽃사진 찍기": "🌸",
  "동방에서 단체사진": "📷",
  "신정문에서 단체사진": "📸",
  "동아리 회장/부회장과 사진 찍기": "⭐",
  "조이름 정하기": "💭",
  "인스타/카톡 교환": "💬",
  "조원을 태그한 스토리 올리기": "🏷️",
  "에타 친구 맺기": "🤝",
  "동방에 방명록 남기기": "📝",
  "MBTI/심리테스트 같이 해보기": "🧠",
  "카페 가기": "☕",
  "노래방 가기": "🎤",
  "선배들의 맛집 가기": "🍴",
  "인생네컷 찍고 동방에 붙이기": "📸",
  "릴스 찍고 업로드": "🎥",
  "서로 초상화 그려주기": "🎨",
  "동방에 있는 보드게임 하기": "🎲",
  "함께 학식 먹기": "🍚",
  "취미활동하기": "🎯",
  "대운동장에 누워서 같이 사진 찍기": "🌾",
  "드레스코드 맞춰서 인증샷": "👔",
  "다같이 낮잠자기": "💤",
  "보드게임방 가기": "🎲",
  "다른 조와 함께 놀기": "🎉",
  "PC방 가기": "🖥️",
  "볼링 치기": "🎳",
  "영화 보기 (장편)": "🎬",
  "술 마시기": "🍻",
  "원데이 클래스": "📚",
  "브이로그 제작": "📹"
};

export const DEFAULT_ACTIVITIES: Activity[] = [
  // 기존 학습 관련 활동들
  {
    id: 'study-group',
    name: '스터디 그룹',
    category: 'study',
    duration: 120,
    minParticipants: 2,
    maxParticipants: 8,
    description: '함께 공부하며 지식을 나누는 시간',
    timePreferences: [
      { startHour: 9, endHour: 12, weight: 0.9 },
      { startHour: 14, endHour: 18, weight: 0.8 }
    ]
  },
  {
    id: 'library-visit',
    name: '도서관 가기',
    category: 'study',
    duration: 60,
    minParticipants: 1,
    description: '조용한 환경에서 개인 학습',
    timePreferences: [
      { startHour: 9, endHour: 18, weight: 0.8 }
    ]
  },
  {
    id: 'coding-practice',
    name: '코딩 연습',
    category: 'study',
    duration: 90,
    minParticipants: 1,
    maxParticipants: 4,
    location: '컴퓨터실',
    description: '프로그래밍 실력 향상을 위한 연습',
    timePreferences: [
      { startHour: 10, endHour: 18, weight: 0.9 }
    ]
  },

  // 기존 운동 관련 활동들
  {
    id: 'gym-workout',
    name: '헬스장 운동',
    category: 'exercise',
    duration: 90,
    minParticipants: 1,
    maxParticipants: 6,
    location: '체육관',
    description: '체력 증진을 위한 운동',
    timePreferences: [
      { startHour: 9, endHour: 11, weight: 0.8 },
      { startHour: 17, endHour: 20, weight: 0.9 }
    ]
  },
  {
    id: 'basketball',
    name: '농구',
    category: 'exercise',
    duration: 60,
    minParticipants: 4,
    maxParticipants: 10,
    location: '농구장',
    description: '팀워크를 기르는 농구 경기',
    timePreferences: [
      { startHour: 15, endHour: 19, weight: 0.9 }
    ]
  },
  {
    id: 'jogging',
    name: '조깅',
    category: 'exercise',
    duration: 30,
    minParticipants: 1,
    maxParticipants: 8,
    description: '캠퍼스 둘레길 조깅',
    emoji: '🏃',
    timePreferences: [
      { startHour: 7, endHour: 9, weight: 0.9 },
      { startHour: 18, endHour: 20, weight: 0.8 }
    ]
  },

  // 기존 식사 관련 활동들
  {
    id: 'lunch-together',
    name: '함께 점심',
    category: 'meal',
    duration: 60,
    minParticipants: 2,
    maxParticipants: 12,
    location: '학식당',
    description: '친구들과 함께하는 점심 시간',
    timePreferences: [
      { startHour: 11, endHour: 14, weight: 1.0 }
    ]
  },
  {
    id: 'dinner-together',
    name: '함께 저녁',
    category: 'meal',
    duration: 90,
    minParticipants: 2,
    maxParticipants: 12,
    location: '학식당',
    description: '친구들과 함께하는 저녁 시간',
    timePreferences: [
      { startHour: 17, endHour: 19, weight: 1.0 }
    ]
  },
  {
    id: 'cafe-time',
    name: '카페 타임',
    category: 'meal',
    duration: 45,
    minParticipants: 1,
    maxParticipants: 8,
    location: '카페',
    description: '커피와 함께하는 휴식 시간',
    timePreferences: [
      { startHour: 10, endHour: 12, weight: 0.7 },
      { startHour: 14, endHour: 17, weight: 0.8 }
    ]
  },

  // 기존 여가 관련 활동들
  {
    id: 'movie-watching',
    name: '영화 감상',
    category: 'leisure',
    duration: 120,
    minParticipants: 1,
    maxParticipants: 20,
    location: '영화관',
    description: '최신 영화 감상',
    timePreferences: [
      { startHour: 14, endHour: 22, weight: 0.8 }
    ]
  },
  {
    id: 'board-games',
    name: '보드게임',
    category: 'leisure',
    duration: 90,
    minParticipants: 3,
    maxParticipants: 8,
    description: '다양한 보드게임으로 즐거운 시간',
    timePreferences: [
      { startHour: 15, endHour: 21, weight: 0.8 }
    ]
  },
  {
    id: 'music-listening',
    name: '음악 감상',
    category: 'leisure',
    duration: 60,
    minParticipants: 1,
    maxParticipants: 10,
    description: '좋아하는 음악을 함께 듣는 시간',
    timePreferences: [
      { startHour: 14, endHour: 20, weight: 0.7 }
    ]
  },

  // 기존 사회 활동
  {
    id: 'club-meeting',
    name: '동아리 모임',
    category: 'social',
    duration: 120,
    minParticipants: 5,
    maxParticipants: 30,
    description: '동아리 정기 모임',
    timePreferences: [
      { startHour: 16, endHour: 20, weight: 0.9 }
    ]
  },
  {
    id: 'project-meeting',
    name: '프로젝트 회의',
    category: 'social',
    duration: 90,
    minParticipants: 3,
    maxParticipants: 10,
    description: '팀 프로젝트 진행 회의',
    timePreferences: [
      { startHour: 10, endHour: 18, weight: 0.8 }
    ]
  },

  // 기존 휴식 관련
  {
    id: 'nap-time',
    name: '낮잠',
    category: 'rest',
    duration: 30,
    minParticipants: 1,
    maxParticipants: 1,
    location: '휴게실',
    description: '짧은 휴식으로 에너지 충전',
    emoji: '😴',
    timePreferences: [
      { startHour: 13, endHour: 15, weight: 0.9 }
    ]
  },
  {
    id: 'meditation',
    name: '명상',
    category: 'rest',
    duration: 20,
    minParticipants: 1,
    maxParticipants: 10,
    description: '마음을 정리하는 명상 시간',
    emoji: '🧘',
    timePreferences: [
      { startHour: 8, endHour: 10, weight: 0.8 },
      { startHour: 17, endHour: 19, weight: 0.7 }
    ]
  },
  {
    id: 'walk-campus',
    name: '캠퍼스 산책',
    category: 'rest',
    duration: 30,
    minParticipants: 1,
    maxParticipants: 5,
    description: '캠퍼스를 걸으며 여유로운 시간',
    emoji: '🌿',
    timePreferences: [
      { startHour: 14, endHour: 18, weight: 0.8 }
    ]
  },

  // === 사용자 정의 활동들 ===

  // 30분-1시간 공강용 활동들
  {
    id: 'flower-photo',
    name: '꽃사진 찍기',
    category: 'social',
    duration: 30,
    minParticipants: 2,
    location: '캠퍼스 내',
    description: '캠퍼스에서 예쁜 꽃과 함께 사진 찍기',
    emoji: '🌸',
    timePreferences: [
      { startHour: 10, endHour: 16, weight: 0.9 }
    ]
  },
  {
    id: 'club-room-photo',
    name: '동방에서 단체사진',
    category: 'social',
    duration: 20,
    minParticipants: 3,
    location: '동아리 동방',
    description: '동아리 동방에서 추억의 단체사진 촬영',
    emoji: '📷',
    timePreferences: [
      { startHour: 12, endHour: 18, weight: 0.8 }
    ]
  },
  {
    id: 'front-gate-photo',
    name: '신정문에서 단체사진',
    category: 'social',
    duration: 25,
    minParticipants: 3,
    location: '신정문',
    description: '학교 대표 장소에서 기념사진 촬영',
    emoji: '📷',
    timePreferences: [
      { startHour: 10, endHour: 17, weight: 0.8 }
    ]
  },
  {
    id: 'leader-photo',
    name: '동아리 회장/부회장과 사진 찍기',
    category: 'social',
    duration: 15,
    minParticipants: 2,
    location: '동아리 동방',
    description: '선배들과 함께하는 특별한 인증샷',
    emoji: '⭐',
    timePreferences: [
      { startHour: 12, endHour: 18, weight: 0.7 }
    ]
  },
  {
    id: 'team-naming',
    name: '조이름 정하기',
    category: 'social',
    duration: 30,
    minParticipants: 2,
    description: '창의적인 브레인스토밍으로 조이름 만들기',
    timePreferences: [
      { startHour: 10, endHour: 18, weight: 0.8 }
    ]
  },
  {
    id: 'contact-exchange',
    name: '인스타/카톡 교환',
    category: 'social',
    duration: 15,
    minParticipants: 2,
    description: '서로 소통할 수 있는 연락처 교환',
    emoji: '💬',
    timePreferences: [
      { startHour: 9, endHour: 21, weight: 0.9 }
    ]
  },
  {
    id: 'story-upload',
    name: '조원을 태그한 스토리 올리기',
    category: 'social',
    duration: 20,
    minParticipants: 2,
    description: '함께한 순간을 SNS에 공유하기',
    emoji: '🏷️',
    timePreferences: [
      { startHour: 10, endHour: 20, weight: 0.8 }
    ]
  },
  {
    id: 'eta-friend',
    name: '에타 친구 맺기',
    category: 'social',
    duration: 10,
    minParticipants: 2,
    description: '에브리타임에서 친구 추가하기',
    timePreferences: [
      { startHour: 9, endHour: 21, weight: 0.9 }
    ]
  },
  {
    id: 'guestbook',
    name: '동방에 방명록 남기기',
    category: 'social',
    duration: 20,
    minParticipants: 2,
    location: '동아리 동방',
    description: '동방에 추억과 감사 인사 남기기',
    timePreferences: [
      { startHour: 12, endHour: 18, weight: 0.8 }
    ]
  },
  {
    id: 'mbti-test',
    name: 'MBTI/심리테스트 같이 해보기',
    category: 'social',
    duration: 40,
    minParticipants: 3,
    description: '재미있는 심리테스트로 서로 알아가기',
    timePreferences: [
      { startHour: 13, endHour: 18, weight: 0.9 }
    ]
  },

  // 1-2시간 공강용 활동들
  {
    id: 'cafe-visit',
    name: '카페 가기',
    category: 'meal',
    duration: 90,
    minParticipants: 2,
    location: '근처 카페',
    description: '따뜻한 음료와 함께하는 대화 시간',
    timePreferences: [
      { startHour: 10, endHour: 17, weight: 0.9 }
    ]
  },
  {
    id: 'karaoke',
    name: '노래방 가기',
    category: 'leisure',
    duration: 120,
    minParticipants: 3,
    location: '노래방',
    description: '신나는 노래로 스트레스 해소',
    timePreferences: [
      { startHour: 14, endHour: 20, weight: 0.9 }
    ]
  },
  {
    id: 'senior-restaurant',
    name: '선배들의 맛집 가기',
    category: 'meal',
    duration: 90,
    minParticipants: 3,
    location: '맛집',
    description: '선배 추천 맛집에서 함께 식사',
    timePreferences: [
      { startHour: 11, endHour: 14, weight: 1.0 },
      { startHour: 17, endHour: 19, weight: 1.0 }
    ]
  },
  {
    id: 'life-four-cut',
    name: '인생네컷 찍고 동방에 붙이기',
    category: 'social',
    duration: 60,
    minParticipants: 2,
    location: '포토부스',
    description: '추억을 담은 네컷 사진으로 동방 꾸미기',
    timePreferences: [
      { startHour: 12, endHour: 18, weight: 0.8 }
    ]
  },
  {
    id: 'reels-making',
    name: '릴스 찍고 업로드',
    category: 'social',
    duration: 75,
    minParticipants: 2,
    description: '트렌디한 릴스 영상 제작 및 업로드',
    timePreferences: [
      { startHour: 13, endHour: 17, weight: 0.8 }
    ]
  },
  {
    id: 'portrait-drawing',
    name: '서로 초상화 그려주기',
    category: 'leisure',
    duration: 90,
    minParticipants: 2,
    description: '창의력을 발휘한 초상화 그리기',
    timePreferences: [
      { startHour: 14, endHour: 17, weight: 0.8 }
    ]
  },
  {
    id: 'club-board-games',
    name: '동방에 있는 보드게임 하기',
    category: 'leisure',
    duration: 100,
    minParticipants: 3,
    location: '동아리 동방',
    description: '동방 보드게임으로 즐거운 시간',
    timePreferences: [
      { startHour: 13, endHour: 18, weight: 0.9 }
    ]
  },
  {
    id: 'campus-meal',
    name: '함께 학식 먹기',
    category: 'meal',
    duration: 60,
    minParticipants: 2,
    location: '학생식당',
    description: '학식을 먹으며 수다 떨기',
    timePreferences: [
      { startHour: 11, endHour: 14, weight: 1.0 },
      { startHour: 17, endHour: 19, weight: 0.8 }
    ]
  },
  {
    id: 'hobby-activity',
    name: '취미활동하기',
    category: 'leisure',
    duration: 90,
    minParticipants: 2,
    description: '공예, 그림, 운동 등 상황에 맞는 취미활동',
    timePreferences: [
      { startHour: 14, endHour: 18, weight: 0.8 }
    ]
  },
  {
    id: 'field-lying-photo',
    name: '대운동장에 누워서 같이 사진 찍기',
    category: 'social',
    duration: 45,
    minParticipants: 3,
    location: '대운동장',
    description: '넓은 운동장에서 자유롭게 사진 촬영',
    timePreferences: [
      { startHour: 10, endHour: 16, weight: 0.9 }
    ]
  },
  {
    id: 'dress-code-photo',
    name: '드레스코드 맞춰서 인증샷',
    category: 'social',
    duration: 75,
    minParticipants: 3,
    description: '특별한 컨셉으로 맞춤 코디 인증샷',
    timePreferences: [
      { startHour: 13, endHour: 17, weight: 0.8 }
    ]
  },
  {
    id: 'group-nap',
    name: '다같이 낮잠자기',
    category: 'rest',
    duration: 60,
    minParticipants: 3,
    location: '동아리 동방',
    description: '돗자리나 매트에서 함께 휴식',
    timePreferences: [
      { startHour: 13, endHour: 15, weight: 1.0 }
    ]
  },

  // 2시간 이상 공강용 활동들
  {
    id: 'board-game-cafe',
    name: '보드게임방 가기',
    category: 'leisure',
    duration: 150,
    minParticipants: 4,
    location: '보드게임카페',
    description: '다양한 보드게임으로 즐거운 시간',
    timePreferences: [
      { startHour: 14, endHour: 18, weight: 0.9 }
    ]
  },
  {
    id: 'multi-team-activity',
    name: '다른 조와 함께 놀기',
    category: 'social',
    duration: 180,
    minParticipants: 6,
    description: '여러 조가 함께하는 대규모 활동',
    timePreferences: [
      { startHour: 14, endHour: 17, weight: 0.8 }
    ]
  },
  {
    id: 'pc-room',
    name: 'PC방 가기',
    category: 'leisure',
    duration: 150,
    minParticipants: 2,
    maxParticipants: 8,
    location: 'PC방',
    description: '온라인 게임으로 팀워크 다지기',
    timePreferences: [
      { startHour: 14, endHour: 19, weight: 0.9 }
    ]
  },
  {
    id: 'bowling',
    name: '볼링 치기',
    category: 'exercise',
    duration: 120,
    minParticipants: 4,
    location: '볼링장',
    description: '스트라이크로 스트레스 해소',
    timePreferences: [
      { startHour: 15, endHour: 19, weight: 0.9 }
    ]
  },
  {
    id: 'movie-watching-long',
    name: '영화 보기 (장편)',
    category: 'leisure',
    duration: 150,
    minParticipants: 2,
    location: '영화관',
    description: '긴 공강시간에 최신 영화 관람',
    timePreferences: [
      { startHour: 14, endHour: 16, weight: 0.8 }
    ]
  },
  {
    id: 'drinking',
    name: '술 마시기',
    category: 'social',
    duration: 180,
    minParticipants: 3,
    location: '주점',
    description: '성인 조원들과 함께하는 회식',
    timePreferences: [
      { startHour: 18, endHour: 21, weight: 1.0 }
    ]
  },
  {
    id: 'one-day-class',
    name: '원데이 클래스',
    category: 'study',
    duration: 150,
    minParticipants: 3,
    location: '문화센터',
    description: '새로운 기술이나 취미 배우기',
    timePreferences: [
      { startHour: 14, endHour: 17, weight: 0.8 }
    ]
  },

  // 기타 활동
  {
    id: 'vlog-making',
    name: '브이로그 제작',
    category: 'social',
    duration: 120,
    minParticipants: 2,
    description: '하루의 활동을 담은 브이로그 제작',
    timePreferences: [
      { startHour: 10, endHour: 18, weight: 0.7 }
    ]
  }
];

export const recommendByMinutes = (list: Activity[], minutes: number) =>
  list.filter(a => a.duration <= minutes).sort((a, b) => a.duration - b.duration);

const hoursWindows = (a: Activity) =>
  (a.timePreferences?.reduce((sum, p) => sum + Math.max(0, p.endHour - p.startHour), 0)) ?? 0;

export const difficultyScore = (a: Activity) => {
  // ① 기본: 소요시간
  let s =
    a.duration <= 30 ? 30 :
    a.duration <= 60 ? 50 :
    a.duration <= 90 ? 70 :
    a.duration <= 120 ? 90 : 110;

  // ② 팀 구성 난도
  if (a.minParticipants >= 3) s += 10;
  if (a.minParticipants >= 5) s += 10;        // 3명 이상 +10, 5명 이상 추가 +10
  if (a.maxParticipants === 1) s -= 10;       // 완전 솔로면 -10

  // ③ 조율 난도(가능 시간대가 좁을수록 +)
  const avail = hoursWindows(a);              // 총 가능 시간(시간)
  if (avail > 0) {
    if (avail <= 2) s += 15;
    else if (avail <= 4) s += 8;
    else if (avail <= 6) s += 4;
  }

  // ④ 장소 난도(이동 필요 추정)
  const offCampusHints = ['보드게임카페','영화관','볼링장','PC방','문화센터','포토부스','맛집','주점','카페'];
  if (a.location && offCampusHints.some(k => a.location!.includes(k))) s += 10;

  // ⑤ 카테고리 보정(선택)
  if (a.category === 'study') s += 5;
  if (a.category === 'exercise') s += 5;

  // 하한/상한 클램프
  s = Math.max(10, Math.min(150, s));
  return s;
};

const toDifficulty = (score: number): import('@/types').Difficulty =>
  score >= 100 ? 'hard' : score >= 60 ? 'medium' : 'easy';

export const SCORED_ACTIVITIES: Activity[] =
  DEFAULT_ACTIVITIES.map(a => {
    const score = difficultyScore(a);
    const emoji = a.emoji ?? EMOJI_BY_NAME[a.name] ?? "🔸";

    // 개발 편의를 위한 누락 경고
    if (!a.emoji && !EMOJI_BY_NAME[a.name]) {
      console.warn("Missing emoji for activity:", a.name);
    }

    return { ...a, score, difficulty: toDifficulty(score), emoji };
  });

// Helper function to get activity score from various sources
export function getActivityScore(activity: { id?: string; name?: string; score?: number }): number {
  // 1. Direct score property (from MohatActivity)
  if (typeof activity?.score === 'number') {
    return Math.round(activity.score);
  }

  // 2. Look up by ID in scored activities
  if (activity?.id) {
    const found = SCORED_ACTIVITIES.find(a => a.id === activity.id);
    if (found?.score) return Math.round(found.score);
  }

  // 3. Look up by name in scored activities
  if (activity?.name) {
    const found = SCORED_ACTIVITIES.find(a => a.name === activity.name);
    if (found?.score) return Math.round(found.score);
  }

  // 4. Default fallback
  return 0;
}