import { useState, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import { useClubStore } from '@/stores/clubStore'
import TimetableGrid, { DAYS, TIME_SLOTS, type TimeSlot } from '@/components/common/TimetableGrid'
import type { PersonalSchedule } from '@/types'

interface AddPersonalScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  onSubmit: (schedule: Omit<PersonalSchedule, 'id' | 'memberId'>) => void
}

const AddPersonalScheduleModal = ({ isOpen, onClose, memberId, memberName, onSubmit }: AddPersonalScheduleModalProps) => {
  const clubStore = useClubStore()
  const [formData, setFormData] = useState({
    title: '',
    note: ''
  })
  const [showTimetableModal, setShowTimetableModal] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(0) // 0: 이번주, 1: 다음주
  const [selectedFreeTimeSlots, setSelectedFreeTimeSlots] = useState<{ day: string; time: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: string; time: string; isDeselecting?: boolean } | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // 선택된 날짜와 시간 정보
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: string;
    startHour: number;
    endHour: number;
  } | null>(null)

  // 현재 멤버의 기존 개인일정들
  const existingSchedules = useMemo(() => {
    return clubStore.personalSchedulesByMember[memberId] || [];
  }, [clubStore.personalSchedulesByMember, memberId]);

  // 모든 멤버들의 개인일정 (본인 포함)
  const allMembersPersonalSchedules = useMemo(() => {
    if (!clubStore.selectedTeam?.team.participants) return [];

    const allSchedules: any[] = [];
    clubStore.selectedTeam.team.participants.forEach(participant => {
      const schedules = clubStore.personalSchedulesByMember[participant.id] || [];
      allSchedules.push(...schedules);
    });
    return allSchedules;
  }, [clubStore.selectedTeam?.team.participants, clubStore.personalSchedulesByMember]);

  // 기존 개인일정 삭제
  const handleDeleteExistingSchedule = (scheduleId: string) => {
    if (confirm('이 개인일정을 삭제하시겠습니까?')) {
      clubStore.removePersonalSchedule(memberId, scheduleId);
    }
  };

  // TimetableGrid가 사용할 선택된 참가자 ID들
  const selectedParticipantIds = useMemo(() => {
    if (!clubStore.selectedTeam?.team.participants) return [];

    const teamId = clubStore.selectedTeam.team.teamId;
    let ids = clubStore.getSelectedParticipants(teamId);

    // 선택된 참가자가 없으면 모든 참가자를 자동 선택
    if (ids.length === 0) {
      ids = clubStore.selectedTeam.team.participants.map(p => p.id);
    }

    return ids;
  }, [clubStore.selectedTeam?.team.participants, clubStore.selectedTeam?.team.teamId, clubStore]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // 특정 주의 특정 요일 날짜 계산
  const getDateForDayInWeek = (day: string, weekOffset: number) => {
    const today = new Date();
    const targetDayIndex = DAYS.indexOf(day);
    const todayJSDay = today.getDay();

    // 이번 주 일요일 구하기 (주의 시작점)
    const thisSunday = new Date(today);
    thisSunday.setDate(today.getDate() - todayJSDay);

    // 목표 날짜 계산 (weekOffset 주 후의 해당 요일)
    const targetDate = new Date(thisSunday);
    targetDate.setDate(thisSunday.getDate() + (weekOffset * 7) + targetDayIndex);

    return targetDate.toISOString().split('T')[0];
  };

  // 시간 슬롯을 선택/해제하는 함수 (모든 시간 선택 가능)
  const toggleTimeSlot = (day: string, timeSlot: string) => {
    setSelectedFreeTimeSlots(prev => {
      const exists = prev.find(s => s.day === day && s.time === timeSlot);
      if (exists) {
        // 이미 선택된 경우 제거
        return prev.filter(s => !(s.day === day && s.time === timeSlot));
      } else {
        // 새로 선택하는 경우 추가 (공강시간이 아니어도 개인일정은 추가 가능)
        return [...prev, { day, time: timeSlot }];
      }
    });
  };

  // 마우스 다운 (드래그 시작 가능성)
  const handleMouseDown = (day: string, timeSlot: string) => {
    setIsDragging(true);
    const isStartSlotSelected = selectedFreeTimeSlots.some(s => s.day === day && s.time === timeSlot);
    setDragStart({ day, time: timeSlot, isDeselecting: isStartSlotSelected });
  };

  // 드래그 중
  const handleMouseEnter = (day: string, timeSlot: string) => {
    if (isDragging && dragStart) {
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

      // 드래그 영역 내의 모든 슬롯 (개인일정이므로 모든 시간 선택 가능)
      const dragAreaSlots: { day: string; time: string }[] = [];
      for (let d = minDay; d <= maxDay; d++) {
        for (let t = minTime; t <= maxTime; t++) {
          const targetDay = DAYS[d];
          const targetTime = timeSlots[t];
          dragAreaSlots.push({ day: targetDay, time: targetTime });
        }
      }

      setSelectedFreeTimeSlots(prev => {
        const nonDragSlots = prev.filter(slot => {
          const slotDayIndex = DAYS.indexOf(slot.day);
          const slotTimeIndex = timeSlots.indexOf(slot.time);
          return slotDayIndex < minDay || slotDayIndex > maxDay ||
                 slotTimeIndex < minTime || slotTimeIndex > maxTime;
        });

        if (dragStart.isDeselecting) {
          return nonDragSlots;
        } else {
          return [...nonDragSlots, ...dragAreaSlots];
        }
      });
    }
  };

  // 마우스 업 (클릭 또는 드래그 종료)
  const handleMouseUp = (day?: string, timeSlot?: string) => {
    if (isDragging && dragStart && day && timeSlot &&
        dragStart.day === day && dragStart.time === timeSlot) {
      toggleTimeSlot(day, timeSlot);
    }

    setIsDragging(false);
    setDragStart(null);
  };

  // 시간표 모달에서 확인 버튼 클릭
  const handleConfirmTimeSelection = () => {
    if (selectedFreeTimeSlots.length > 0) {
      // 선택된 시간 슬롯들을 기반으로 날짜와 시간 정보 계산
      const firstSlot = selectedFreeTimeSlots[0];
      const dateString = getDateForDayInWeek(firstSlot.day, currentWeek);

      // 시간 범위 계산
      const timeSlots = selectedFreeTimeSlots
        .map(slot => parseInt(slot.time.split(':')[0]))
        .sort((a, b) => a - b);

      const startHour = Math.min(...timeSlots);
      const endHour = Math.max(...timeSlots) + 1;

      setSelectedDateTime({
        date: dateString,
        startHour,
        endHour
      });

      setShowTimetableModal(false);
    }
  };

  // 시간표 모달 초기화
  const resetTimetableModal = () => {
    setSelectedFreeTimeSlots([]);
    setIsDragging(false);
    setDragStart(null);
  };

  const getIntensityColor = (count: number, day?: string, timeSlot?: string) => {
    const isSelected = day && timeSlot ? selectedFreeTimeSlots.some(slot => slot.day === day && slot.time === timeSlot) : false;

    // 선택된 시간 슬롯은 항상 강조 표시
    if (isSelected) {
      return 'bg-green-400 hover:bg-green-500 cursor-pointer border-4 border-green-600 shadow-lg ring-2 ring-green-300 transition-all duration-200';
    }

    if (count === 0) {
      // 일반 공강시간 - 연한 초록색, 호버시 더 진해짐
      return 'bg-green-100 hover:bg-green-200 cursor-pointer border border-green-300 transition-all duration-200';
    }

    // 수업이 있는 시간 - 기본적으로 클릭 불가능하지만 시각적으로는 표시
    switch (count) {
      case 1: return 'bg-blue-100 border border-blue-200';
      case 2: return 'bg-blue-200 border border-blue-300';
      case 3: return 'bg-blue-300 border border-blue-400';
      case 4: return 'bg-blue-500 border border-blue-600 text-white';
      case 5: return 'bg-blue-700 border border-blue-800 text-white';
      case 6:
      default: return 'bg-blue-900 border border-blue-900 text-white';
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.title.trim()) {
      newErrors.title = '일정 이름을 입력해주세요'
    }
    if (!selectedDateTime) {
      newErrors.datetime = '시간표에서 날짜와 시간을 선택해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedDateTime) return

    onSubmit({
      title: formData.title.trim(),
      date: selectedDateTime.date,
      startHour: selectedDateTime.startHour,
      endHour: selectedDateTime.endHour,
      ...(formData.note.trim() && { note: formData.note.trim() })
    });

    // 폼 초기화
    setFormData({ title: '', note: '' })
    setSelectedDateTime(null)
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setFormData({ title: '', note: '' })
    setSelectedDateTime(null)
    setErrors({})
    setShowTimetableModal(false)
    setCurrentWeek(0)
    resetTimetableModal()
    onClose()
  }

  // 선택된 날짜/시간 포맷팅
  const getFormattedDateTime = () => {
    if (!selectedDateTime) return null;
    const date = new Date(selectedDateTime.date);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${DAYS[date.getDay()]})`;
    const timeStr = `${selectedDateTime.startHour}:00-${selectedDateTime.endHour}:00`;
    return `${dateStr} ${timeStr}`;
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{memberName}님의 개인일정 추가</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 기존 개인일정 목록 */}
          {existingSchedules.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 text-gray-700">기존 개인일정</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {existingSchedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div className="flex-1">
                      <div className="font-medium text-yellow-800">{schedule.title}</div>
                      <div className="text-yellow-600">
                        {new Date(schedule.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short'
                        })} {schedule.startHour}:00-{schedule.endHour}:00
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingSchedule(schedule.id)}
                      className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              일정 이름 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예: 개인 약속, 병원 방문"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              날짜 및 시간 *
            </label>
            {selectedDateTime ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    {getFormattedDateTime()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDateTime(null)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    변경
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  resetTimetableModal();
                  setShowTimetableModal(true);
                }}
                className="w-full p-3 border border-dashed border-gray-300 rounded-md hover:border-primary hover:bg-muted/20 transition-colors"
              >
                시간표에서 날짜/시간 선택
              </button>
            )}
            {selectedFreeTimeSlots.length > 0 && showTimetableModal && (
              <p className="text-xs text-green-600 mt-1">
                선택된 시간 슬롯: {selectedFreeTimeSlots.length}개
              </p>
            )}
            {errors.datetime && <p className="text-sm text-red-500 mt-1">{errors.datetime}</p>}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium mb-1">
              메모
            </label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="추가 메모 (선택사항)"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>

      {/* 시간표 선택 모달 */}
      {showTimetableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">시간표에서 날짜/시간 선택</h3>
              <button
                onClick={() => setShowTimetableModal(false)}
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
                  selectedParticipantIds={selectedParticipantIds}
                  personalSchedules={allMembersPersonalSchedules}
                  onSlotMouseDown={handleMouseDown}
                  onSlotMouseEnter={handleMouseEnter}
                  onSlotMouseUp={handleMouseUp}
                  showFreeTimeText={true}
                  getIntensityColor={getIntensityColor}
                  showFree={true}
                />
              </div>

              {/* 선택된 시간 슬롯 정보 */}
              {selectedFreeTimeSlots.length > 0 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                    <span className="inline-block w-3 h-3 bg-green-400 border border-green-600 rounded mr-2"></span>
                    선택된 시간 슬롯: <span className="ml-1 px-2 py-0.5 bg-green-600 text-white rounded-full text-xs">{selectedFreeTimeSlots.length}개</span>
                  </div>
                  <div className="text-xs text-green-700">
                    ⏰ 예상 소요시간: <span className="font-medium">{selectedFreeTimeSlots.length}시간</span>
                  </div>
                  {selectedFreeTimeSlots.length > 1 && (
                    <div className="mt-2 text-xs text-green-600">
                      💡 여러 시간대가 선택되었습니다. 다시 클릭하여 개별 해제할 수 있습니다.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 p-2 bg-gray-50 rounded border text-xs text-gray-600">
                <div className="font-medium mb-1">📋 사용 방법:</div>
                <div className="space-y-1">
                  <div>• <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>연한 초록색: 공강시간 (권장)</div>
                  <div>• <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></span>파란색: 수업이 있는 시간 (개인일정 추가 가능)</div>
                  <div>• <span className="inline-block w-3 h-3 bg-green-400 border-2 border-green-600 rounded mr-1"></span>진한 초록색: 선택된 시간 (클릭시 해제)</div>
                  <div>• 개인일정은 수업이 있는 시간에도 추가할 수 있습니다</div>
                  <div>• 드래그로 여러 시간대를 한번에 선택하거나 해제할 수 있습니다</div>
                </div>
              </div>

              {/* 확인 버튼 */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowTimetableModal(false)}
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
      )}
    </div>
  )
}

export default AddPersonalScheduleModal