# 시간표 데이터 구조 명세

이 문서는 Gemini API를 통한 시간표 이미지 분석 및 참가자 데이터 추출 시 사용되는 JSON 구조를 정의합니다.

## 최상위 구조
```json
{
  "participants": [ ... ]
}
```
- `participants`: 여러 명의 참가자 정보를 담는 배열

---

## participants 배열 요소
```json
{
  "id": "S001",
  "name": "참가자1",
  "timetable": [ ... ]
}
```

| 필드명      | 타입     | 설명                  | 예시         |
|-------------|----------|-----------------------|--------------|
| `id`        | String   | 참가자 고유 ID        | `"S001"`     |
| `name`      | String   | 참가자 이름           | `"참가자1"`  |
| `timetable` | Array    | 시간표 데이터 배열    | `[ {...} ]`  |

---

## timetable 배열 요소
```json
{
  "day": "월",
  "time": "11:00-13:00",
  "subject": "확률및통계",
  "location": "전주:공과대학 7호관 301"
}
```

| 필드명      | 타입     | 설명                | 예시                           |
|-------------|----------|---------------------|--------------------------------|
| `day`       | String   | 요일 (월~금)        | `"월"`                         |
| `time`      | String   | 시간 범위           | `"11:00-13:00"`                |
| `subject`   | String   | 과목명              | `"확률및통계"`                  |
| `location`  | String   | 강의실 위치         | `"전주:공과대학 7호관 301"`     |

---

## 전체 구조 요약
- **participants**: `Array`
  - **id**: `String`
  - **name**: `String`
  - **timetable**: `Array`
    - **day**: `String` (요일)
    - **time**: `String` (`HH:MM-HH:MM`)
    - **subject**: `String` (과목명)
    - **location**: `String` (강의실 위치)

---

## 관련 파일
- `src/lib/geminiAPI.ts` - 이 구조를 기반으로 Gemini API 프롬프트 생성
- `src/types/index.ts` - TypeScript 인터페이스 정의
- `src/stores/clubStore.ts` - 추출된 데이터의 상태 관리
