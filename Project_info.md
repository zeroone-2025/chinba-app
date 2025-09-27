# CHINBA 프로젝트 발표 자료

## 📋 프로젝트 개요

### 프로젝트명: CHINBA
**한국 학생 친목 프로그램 서비스**

- **개발 기간**: 2025년 개발
- **프로젝트 목표**: 대학 동아리와 팀 기반 활동을 통해 학생들의 연결을 돕는 웹 애플리케이션
- **핵심 가치**: 동아리 활동 관리, 시간표 기반 모임 추천, 팀 성과 추적

---

## 🛠 기술 스택

### 프론트엔드 (메인 기술)
- **React 19** - 최신 버전 사용으로 성능 최적화
- **TypeScript** - 타입 안정성 확보
- **Vite 7** - 빠른 개발 서버 및 빌드 도구

### 상태 관리
- **Zustand** - 경량 상태 관리 라이브러리
  - React 19 호환성을 위해 Recoil에서 마이그레이션
  - 지속성(persistence) 지원으로 데이터 보존

### UI/UX
- **Tailwind CSS 3** - 유틸리티 기반 CSS 프레임워크
- **shadcn/ui** - 고품질 컴포넌트 라이브러리
- **Pretendard Variable** - 한글 최적화 폰트
- **Lucide React** - 일관된 아이콘 시스템

### 라우팅 및 차트
- **React Router DOM 7** - 최신 라우팅 시스템
- **Recharts** - 데이터 시각화를 위한 차트 라이브러리

### 개발 도구
- **ESLint + TypeScript ESLint** - 코드 품질 관리
- **PostCSS + Autoprefixer** - CSS 호환성

---

## 🏗 프로젝트 구조

### 폴더 구조
```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── layouts/         # 레이아웃 컴포넌트
│   │   ├── MainLayout.tsx      # 메인 앱 레이아웃
│   │   ├── Sidebar.tsx         # 동아리/팀 네비게이션
│   │   └── TabNavigation.tsx   # 상단 탭 네비게이션
│   ├── common/          # 공통 컴포넌트
│   │   └── TimetableGrid.tsx   # 시간표 그리드 (드래그 기능 포함)
│   ├── mannaja/         # "만나자" 페이지 전용 컴포넌트
│   ├── mohat/           # "뭐했니" 페이지 전용 컴포넌트
│   ├── jababa/          # "잡아봐" 페이지 전용 컴포넌트
│   └── ui/              # shadcn/ui 기본 컴포넌트
├── pages/               # 페이지별 메인 컴포넌트
│   ├── mannaja/Mannaja.tsx     # 홈/만남 페이지
│   ├── mohat/Mohat.tsx         # 활동 관리 페이지
│   └── jababa/Jababa.tsx       # 랭킹/경쟁 페이지
├── stores/              # Zustand 상태 관리
├── lib/                 # 유틸리티 함수
├── types/               # TypeScript 타입 정의
└── styles/              # 전역 스타일
```

### 레이아웃 시스템
- **1280px 중앙 정렬 컨테이너**
- **사이드바** (250px): 동아리/팀 네비게이션
- **탭 네비게이션**: 3개 주요 페이지 간 이동
- **반응형 디자인**: 모바일/태블릿 지원

---

## 💾 데이터 저장 및 상태 관리

### 1. clubStore (메인 데이터 관리)
**위치**: `src/stores/clubStore.ts`

#### 관리 데이터:
- **동아리/팀 구조**: NextOne(개발), ZeroOne(디자인), Prior(기획)
- **참가자 정보**: 개인 시간표, 개인 일정
- **참가자 선택**: 팀별 활동 참여자 관리
- **시간표 데이터**: `timetables.json`에서 로드

