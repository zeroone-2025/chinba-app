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

// 특정 주의 특정 요일 날짜 계산
export function getDateForDayInWeek(day: string, weekOffset: number): string {
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();

  // DAYS 배열에서 선택된 요일의 인덱스 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)
  const targetDayIndex = DAYS.indexOf(day);

  // JavaScript getDay(): 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  const todayJSDay = today.getDay();

  // 이번 주 일요일 구하기 (주의 시작점)
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - todayJSDay);

  // 목표 날짜 계산 (weekOffset 주 후의 해당 요일)
  const targetDate = new Date(thisSunday);
  targetDate.setDate(thisSunday.getDate() + (weekOffset * 7) + targetDayIndex);

  return targetDate.toISOString().split('T')[0];
}

// 선택된 시간 슬롯들로부터 시작 시간과 종료 시간 계산
export function calculateTimeRangeFromSlots(slots: { day: string; time: string }[]): {
  startHour: number;
  endHour: number;
} {
  if (slots.length === 0) {
    return { startHour: 9, endHour: 10 }; // 기본값
  }

  // 시간 슬롯에서 시간 추출하여 정렬
  const hours = slots.map(slot => {
    const startTime = slot.time.split('-')[0];
    return parseInt(startTime.split(':')[0]);
  }).sort((a, b) => a - b);

  const startHour = Math.min(...hours);
  const endHour = Math.max(...hours) + 1; // 마지막 슬롯의 종료 시간

  return { startHour, endHour };
}

// 주의 시작일(일요일) 계산
export function getWeekStart(date: Date, weekOffset: number = 0): Date {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay() + (weekOffset * 7));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// 주 시작일과 요일 인덱스로 날짜 문자열 생성
export function toDateString(weekStart: Date, weekdayIndex: number): string {
  const targetDate = new Date(weekStart);
  targetDate.setDate(weekStart.getDate() + weekdayIndex);
  return targetDate.toISOString().split('T')[0];
}

// 날짜 문자열을 읽기 쉬운 형태로 포맷
export function formatDateRange(dateStr: string, startHour: number, endHour: number): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdayIndexToKorean(date.getDay());

  return `${month}/${day}(${weekday}) ${startHour}-${endHour}시`;
}