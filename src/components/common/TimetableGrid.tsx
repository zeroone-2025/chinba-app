import { useMemo } from 'react';

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
  onSlotClick?: (day: string, timeSlot: string, count: number) => void;
  onSlotMouseDown?: (day: string, timeSlot: string) => void;
  onSlotMouseEnter?: (day: string, timeSlot: string) => void;
  onSlotMouseUp?: (day: string, timeSlot: string) => void;
  showFreeTimeText?: boolean;
  getIntensityColor?: (count: number, day?: string, timeSlot?: string) => string;
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
  onSlotClick,
  onSlotMouseDown,
  onSlotMouseEnter,
  onSlotMouseUp,
  showFreeTimeText = false,
  getIntensityColor = defaultGetIntensityColor
}: TimetableGridProps) {
  // 병합된 시간표 계산
  const mergedTimetable = useMemo(() => {
    const selectedParticipants = participants.filter(p =>
      selectedParticipantIds.includes(p.id)
    );

    const timeSlotMap = new Map<string, TimeSlot>();

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

    return timeSlotMap;
  }, [participants, selectedParticipantIds]);

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
            {timeSlot}
          </div>
          {DAYS.map(day => {
            const slotKey = `${day}-${timeSlot}`;
            const slot = mergedTimetable.get(slotKey);
            const count = slot?.count || 0;

            return (
              <div
                key={`${day}-${timeSlot}`}
                onClick={() => onSlotClick?.(day, timeSlot, count)}
                onMouseDown={() => onSlotMouseDown?.(day, timeSlot)}
                onMouseEnter={() => onSlotMouseEnter?.(day, timeSlot)}
                onMouseUp={() => onSlotMouseUp?.(day, timeSlot)}
                className={`p-2 text-xs border-r last:border-r-0 min-h-[40px] ${getIntensityColor(count, day, timeSlot)} ${
                  onSlotClick || onSlotMouseDown ? 'cursor-pointer' : ''
                } select-none`}
                title={slot ? `${count}명: ${slot.participants.join(', ')}` : ''}
              >
                {count > 0 && (
                  <div className="text-center font-medium">
                    {count}
                  </div>
                )}
                {count === 0 && showFreeTimeText && (
                  <div className="text-center text-green-700 text-xs">
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

export { DAYS, TIME_SLOTS, type TimeSlot, type Participant };