import { useState, useEffect } from 'react'
import { Plus, Users, Calendar } from 'lucide-react'
import { useClubStore } from '@/stores/clubStore'
import { useMohatStore } from '@/stores/mohatStore'
import AddActivityModal from '@/components/mohat/AddActivityModal'

const Mohat = () => {
  const selectedTeam = useClubStore((state) => state.selectedTeam)
  const { activities, setSelectedTeam } = useMohatStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Update activities when selectedTeam changes
  useEffect(() => {
    if (selectedTeam) {
      setSelectedTeam(selectedTeam)
    }
  }, [selectedTeam, setSelectedTeam])

  return (
    <div>
      <div className="mb-4 p-4 bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground">현재 선택된 팀</p>
        <p className="font-medium text-foreground">
          {selectedTeam?.club} - {selectedTeam?.team}
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-foreground">뭐했니</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">아직 활동이 없습니다.</p>
          <p className="text-sm text-muted-foreground">
            '추가' 버튼을 클릭하여 첫 번째 활동을 기록해보세요!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {activity.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-2">
                    {activity.title}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {activity.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {activity.headcount}명
                    </div>
                  </div>

                  {activity.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTeam={selectedTeam}
      />
    </div>
  )
}

export default Mohat