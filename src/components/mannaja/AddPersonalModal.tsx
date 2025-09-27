import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateRange, getWeekStart, toDateString } from "@/lib/time";
import type { PersonalSchedule } from "@/types";
import SelectFromTimetableModal from "./SelectFromTimetableModal";
import { X } from "lucide-react";

interface AddPersonalModalProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  onSubmit: (schedule: Omit<PersonalSchedule, 'id' | 'memberId'>) => void;
}

interface TimeRange {
  week: number;
  weekdayIndex: number;
  startHour: number;
  endHour: number;
}

export default function AddPersonalModal({
  open,
  onClose,
  memberName,
  onSubmit
}: AddPersonalModalProps) {
  const [title, setTitle] = useState("");
  const [selectedRange, setSelectedRange] = useState<TimeRange | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("일정 이름을 입력해주세요.");
      return;
    }

    if (!selectedRange) {
      alert("시간표에서 날짜와 시간을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const weekStart = getWeekStart(new Date(), selectedRange.week);
      const date = toDateString(weekStart, selectedRange.weekdayIndex);

      onSubmit({
        title: title.trim(),
        date,
        startHour: selectedRange.startHour,
        endHour: selectedRange.endHour,
        ...(note.trim() && { note: note.trim() })
      });

      // 폼 초기화
      setTitle("");
      setSelectedRange(null);
      setNote("");
      onClose();
    } catch (error) {
      console.error("Failed to add personal schedule:", error);
      alert("일정 추가에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 시간표에서 선택한 데이터를 폼에 반영
  const handleTimetableConfirm = (range: TimeRange) => {
    setSelectedRange(range);
    setShowTimetableModal(false);
  };

  // 선택된 범위 클리어
  const clearSelection = () => {
    setSelectedRange(null);
  };

  // 선택된 범위의 포맷된 날짜 문자열 생성
  const getFormattedSelection = () => {
    if (!selectedRange) return null;
    const weekStart = getWeekStart(new Date(), selectedRange.week);
    const dateStr = toDateString(weekStart, selectedRange.weekdayIndex);
    return formatDateRange(dateStr, selectedRange.startHour, selectedRange.endHour);
  };

  return (
    <Dialog open={open} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{memberName}님의 개인 일정 추가</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">일정 이름 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="예: 개인 약속, 병원 방문"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>날짜 및 시간 *</Label>
            {selectedRange ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <span className="flex-1 text-sm font-medium text-blue-800">
                  {getFormattedSelection()}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={isSubmitting}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTimetableModal(true)}
                disabled={isSubmitting}
                className="w-full justify-center"
              >
                시간표에서 선택
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">메모</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              placeholder="추가 메모 (선택사항)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* 시간표 선택 모달 */}
      <SelectFromTimetableModal
        isOpen={showTimetableModal}
        onClose={() => setShowTimetableModal(false)}
        onConfirm={handleTimetableConfirm}
      />
    </Dialog>
  );
}