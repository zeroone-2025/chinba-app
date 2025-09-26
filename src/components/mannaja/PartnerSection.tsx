// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
export default function PartnerSection({ ctx }: { ctx: { clubType: string; team: string } }) {
  // ctx parameter reserved for future team member implementation
  return (
    <section className="mb-6">
      <h2 className="text-xl font-semibold mb-2">팀원 섹션(상단)</h2>
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        팀원 컴포넌트 영역입니다. 이곳에 팀원 코드 삽입.
      </div>
    </section>
  );
}