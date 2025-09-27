import { useState, useMemo, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useMohatStore } from '@/stores/mohatStore'
import { SCORED_ACTIVITIES, difficultyScore } from '@/stores/activities'
import { useTeamStore, type Ctx } from '@/stores/teamStore'
import { useClubStore } from '@/stores/clubStore'
import TimetableGrid, { DAYS, TIME_SLOTS, type TimeSlot } from '@/components/common/TimetableGrid'

interface SelectedTeam {
  club: string
  team: string
}

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTeam: SelectedTeam | null
}


const AddActivityModal = ({ isOpen, onClose, selectedTeam }: AddActivityModalProps) => {
  const addActivity = useMohatStore((state) => state.addActivity)
  const { addScore, addActivitySample } = useTeamStore()
  const clubStore = useClubStore()
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    headcount: '',
    duration: '',
    description: '',
  })
  const [showCatalog, setShowCatalog] = useState(false)
  const [showTimetableModal, setShowTimetableModal] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(0) // 0: 이번주, 1: 다음주
  const [selectedFreeTimeSlots, setSelectedFreeTimeSlots] = useState<{ day: string; time: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: string; time: string; isDeselecting?: boolean } | null>(null)
  const [, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [selectedActivityScore, setSelectedActivityScore] = useState<number | null>(null)

  // 팀 변경 시 참여인원수 자동 업데이트
  useEffect(() => {
    if (clubStore.selectedTeam?.team.teamId) {
      const teamId = clubStore.selectedTeam.team.teamId;
      const selectedParticipantIds = clubStore.getSelectedParticipants(teamId);

      // 선택된 참가자가 없으면 모든 참가자를 자동 선택 (mergedTimetable에서도 동일하게 처리됨)
      const finalSelectedIds = selectedParticipantIds.length > 0
        ? selectedParticipantIds
        : clubStore.selectedTeam.team.participants.map(p => p.id);

      setFormData(prev => ({
        ...prev,
        headcount: finalSelectedIds.length.toString()
      }));
    }
  }, [clubStore.selectedTeam?.team.teamId, clubStore])

  // 현재 팀의 선택된 참가자들과 병합된 시간표 계산
  const mergedTimetable = useMemo(() => {
    if (!selectedTeam || !clubStore.selectedTeam?.team.participants) return new Map();

    const teamId = clubStore.selectedTeam.team.teamId;
    let selectedParticipantIds = clubStore.getSelectedParticipants(teamId);

    // 선택된 참가자가 없으면 모든 참가자를 자동 선택
    if (selectedParticipantIds.length === 0) {
      selectedParticipantIds = clubStore.selectedTeam.team.participants.map(p => p.id);
      clubStore.setSelectedParticipants(teamId, selectedParticipantIds);
    }

    const participants = clubStore.selectedTeam.team.participants.filter(p =>
      selectedParticipantIds.includes(p.id)
    );

    const timeSlotMap = new Map<string, TimeSlot>();

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

    return timeSlotMap;
  }, [selectedTeam, clubStore.selectedTeam?.team.participants, clubStore.selectedTeam?.team.teamId, clubStore]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCatalogSelect = (activity: typeof SCORED_ACTIVITIES[0]) => {
    setFormData(prev => ({
      ...prev,
      title: activity.name,
      description: activity.description || ''
    }))
    setSelectedActivityScore(activity.score || 0)
    setShowCatalog(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.date) {
      newErrors.date = '날짜를 입력해주세요'
    }
    if (!formData.title.trim()) {
      newErrors.title = '활동명을 입력해주세요'
    }
    if (!formData.headcount || parseInt(formData.headcount) <= 0) {
      newErrors.headcount = '참여인원수는 1 이상이어야 합니다'
    }
    if (formData.duration && parseInt(formData.duration) <= 0) {
      newErrors.duration = '소요시간은 1분 이상이어야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const ensureScore = (activityData: { title: string; headcount: number; duration?: number }) => {
    if (selectedActivityScore !== null) {
      return selectedActivityScore
    }
    // Calculate score based on form data if no catalog activity was selected
    return difficultyScore({
      id: 'temp',
      name: activityData.title || '',
      duration: activityData.duration || 60, // default duration
      minParticipants: activityData.headcount,
      category: 'social' // default category
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedTeam) return

    // Note: Image file is converted to Object URL for preview only
    // On page refresh, images will not persist as we're not storing actual file data
    const baseActivityData = {
      date: formData.date,
      title: formData.title.trim(),
      headcount: parseInt(formData.headcount),
      ...(formData.duration && { duration: parseInt(formData.duration) }),
      ...(formData.description.trim() && { description: formData.description.trim() }),
      ...(imagePreview && { imageUrl: imagePreview })
    }

    const score = ensureScore(baseActivityData)
    const activityData = { ...baseActivityData, score }

    const ctx: Ctx = { clubType: selectedTeam.club, team: selectedTeam.team }

    // Track activity samples for team statistics
    const dur = activityData.duration ?? 60 // default 60 minutes if not specified
    const ppl = parseInt(formData.headcount)

    addActivity(activityData, selectedTeam)
    addScore(ctx, score)
    addActivitySample(ctx, dur, ppl)

    // Reset form
    setFormData({ date: '', title: '', headcount: '', duration: '', description: '' })
    setImageFile(null)
    setImagePreview('')
    setErrors({})
    setSelectedActivityScore(null)
    onClose()
  }

  // 특정 주의 특정 요일 날짜 계산
  const getDateForDayInWeek = (day: string, weekOffset: number) => {
    const today = new Date();

    // DAYS 배열에서 선택된 요일의 인덱스 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)
    const targetDayIndex = DAYS.indexOf(day);

    // JavaScript getDay(): 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
    // 이제 DAYS 배열과 JavaScript getDay()가 정확히 일치함
    const todayJSDay = today.getDay();

    // 디버깅 로그 추가
    console.log('=== 날짜 계산 디버깅 ===');
    console.log('오늘:', today.toISOString().split('T')[0], `(${['일', '월', '화', '수', '목', '금', '토'][todayJSDay]})`);
    console.log('선택한 요일:', day);
    console.log('targetDayIndex:', targetDayIndex);
    console.log('weekOffset:', weekOffset);

    // 이번 주 일요일 구하기 (주의 시작점)
    const thisSunday = new Date(today);
    thisSunday.setDate(today.getDate() - todayJSDay);
    console.log('이번주 일요일:', thisSunday.toISOString().split('T')[0]);

    // 목표 날짜 계산 (weekOffset 주 후의 해당 요일)
    const targetDate = new Date(thisSunday);
    targetDate.setDate(thisSunday.getDate() + (weekOffset * 7) + targetDayIndex);

    const result = targetDate.toISOString().split('T')[0];
    console.log('계산된 날짜:', result);
    console.log('=== 날짜 계산 끝 ===');

    return result;
  };

  // 시간 슬롯을 선택/해제하는 함수
  const toggleTimeSlot = (day: string, timeSlot: string) => {
    const slotKey = `${day}-${timeSlot}`;
    const slot = mergedTimetable.get(slotKey);
    const count = slot?.count || 0;

    // 공강시간(count === 0)인 경우만 선택 가능
    if (count === 0) {
      setSelectedFreeTimeSlots(prev => {
        const exists = prev.find(s => s.day === day && s.time === timeSlot);
        if (exists) {
          // 이미 선택된 경우 제거
          return prev.filter(s => !(s.day === day && s.time === timeSlot));
        } else {
          // 새로 선택하는 경우 추가
          return [...prev, { day, time: timeSlot }];
        }
      });
    }
  };

  // 마우스 다운 (드래그 시작 가능성)
  const handleMouseDown = (day: string, timeSlot: string) => {
    const slotKey = `${day}-${timeSlot}`;
    const slot = mergedTimetable.get(slotKey);
    const count = slot?.count || 0;

    if (count === 0) {
      setIsDragging(true);
      // 드래그 시작점이 선택된 상태인지 확인하여 드래그 모드 결정
      const isStartSlotSelected = selectedFreeTimeSlots.some(s => s.day === day && s.time === timeSlot);
      setDragStart({ day, time: timeSlot, isDeselecting: isStartSlotSelected });
      // 여기서는 토글하지 않음 - mouseUp에서 처리
    }
  };

  // 드래그 중
  const handleMouseEnter = (day: string, timeSlot: string) => {
    if (isDragging && dragStart) {
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

        // 드래그 시작점의 상태에 따라 선택/해제 결정
        setSelectedFreeTimeSlots(prev => {
          // 드래그 영역 밖의 슬롯들 유지
          const nonDragSlots = prev.filter(slot => {
            const slotDayIndex = DAYS.indexOf(slot.day);
            const slotTimeIndex = timeSlots.indexOf(slot.time);
            return slotDayIndex < minDay || slotDayIndex > maxDay ||
                   slotTimeIndex < minTime || slotTimeIndex > maxTime;
          });

          if (dragStart.isDeselecting) {
            // 해제 모드: 드래그 영역의 슬롯들 제거
            return nonDragSlots;
          } else {
            // 선택 모드: 드래그 영역의 슬롯들 추가
            return [...nonDragSlots, ...dragAreaSlots];
          }
        });
      }
    }
  };

  // 마우스 업 (클릭 또는 드래그 종료)
  const handleMouseUp = (day?: string, timeSlot?: string) => {
    // 드래그가 시작되었지만 실제로는 클릭인 경우 (같은 위치에서 mouseDown과 mouseUp)
    if (isDragging && dragStart && day && timeSlot &&
        dragStart.day === day && dragStart.time === timeSlot) {
      // 단순 클릭으로 처리
      toggleTimeSlot(day, timeSlot);
    }

    setIsDragging(false);
    setDragStart(null);
  };

  // 시간표 모달에서 확인 버튼 클릭
  const handleConfirmTimeSelection = () => {
    if (selectedFreeTimeSlots.length > 0) {
      // 선택된 시간 슬롯들을 기반으로 날짜와 소요시간 계산
      const firstSlot = selectedFreeTimeSlots[0];
      const dateString = getDateForDayInWeek(firstSlot.day, currentWeek);
      const durationMinutes = selectedFreeTimeSlots.length * 60; // 각 슬롯당 1시간(60분)

      // 선택된 참가자 수 계산
      const teamId = clubStore.selectedTeam?.team.teamId;
      const selectedParticipantIds = teamId ? clubStore.getSelectedParticipants(teamId) : [];

      setFormData(prev => ({
        ...prev,
        date: dateString,
        duration: durationMinutes.toString(),
        headcount: selectedParticipantIds.length.toString()
      }));

      setShowTimetableModal(false);
    }
  };

  // 시간표 모달 초기화
  const resetTimetableModal = () => {
    setSelectedFreeTimeSlots([]);
    setIsDragging(false);
    setDragStart(null);
  };

  const getIntensityColor = (count: number, day: string, timeSlot: string) => {
    const isSelected = selectedFreeTimeSlots.some(slot => slot.day === day && slot.time === timeSlot);

    if (count === 0) {
      if (isSelected) {
        return 'bg-green-300 hover:bg-green-400 cursor-pointer border-2 border-green-500';
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

  const handleClose = () => {
    setFormData({ date: '', title: '', headcount: '', duration: '', description: '' })
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview('')
    setErrors({})
    setShowCatalog(false)
    setShowTimetableModal(false)
    setCurrentWeek(0)
    resetTimetableModal()
    setSelectedActivityScore(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">활동 추가</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              날짜 *
            </label>
            <input
              type="text"
              id="date"
              name="date"
              value={formData.date}
              onClick={() => {
                resetTimetableModal();
                setShowTimetableModal(true);
              }}
              onChange={handleInputChange}
              placeholder="시간표에서 날짜를 선택하세요"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              readOnly
            />
            {selectedFreeTimeSlots.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                선택된 시간 슬롯: {selectedFreeTimeSlots.length}개 ({selectedFreeTimeSlots.length}시간)
              </p>
            )}
            {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="title" className="block text-sm font-medium">
                활동명 *
              </label>
              <button
                type="button"
                onClick={() => setShowCatalog(!showCatalog)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                카탈로그에서 선택
                <ChevronDown className={`w-3 h-3 transition-transform ${showCatalog ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showCatalog && (
              <div className="mb-2 border rounded-md max-h-32 overflow-y-auto bg-muted/10">
                {SCORED_ACTIVITIES.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => handleCatalogSelect(activity)}
                    className="w-full text-left p-2 text-sm hover:bg-muted/20 border-b border-border/20 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{activity.name}</div>
                      {activity.difficulty && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full text-white ${
                          activity.difficulty === 'hard' ? 'bg-red-500' :
                          activity.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          {activity.difficulty === 'hard' ? 'HARD' :
                           activity.difficulty === 'medium' ? 'MED' : 'EASY'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.duration}분 · {activity.category}
                      {activity.score && (
                        <span className="ml-1">· {activity.score}점</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="활동명을 입력하세요"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="headcount" className="block text-sm font-medium mb-1">
              참여인원수 *
            </label>
            <input
              type="number"
              id="headcount"
              name="headcount"
              value={formData.headcount}
              onChange={handleInputChange}
              min="1"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="참여인원수를 입력하세요"
            />
            {errors.headcount && <p className="text-sm text-red-500 mt-1">{errors.headcount}</p>}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium mb-1">
              소요시간 (분)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="1"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="소요시간을 입력하세요 (기본: 60분)"
            />
            {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium mb-1">
              사진
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className="w-full max-h-40 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              설명
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="활동에 대한 설명을 입력하세요"
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
              제출
            </button>
          </div>
        </form>
      </div>

      {/* 시간표 선택 모달 */}
      {showTimetableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">시간표에서 날짜 선택</h3>
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
                  selectedParticipantIds={clubStore.getSelectedParticipants(clubStore.selectedTeam?.team.teamId || '')}
                  onSlotMouseDown={handleMouseDown}
                  onSlotMouseEnter={handleMouseEnter}
                  onSlotMouseUp={handleMouseUp}
                  showFreeTimeText={true}
                  getIntensityColor={getIntensityColor}
                />
              </div>

              {/* 선택된 시간 슬롯 정보 */}
              {selectedFreeTimeSlots.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-2">
                    선택된 시간 슬롯: {selectedFreeTimeSlots.length}개
                  </div>
                  <div className="text-xs text-green-700">
                    예상 소요시간: {selectedFreeTimeSlots.length * 60}분
                  </div>
                  <div className="text-xs text-green-700">
                    참여 예정 인원: {clubStore.selectedTeam?.team.teamId ? clubStore.getSelectedParticipants(clubStore.selectedTeam.team.teamId).length : 0}명
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-muted-foreground">
                * 초록색 영역(공강시간)을 클릭하거나 드래그하여 시간을 선택하세요.
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

export default AddActivityModal