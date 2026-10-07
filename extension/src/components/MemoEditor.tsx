import { RotateCcw } from "lucide-react";

interface MemoEditorProps {
  memo: string;
  onChange: (val: string) => void;
  hasExisting: boolean;
  disabled?: boolean;
}

export function MemoEditor({
  memo,
  onChange,
  hasExisting,
  disabled = false,
}: MemoEditorProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-semibold text-zinc-300">
          주간 업무 메모 (Raw Memo)
        </label>
        <div className="flex items-center gap-2">
          {memo.length > 0 && !disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              비우기
            </button>
          )}
          <span className="text-[11px] text-zinc-500 font-mono">
            {memo.length}자
          </span>
        </div>
      </div>

      <div className="relative border border-zinc-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl bg-zinc-950/70 transition-all overflow-hidden">
        <textarea
          value={memo}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus
          rows={7}
          placeholder="이번 주 진행한 업무나 해결한 문제, 성과를 자유롭게 적어보세요. (예: 결제 오류 핫픽스 배포, 커넥션 풀 튜닝으로 응답속도 90% 개선 등)"
          className="w-full bg-transparent p-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
        />

        {hasExisting && (
          <div className="px-3 py-1 bg-indigo-950/40 border-t border-indigo-900/30 text-[10px] text-indigo-300 flex items-center justify-between">
            <span>💡 기존에 저장된 메모를 불러왔습니다. 수정 후 저장할 수 있습니다.</span>
          </div>
        )}
      </div>
    </div>
  );
}
