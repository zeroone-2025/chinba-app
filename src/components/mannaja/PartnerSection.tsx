import { useState, useMemo, useEffect } from "react";
import { Users } from "lucide-react";
import { useClubStore } from "@/stores/clubStore";
import TimetableGrid, { DAYS, type TimeSlot } from "@/components/common/TimetableGrid";

interface FreeTimeBlock {
  day: string;
  startHour: number;
  duration: number;
}

interface PartnerSectionProps {
  ctx: { clubType: string; team: string };
  onFreeTimeSelect: (freeTime: FreeTimeBlock | null) => void;
}

export default function PartnerSection({ onFreeTimeSelect }: PartnerSectionProps) {
  const selectedTeam = useClubStore((state) => state.selectedTeam);
  const { setSelectedParticipants: setStoreSelectedParticipants, getSelectedParticipants } = useClubStore();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedFreeTime, setSelectedFreeTime] = useState<FreeTimeBlock | null>(null);

  // Initialize selected participants when team changes
  useEffect(() => {
    if (selectedTeam?.team.participants) {
      const teamId = selectedTeam.team.teamId;
      const storedParticipants = getSelectedParticipants(teamId);

      if (storedParticipants.length > 0) {
        // 저장된 선택 상태가 있으면 복원
        setSelectedParticipants(storedParticipants);
      } else {
        // 없으면 모든 참가자 선택
        const allParticipantIds = selectedTeam.team.participants.map(p => p.id);
        setSelectedParticipants(allParticipantIds);
        setStoreSelectedParticipants(teamId, allParticipantIds);
      }
    }
  }, [selectedTeam?.team.teamId, getSelectedParticipants, setStoreSelectedParticipants]);

  if (!selectedTeam || !selectedTeam.team.participants) {
    return (
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Users className="h-5 w-5" />
          팀을 선택해주세요
        </h2>
        <div className="rounded-xl border p-4 text-sm text-muted-foreground">
          팀을 선택하면 팀원 정보와 시간표가 표시됩니다.
        </div>
      </section>
    );
  }

  const participants = selectedTeam.team.participants;

  const handleParticipantToggle = (participantId: string) => {
    const newSelectedParticipants = selectedParticipants.includes(participantId)
      ? selectedParticipants.filter(id => id !== participantId)
      : [...selectedParticipants, participantId];

    setSelectedParticipants(newSelectedParticipants);

    // 스토어에 저장
    if (selectedTeam?.team.teamId) {
      setStoreSelectedParticipants(selectedTeam.team.teamId, newSelectedParticipants);
    }
  };

  // 공강시간 계산을 위한 병합된 시간표 (TimetableGrid 내부에서 계산되므로 직접 계산)
  const mergedTimetable = useMemo(() => {
    if (!participants) return new Map();

    const timeSlotMap = new Map<string, TimeSlot>();

    const selectedParticipantData = participants.filter(p =>
      selectedParticipants.includes(p.id)
    );

    selectedParticipantData.forEach(participant => {
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
  }, [participants, selectedParticipants]);

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-transparent';

    // 최대 6명까지 6단계로 나누어서 색상 표시
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


  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        {selectedTeam.team.teamName} ({participants.length}명)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Participants List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium mb-3">팀원 목록</h3>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                onClick={() => handleParticipantToggle(participant.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedParticipants.includes(participant.id)
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(participant.id)}
                    onChange={() => handleParticipantToggle(participant.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {participant.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {participant.id} • {new Set(participant.timetable.map(t => t.subject)).size}개 과목
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 공강시간 표시 */}
          {selectedParticipants.length > 0 && (() => {
            const getFreeTimeBlocks = () => {
              const freeBlocks = [];

              // 각 요일별로 공강시간 계산
              for (const day of DAYS) {
                const daySchedule = [];

                // 해당 요일의 모든 시간대에서 수업이 있는지 확인
                for (let hour = 9; hour <= 20; hour++) {
                  const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
                  const slotKey = `${day}-${timeSlot}`;
                  const slot = mergedTimetable.get(slotKey);
                  const hasClass = (slot?.count || 0) > 0;

                  daySchedule.push({ hour, hasClass });
                }

                // 연속된 공강시간 찾기
                let currentFreeStart = null;
                for (let i = 0; i < daySchedule.length; i++) {
                  const { hour, hasClass } = daySchedule[i];

                  if (!hasClass && currentFreeStart === null) {
                    currentFreeStart = hour;
                  } else if (hasClass && currentFreeStart !== null) {
                    const duration = hour - currentFreeStart;
                    if (duration >= 1) {
                      freeBlocks.push({
                        day,
                        startHour: currentFreeStart,
                        duration
                      });
                    }
                    currentFreeStart = null;
                  }
                }

                // 하루 끝까지 공강인 경우
                if (currentFreeStart !== null) {
                  const duration = 21 - currentFreeStart;
                  if (duration >= 1) {
                    freeBlocks.push({
                      day,
                      startHour: currentFreeStart,
                      duration
                    });
                  }
                }
              }

              return freeBlocks;
            };

            const freeBlocks = getFreeTimeBlocks();

            return freeBlocks.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800 mb-2">
                  📅 공강시간
                </div>
                <div className="space-y-1">
                  {freeBlocks.map((block, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        const isAlreadySelected = selectedFreeTime?.day === block.day &&
                                                selectedFreeTime?.startHour === block.startHour;

                        if (isAlreadySelected) {
                          setSelectedFreeTime(null);
                          onFreeTimeSelect(null);
                        } else {
                          setSelectedFreeTime(block);
                          onFreeTimeSelect(block);
                        }
                      }}
                      className={`text-xs cursor-pointer p-2 rounded transition-colors ${
                        selectedFreeTime?.day === block.day &&
                        selectedFreeTime?.startHour === block.startHour
                          ? 'bg-green-200 text-green-800 font-medium'
                          : 'text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {block.day}요일: {block.startHour}:00-{block.startHour + block.duration}:00 ({block.duration}시간)
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Merged Timetable */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-medium mb-3">
            병합된 시간표 ({selectedParticipants.length}명 선택)
          </h3>

          {/* Color Legend */}
          <div className="mb-3 p-3 bg-muted/20 rounded-lg">
            <div className="text-sm font-medium mb-2">겹치는 인원 수</div>
            <div className="flex items-center gap-4 flex-wrap">
              {Array.from({length: Math.min(selectedParticipants.length, 6)}, (_, i) => i + 1).map(count => (
                <div key={count} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${getIntensityColor(count)}`}></div>
                  <span className="text-xs">{count}명</span>
                </div>
              ))}
            </div>
          </div>


          <TimetableGrid
            participants={participants}
            selectedParticipantIds={selectedParticipants}
            getIntensityColor={getIntensityColor}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            * 색상이 진할수록 더 많은 팀원이 동시에 수업이 있는 시간입니다.
          </div>
        </div>
      </div>
    </section>
  );
}