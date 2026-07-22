import { useState, useEffect } from "react";
import {
  STORY,
  EVENT_ORDER,
  GAMEOVER_GENERIC,
  MIANZI_FAIL_THRESHOLD,
  GUANXI_WARNING_THRESHOLD,
  LEVEL_INTROS,
} from "./Story.js";
import { playDoorSlam, playHeartbeat, playClockTick } from "./sfx.js";
import "./App.css";

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function scoreLabel(guanxi, mianzi) {
  const total = guanxi + mianzi;
  if (total >= 170) return "أداء ممتاز — مفاوض جاهز للسوق الصيني";
  if (total >= 130) return "أداء جيد مع بعض الهفوات — أساس متين";
  if (total >= 90) return "أداء متوسط — يحتاج مراجعة بروتوكولات أساسية";
  return "أداء ضعيف — يوصى بإعادة المحاكاة ومراجعة المفاهيم";
}

function initialState() {
  return {
    screen: "start",
    nodeId: "level1_intro",
    guanxi: 50,
    mianzi: 50,
    lastVerdict: null,
    log: {},
    gameoverText: "",
  };
}

function StartScreen({ onStart }) {
  return (
    <section className="start-card" style={{ maxWidth: "600px", margin: "50px auto" }}>
      <p className="eyebrow">محاكاة تفاعلية — Corporate Visual Novel</p>
      <h1>محاكي الصفقات الصينية</h1>
      <h2>البروتوكولات والعلاقات التجارية (Guanxi)</h2>
      <p className="start-desc">
        اضغطي على الزر أدناه لبدء المحاكاة واستعراض المشاهد.
      </p>
      <button className="btn-primary" onClick={onStart}>
        ابدأ المحاكاة
      </button>
    </section>
  );
}

function renderFormattedText(text) {
  return text.split("\n").map((line, i) => (
    <p key={i} className="start-desc-line">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
    </p>
  ));
}

function CinematicNote({ icon, text, kind }) {
  return (
    <div className={`intro-note intro-note-${kind}`}>
      <span className="intro-note-icon">{icon}</span>
      <span className="intro-note-text">{text}</span>
    </div>
  );
}

function renderIntroBlock(block, i) {
  switch (block.type) {
    case "note":
      return <CinematicNote key={i} icon={block.icon || "🔊"} text={block.text} kind="sound" />;
    case "direction":
      return <CinematicNote key={i} icon={block.icon || "🎬"} text={block.text} kind="direction" />;
    case "heading":
      return (
        <h3 key={i} className="intro-heading">
          {block.text}
        </h3>
      );
    case "legend":
      return (
        <div key={i} className="intro-legend-row">
          <span className="intro-legend-icon">{block.icon}</span>
          <span>
            <strong>{block.label}:</strong> {block.text}
          </span>
        </div>
      );
    case "quote":
      return (
        <p key={i} className="intro-quote">
          {block.text}
        </p>
      );
    default:
      return (
        <p key={i} className="start-desc-line">
          {block.text}
        </p>
      );
  }
}

function LevelIntroScreen({ intro, onContinue }) {
  const pages = intro.pagesAr;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!pages) return;
    // الصفحة الأولى: صوت الباب مشغَّل مسبقاً عبر handleStart لحظة فتح المقدمة.
    // الصفحة الأخيرة: تحمل ملاحظة دقات الساعة، فتُشغَّل هنا لحظة الوصول إليها.
    if (step === pages.length - 1) {
      playClockTick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!pages) {
    return (
      <section className="start-card" style={{ maxWidth: "600px", margin: "50px auto" }}>
        <p className="eyebrow">{intro.subtitleAr}</p>
        <h1>{intro.titleAr}</h1>
        <div className="start-desc">{renderFormattedText(intro.introAr)}</div>
        <button className="btn-primary btn-glow" onClick={onContinue}>
          {intro.buttonAr}
        </button>
      </section>
    );
  }

  const isLast = step === pages.length - 1;

  return (
    <section className="start-card intro-card" style={{ maxWidth: "600px", margin: "50px auto" }}>
      {step === 0 && <div className="intro-red-flash" />}
      <p className="eyebrow">{intro.subtitleAr}</p>
      <h1>{intro.titleAr}</h1>
      <div className="intro-page-dots">
        {pages.map((_, i) => (
          <span key={i} className={"intro-dot" + (i === step ? " intro-dot-active" : "")} />
        ))}
      </div>
      <p className="intro-page-counter">
        صفحة {step + 1} من {pages.length}
      </p>
      <div className="start-desc intro-page-content" key={step}>
        {pages[step].map(renderIntroBlock)}
      </div>
      <div className="intro-nav">
        {step > 0 && (
          <button className="btn-secondary" onClick={() => setStep((s) => s - 1)}>
            السابق
          </button>
        )}
        {!isLast && (
          <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>
            التالي
          </button>
        )}
        {isLast && (
          <button className="btn-primary btn-glow" onClick={onContinue}>
            {intro.buttonAr}
          </button>
        )}
      </div>
    </section>
  );
}

