import { useState } from "react";
import { Upload } from "lucide-react";
import { useClubStore } from "@/stores/clubStore";
import PartnerSection from "@/components/mannaja/PartnerSection";
import RecommendSection from "@/components/mannaja/RecommendSection";

interface FreeTimeBlock {
  day: string;
  startHour: number;
  duration: number;
}

const Mannaja = () => {
  const selectedTeam = useClubStore((state) => state.selectedTeam);
  const [selectedFreeTime, setSelectedFreeTime] = useState<FreeTimeBlock | null>(null);

  const ctx = {
    clubType: selectedTeam?.club || "",
    team: selectedTeam?.team?.teamName || ""
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 파일 선택되어도 아무 기능 없음
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
          <input
            type="file"
            id="timetable-upload"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="timetable-upload"
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer text-sm"
          >
            <Upload className="w-4 h-4" />
            시간표 업로드
          </label>
        </div>
      </div>

      <h1 className="text-3xl font-semibold text-foreground mb-6">만나자</h1>

      <main className="space-y-6">
        <PartnerSection ctx={ctx} onFreeTimeSelect={setSelectedFreeTime} />
        <RecommendSection ctx={ctx} selectedFreeTime={selectedFreeTime} />
      </main>
    </div>
  );
};

export default Mannaja;