#### 주요 기능:
```typescript
// 팀 선택 및 관리
selectTeam: (club: string, team: Team) => void
toggleClub: (clubName: string) => void

// 참가자 관리
addParticipantsToCurrentTeam: (participants: Participant[]) => void
removeParticipantFromCurrentTeam: (participantId: string) => void

// 개인 일정 관리
addPersonalSchedule: (memberId: string, schedule: PersonalSchedule) => void
removePersonalSchedule: (memberId: string, scheduleId: string) => void

// 전역 ID 관리
getNextParticipantId: () => string  // G001, G002... 형식
```

### 2. mohatStore (활동 관리)
**위치**: `src/stores/mohatStore.ts`

#### 특징:
- **팀별 분리 저장**: 각 팀의 활동이 독립적으로 관리
- **동적 스토어 생성**: 팀 선택 시 해당 팀 전용 스토어 생성
- **자동 ID 생성**: 타임스탬프 + 랜덤 문자열

### 3. teamStore (점수 및 통계)
**위치**: `src/stores/teamStore.ts`

#### 관리 데이터:
- **팀 점수**: 활동별 점수 누적
- **활동 통계**: 활동 횟수, 총 참여시간, 참여율
- **팀 메타데이터**: 실제 팀 크기 (`timetables.json` 기반)

### 4. 데이터 지속성 (Persistence)
모든 주요 스토어는 `zustand/middleware`의 `persist`를 사용하여 브라우저 localStorage에 자동 저장됩니다.

---

## 🎯 핵심 기능

### 1. 만나자 (Mannaja) - 홈/모임 관리 페이지

#### 주요 기능:
- **시간표 업로드**: Google Gemini AI를 통한 이미지 텍스트 추출
- **팀 구성원 관리**: 참가자 추가/삭제, 시간표 관리
- **개인 일정 추가**: 드래그 기반 시간표 선택 (새로 구현)
- **공강 시간 추천**: 팀원들의 공통 공강 시간 자동 계산

#### 드래그 시간표 선택 시스템 (신규 구현):
```typescript
// 새로 추가된 타입
interface CellPos { day: number; slot: number; }
interface Range { day: number; start: number; end: number; }

// TimetableGrid 새 Props
dragEnabled?: boolean;
onDragStart?: (cell: CellPos) => void;
onDragMove?: (cell: CellPos) => void;
onDragEnd?: (range: Range) => void;
selectedRanges?: Range[];
dragPreview?: Range | null;
```

**특징**:
- 실시간 드래그 미리보기 (반투명 오버레이)
- 셀 격자에 스냅되는 선택
- 다중 구간 선택 지원
- 개별 구간 삭제 및 전체 초기화
- 터치/모바일 지원 (`pointer events`)

### 2. 뭐했니 (Mohat) - 활동 기록 및 관리

#### 주요 기능:
- **활동 추가**: 70개 이상의 사전 정의된 활동 카탈로그
- **활동 수정/삭제**: 실시간 편집 기능
- **점수 시스템**: 활동 난이도별 자동 점수 계산
- **이미지 첨부**: 활동 사진 업로드 및 미리보기
- **팀별 데이터**: 팀 전환 시 해당 팀 활동만 표시

#### 점수 계산 알고리즘:
```typescript
// 활동 난이도 점수 계산
export const difficultyScore = (activity: Activity) => {
  let score = 기본점수(소요시간);           // 30-110점
  score += 팀구성난도(최소참여인원);         // 0-20점
  score += 조율난도(가능시간대);           // 0-15점
  score += 장소난도(이동필요여부);         // 0-10점
  score += 카테고리보정(운동/학습);        // 0-10점
  return Math.max(10, Math.min(150, score));
};
```

### 3. 잡아봐 (Jababa) - 팀 랭킹 및 경쟁

#### 주요 기능:
- **실시간 랭킹**: 점수 기반 팀 순위
- **다중 지표**: 점수, 활동 횟수, 총 참여시간, 참여율
- **시각화**: Recharts 기반 바차트
- **동아리별 필터링**: 현재 선택된 동아리의 팀들만 표시

---

## 🔧 구현 기술 세부사항

