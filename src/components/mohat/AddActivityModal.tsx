import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useMohatStore } from '@/stores/mohatStore'
import { DEFAULT_ACTIVITIES } from '@/stores'

interface SelectedTeam {
  club: string
  team: string
}

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTeam: SelectedTeam | null
}

const AddActivityModal = ({ isOpen, onClose, selectedTeam }: AddActivityModalProps) => {
  const addActivity = useMohatStore((state) => state.addActivity)
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    headcount: '',
    description: '',
  })
  const [showCatalog, setShowCatalog] = useState(false)
  const [, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCatalogSelect = (activity: typeof DEFAULT_ACTIVITIES[0]) => {
    setFormData(prev => ({
      ...prev,
      title: activity.name,
      description: activity.description || ''
    }))
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedTeam) return

    // Note: Image file is converted to Object URL for preview only
    // On page refresh, images will not persist as we're not storing actual file data
    const activityData = {
      date: formData.date,
      title: formData.title.trim(),
      headcount: parseInt(formData.headcount),
      ...(formData.description.trim() && { description: formData.description.trim() }),
      ...(imagePreview && { imageUrl: imagePreview })
    }

    addActivity(activityData, selectedTeam)

    // Reset form
    setFormData({ date: '', title: '', headcount: '', description: '' })
    setImageFile(null)
    setImagePreview('')
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setFormData({ date: '', title: '', headcount: '', description: '' })
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview('')
    setErrors({})
    setShowCatalog(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">활동 추가</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              날짜 *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="title" className="block text-sm font-medium">
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
                {DEFAULT_ACTIVITIES.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => handleCatalogSelect(activity)}
                    className="w-full text-left p-2 text-sm hover:bg-muted/20 border-b border-border/20 last:border-b-0"
                  >
                    <div className="font-medium">{activity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {activity.duration}분 · {activity.category}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="활동명을 입력하세요"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="headcount" className="block text-sm font-medium mb-1">
              참여인원수 *
            </label>
            <input
              type="number"
              id="headcount"
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
            <label htmlFor="image" className="block text-sm font-medium mb-1">
              사진
            </label>
            <input
              type="file"
              id="image"
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
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              설명
            </label>
            <textarea
              id="description"
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
              제출
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddActivityModal