import { useState } from "react";
import { useClubStore } from "@/stores/clubStore";
import { useTeamStore } from "@/stores/teamStore";
import { ClubBarChart } from "@/components/jababa/ClubBarChart";
import { cn } from "@/lib/utils";

const METRICS = ['점수','활동 횟수','총 참여시간','참여율'] as const;
type Metric = typeof METRICS[number];

interface TeamData {
  team: string;
  score: number;
  activityCount: number;
  totalMinutes: number;
  participationRate: string;
  avgParticipation: number;
  rank: number;
}

const Jababa = () => {
  const [metric, setMetric] = useState<Metric>('점수');
  const selectedTeam = useClubStore((state) => state.selectedTeam);
  const teamStore = useTeamStore();

  try {

    // Get current clubType from selectedTeam, fallback to "개발동아리"
    const clubType = selectedTeam?.club || "개발동아리";

    // Get all scores from the store
    const allScores = teamStore.scores || {};

  // Filter teams for the current club and get metadata
  const clubTeams: TeamData[] = Object.entries(allScores)
    .filter(([key]) => key.startsWith(clubType + '/'))
    .map(([key, score]) => {
      const team = key.replace(clubType + '/', '');
      const meta = teamStore.getMeta({ clubType, team });
      const avgParticipation = meta.avgParticipation;

      return {
        team,
        score,
        activityCount: meta.activityCount,
        totalMinutes: meta.totalMinutes,
        // Participation rate based on actual team size from timetables.json
        participationRate: (avgParticipation * 100).toFixed(1) + '%',
        avgParticipation // raw value for chart normalization
      };
    })
    .filter(item => typeof item.team === 'string' && item.team.trim() !== '') // Filter out invalid team names
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .map((x, i) => ({
      ...x,
      rank: i + 1
    }));

    // Helper function to get value for selected metric
    const valueOf = (m: Metric, teamName: string) => {
      const team = clubTeams.find(t => t.team === teamName);
      if (!team) return 0;

      if (m === '점수') return team.score ?? 0;
      if (m === '활동 횟수') return team.activityCount;
      if (m === '총 참여시간') return team.totalMinutes;
      if (m === '참여율') return team.avgParticipation * 100;
      return 0;
    };

    // Prepare chart data for BarChart
    const chartTeams = clubTeams.map(team => String(team.team));
    const data = chartTeams.map(team => ({
      team: String(team), // Ensure team is always a string
      value: valueOf(metric, team)
    }));

    const colorOf = (_team: string, i: number) => ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#06b6d4', '#e11d48'][i % 7];

    return (
      <div>
        

        <h1 className="text-3xl font-semibold text-foreground mb-6">
          {clubType} 팀 랭킹
        </h1>

        {clubTeams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">아직 점수가 없습니다.</p>
            <p className="text-sm text-muted-foreground">
              활동을 추가하여 팀 점수를 쌓아보세요!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-background border rounded-lg">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    순위
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    팀
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    점수
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    활동 횟수
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    참여율
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    총 참여시간
                  </th>
                </tr>
              </thead>
              <tbody>
                {clubTeams.map((row) => (
                  <tr
                    key={row.team}
                    className="border-b hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          row.rank === 1 ? 'bg-yellow-500 text-white' :
                          row.rank === 2 ? 'bg-gray-400 text-white' :
                          row.rank === 3 ? 'bg-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {row.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {String(row.team)}
                      {selectedTeam?.team?.teamName === String(row.team) && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                          현재 팀
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                      {row.score}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">
                      {row.activityCount}회
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">
                      {row.participationRate}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">
                      {row.totalMinutes}분
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Metric tabs and chart */}
        {clubTeams.length > 0 && (
          <div className="mt-6 border rounded-xl p-4 bg-white/50 dark:bg-neutral-900/50">
            <h3 className="text-lg font-semibold mb-2">팀별 지표 비교</h3>
            <p className="text-sm text-muted-foreground mb-4">
              지표를 선택하여 팀들 간의 성과를 비교할 수 있습니다.
            </p>

            {/* Metric selector tabs */}
            <div className="flex gap-2 mb-3">
              {METRICS.map(m => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    "px-3 py-1 rounded-full border text-sm transition-colors",
                    metric === m
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            <ClubBarChart data={data} metric={metric} colors={colorOf} />
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Jababa page error:', error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">에러가 발생했습니다</h1>
        <p className="text-muted-foreground">
          개발자 도구를 확인해주세요. 에러: {error instanceof Error ? error.message : '알 수 없는 에러'}
        </p>
      </div>
    );
  }
};

export default Jababa;
