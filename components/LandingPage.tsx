"use client";

import { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LandingPage() {
  const { signInWithGoogle, signInWithDemo, isFirebaseConfigured } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      if (isFirebaseConfigured) {
        await signInWithGoogle();
      } else {
        // Firebase 키 미설정 시 안내 후 데모 계정으로 로그인 지원
        signInWithDemo();
      }
    } catch (err: unknown) {
      console.error(err);
      const isClosedByUser =
        typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "auth/popup-closed-by-user";
      if (!isClosedByUser) {
        setErrorMsg("로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 dark:from-white dark:via-indigo-200 dark:to-zinc-100 bg-clip-text text-transparent">
                CareerPulse
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                3-Way 커리어 OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-500 font-medium px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Google 보안 인증 & 개인별 암호화 격리</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>{isSigningIn ? "로그인 중..." : "Google 로그인"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="flex-1 flex flex-col items-center">
        {/* Firebase Config Notice (만약 키 미설정 시 개발 안내 뱃지) */}
        {!isFirebaseConfigured && (
          <div className="w-full bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800/80 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-200">
            <span>⚙️ Firebase 설정(.env.local)이 준비되지 않은 경우에도 </span>
            <button
              onClick={() => signInWithDemo()}
              className="underline font-bold hover:text-amber-950 cursor-pointer ml-1"
            >
              [체험 계정으로 1초 로그인]
            </button>
            <span>하여 모든 기능을 즉시 테스트해 보실 수 있습니다.</span>
          </div>
        )}

        {/* Hero Section */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>직장인을 위한 1-Input 3-Output 자동 분류 커리어 운영체제</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight sm:leading-tight">
            금요일 퇴근 전 1분, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
              대충 털어놓기만 하세요.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            양식 고민 없이 한 주간 한 일과 이슈를 입력하면, AI가 <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">주간업무보고</strong> · <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">연봉협상 Brag Sheet</strong> · <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">이직용 STAR 포트폴리오</strong>로 자동 변환하여 누적합니다.
          </p>

          {/* CTA Button Group */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm sm:text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon className="w-5 h-5 bg-white p-0.5 rounded-full" />
              <span>{isSigningIn ? "로그인 중..." : "Google 계정으로 1초 만에 시작하기"}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {!isFirebaseConfigured && (
              <button
                onClick={() => signInWithDemo()}
                className="w-full sm:w-auto px-5 py-4 rounded-2xl text-xs sm:text-sm font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                체험 계정으로 둘러보기
              </button>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
          )}

          {/* Trust Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>초기 비용 완전 무료</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Google 인증 개인 격리 DB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>대외비(NDA) 자동 마스킹</span>
            </div>
          </div>
        </section>

        {/* 2. Interactive 1-Input 3-Output Visual Architecture */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200/80 dark:border-zinc-800">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              1개의 메모가 3개의 독립된 서랍으로 자동 변환됩니다
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              퇴근 전 대충 적은 한 문단이 주간보고, 연봉협상, 이직 준비까지 평생의 커리어 자산으로 누적됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Drawer 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  [단기] 매주 월요일용
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Tab A. 주간업무보고
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                팀장/부서장 보고용 개조식 요약 (완료 업무 / 진행 중 이슈 / 차주 계획). 슬랙 및 사내 메일에 원클릭 복사 붙여넣기 완료.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                • 결제 타임아웃 핫픽스 (완료)<br />
                • Grafana APM 대시보드 구축 (진행)
              </div>
            </div>

            {/* Drawer 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  [중기] 분기/연말 연봉협상
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Tab B. Brag Sheet 시트
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                조직 기여도와 정량적 개선 수치(%) 중심 집계. 원하는 개수(3개/5개/10개/전체)에 맞춰 중요도별로 맞춤 압축 합성.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                • API 레이턴시 93% 단축 (1,200ms→85ms)<br />
                • 결제 오류율 0% 안정화
              </div>
            </div>

            {/* Drawer 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  [장기] 1~2년 이직 포트폴리오
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Tab C. STAR 경력 금고
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Situation-Task-Action-Result 구조화. 기업명·주요 고객사·매출 규모를 대외비(NDA) 마스킹하여 외부 공유 시 안전.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                • [고객사 A] 결제 안정성 최적화<br />
                • #성능최적화 #트러블슈팅 #핀테크
              </div>
            </div>
          </div>
        </section>

        {/* 3. Security & Privacy Deep Dive Section */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200/80 dark:border-zinc-800">
          <div className="bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-indigo-300">
                <Lock className="w-3.5 h-3.5" />
                <span>직장인을 위한 엔터프라이즈급 데이터 보안</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                회사의 민감한 업무 기록, <br />
                누구도 열어볼 수 없도록 철저히 격리됩니다.
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                CareerPulse는 Google 보안 인증 기반의 엄격한 데이터 격리 체계와 엔터프라이즈 보안 프로토콜을 준수합니다. 타 사용자나 제3자의 접근이 원천 차단됩니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">계정별 데이터 격리 & 클라우드 암호화</strong>
                    <span className="text-zinc-400">금융권 수준의 AES-256 저장 암호화 및 교차 접근 차단</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">대외비(NDA) 비식별화 엔진</strong>
                    <span className="text-zinc-400">기업명, 거래처, 매출 지표 자동 마스킹</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">IndexedDB 로컬 오프라인 캐시</strong>
                    <span className="text-zinc-400">네트워크 끊김에도 안전한 브라우저 영속성</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">언제든 데이터 백업 및 삭제</strong>
                    <span className="text-zinc-400">JSON 내보내기 및 1초 계정 데이터 영구 파기</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Bottom Final CTA */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            이번 주 금요일 퇴근길부터, 커리어를 자산으로 만드세요.
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            별도의 가입 양식 없이 Google 계정으로 1초 만에 바로 시작할 수 있습니다.
          </p>
          <div className="pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm sm:text-base font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-xl shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon className="w-5 h-5 bg-white p-0.5 rounded-full" />
              <span>Google 계정으로 바로 시작하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-8 bg-white/50 dark:bg-zinc-950/50 text-center text-xs text-zinc-500 space-y-2">
        <p>© 2026 CareerPulse. 직장인을 위한 1분 주간 기록 3-Way 커리어 OS.</p>
        <p className="text-[11px] text-zinc-400">
          엔터프라이즈급 데이터 보안, AES-256 저장 암호화 및 AI 모델 미학습 보증
        </p>
      </footer>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}
