import { useClubStore } from "@/stores/clubStore";

const Mannaja = () => {
  const selectedTeam = useClubStore((state) => state.selectedTeam);

  return (
    <div>
      <div className="mb-4 p-4 bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground">현재 선택된 팀</p>
        <p className="font-medium text-foreground">
          {selectedTeam?.club} - {selectedTeam?.team}
        </p>
      </div>
      <h1 className="text-3xl font-semibold text-foreground mb-6">만나자</h1>
      <p className="text-muted-foreground">
        {selectedTeam?.club} {selectedTeam?.team}의 만나자 페이지입니다.
      </p>
    </div>
  );
};

export default Mannaja;
