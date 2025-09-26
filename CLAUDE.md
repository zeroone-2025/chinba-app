# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드를 제공합니다.

## 명령어

- **개발**: `npm run dev` - 포트 3000에서 Vite 개발 서버 시작
- **빌드**: `npm run build` - TypeScript 컴파일 + Vite 빌드
- **린트**: `npm run lint` - ESLint 검사
- **미리보기**: `npm run preview` - 빌드된 애플리케이션 미리보기

## 프로젝트 개요

**CHINBA**는 React 19, TypeScript, Vite로 구축된 한국 학생 친목 프로그램 서비스입니다. 이 애플리케이션은 동아리와 팀 기반 활동을 통해 학생들의 연결을 도와주며, "만나자", "뭐했니", "잡아봐"의 세 가지 주요 페이지를 제공합니다.

## 아키텍처

### 기술 스택
- **React 19** with TypeScript and Vite 7
- **상태 관리**: Zustand (React 19 호환성 문제로 Recoil에서 마이그레이션)
- **스타일링**: Tailwind CSS 3 + shadcn/ui 컴포넌트
- **타이포그래피**: 한글/영문 텍스트용 Pretendard Variable 폰트
- **라우팅**: React Router DOM 7
- **아이콘**: Lucide React

### 프로젝트 구조
```
src/
├── components/
│   ├── layouts/          # 레이아웃 컴포넌트
│   │   ├── MainLayout.tsx    # 메인 앱 레이아웃 래퍼
│   │   ├── Sidebar.tsx       # 동아리/팀 네비게이션 사이드바
│   │   └── TabNavigation.tsx # 상단 탭 네비게이션
│   └── ui/               # shadcn/ui 컴포넌트
├── pages/                # 페이지별 폴더 구조
│   ├── mannaja/              # "만나자" 페이지 관련
│   │   └── Mannaja.tsx           # 홈/만남 페이지 메인 컴포넌트
│   ├── jababa/               # "잡아봐" 페이지 관련
│   │   └── Jababa.tsx            # 잡기 페이지 메인 컴포넌트
│   └── mohat/                # "뭐했니" 페이지 관련
│       └── Mohat.tsx             # 활동 페이지 메인 컴포넌트
├── stores/
│   └── clubStore.ts          # 동아리/팀 상태용 Zustand 스토어
└── styles/
    └── main.css              # 전역 스타일 + Tailwind 임포트
```

### 레이아웃 시스템
- **1280px 중앙 정렬 컨테이너** - 좌측 사이드바 + 메인 콘텐츠 영역
- **사이드바** (250px): CHINBA 로고(홈 링크) + 접을 수 있는 동아리/팀 네비게이션
- **탭 네비게이션**: 호버/활성 상태를 가진 현대적인 pill 스타일 탭
- **메인 레이아웃**: 사이드바 + 탭 네비게이션 + 콘텐츠 영역 결합

### 상태 관리
`useClubStore` (Zustand)가 관리하는 항목:
- `clubs`: 팀을 포함한 동아리 배열 (개발 동아리, 디자인 동아리, 기획 동아리)
- `openClubs`: 사이드바에서 펼쳐진 동아리들 (기본적으로 모두 펼쳐짐)
- `selectedTeam`: 현재 선택된 동아리 + 팀 조합
- 액션: `toggleClub()`, `selectTeam()`

### 라우팅
- `/` → Mannaja (만나자) 페이지 - 홈/기본 라우트
- `/mohat` → Mohat (뭐했니) 페이지
- `/jababa` → Jababa (잡아봐) 페이지

### 스타일링 접근법
- **shadcn/ui** 컴포넌트 라이브러리와 Tailwind CSS 유틸리티
- **CSS 커스텀 속성** 테마용 (다크 모드 지원)
- **현대적 인터랙션**: 스케일 애니메이션, 그림자, 부드러운 전환
- **한글 최적화**: Pretendard 폰트 패밀리

## 개발 참고사항

### 경로 별칭
- `@/`는 Vite 설정을 통해 `src/` 디렉토리에 매핑됨

### React 19 마이그레이션
- **이전에는 Recoil 사용** but React 19 호환성을 위해 **Zustand로 마이그레이션**
- 현대적인 React 19 패턴 사용 (`createRoot`, `StrictMode`)

### 의존성 정리
- **SCSS → Tailwind CSS 전환**: `sass` 패키지 및 Vite SCSS 설정 제거
- **미사용 UI 컴포넌트**: `@radix-ui/react-tabs`, `src/components/ui/tabs.tsx` 제거
- **테스트 컴포넌트**: `src/TestApp.tsx` 제거 (디버깅용으로만 사용됨)
- **필수 의존성 유지**: `@radix-ui/react-collapsible` (Sidebar에서 사용), `autoprefixer`/`postcss` (Tailwind CSS 필요)

### 컴포넌트 패턴
- 모든 페이지는 Zustand 스토어에서 `selectedTeam`을 소비
- UI 컴포넌트는 클래스 병합을 위한 `cn()` 유틸리티와 함께 shadcn/ui 규칙을 따름
- 레이아웃 컴포넌트는 반응형 동작을 위해 flexbox 사용

### 페이지 폴더 구조
- **페이지별 폴더 분리**: 각 페이지(mannaja, jababa, mohat)마다 전용 폴더 생성
- **확장성 고려**: 페이지별 서브 컴포넌트, 훅, 유틸리티를 같은 폴더에 배치 가능
- **명확한 구조**: `pages/jababa/Jababa.tsx`, `pages/jababa/components/`, `pages/jababa/hooks/` 등으로 확장 가능