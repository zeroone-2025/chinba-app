// 날짜 문자열을 요일 인덱스로 변환 (0=일요일, 1=월요일, ..., 6=토요일)
export function ymdToWeekdayIndex(dateStr: string): number {
  return new Date(dateStr).getDay();
}

// 요일 인덱스를 한글 요일로 변환
export function weekdayIndexToKorean(dayIndex: number): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[dayIndex] || '';
}

// 시간 범위가 유효한지 검증
export function isValidTimeRange(startHour: number, endHour: number): boolean {
  return startHour >= 0 && endHour <= 24 && startHour < endHour;
}