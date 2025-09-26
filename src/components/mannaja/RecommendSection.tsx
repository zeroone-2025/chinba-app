import { useState } from "react";
import { DEFAULT_ACTIVITIES, recommendByMinutes } from "@/stores";

export type Ctx = { clubType: string; team: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
export default function RecommendSection({ ctx }: { ctx: Ctx }) {
  // ctx parameter reserved for future context-aware recommendations
  const [minutes, setMinutes] = useState<number>(30);
  const recommendedActivities = recommendByMinutes(DEFAULT_ACTIVITIES, minutes);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">활동 추천</h2>

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
          {recommendedActivities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
            >
              <h4 className="font-medium text-lg mb-2">{activity.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                소요시간: {activity.duration}분
              </p>
              {activity.description && (
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
              )}
            </div>
          ))}
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