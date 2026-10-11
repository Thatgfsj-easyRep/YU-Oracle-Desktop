// 塔罗镜模块（参照 Android 原版 v0.2.1 状态机）
// 状态：home(抽牌主页) → loaded(手动翻牌) → back→ home

const TPL = `
<section class="oracle-host">
  <div class="home" data-view="home">
    <h1 class="title">塔罗镜</h1>
    <p class="subtitle-en">Tarot Mirror</p>
    <p class="subtitle-zh">心 诚 则 灵</p>
    <p class="lead">请在心中默念你的问题</p>
    <div class="actions">
      <button class="btn" data-action="draw-one">点击抽取</button>
      <button class="btn ghost" data-action="draw-three">三卡阵 · 过去 / 现在 / 未来</button>
    </div>
  </div>

  <div class="stage" data-view="single" hidden>
    <div class="hint" data-role="hint">— 点 击 翻 牌 —</div>
    <div class="card-w160" data-role="card">
      <div class="face back">✦</div>
      <div class="face front"><img data-role="img" alt=""></div>
    </div>
    <div class="info" data-role="info">
      <div class="name" data-role="name"></div>
      <div class="name-en" data-role="name-en"></div>
      <div class="orientation" data-role="ori"></div>
    </div>
    <div class="actions row">
      <button class="btn ghost" data-action="clear">返回首页</button>
      <button class="btn" data-action="copy">复制占卜结果</button>
      <button class="btn ghost" data-action="ai">打开 DeepSeek</button>
    </div>
  </div>

  <div class="stage" data-view="spread" hidden>
    <div class="spread">
      <div class="slot"><div class="lbl">过  去</div><div class="card-w80" data-role="card" data-i="0"><div class="face back">✦</div><div class="face front"><img data-role="img" alt=""></div></div><div class="card-info" data-role="info0"><div class="card-name" data-role="name0"></div><div class="card-en" data-role="en0"></div><div class="card-ori" data-role="ori0"></div></div></div>
      <div class="slot"><div class="lbl">现  在</div><div class="card-w80" data-role="card" data-i="1"><div class="face back">✦</div><div class="face front"><img data-role="img" alt=""></div></div><div class="card-info" data-role="info1"><div class="card-name" data-role="name1"></div><div class="card-en" data-role="en1"></div><div class="card-ori" data-role="ori1"></div></div></div>
      <div class="slot"><div class="lbl">未  来</div><div class="card-w80" data-role="card" data-i="2"><div class="face back">✦</div><div class="face front"><img data-role="img" alt=""></div></div><div class="card-info" data-role="info2"><div class="card-name" data-role="name2"></div><div class="card-en" data-role="en2"></div><div class="card-ori" data-role="ori2"></div></div></div>
    </div>
    <div class="actions row" style="margin-top:24px">
      <button class="btn ghost" data-action="clear">返回首页</button>
      <button class="btn" data-action="copy">复制占卜结果</button>
      <button class="btn ghost" data-action="ai">打开 DeepSeek</button>
    </div>
  </div>
</section>
`;

