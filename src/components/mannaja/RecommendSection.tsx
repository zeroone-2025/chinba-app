import { useState, useEffect } from "react";
import { DEFAULT_ACTIVITIES, recommendByMinutes, getActivityScore } from "@/stores";

export type Ctx = { clubType: string; team: string };

interface RecommendSectionProps {
  ctx: Ctx;
  selectedFreeTime?: {
    day: string;
    startHour: number;
    duration: number;
  } | null;
}

export default function RecommendSection({ selectedFreeTime }: RecommendSectionProps) {
  const [minutes, setMinutes] = useState<number>(30);

  // 선택된 공강시간이 있으면 해당 시간으로 설정, 없으면 기본값으로 리셋
  useEffect(() => {
    if (selectedFreeTime) {
      setMinutes(selectedFreeTime.duration * 60);
    } else {
      setMinutes(30);
    }
  }, [selectedFreeTime]);

  const recommendedActivities = recommendByMinutes(DEFAULT_ACTIVITIES, minutes);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">활동 추천</h2>

      {selectedFreeTime && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-800">
            선택된 공강시간: {selectedFreeTime.day}요일 {selectedFreeTime.startHour}:00-{selectedFreeTime.startHour + selectedFreeTime.duration}:00 ({selectedFreeTime.duration}시간)
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          사용 가능한 시간 (분)
        </label>
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          min="1"
          className="w-32 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="30"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-medium">추천 활동 ({recommendedActivities.length}개)</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendedActivities.map((activity) => {
            const score = getActivityScore(activity);
            return (
              <div
                key={activity.id}
                className="relative p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
              >
                {score > 0 && (
                  <span className="absolute top-12 right-3 whitespace-nowrap text-sm font-medium px-3 py-1 rounded-full border leading-none">
                    {score}점
                  </span>
                )}  
                <div className="flex items-center gap-2 mb-2">
                  <span aria-hidden>{activity.emoji ?? '🔸'}</span>
                  <h4 className="font-medium text-lg">{activity.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  소요시간: {activity.duration}분
                </p>
                {activity.description && (
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {recommendedActivities.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {minutes}분 이하로 할 수 있는 활동이 없습니다. 더 긴 시간을 입력해보세요.
          </p>
        )}
      </div>
    </section>
  );
}