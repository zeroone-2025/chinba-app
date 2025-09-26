import { useClubStore } from "@/stores/clubStore";
import PartnerSection from "@/components/mannaja/PartnerSection";
import RecommendSection from "@/components/mannaja/RecommendSection";

const Mannaja = () => {
  const selectedTeam = useClubStore((state) => state.selectedTeam);

  const ctx = {
    clubType: selectedTeam?.club || "",
    team: selectedTeam?.team || ""
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground">현재 선택된 팀</p>
        <p className="font-medium text-foreground">
          {selectedTeam?.club} - {selectedTeam?.team}
        </p>
      </div>

      <h1 className="text-3xl font-semibold text-foreground mb-6">만나자</h1>

      <main className="space-y-6">
        <PartnerSection ctx={ctx} />
        <RecommendSection ctx={ctx} />
      </main>
    </div>
  );
};

export default Mannaja;