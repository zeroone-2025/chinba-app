import { useState } from "react";
import { Upload } from "lucide-react";
import { useClubStore } from "@/stores/clubStore";
import PartnerSection from "@/components/mannaja/PartnerSection";
import RecommendSection from "@/components/mannaja/RecommendSection";
import TimetableUploadModal from "@/components/mannaja/TimetableUploadModal";
import type { ExtractedTimetableData } from "@/lib/geminiAPI";

interface FreeTimeBlock {
  day: string;
  startHour: number;
  duration: number;
}

const Mannaja = () => {
  const selectedTeam = useClubStore((state) => state.selectedTeam);
  const addParticipantsToCurrentTeam = useClubStore((state) => state.addParticipantsToCurrentTeam);
  const getNextParticipantId = useClubStore((state) => state.getNextParticipantId);
  const [selectedFreeTime, setSelectedFreeTime] = useState<FreeTimeBlock | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const ctx = {
    clubType: selectedTeam?.club || "",
    team: selectedTeam?.team?.teamName || ""
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };


  const handleDataExtracted = (data: ExtractedTimetableData) => {
    console.log('받은 추출 데이터:', data);

    if (!selectedTeam) {
      alert('팀을 선택해주세요.');
      return;
    }

    try {
      console.log('현재 선택된 팀:', selectedTeam.team.teamName);
      console.log('추가할 참가자들:', data.participants);

      // 각 참가자에게 전역 고유 ID 할당
      const participantsWithUniqueIds = data.participants.map((participant, index) => {
        const uniqueId = getNextParticipantId();
        return {
          ...participant,
          id: uniqueId,
          name: participant.name || `학생${uniqueId.slice(1)}`
        };
      });

      console.log('고유 ID가 할당된 참가자들:', participantsWithUniqueIds);

      // 추출된 참가자들을 현재 팀에 추가
      addParticipantsToCurrentTeam(participantsWithUniqueIds);

      console.log('참가자 추가 완료');
      alert(`${participantsWithUniqueIds.length}명의 참가자가 "${selectedTeam.team.teamName}" 팀에 추가되었습니다!`);
    } catch (error) {
      console.error('참가자 추가 실패:', error);
      alert(`참가자 추가에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-muted/20 rounded-lg flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">현재 선택된 팀</p>
          <p className="font-medium text-foreground">
            {selectedTeam?.club} - {selectedTeam?.team?.teamName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            시간표 업로드
          </button>
        </div>
      </div>

      <h1 className="text-3xl font-semibold text-foreground mb-6"></h1>

      <main className="space-y-6">
        <PartnerSection ctx={ctx} onFreeTimeSelect={setSelectedFreeTime} />
        <RecommendSection ctx={ctx} selectedFreeTime={selectedFreeTime} />
      </main>

      {/* 시간표 업로드 모달 */}
      <TimetableUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataExtracted={handleDataExtracted}
      />
    </div>
  );
};

export default Mannaja;