function Meter({ label, value, danger }) {
  return (
    <div className="meter">
      <div className="meter-label">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="meter-track">
        <div
          className={"meter-fill" + (danger ? " meter-danger" : "")}
          style={{ width: value + "%" }}
        />
      </div>
    </div>
  );
}

// خريطة أسماء المتحدثين (كما تُكتب فعليًا بـ Story.js) إلى بادئة اسم ملف الصورة بـ public/assets/
const characterImageMap = {
  "السيدة لي": "Ms.li",
  "السيدة تشن": "Mr.chen",
  "المدير وانغ": "ManagerWang",
};

// صور خاصة بمشاهد معيّنة (تتجاوز صورة التعبير العادية)
const specialNodeImages = {
  ev4: "/assets/Ms.li-Toast.png",
};

// يحدد خلفية المشهد بناءً على بادئة رقم اللفل في nodeId (l3.. مصنع، l4ev4 توقيع، l4.. اجتماعات، غير ذلك مطعم)
function getBackgroundUrl(nodeId) {
  if (nodeId.startsWith("l4ev4")) return "url('/assets/backgrounds/signing.png')";
  if (nodeId.startsWith("l4")) return "url('/assets/backgrounds/boardroom.png')";  if (nodeId.startsWith("l3")) return "url('/assets/backgrounds/factory.png')";
  return "url('/assets/backgrounds/restaurant.png')";
}