const CSS = `
.oracle-host { display:flex; flex-direction:column; align-items:center; gap:14px; width:100%; max-width:560px;
  /* iOS 竖屏（390pt）也能装下三张牌：所有尺寸由这两个变量派生 */
  --cw1: min(200px, 52vw);   /* 单卡模式卡宽 */
  --cw3: min(200px, 27vw);   /* 三卡阵卡宽：3×27vw + 2×2.5vw = 86vw < 96vw */
  --gap3: min(32px, 2.5vw);
}
.title { color:#D4AF37; font-size:clamp(26px,7vw,36px); margin:8px 0 4px; font-weight:600; letter-spacing:clamp(3px,1.6vw,8px); }
.subtitle-en { color:#F5E7A0; font-size:13px; font-style:italic; letter-spacing:2px; opacity:.75; margin:0; }
.subtitle-zh { color:#F5E7C8; font-size:max(11px,3vw); opacity:.55; margin:6px 0 28px; letter-spacing:4px; }
.lead { font-size:max(12px,3.4vw); opacity:.55; margin-bottom:32px; }
.home { display:flex; flex-direction:column; align-items:center; }
.home[hidden], .stage[hidden] { display: none !important; }
.actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
.actions.row { margin-top:8px; }

/* 3D 翻牌 */
.stage { perspective:1200px; display:flex; flex-direction:column; align-items:center; }
.hint { font-size:max(12px,3.4vw); opacity:.55; font-style:italic; letter-spacing:4px; height:18px; }
.hint.hide { opacity:0; transition:opacity .4s; }

/* === 卡面尺寸：宽由 --cw 决定，高按塔罗牌 1:1.4 比例派生 === */
.card-w160 {
  width:var(--cw1); height:calc(var(--cw1) * 1.4); position:relative;
  transform-style:preserve-3d; cursor:pointer;
  -webkit-user-select:none; user-select:none;   /* 翻牌时不要选中文字 */
}
.card-w160 { transition: transform .8s ease-in-out; }
.card-w160.flipped { transform:rotateY(180deg); }

.card-w80 {
  width:var(--cw3); height:calc(var(--cw3) * 1.4); position:relative;
  transform-style:preserve-3d; cursor:pointer;
  -webkit-user-select:none; user-select:none;
}
.card-w80 { transition: transform .8s ease-in-out; }
.card-w80.flipped { transform:rotateY(180deg); }

.face {
  position:absolute; inset:0; backface-visibility:hidden;
  border-radius:10px; overflow:hidden;
  box-shadow:0 0 28px rgba(212,175,55,.55), 0 0 0 2px rgba(212,175,55,.3) inset;
}
.face.back {
  transform:rotateY(0deg); /* 默认可见（背面朝上） */
  background:linear-gradient(135deg,#3C126E 0%, #1a0540 60%, #040214 100%);
  display:flex; align-items:center; justify-content:center;
  font-size:calc(var(--cw1) * .32); color:#D4AF37;   /* ✦ 随牌缩放 */
  text-shadow:0 0 18px rgba(212,175,55,.5);
}
.face.back::before {
  content:""; position:absolute; inset:8px;
  border:1px solid rgba(212,175,55,.4); border-radius:6px;
}
.face.front { background:#000; transform:rotateY(180deg); /* 默认隐藏 */ }
.face.front img { width:100%; height:100%; object-fit:cover; display:block; }

.card-w80 .face { border-radius:6px; box-shadow:0 0 14px rgba(212,175,55,.4); }
.card-w80 .face.back { font-size:calc(var(--cw3) * .24); }
.card-w80 .face.back::before { inset:4px; }

.spread { display:flex; gap:var(--gap3); justify-content:center; align-items:flex-end; }
.lbl { text-align:center; color:#D4AF37; font-size:13px; margin-bottom:6px; letter-spacing:2px; }
.slot { display:flex; flex-direction:column; align-items:center; gap:8px; }
.card-info { text-align:center; opacity:0; transition:opacity .5s; }
.card-info.show { opacity:1; }
.card-info .card-name { color:#D4AF37; font-size:clamp(11px,3vw,16px); font-weight:600; }
.card-info .card-en { color:#F5E7A0; font-size:max(10px,2.7vw); font-style:italic; opacity:.85; }
.card-info .card-ori { color:#F5E7C8; font-size:max(10px,2.8vw); margin-top:2px; }
.card-info .card-ori.rev { color:#c97bd8; }

.info { text-align:center; opacity:0; transition: opacity .6s .3s; min-height:74px; margin-top:14px; }
.info.show { opacity:1; }
.name { color:#D4AF37; font-size:clamp(18px,5vw,22px); margin:4px 0; font-weight:600; }
.name-en { color:#F5E7A0; font-size:13px; font-style:italic; opacity:.85; }
.orientation { color:#F5E7C8; margin-top:4px; font-size:max(12px,3.2vw); }
.orientation.rev { color:#c97bd8; }
`;

const state = { drawn: [], mode: null };

function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }

async function loadCards() {
  const r = await fetch("./tarot/cards.json");
  return r.json();
}

function drawOne(cards) {
  const c = cards[Math.floor(Math.random() * cards.length)];
  return [{ card: c, reversed: Math.random() < 0.5 }];
}
function drawThree(cards) {
  return shuffle(cards).slice(0, 3).map(c =>
    ({ card: c, reversed: Math.random() < 0.5 })
  );
}

