import { useMemo } from 'react';
import { formatHourRange } from '@/lib/utils';
import { ymdToWeekdayIndex } from '@/lib/time';
import type { PersonalSchedule } from '@/types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TIME_SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00',
  '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00'
];

interface TimeSlot {
  day: string;
  time: string;
  count: number;
  participants: string[];
}

// New types for drag functionality
interface CellPos {
  day: number;
  slot: number;
}

interface Range {
  day: number;
  start: number;
  end: number; // exclusive (end - 1 is the last included slot)
}

interface Participant {
  id: string;
  name: string;
  timetable: Array<{
    subject: string;
    location: string;
    day: string;
    time: string;
  }>;
}

interface TimetableGridProps {
  participants: Participant[];
  selectedParticipantIds: string[];
  personalSchedules?: PersonalSchedule[]; // 개인일정 추가
  onSlotClick?: (day: string, timeSlot: string, count: number) => void;
  onSlotMouseDown?: (day: string, timeSlot: string) => void;
  onSlotMouseEnter?: (day: string, timeSlot: string) => void;
  onSlotMouseUp?: (day: string, timeSlot: string) => void;
  showFreeTimeText?: boolean;
  showFree?: boolean; // 공강 시각적 표시 옵션 추가
  getIntensityColor?: (count: number, day?: string, timeSlot?: string) => string;
  highlightedFreeTime?: {
    day: string;
    startHour: number;
    duration: number;
  } | null;
  // New drag functionality props
  dragEnabled?: boolean;
  onDragStart?: (cell: CellPos) => void;
  onDragMove?: (cell: CellPos) => void;
  onDragEnd?: (range: Range) => void;
  selectedRanges?: Range[];
  dragPreview?: Range | null;
}

const defaultGetIntensityColor = (count: number) => {
  if (count === 0) return 'bg-transparent';
  switch (count) {
    case 1: return 'bg-blue-100';
    case 2: return 'bg-blue-200';
    case 3: return 'bg-blue-300';
    case 4: return 'bg-blue-500';
    case 5: return 'bg-blue-700';
    case 6:
    default: return 'bg-blue-900';
  }
};

