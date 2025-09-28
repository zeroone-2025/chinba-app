import { useState, useMemo, useCallback } from 'react'
import { X } from 'lucide-react'
import { useClubStore } from '@/stores/clubStore'
import TimetableGrid, { DAYS, TIME_SLOTS, type TimeSlot, type CellPos, type Range } from '@/components/common/TimetableGrid'
import { calculateTimeRangeFromSlots } from '@/lib/time'

interface TimeRange {
  week: number;
  weekdayIndex: number;
  startHour: number;
  endHour: number;
}

interface SelectFromTimetableModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (range: TimeRange) => void
}

const SelectFromTimetableModal = ({ isOpen, onClose, onConfirm }: SelectFromTimetableModalProps) => {
  const clubStore = useClubStore()
  const [currentWeek, setCurrentWeek] = useState(0) // 0: 이번주, 1: 다음주

  // New drag-based state management
  const [selectedRanges, setSelectedRanges] = useState<Range[]>([])
  const [dragPreview, setDragPreview] = useState<Range | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<CellPos | null>(null)

  // Legacy state for backward compatibility with existing UI
  const [selectedFreeTimeSlots, setSelectedFreeTimeSlots] = useState<{ day: string; time: string }[]>([])
  const [dragStart, setDragStart] = useState<{ day: string; time: string; isDeselecting?: boolean } | null>(null)

  // 현재 팀의 선택된 참가자들과 병합된 시간표 계산 (개인 일정 포함)
  const mergedTimetable = useMemo(() => {
    if (!clubStore.selectedTeam?.team.participants) return new Map();

    const teamId = clubStore.selectedTeam.team.teamId;
    let selectedParticipantIds = clubStore.getSelectedParticipants(teamId);

    // 선택된 참가자가 없으면 모든 참가자를 자동 선택
    if (selectedParticipantIds.length === 0) {
      selectedParticipantIds = clubStore.selectedTeam.team.participants.map(p => p.id);
    }

    const participants = clubStore.selectedTeam.team.participants.filter(p =>
      selectedParticipantIds.includes(p.id)
    );

    const timeSlotMap = new Map<string, TimeSlot>();

    // 참가자들의 기본 시간표 처리
    participants.forEach(participant => {
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

    // 개인 일정 처리
    participants.forEach(participant => {
      const personalSchedules = clubStore.personalSchedulesByMember[participant.id] || [];
      personalSchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.date);
        const dayIndex = scheduleDate.getDay();
        const dayName = DAYS[dayIndex];

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
    });

    return timeSlotMap;
  }, [clubStore.selectedTeam?.team.participants, clubStore.selectedTeam?.team.teamId, clubStore.personalSchedulesByMember, clubStore]);

  // Convert ranges to legacy slot format for UI compatibility
  const rangesToSlots = useCallback((ranges: Range[]): { day: string; time: string }[] => {
    const slots: { day: string; time: string }[] = [];
    ranges.forEach(range => {
      const dayName = DAYS[range.day];
      for (let slotIndex = range.start; slotIndex < range.end; slotIndex++) {
        const timeSlot = TIME_SLOTS[slotIndex];
        if (timeSlot) {
          slots.push({ day: dayName, time: timeSlot });
        }
      }
    });
    return slots;
  }, []);

  // Convert legacy slots to ranges (for backward compatibility)
  const slotsToRanges = useCallback((slots: { day: string; time: string }[]): Range[] => {
    const grouped = new Map<number, number[]>();

    slots.forEach(slot => {
      const dayIndex = DAYS.indexOf(slot.day);
      const slotIndex = TIME_SLOTS.indexOf(slot.time);
      if (dayIndex >= 0 && slotIndex >= 0) {
        if (!grouped.has(dayIndex)) {
          grouped.set(dayIndex, []);
        }
        grouped.get(dayIndex)!.push(slotIndex);
      }
    });

    const ranges: Range[] = [];
    grouped.forEach((slotIndices, dayIndex) => {
      slotIndices.sort((a, b) => a - b);

      let start = slotIndices[0];
      let end = start + 1;

      for (let i = 1; i < slotIndices.length; i++) {
        if (slotIndices[i] === end) {
          end++;
        } else {
          ranges.push({ day: dayIndex, start, end });
          start = slotIndices[i];
          end = start + 1;
        }
      }
      ranges.push({ day: dayIndex, start, end });
    });

    return ranges;
  }, []);

  // Helper functions for range manipulation
  const mergeRanges = useCallback((ranges: Range[]): Range[] => {
    if (ranges.length === 0) return [];

    const sorted = [...ranges].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.start - b.start;
    });

    const merged: Range[] = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      if (current.day === next.day && current.end >= next.start) {
        current.end = Math.max(current.end, next.end);
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);

    return merged;
  }, []);

  const removeRange = useCallback((ranges: Range[], toRemove: Range): Range[] => {
    const result: Range[] = [];

    ranges.forEach(range => {
      if (range.day !== toRemove.day) {
        result.push(range);
        return;
      }

      // Same day - handle overlap
      if (range.end <= toRemove.start || range.start >= toRemove.end) {
        // No overlap
        result.push(range);
      } else {
        // Has overlap - split if necessary
        if (range.start < toRemove.start) {
          result.push({ day: range.day, start: range.start, end: toRemove.start });
        }
        if (range.end > toRemove.end) {
          result.push({ day: range.day, start: toRemove.end, end: range.end });
        }
      }
    });

    return result;
  }, []);

  // Update legacy slots when ranges change
  useMemo(() => {
    setSelectedFreeTimeSlots(rangesToSlots(selectedRanges));
  }, [selectedRanges, rangesToSlots]);

  // 시간 슬롯을 선택/해제하는 함수 (legacy compatibility)
  const toggleTimeSlot = (day: string, timeSlot: string) => {
    const slotKey = `${day}-${timeSlot}`;
    const slot = mergedTimetable.get(slotKey);
    const count = slot?.count || 0;

    // 공강시간(count === 0)인 경우만 선택 가능
    if (count === 0) {
      const dayIndex = DAYS.indexOf(day);
      const slotIndex = TIME_SLOTS.indexOf(timeSlot);

      if (dayIndex >= 0 && slotIndex >= 0) {
        const newRange: Range = {
          day: dayIndex,
          start: slotIndex,
          end: slotIndex + 1
        };

        // Check if this slot is already selected
        const isSelected = selectedRanges.some(range =>
          range.day === dayIndex && slotIndex >= range.start && slotIndex < range.end
        );

        if (isSelected) {
          // Remove the slot
          setSelectedRanges(prev => mergeRanges(removeRange(prev, newRange)));
        } else {
          // Add the slot
          setSelectedRanges(prev => mergeRanges([...prev, newRange]));
        }
      }
    }
  };

  // New drag handlers for enhanced functionality
  const handleDragStart = useCallback((cell: CellPos) => {
    const slotKey = `${DAYS[cell.day]}-${TIME_SLOTS[cell.slot]}`;
    const slot = mergedTimetable.get(slotKey);
    const count = slot?.count || 0;

    if (count === 0) {
      setIsDragging(true);
      setDragStartPos(cell);
      setDragPreview({
        day: cell.day,
        start: cell.slot,
        end: cell.slot + 1
      });
    }
  }, [mergedTimetable]);

  const handleDragMove = useCallback((cell: CellPos) => {
    if (!isDragging || !dragStartPos) return;

    const minDay = Math.min(dragStartPos.day, cell.day);
    const maxDay = Math.max(dragStartPos.day, cell.day);
    const minSlot = Math.min(dragStartPos.slot, cell.slot);
    const maxSlot = Math.max(dragStartPos.slot, cell.slot);

    // For now, only support single-day selection (as per existing behavior)
    if (minDay === maxDay) {
      setDragPreview({
        day: minDay,
        start: minSlot,
        end: maxSlot + 1
      });
    }
  }, [isDragging, dragStartPos]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || !dragPreview) {
      setIsDragging(false);
      setDragStartPos(null);
      setDragPreview(null);
      return;
    }

    // Check if all slots in preview are free
    let allFree = true;
    for (let slotIndex = dragPreview.start; slotIndex < dragPreview.end; slotIndex++) {
      const slotKey = `${DAYS[dragPreview.day]}-${TIME_SLOTS[slotIndex]}`;
      const slot = mergedTimetable.get(slotKey);
      const count = slot?.count || 0;
      if (count > 0) {
        allFree = false;
        break;
      }
    }

    if (allFree) {
      // Check if selection overlaps with existing ranges
      const hasOverlap = selectedRanges.some(existing =>
        existing.day === dragPreview.day &&
        !(existing.end <= dragPreview.start || existing.start >= dragPreview.end)
      );

      if (hasOverlap) {
        // Remove overlapping ranges
        setSelectedRanges(prev => mergeRanges(removeRange(prev, dragPreview)));
      } else {
        // Add new range
        setSelectedRanges(prev => mergeRanges([...prev, dragPreview]));
      }
    }

    setIsDragging(false);
    setDragStartPos(null);
    setDragPreview(null);
  }, [isDragging, dragPreview, selectedRanges, mergedTimetable, mergeRanges, removeRange]);

  // Legacy mouse handlers (for backward compatibility)
  const handleMouseDown = (day: string, timeSlot: string) => {
    const slotKey = `${day}-${timeSlot}`;
    const slot = mergedTimetable.get(slotKey);
    const count = slot?.count || 0;

    if (count === 0) {
      // Legacy drag handling
      setIsDragging(true);
      const isStartSlotSelected = selectedFreeTimeSlots.some(s => s.day === day && s.time === timeSlot);
      setDragStart({ day, time: timeSlot, isDeselecting: isStartSlotSelected });
    }
  };

  // Legacy 드래그 중 (for backward compatibility when not using new drag system)
  const handleMouseEnter = (day: string, timeSlot: string) => {
    if (isDragging && dragStart && !dragStartPos) {
      const slotKey = `${day}-${timeSlot}`;
      const slot = mergedTimetable.get(slotKey);
      const count = slot?.count || 0;

      if (count === 0) {
        // 드래그 영역의 모든 슬롯을 선택/해제
        const dayIndex = DAYS.indexOf(day);
        const startDayIndex = DAYS.indexOf(dragStart.day);

        const timeSlots = TIME_SLOTS;
        const timeIndex = timeSlots.indexOf(timeSlot);
        const startTimeIndex = timeSlots.indexOf(dragStart.time);

        // 드래그 영역 계산
        const minDay = Math.min(dayIndex, startDayIndex);
        const maxDay = Math.max(dayIndex, startDayIndex);
        const minTime = Math.min(timeIndex, startTimeIndex);
        const maxTime = Math.max(timeIndex, startTimeIndex);

        // 드래그 영역 내의 모든 공강 슬롯
        const dragAreaSlots: { day: string; time: string }[] = [];
        for (let d = minDay; d <= maxDay; d++) {
          for (let t = minTime; t <= maxTime; t++) {
            const targetDay = DAYS[d];
            const targetTime = timeSlots[t];
            const targetSlotKey = `${targetDay}-${targetTime}`;
            const targetSlot = mergedTimetable.get(targetSlotKey);
            const targetCount = targetSlot?.count || 0;

            if (targetCount === 0) {
              dragAreaSlots.push({ day: targetDay, time: targetTime });
            }
          }
        }

        // Convert to ranges for new system
        const newRanges = slotsToRanges(dragAreaSlots);

        if (dragStart.isDeselecting) {
          // 해제 모드: 드래그 영역의 슬롯들 제거
          setSelectedRanges(prev => {
            let result = [...prev];
            newRanges.forEach(range => {
              result = removeRange(result, range);
            });
            return mergeRanges(result);
          });
        } else {
          // 선택 모드: 드래그 영역의 슬롯들 추가
          setSelectedRanges(prev => mergeRanges([...prev, ...newRanges]));
        }
      }
    }
  };

  // 마우스 업 (클릭 또는 드래그 종료)
  const handleMouseUp = (day?: string, timeSlot?: string) => {
    // 드래그가 시작되었지만 실제로는 클릭인 경우 (같은 위치에서 mouseDown과 mouseUp)
    if (isDragging && dragStart && day && timeSlot &&
        dragStart.day === day && dragStart.time === timeSlot && !dragStartPos) {
      // 단순 클릭으로 처리
      toggleTimeSlot(day, timeSlot);
    }

    setIsDragging(false);
    setDragStart(null);
  };

  // 시간표 모달에서 확인 버튼 클릭
  const handleConfirmTimeSelection = () => {
    if (selectedFreeTimeSlots.length > 0) {
      // 선택된 시간 슬롯들을 기반으로 범위 계산
      const firstSlot = selectedFreeTimeSlots[0];
      const weekdayIndex = DAYS.indexOf(firstSlot.day);
      const { startHour, endHour } = calculateTimeRangeFromSlots(selectedFreeTimeSlots);

      onConfirm({
        week: currentWeek,
        weekdayIndex,
        startHour,
        endHour
      });

      // 모달 초기화
      resetModal();
    }
  };

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedRanges([]);
    setDragPreview(null);
    setIsDragging(false);
    setDragStartPos(null);
    setDragStart(null);
  }, []);

  // 모달 초기화
  const resetModal = () => {
    clearSelections();
    setCurrentWeek(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getIntensityColor = (count: number, day?: string, timeSlot?: string) => {
    const isSelected = day && timeSlot ? selectedFreeTimeSlots.some(slot => slot.day === day && slot.time === timeSlot) : false;

    if (count === 0) {
      if (isSelected) {
        // 선택된 공강 시간 - 파란색 하이라이트
        return 'bg-blue-200 hover:bg-blue-300 cursor-pointer ring-2 ring-blue-400';
      }
      return 'bg-green-100 hover:bg-green-200 cursor-pointer';
    }

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">시간표에서 날짜/시간 선택</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* 주차 선택 버튼 */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setCurrentWeek(0)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                currentWeek === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              이번주
            </button>
            <button
              type="button"
              onClick={() => setCurrentWeek(1)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                currentWeek === 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              다음주
            </button>
          </div>

          {/* 시간표 그리드 */}
          <div onMouseUp={() => handleMouseUp()}>
            <TimetableGrid
              participants={clubStore.selectedTeam?.team.participants || []}
              selectedParticipantIds={clubStore.getSelectedParticipants(clubStore.selectedTeam?.team.teamId || '')}
              // Legacy handlers for backward compatibility
              onSlotMouseDown={handleMouseDown}
              onSlotMouseEnter={handleMouseEnter}
              onSlotMouseUp={handleMouseUp}
              // New drag handlers
              dragEnabled={true}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              selectedRanges={selectedRanges}
              dragPreview={dragPreview}
              showFreeTimeText={true}
              getIntensityColor={getIntensityColor}
              showFree={true}
            />
          </div>

          {/* Selection controls */}
          {selectedRanges.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-blue-800">
                  선택된 구간: {selectedRanges.length}개
                </div>
                <button
                  type="button"
                  onClick={clearSelections}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  모두 삭제
                </button>
              </div>
              <div className="space-y-1">
                {selectedRanges.map((range, index) => {
                  const dayName = DAYS[range.day];
                  const startTime = TIME_SLOTS[range.start]?.split('-')[0] || '';
                  const endTime = TIME_SLOTS[range.end - 1]?.split('-')[1] || '';
                  const slotCount = range.end - range.start;

                  return (
                    <div key={index} className="flex items-center justify-between text-xs text-blue-700">
                      <span>
                        {dayName}요일 {startTime}-{endTime} ({slotCount}시간)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRanges(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="text-blue-500 hover:text-blue-700 ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 선택된 시간 슬롯 정보 */}
          {selectedFreeTimeSlots.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-2">
                선택된 시간 슬롯: {selectedFreeTimeSlots.length}개
              </div>
              <div className="text-xs text-green-700">
                예상 소요시간: {selectedFreeTimeSlots.length}시간
              </div>
              {(() => {
                const { startHour, endHour } = calculateTimeRangeFromSlots(selectedFreeTimeSlots);
                return (
                  <div className="text-xs text-green-700">
                    시간 범위: {startHour}:00 - {endHour}:00
                  </div>
                );
              })()}
            </div>
          )}

          <div className="mt-3 text-xs text-muted-foreground">
            * 초록색 영역(공강시간)을 클릭하거나 드래그하여 시간을 선택하세요.
            <br />* 이미 선택된 영역을 클릭하거나 드래그하면 선택이 해제됩니다.
          </div>

          {/* 확인 버튼 */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirmTimeSelection}
              disabled={selectedFreeTimeSlots.length === 0}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              확인 ({selectedFreeTimeSlots.length}개 선택)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectFromTimetableModal;