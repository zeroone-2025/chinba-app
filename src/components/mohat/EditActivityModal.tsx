import { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useMohatStore, type MohatActivity } from '@/stores/mohatStore'
import { SCORED_ACTIVITIES, difficultyScore } from '@/stores/activities'
import { useTeamStore, type Ctx } from '@/stores/teamStore'

interface SelectedTeam {
  club: string
  team: string
}

interface EditActivityModalProps {
  isOpen: boolean
  onClose: () => void
  activity: MohatActivity
  selectedTeam: SelectedTeam | null
}

const EditActivityModal = ({ isOpen, onClose, activity, selectedTeam }: EditActivityModalProps) => {
  const updateActivity = useMohatStore((state) => state.updateActivity)
  const { addScore, updateActivitySample } = useTeamStore()
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    headcount: '',
    duration: '',
    description: '',
  })
  const [showCatalog, setShowCatalog] = useState(false)
  const [, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [selectedActivityScore, setSelectedActivityScore] = useState<number | null>(null)

  // Pre-fill form when modal opens or activity changes
  useEffect(() => {
    if (isOpen && activity) {
      setFormData({
        date: activity.date,
        title: activity.title,
        headcount: activity.headcount.toString(),
        duration: activity.duration?.toString() || '',
        description: activity.description || '',
      })
      setImagePreview(activity.imageUrl || '')
    }
  }, [isOpen, activity])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCatalogSelect = (catalogActivity: typeof SCORED_ACTIVITIES[0]) => {
    setFormData(prev => ({
      ...prev,
      title: catalogActivity.name,
      description: catalogActivity.description || ''
    }))
    setSelectedActivityScore(catalogActivity.score || 0)
    setShowCatalog(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.date) {
      newErrors.date = '날짜를 입력해주세요'
    }
    if (!formData.title.trim()) {
      newErrors.title = '활동명을 입력해주세요'
    }
    if (!formData.headcount || parseInt(formData.headcount) <= 0) {
      newErrors.headcount = '참여인원수는 1 이상이어야 합니다'
    }
    if (formData.duration && parseInt(formData.duration) <= 0) {
      newErrors.duration = '소요시간은 1분 이상이어야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const ensureScore = (activityData: { title: string; headcount: number; duration?: number }) => {
    if (selectedActivityScore !== null) {
      return selectedActivityScore
    }
    // Use existing score if available, or calculate based on form data
    if (activity.score) {
      return activity.score
    }
    return difficultyScore({
      id: 'temp',
      name: activityData.title || '',
      duration: activityData.duration || 60, // default duration
      minParticipants: activityData.headcount,
      category: 'social' // default category
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedTeam) return

    const baseUpdatedData = {
      date: formData.date,
      title: formData.title.trim(),
      headcount: parseInt(formData.headcount),
      ...(formData.duration && { duration: parseInt(formData.duration) }),
      ...(formData.description.trim() && { description: formData.description.trim() }),
      ...(imagePreview && { imageUrl: imagePreview })
    }

    const oldScore = activity.score || 0
    const newScore = ensureScore(baseUpdatedData)
    const updatedData: Partial<MohatActivity> = { ...baseUpdatedData, score: newScore }

    const ctx: Ctx = { clubType: selectedTeam.club, team: selectedTeam.team }

    // Track activity sample changes for team statistics
    const oldDur = activity.duration ?? 60
    const oldPpl = activity.headcount
    const newDur = updatedData.duration ?? oldDur
    const newPpl = parseInt(formData.headcount)

    updateActivity(activity.id, updatedData, selectedTeam)
    addScore(ctx, newScore - oldScore) // Add the difference in score
    updateActivitySample(ctx, oldDur, oldPpl, newDur, newPpl)

    handleClose()
  }

  const handleClose = () => {
    setFormData({ date: '', title: '', headcount: '', duration: '', description: '' })
    setImageFile(null)
    if (imagePreview && imagePreview !== activity.imageUrl) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview('')
    setErrors({})
    setShowCatalog(false)
    setSelectedActivityScore(null)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">활동 수정</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-sm transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="edit-date" className="block text-sm font-medium mb-1">
              날짜 *
            </label>
            <input
              type="date"
              id="edit-date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="edit-title" className="block text-sm font-medium">
                활동명 *
              </label>
              <button
                type="button"
                onClick={() => setShowCatalog(!showCatalog)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                카탈로그에서 선택
                <ChevronDown className={`w-3 h-3 transition-transform ${showCatalog ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showCatalog && (
              <div className="mb-2 border rounded-md max-h-32 overflow-y-auto bg-muted/10">
                {SCORED_ACTIVITIES.map((catalogActivity) => (
                  <button
                    key={catalogActivity.id}
                    type="button"
                    onClick={() => handleCatalogSelect(catalogActivity)}
                    className="w-full text-left p-2 text-sm hover:bg-muted/20 border-b border-border/20 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{catalogActivity.name}</div>
                      {catalogActivity.difficulty && (
                        <span className={`px-1.5 py-0.5 text-xs rounded-full text-white ${
                          catalogActivity.difficulty === 'hard' ? 'bg-red-500' :
                          catalogActivity.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          {catalogActivity.difficulty === 'hard' ? 'HARD' :
                           catalogActivity.difficulty === 'medium' ? 'MED' : 'EASY'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {catalogActivity.duration}분 · {catalogActivity.category}
                      {catalogActivity.score && (
                        <span className="ml-1">· {catalogActivity.score}점</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              id="edit-title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="활동명을 입력하세요"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="edit-headcount" className="block text-sm font-medium mb-1">
              참여인원수 *
            </label>
            <input
              type="number"
              id="edit-headcount"
              name="headcount"
              value={formData.headcount}
              onChange={handleInputChange}
              min="1"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="참여인원수를 입력하세요"
            />
            {errors.headcount && <p className="text-sm text-red-500 mt-1">{errors.headcount}</p>}
          </div>

          <div>
            <label htmlFor="edit-duration" className="block text-sm font-medium mb-1">
              소요시간 (분)
            </label>
            <input
              type="number"
              id="edit-duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="1"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="소요시간을 입력하세요 (기본: 60분)"
            />
            {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
          </div>

          <div>
            <label htmlFor="edit-image" className="block text-sm font-medium mb-1">
              사진
            </label>
            <input
              type="file"
              id="edit-image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className="w-full max-h-40 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium mb-1">
              설명
            </label>
            <textarea
              id="edit-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="활동에 대한 설명을 입력하세요"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              수정
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditActivityModal