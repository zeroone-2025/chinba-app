import { useState, useEffect } from 'react'
import { Plus, Users, Calendar, Edit, Trash2, Trophy } from 'lucide-react'
import { useClubStore } from '@/stores/clubStore'
import { useMohatStore, type MohatActivity } from '@/stores/mohatStore'
import { useTeamStore, type Ctx } from '@/stores/teamStore'
import AddActivityModal from '@/components/mohat/AddActivityModal'
import EditActivityModal from '@/components/mohat/EditActivityModal'

const Mohat = () => {
  const selectedTeam = useClubStore((state) => state.selectedTeam)
  const { activities, setSelectedTeam, removeActivity } = useMohatStore()
  const { getScore, addScore, removeActivitySample, getMeta } = useTeamStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<MohatActivity | null>(null)

  // Get current team score and metadata
  const teamScore = selectedTeam ? getScore({ clubType: selectedTeam.club, team: selectedTeam.team }) : 0
  const teamMeta = selectedTeam ? getMeta({ clubType: selectedTeam.club, team: selectedTeam.team }) : null

  // Update activities when selectedTeam changes
  useEffect(() => {
    if (selectedTeam) {
      setSelectedTeam(selectedTeam)
    }
  }, [selectedTeam, setSelectedTeam])

  const handleEdit = (activity: MohatActivity) => {
    setEditingActivity(activity)
    setIsEditModalOpen(true)
  }

  const handleDelete = (activity: MohatActivity) => {
    if (!selectedTeam) return

    if (confirm('정말 삭제할까요?')) {
      const oldScore = activity.score || 0
      const ctx: Ctx = { clubType: selectedTeam.club, team: selectedTeam.team }

      // Track activity sample removal for team statistics
      const dur = activity.duration ?? 60
      const ppl = activity.headcount

      removeActivity(activity.id, selectedTeam)
      addScore(ctx, -oldScore) // Subtract the score
      removeActivitySample(ctx, dur, ppl)
    }
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setEditingActivity(null)
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground">현재 선택된 팀</p>
        <p className="font-medium text-foreground">
          {selectedTeam?.club} - {selectedTeam?.team}
        </p>
        {teamMeta && (
          <p className="text-sm text-muted-foreground mt-1">
            팀 전체 인원: {teamMeta.members}명
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold text-foreground">뭐했니</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full text-sm font-medium">
            <Trophy className="w-4 h-4" />
            <span>팀 점수: <strong>{teamScore}</strong></span>
          </div>
        </div>
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
              className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {/* Edit and Delete buttons */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  onClick={() => handleEdit(activity)}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                  title="수정"
                  aria-label="활동 수정"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(activity)}
                  className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors text-muted-foreground hover:text-destructive"
                  title="삭제"
                  aria-label="활동 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

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

                <div className="flex-1 min-w-0 pr-16">
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

      {editingActivity && (
        <EditActivityModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          activity={editingActivity}
          selectedTeam={selectedTeam}
        />
      )}
    </div>
  )
}

export default Mohat