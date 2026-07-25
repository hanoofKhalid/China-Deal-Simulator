import { useState } from "react";
import {
  STORY,
  EVENT_ORDER,
  GAMEOVER_GENERIC,
  MIANZI_FAIL_THRESHOLD,
  GUANXI_WARNING_THRESHOLD,
  LEVEL_INTROS,
  LEVELS,
  LEVEL_UNLOCK_ON_REACH,
  getLevelIdForNode,
  START_STATE,
} from "./Story.js";
import "./App.css";

const MAX_LEVEL_STORAGE_KEY = "chinaDealSimulator.maxUnlockedLevel";

function loadMaxUnlockedLevel() {
  if (typeof window === "undefined") return 1;
  const parsed = parseInt(window.localStorage.getItem(MAX_LEVEL_STORAGE_KEY), 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, LEVELS.length);
}

function saveMaxUnlockedLevel(level) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MAX_LEVEL_STORAGE_KEY, String(level));
}

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
    nodeId: "ev1",
    guanxi: START_STATE.guanxi,
    mianzi: START_STATE.mianzi,
    lastVerdict: null,
    log: {},
    gameoverText: "",
    maxUnlockedLevel: loadMaxUnlockedLevel(),
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

function LevelIntroScreen({ intro, onContinue }) {
  return (
    <section className="start-card" style={{ maxWidth: "600px", margin: "50px auto" }}>
      <p className="eyebrow">{intro.subtitleAr}</p>
      <h1>{intro.titleAr}</h1>
      <p className="start-desc">{intro.introAr}</p>
      <button className="btn-primary" onClick={onContinue}>
        {intro.buttonAr}
      </button>
    </section>
  );
}

function LevelSidebar({ maxUnlockedLevel, currentLevelId, onSelectLevel }) {
  return (
    <nav className="level-sidebar">
      <p className="level-sidebar-title">المستويات</p>
      <div className="level-sidebar-list">
        {LEVELS.map((level) => {
          const unlocked = level.id <= maxUnlockedLevel;
          const isCurrent = level.id === currentLevelId;
          return (
            <button
              key={level.id}
              type="button"
              disabled={!unlocked}
              title={unlocked ? level.nameAr : "أكمل المستوى السابق أولاً لفتح هذا المستوى"}
              className={
                "level-btn" +
                (unlocked ? "" : " level-btn-locked") +
                (isCurrent ? " level-btn-current" : "")
              }
              onClick={() => unlocked && onSelectLevel(level)}
            >
              <span className="level-btn-num">{unlocked ? level.id : "🔒"}</span>
              <span className="level-btn-name">{level.nameAr}</span>
            </button>
          );
        })}
      </div>
    </nav>
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
  if (nodeId.startsWith("l4")) return "url('/assets/backgrounds/boardroom.png')";
  if (nodeId.startsWith("l3")) return "url('/assets/backgrounds/factory.png')";
  if (nodeId.startsWith("l5")) return "url('/assets/backgrounds/factory.png')";
  if (nodeId.startsWith("l6")) return "url('/assets/backgrounds/boardroom.png')";
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
            onClick={() => onChoice(node, choice)}
          >
            <span className="choice-label-ar">{choice.label}</span>
            {choice.labelZh && <span className="choice-label-zh">{choice.labelZh}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

function GameOverScreen({ text, onRestart }) {
  return (
    <section className="end-card" style={{ maxWidth: "600px", margin: "50px auto" }}>
      <p className="eyebrow eyebrow-danger">انتهت المحاكاة</p>
      <h2>انسحب الطرف الصيني من اللقاء</h2>
      <p id="gameover-text">{text}</p>
      <button className="btn-primary" onClick={onRestart}>
        إعادة المحاولة
      </button>
    </section>
  );
}

function EvaluationScreen({ state, onRestart }) {
  const loggedEntries = EVENT_ORDER.map((key) => ({ key, entry: state.log[key] })).filter(
    ({ entry }) => entry
  );

  return (
    <section className="end-card end-card-wide" style={{ maxWidth: "700px", margin: "50px auto" }}>
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
      <ul id="evaluation-list">
        {loggedEntries.map(({ key, entry }) => (
          <li key={key} className={`eval-item eval-${entry.verdict}`}>
            <div className="eval-title">{entry.eventTitle}</div>
            <div className="eval-choice">{entry.label}</div>
            <div className="eval-analysis">{entry.analysis}</div>
          </li>
        ))}
      </ul>
      <button className="btn-primary" onClick={onRestart}>
        إعادة المحاكاة
      </button>
    </section>
  );
}

export default function App() {
  const [state, setState] = useState(initialState);

  function handleStart() {
    setState({ ...initialState(), screen: "game" });
  }

  function handleSelectLevel(level) {
    setState((prev) => ({
      ...prev,
      screen: "game",
      nodeId: level.startNode,
      guanxi: START_STATE.guanxi,
      mianzi: START_STATE.mianzi,
      lastVerdict: null,
      log: {},
      gameoverText: "",
    }));
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
          eventTitle: node.eventTitle || node.branchTitle,
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

      const unlockedLevel = LEVEL_UNLOCK_ON_REACH[choice.next];
      let maxUnlockedLevel = prev.maxUnlockedLevel;
      if (unlockedLevel && unlockedLevel > maxUnlockedLevel) {
        maxUnlockedLevel = unlockedLevel;
        saveMaxUnlockedLevel(maxUnlockedLevel);
      }

      if (choice.next === "evaluation") {
        return {
          ...prev,
          guanxi,
          mianzi,
          log,
          lastVerdict: choice.verdict,
          screen: "evaluation",
          maxUnlockedLevel,
        };
      }

      return {
        ...prev,
        guanxi,
        mianzi,
        log,
        lastVerdict: choice.verdict,
        nodeId: choice.next || "ev1",
        maxUnlockedLevel,
      };
    });
  }

  const isLevelIntro = state.screen === "game" && Boolean(LEVEL_INTROS[state.nodeId]);
  const currentLevelId = getLevelIdForNode(state.nodeId);

  return (
    <div id="app">
      <LevelSidebar
        maxUnlockedLevel={state.maxUnlockedLevel}
        currentLevelId={currentLevelId}
        onSelectLevel={handleSelectLevel}
      />
      <div id="app-main">
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
          <GameOverScreen text={state.gameoverText} onRestart={handleStart} />
        )}
        {state.screen === "evaluation" && (
          <EvaluationScreen state={state} onRestart={handleStart} />
        )}
      </div>
    </div>
  );
}