### 1. AI 통합 (Google Gemini)
**파일**: `src/lib/geminiAPI.ts`
- 시간표 이미지에서 텍스트 추출
- 구조화된 JSON 데이터로 변환
- 참가자 정보 자동 파싱

### 2. 시간표 처리 시스템
**파일**: `src/components/common/TimetableGrid.tsx`
- 기본 수업 시간표 + 개인 일정 병합
- 공강 시간 자동 계산
- 참여율 기반 색상 코딩
- 드래그 앤 드롭 선택 (최신 추가)

### 3. 컴포넌트 설계 원칙
- **재사용성**: 공통 컴포넌트 분리
- **타입 안전성**: 모든 props와 state 타입 정의
- **성능 최적화**: `useMemo`, `useCallback` 활용
- **접근성**: ARIA 라벨 및 키보드 네비게이션

### 4. 스타일링 시스템
**파일**: `src/styles/main.css`
- CSS Custom Properties 기반 테마
- 다크 모드 지원
- 드래그 시각화 전용 클래스:
  ```css
  .tt-drag-preview { /* 드래그 미리보기 */ }
  .tt-selected { /* 선택된 범위 */ }
  ```

---

## 📊 데이터 플로우

### 1. 시간표 업로드 플로우
```
이미지 업로드 → Gemini AI 처리 → 데이터 추출 → clubStore 저장 → UI 업데이트
```

### 2. 활동 추가 플로우
```
활동 선택 → 점수 계산 → mohatStore 저장 → teamStore 점수 업데이트 → 랭킹 갱신
```

### 3. 개인 일정 추가 플로우 (신규)
```
시간표 드래그 → 범위 선택 → Range 변환 → clubStore 저장 → 시간표 재계산
```

---

## 🎨 UI/UX 특징

### 1. 디자인 시스템
- **일관된 컬러 팔레트**: Primary, Secondary, Muted 색상
- **타이포그래피**: Pretendard 폰트로 한글 최적화
- **간격 시스템**: Tailwind의 일관된 spacing
- **애니메이션**: 부드러운 전환 효과

### 2. 사용자 경험
- **직관적 네비게이션**: 3단계 구조 (동아리 → 팀 → 기능)
- **실시간 피드백**: 드래그, 호버, 클릭 시 즉시 반응
- **상태 표시**: 로딩, 성공, 오류 상태 명확히 구분
- **모바일 최적화**: 터치 제스처 지원

### 3. 접근성
- **키보드 네비게이션**: Tab, Enter, Arrow 키 지원
- **스크린 리더**: ARIA 라벨 및 역할 정의
- **색상 대비**: WCAG 2.1 AA 기준 준수

---

## 🚀 성능 최적화

### 1. 번들 최적화
- **Vite**: ES 모듈 기반 빠른 빌드
- **Tree Shaking**: 사용하지 않는 코드 제거
- **Code Splitting**: 페이지별 청크 분리

### 2. 런타임 최적화
- **React 19**: 최신 성능 개선사항 활용
- **Zustand**: Redux 대비 작은 번들 크기
- **이미지 최적화**: WebP 포맷 지원

### 3. 메모리 관리
- **이미지 URL**: `URL.revokeObjectURL`로 메모리 누수 방지
- **이벤트 리스너**: 컴포넌트 언마운트 시 정리
- **상태 정규화**: 중복 데이터 최소화

---

## 🧪 테스트 및 품질 관리

### 1. 개발 환경
- **TypeScript**: 컴파일 타임 타입 검사
- **ESLint**: 코드 스타일 및 버그 방지
- **Prettier**: 일관된 코드 포맷팅

### 2. 빌드 검증
```bash
npm run build    # TypeScript 컴파일 + Vite 빌드
npm run lint     # ESLint 검사
npm run preview  # 빌드 결과 미리보기
```

---

## 📈 확장 가능성