function GameScreen({ state, onChoice }) {
  const node = STORY[state.nodeId];
  if (!node) return <div>خطأ في تحميل عقدة القصة</div>;

  const showWarning = state.guanxi < GUANXI_WARNING_THRESHOLD;

  let characterExpression = "Neutral";
  if (state.lastVerdict === "success") characterExpression = "Happy";
  if (state.lastVerdict === "fail" || state.lastVerdict === "gameover") characterExpression = "Mad";

  const imageName = characterImageMap[node.speaker];
  const imageSrc =
    specialNodeImages[state.nodeId] ||
    (imageName ? `/assets/${imageName}-${characterExpression}.png` : null);
  return (
    <section
      className="game-screen-container"
      style={{
        backgroundImage: getBackgroundUrl(state.nodeId),
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div id="status-bar">
        <Meter
          label="العلاقة (Guanxi)"
          value={state.guanxi}
          danger={state.guanxi < GUANXI_WARNING_THRESHOLD}
        />
        <Meter
          label="ماء الوجه (Mianzi)"
          value={state.mianzi}
          danger={state.mianzi < MIANZI_FAIL_THRESHOLD}
        />
      </div>
      {showWarning && <div id="warning-banner">تحذير: العلاقة مهددة</div>}

                 {imageSrc && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: "58vh" }}>
          <img
            src={imageSrc}
            alt={node.speaker}
            style={{ maxHeight: "100%", width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.6))" }}
            onError={(e) => {
              console.log("Image load failed:", e.target.src);
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="dialogue-box">
        <div className="dialogue-speaker">{node.speaker}</div>
        <div className="dialogue-text">{node.text}</div>
      </div>

      <div className="choice-list">
        {node.choices && node.choices.map((choice, index) => (
          <button
            key={index}
            type="button"
            className="choice-btn"
            onClick={() => {
              playHeartbeat();
              onChoice(node, choice);
            }}
          >
            <span className="choice-label-ar">{choice.label}</span>
            {choice.labelZh && <span className="choice-label-zh">{choice.labelZh}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

const VERDICT_ICONS = { success: "✔", warning: "⚠", fail: "✗" };

function DecisionLog({ log }) {
  const loggedKeys = EVENT_ORDER.filter((key) => log[key]);
  if (loggedKeys.length === 0) return null;

  return (
    <>
      <h3 className="eval-section-title">تحليل أبرز القرارات</h3>
      <ul id="evaluation-list">
        {loggedKeys.map((key) => {
          const entry = log[key];
          const eventTitle = STORY[key]?.eventTitle || key;
          return (
            <li key={key} className={`eval-item eval-${entry.verdict}`}>
              <div className="eval-title">
                <span style={{ color: `var(--${entry.verdict})` }}>
                  {VERDICT_ICONS[entry.verdict] || "•"}
                </span>{" "}
                {eventTitle}
              </div>
              <div className="eval-choice">{entry.label}</div>
              <div className="eval-analysis">{entry.analysis}</div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function GameOverScreen({ state, onRestart }) {
  return (
    <section className="end-card end-card-wide" style={{ maxWidth: "600px", margin: "50px auto" }}>
      <p className="eyebrow eyebrow-danger">انتهت المحاكاة</p>
      <h2>انسحب الطرف الصيني من اللقاء</h2>
      <p id="gameover-text">{state.gameoverText}</p>
      <DecisionLog log={state.log} />
      <button className="btn-primary" onClick={onRestart}>
        إعادة المحاولة
      </button>
    </section>
  );
}

function EvaluationScreen({ state, onRestart }) {
  return (
    <section className="end-card end-card-wide" style={{ maxWidth: "600px", margin: "50px auto" }}>
      <p className="eyebrow">شاشة التقييم والتبرير</p>
      <h2>{scoreLabel(state.guanxi, state.mianzi)}</h2>
      <div className="final-scores">
        <div className="final-score">
          <span>العلاقة (Guanxi)</span>
          <strong>{state.guanxi} / 100</strong>
        </div>
        <div className="final-score">
          <span>ماء الوجه (Mianzi)</span>
          <strong>{state.mianzi} / 100</strong>
        </div>
      </div>
      <DecisionLog log={state.log} />
      <button className="btn-primary" onClick={onRestart}>
        إعادة المحاكاة
      </button>
    </section>
  );
}

export default function App() {
  const [state, setState] = useState(initialState);

  function handleStart() {
    playDoorSlam();
    setState({ ...initialState(), screen: "game" });
  }

  function handleLevelIntroContinue() {
    setState((prev) => ({
      ...prev,
      nodeId: LEVEL_INTROS[prev.nodeId].nextNode,
    }));
  }

  function handleChoice(node, choice) {
    if (choice.verdict === "gameover") {
      setState((prev) => ({
        ...prev,
        screen: "gameover",
        lastVerdict: choice.verdict,
        gameoverText: choice.gameoverText,
      }));
      return;
    }

    setState((prev) => {
      const guanxi = clamp(prev.guanxi + choice.effects.guanxi);
      const mianzi = clamp(prev.mianzi + choice.effects.mianzi);
      const log = {
        ...prev.log,
        [node.eventKey]: {
          label: choice.label,
          verdict: choice.verdict,
          analysis: choice.analysis,
        },
      };

      if (mianzi < MIANZI_FAIL_THRESHOLD) {
        return {
          ...prev,
          guanxi,
          mianzi,
          log,
          lastVerdict: choice.verdict,
          screen: "gameover",
          gameoverText: GAMEOVER_GENERIC,
        };
      }

      if (choice.next === "evaluation") {
        return { ...prev, guanxi, mianzi, log, lastVerdict: choice.verdict, screen: "evaluation" };
      }

      return {
        ...prev,
        guanxi,
        mianzi,
        log,
        lastVerdict: choice.verdict,
        nodeId: choice.next || "ev1",
      };
    });
  }

  const isLevelIntro = state.screen === "game" && Boolean(LEVEL_INTROS[state.nodeId]);

  return (
    <div id="app">
      {state.screen === "start" && <StartScreen onStart={handleStart} />}
      {isLevelIntro && (
        <LevelIntroScreen
          intro={LEVEL_INTROS[state.nodeId]}
          onContinue={handleLevelIntroContinue}
        />
      )}
      {state.screen === "game" && !isLevelIntro && (
        <GameScreen state={state} onChoice={handleChoice} />
      )}
      {state.screen === "gameover" && (
        <GameOverScreen state={state} onRestart={handleStart} />
      )}
      {state.screen === "evaluation" && (
        <EvaluationScreen state={state} onRestart={handleStart} />
      )}
    </div>
  );
}