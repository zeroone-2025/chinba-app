import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isValidTimeRange } from "@/lib/time";
import type { PersonalSchedule } from "@/types";

interface AddPersonalModalProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  onSubmit: (schedule: Omit<PersonalSchedule, 'id' | 'memberId'>) => void;
}

export default function AddPersonalModal({
  open,
  onClose,
  memberName,
  onSubmit
}: AddPersonalModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState<number>(9);
  const [endHour, setEndHour] = useState<number>(10);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date) {
      alert("일정 이름과 날짜를 입력해주세요.");
      return;
    }

    if (!isValidTimeRange(startHour, endHour)) {
      alert("올바른 시간 범위를 입력해주세요. (시작 시간 < 종료 시간)");
      return;
    }

    setIsSubmitting(true);

    try {
      onSubmit({
        title: title.trim(),
        date,
        startHour,
        endHour,
        ...(note.trim() && { note: note.trim() })
      });

      // 폼 초기화
      setTitle("");
      setDate("");
      setStartHour(9);
      setEndHour(10);
      setNote("");
      onClose();
    } catch (error) {
      console.error("Failed to add personal schedule:", error);
      alert("일정 추가에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 시간 옵션 생성 (9-21시)
  const timeOptions = Array.from({ length: 13 }, (_, i) => i + 9);

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
            <Label htmlFor="date">날짜 *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-hour">시작 시간 *</Label>
              <Select value={startHour.toString()} onValueChange={(value: string) => setStartHour(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-hour">종료 시간 *</Label>
              <Select value={endHour.toString()} onValueChange={(value: string) => setEndHour(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
    </Dialog>
  );
}