### 1. 기능 확장
- **알림 시스템**: 모임 일정 리마인더
- **채팅 기능**: 팀원 간 실시간 소통
- **캘린더 연동**: Google Calendar, Outlook 연동
- **모바일 앱**: React Native 포팅

### 2. 데이터 확장
- **백엔드 연동**: RESTful API 또는 GraphQL
- **실시간 동기화**: WebSocket 또는 Server-Sent Events
- **클라우드 저장**: Firebase, Supabase 연동

### 3. 분석 기능
- **사용자 행동 분석**: 활동 패턴 분석
- **추천 알고리즘**: 개인화된 활동 추천
- **리포트 생성**: 팀 성과 리포트 자동 생성

---

## 🔍 프로젝트 특장점

### 1. 기술적 우수성
- **최신 기술 스택**: React 19, TypeScript, Vite 7
- **성능 최적화**: 번들 크기 최소화, 렌더링 최적화
- **타입 안전성**: 100% TypeScript로 런타임 오류 방지

### 2. 사용자 중심 설계
- **한국 대학생 특화**: 학과, 동아리 문화 반영
- **직관적 인터페이스**: 학습 비용 최소화
- **모바일 친화적**: 언제 어디서나 접근 가능

### 3. 확장성과 유지보수성
- **모듈화된 구조**: 기능별 독립적 개발 가능
- **일관된 코딩 스타일**: 팀 개발에 적합
- **명확한 타입 정의**: 코드 가독성 및 유지보수성 향상

---

## 💡 예상 질의응답

### Q1: 왜 Zustand를 선택했나요?
**A**: React 19 호환성과 번들 크기 최적화를 위해 선택했습니다. Redux Toolkit 대비 약 80% 작은 크기이며, 설정이 간단하고 TypeScript 지원이 우수합니다.

### Q2: AI 기능은 어떻게 구현했나요?
**A**: Google Gemini API를 사용하여 시간표 이미지에서 텍스트를 추출하고, 구조화된 JSON으로 변환합니다. 오류 처리와 재시도 로직을 포함하여 안정성을 확보했습니다.

### Q3: 드래그 기능 구현의 어려운 점은?
**A**: 터치 디바이스 호환성과 성능 최적화가 가장 어려웠습니다. Pointer Events API를 사용하여 마우스와 터치를 통합 처리하고, 불필요한 렌더링을 방지하기 위해 상태 최적화를 했습니다.

### Q4: 확장성은 어떻게 보장했나요?
**A**: 컴포넌트별 독립적 개발이 가능하도록 모듈화했고, 타입 안전성을 통해 리팩토링 시 오류를 방지했습니다. 또한 설정 파일을 통한 동아리 추가가 간단합니다.

### Q5: 성능 최적화는 어떻게 했나요?
**A**: React 19의 최신 기능을 활용하고, 번들 분할, 이미지 최적화, 메모이제이션을 적용했습니다. 또한 필요한 컴포넌트만 렌더링하도록 상태 설계를 최적화했습니다.

---

## 🎯 프로젝트 성과 및 학습 효과

### 1. 기술적 성취
- React 19 최신 기능 활용 경험
- 복잡한 상태 관리 시스템 설계
- AI API 통합 및 데이터 처리
- 고성능 드래그 앤 드롭 구현

### 2. 문제 해결 능력
- 성능 병목점 분석 및 해결
- 크로스 브라우저 호환성 확보
- 타입 시스템 설계 및 활용
- 사용자 경험 최적화

### 3. 프로젝트 관리
- 모듈화된 아키텍처 설계
- 코드 품질 관리 체계 구축
- Git 기반 버전 관리
- 문서화 및 주석 관리

---

**CHINBA 프로젝트**는 최신 웹 기술을 활용하여 한국 대학생들의 친목 활동을 효율적으로 관리할 수 있는 플랫폼입니다. 사용자 중심의 설계와 확장 가능한 아키텍처를 통해 실제 서비스로 발전시킬 수 있는 견고한 기반을 마련했습니다.