function buildShareText(drawn) {
  if (drawn.length === 1) {
    const d = drawn[0];
    const o = d.reversed ? "逆位" : "顺位";
    return [
      "我抽取了塔罗牌，这是我抽到的卡牌：",
      "",
      `${d.card.name_zh}（${d.card.name_en}）${o}`,
      "",
      "我要问的问题是："
    ].join("\n");
  }
  const labels = ["过去", "现在", "未来"];
  const body = drawn.map((d, i) => {
    const o = d.reversed ? "逆位" : "顺位";
    return `${labels[i]}：${d.card.name_zh}（${d.card.name_en}）${o}`;
  }).join("\n");
  return [
    "我抽取了塔罗牌，这是我抽到的卡牌：",
    "",
    body,
    "",
    "我要问的问题是："
  ].join("\n");
}

function render(host, onCopy, onAI) {
  host.innerHTML = TPL;

  const styleEl = document.createElement("style");
  styleEl.textContent = CSS;
  host.appendChild(styleEl);

  const views = {
    home: host.querySelector('[data-view="home"]'),
    single: host.querySelector('[data-view="single"]'),
    spread: host.querySelector('[data-view="spread"]')
  };

  // 切换 view helper
  function showView(name) {
    Object.entries(views).forEach(([k, el]) => {
      el.hidden = k !== name;
    });
  }

  // 抽一张
  async function doDrawOne() {
    const data = await loadCards();
    state.drawn = drawOne(data.cards); state.mode = "one";
    renderSingle(state.drawn);
    showView("single");
  }

  async function doDrawThree() {
    const data = await loadCards();
    state.drawn = drawThree(data.cards); state.mode = "three";
    renderSpread(state.drawn);
    showView("spread");
  }

  function renderSingle(drawn) {
    const d = drawn[0];
    const card = views.single.querySelector('[data-role="card"]');
    const img = views.single.querySelector('[data-role="img"]');
    img.src = `./tarot/cards/${d.card.image_res}.jpg`;
    views.single.querySelector('[data-role="name"]').textContent = d.card.name_zh;
    views.single.querySelector('[data-role="name-en"]').textContent = d.card.name_en;
    const ori = views.single.querySelector('[data-role="ori"]');
    ori.textContent = d.reversed ? "逆位 Reversed" : "顺位 Upright";
    ori.className = "orientation" + (d.reversed ? " rev" : "");
    card.classList.remove("flipped", "reversed");
    const hint = views.single.querySelector('[data-role="hint"]');
    const info = views.single.querySelector('[data-role="info"]');
    hint.classList.remove("hide");
    info.classList.remove("show");
    card.onclick = () => {
      const flipped = card.classList.toggle("flipped");
      hint.classList.toggle("hide", flipped);
      info.classList.toggle("show", flipped);
      if (flipped && d.reversed) card.classList.add("reversed");
      else card.classList.remove("reversed");
    };
  }

  function renderSpread(drawn) {
    drawn.forEach((d, i) => {
      const card = views.spread.querySelector(`[data-i="${i}"]`);
      const img = card.querySelector('[data-role="img"]');
      const info = views.spread.querySelector(`[data-role="info${i}"]`);
      img.src = `./tarot/cards/${d.card.image_res}.jpg`;
      card.classList.remove("flipped");
      info.classList.remove("show");
      // 翻牌后显示牌名信息
      card.onclick = () => {
        card.classList.toggle("flipped");
        info.classList.toggle("show", card.classList.contains("flipped"));
      };
      // 填写牌名信息（先隐藏）
      views.spread.querySelector(`[data-role="name${i}"]`).textContent = d.card.name_zh;
      views.spread.querySelector(`[data-role="en${i}"]`).textContent = d.card.name_en;
      const ori = views.spread.querySelector(`[data-role="ori${i}"]`);
      ori.textContent = d.reversed ? "逆位 Reversed" : "顺位 Upright";
      ori.className = "card-ori" + (d.reversed ? " rev" : "");
    });
  }

  // 事件代理：抽取 / 返回 / 复制 / AI
  host.addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    if (action === "draw-one") await doDrawOne();
    else if (action === "draw-three") await doDrawThree();
    else if (action === "clear") { state.drawn = []; showView("home"); }
    else if (action === "copy") onCopy(buildShareText(state.drawn));
    else if (action === "ai") onAI();
  });

  showView("home");
}

export function initTarot(host, cbs) {
  render(host, cbs.onCopy, cbs.onAI);
}