export default function TimetableGrid({
  participants,
  selectedParticipantIds,
  personalSchedules = [], // 개인일정 기본값 추가
  onSlotClick,
  onSlotMouseDown,
  onSlotMouseEnter,
  onSlotMouseUp,
  showFreeTimeText = false,
  showFree = false, // 공강 표시 기본값
  getIntensityColor = defaultGetIntensityColor,
  highlightedFreeTime,
  // New drag functionality props with defaults
  dragEnabled = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  selectedRanges = [],
  dragPreview = null
}: TimetableGridProps) {
  // 병합된 시간표 계산 (수업 + 개인일정 포함)
  const mergedTimetable = useMemo(() => {
    const selectedParticipants = participants.filter(p =>
      selectedParticipantIds.includes(p.id)
    );

    const timeSlotMap = new Map<string, TimeSlot>();

    // 1. 기존 수업 시간표 처리
    selectedParticipants.forEach(participant => {
      participant.timetable.forEach(slot => {
        const [startTime, endTime] = slot.time.split('-');
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);

        for (let hour = startHour; hour < endHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
          const key = `${slot.day}-${timeSlot}`;

          if (!timeSlotMap.has(key)) {
            timeSlotMap.set(key, {
              day: slot.day,
              time: timeSlot,
              count: 0,
              participants: []
            });
          }
          const existing = timeSlotMap.get(key)!;
          existing.count++;
          existing.participants.push(participant.name);
        }
      });
    });

    // 2. 개인일정 처리 - 선택된 참가자들의 개인일정만 포함
    personalSchedules.forEach(schedule => {
      // 해당 개인일정의 소유자가 선택된 참가자인지 확인
      if (!selectedParticipantIds.includes(schedule.memberId)) return;

      const participant = selectedParticipants.find(p => p.id === schedule.memberId);
      if (!participant) return;

      // 날짜를 요일로 변환
      const dayIndex = ymdToWeekdayIndex(schedule.date);
      const dayName = ['일', '월', '화', '수', '목', '금', '토'][dayIndex];

      // 시간 범위의 각 시간 슬롯을 처리
      for (let hour = schedule.startHour; hour < schedule.endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
        const key = `${dayName}-${timeSlot}`;

        if (!timeSlotMap.has(key)) {
          timeSlotMap.set(key, {
            day: dayName,
            time: timeSlot,
            count: 0,
            participants: []
          });
        }
        const existing = timeSlotMap.get(key)!;
        existing.count++;
        existing.participants.push(`${participant.name} (개인일정)`);
      }
    });

    return timeSlotMap;
  }, [participants, selectedParticipantIds, personalSchedules]);

  // Helper functions for drag functionality
  const getIndicesFromDaySlot = (day: string, timeSlot: string): CellPos => ({
    day: DAYS.indexOf(day),
    slot: TIME_SLOTS.indexOf(timeSlot)
  });

  const isInRange = (dayIndex: number, slotIndex: number, range: Range): boolean => {
    return range.day === dayIndex && slotIndex >= range.start && slotIndex < range.end;
  };

  const isInDragPreview = (dayIndex: number, slotIndex: number): boolean => {
    return dragPreview ? isInRange(dayIndex, slotIndex, dragPreview) : false;
  };

  const isInSelectedRanges = (dayIndex: number, slotIndex: number): boolean => {
    return selectedRanges.some(range => isInRange(dayIndex, slotIndex, range));
  };

  // Enhanced event handlers for drag support
  const handlePointerDown = (day: string, timeSlot: string, event: React.PointerEvent) => {
    if (dragEnabled) {
      event.preventDefault();
      const cellPos = getIndicesFromDaySlot(day, timeSlot);
      onDragStart?.(cellPos);
    }
    onSlotMouseDown?.(day, timeSlot);
  };

  const handlePointerMove = (day: string, timeSlot: string) => {
    if (dragEnabled) {
      const cellPos = getIndicesFromDaySlot(day, timeSlot);
      onDragMove?.(cellPos);
    }
    onSlotMouseEnter?.(day, timeSlot);
  };

  const handlePointerUp = (day: string, timeSlot: string) => {
    if (dragEnabled) {
      const cellPos = getIndicesFromDaySlot(day, timeSlot);
      const range: Range = {
        day: cellPos.day,
        start: cellPos.slot,
        end: cellPos.slot + 1
      };
      onDragEnd?.(range);
    }
    onSlotMouseUp?.(day, timeSlot);
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="grid grid-cols-8 bg-muted/50">
        <div className="p-2 text-sm font-medium text-center border-r">시간</div>
        {DAYS.map(day => (
          <div key={day} className="p-2 text-sm font-medium text-center border-r last:border-r-0">
            {day}요일
          </div>
        ))}
      </div>
      {TIME_SLOTS.map(timeSlot => (
        <div key={timeSlot} className="grid grid-cols-8 border-t">
          <div className="p-2 text-xs text-center border-r bg-muted/20">
            {formatHourRange(timeSlot)}
          </div>
          {DAYS.map((day, dayIndex) => {
            const slotKey = `${day}-${timeSlot}`;
            const slot = mergedTimetable.get(slotKey);
            const count = slot?.count || 0;
            const slotIndex = TIME_SLOTS.indexOf(timeSlot);

            // 강조 표시 여부 확인
            const isHighlighted = highlightedFreeTime &&
              highlightedFreeTime.day === day &&
              (() => {
                const slotHour = parseInt(timeSlot.split(':')[0]);
                const endHour = highlightedFreeTime.startHour + highlightedFreeTime.duration;
                return slotHour >= highlightedFreeTime.startHour && slotHour < endHour;
              })();

            // Drag state checks
            const isInDragPreviewArea = isInDragPreview(dayIndex, slotIndex);
            const isInSelectedArea = isInSelectedRanges(dayIndex, slotIndex);

            // Dynamic class calculation
            let cellClasses = 'p-2 text-xs border-r last:border-r-0 min-h-[40px] select-none relative';

            // Base color (original logic)
            if (count === 0 && showFree) {
              cellClasses += ' bg-green-100';
            } else {
              cellClasses += ` ${getIntensityColor(count, day, timeSlot)}`;
            }

            // Drag preview overlay (highest priority when dragging)
            if (isInDragPreviewArea && count === 0) {
              cellClasses += ' tt-drag-preview';
            }
            // Selected range overlay (when not in preview)
            else if (isInSelectedArea && count === 0) {
              cellClasses += ' tt-selected';
            }

            // Interactive states
            if (dragEnabled || onSlotClick || onSlotMouseDown) {
              cellClasses += ' cursor-pointer';
            }

            // Legacy highlight (lowest priority)
            if (isHighlighted) {
              cellClasses += ' ring-4 ring-green-400 ring-opacity-70 z-10';
            }

            return (
              <div
                key={`${day}-${timeSlot}`}
                onClick={() => onSlotClick?.(day, timeSlot, count)}
                onPointerDown={(e) => handlePointerDown(day, timeSlot, e)}
                onPointerMove={() => handlePointerMove(day, timeSlot)}
                onPointerUp={() => handlePointerUp(day, timeSlot)}
                onMouseDown={() => onSlotMouseDown?.(day, timeSlot)}
                onMouseEnter={() => onSlotMouseEnter?.(day, timeSlot)}
                onMouseUp={() => onSlotMouseUp?.(day, timeSlot)}
                className={cellClasses}
                title={slot ? `${count}명: ${slot.participants.join(', ')}` : ''}
                style={{
                  touchAction: dragEnabled ? 'none' : 'auto' // Prevent scrolling during drag on mobile
                }}
              >
                {count > 0 && (
                  <div className="text-center font-medium">
                    {count}
                  </div>
                )}
                {count === 0 && (showFreeTimeText || showFree) && (
                  <div className="text-center text-green-700 text-xs font-medium whitespace-nowrap">
                    공강
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export { DAYS, TIME_SLOTS, type TimeSlot, type Participant, type CellPos, type Range };