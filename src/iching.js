// 易经卜卦模块
// 状态机（参照 Android 原版 IChingOracleScreen.kt v1.0.0）：
//   home   → 点击抽取
//   drawing → 六爻从下往上 240ms/爻 逐爻出现
//           → 卦名淡入
//           → 卦辞淡入 + 分隔线
//           → 象传淡入
//           → 自动转 loaded
//   loaded → 完整卦象 + "再算一卦" + "✨ 问 AI" 按钮
// 再抽确认：弹"提醒"对话框

const TPL = `
<section class="iching-host">
  <div class="home" data-view="home">
    <div class="word-cloud" data-role="cloud"></div>
    <div class="home-center">
      <h1 class="title">八卦</h1>
      <p class="subtitle-zh">心 诚 则 灵</p>
      <p class="lead">请在心中默念你的问题</p>
      <div class="actions">
        <button class="btn" data-action="draw">点击抽取</button>
      </div>
    </div>
  </div>
  <div class="stage" data-view="drawing" hidden>
    <div class="hex-card" data-role="card">
      <div class="hex-lines" data-role="lines"></div>
      <div class="hex-name" data-role="name"></div>
      <div class="hex-pinyin" data-role="pinyin"></div>
      <div class="hex-en" data-role="en"></div>
      <div class="section-label" data-role="lbl1">卦辞</div>
      <div class="hex-judgment" data-role="judgment"></div>
      <div class="section-label" data-role="lbl2">象传</div>
      <div class="hex-image" data-role="image"></div>
    </div>
    <div class="actions row" data-role="actions" style="opacity:0;pointer-events:none">
      <button class="btn ghost" data-action="redraw">再算一卦</button>
      <button class="btn" data-action="copy">复制占卜结果</button>
      <button class="btn ghost" data-action="ai">打开 DeepSeek</button>
    </div>
  </div>
  <div class="modal" data-role="modal" hidden>
    <div class="modal-box">
      <div class="modal-title" data-role="modal-title">—</div>
      <div class="modal-text" data-role="modal-text">—</div>
      <div class="modal-actions">
        <button class="btn ghost" data-action="modal-cancel">取消</button>
        <button class="btn" data-action="modal-confirm">继续抽取</button>
      </div>
    </div>
  </div>
</section>
`;

const CSS = `
.iching-host { position:relative; width:100%; max-width:600px; min-height:min(560px, 100%); display:flex; align-items:center; justify-content:center; }
.iching-host .home[hidden],
.iching-host .stage[hidden] { display: none !important; }
.iching-host .home,
.iching-host .stage { display: flex; flex-direction: column; align-items: center; width: 100%; }

/* Home */
/* 原来固定 560px 高：在 iPhone（可视高约 760px、去掉 tab 栏更少）会被裁掉，改成跟随容器 */
.iching-host .home { position:relative; width:100%; height:100%; min-height:min(560px, 100%); }
.iching-host .word-cloud { position:absolute; inset:0; overflow:hidden; }
.iching-host .word-cloud .name {
  position:absolute; color:rgba(58,42,26,.12);
  font-family:"Source Han Serif SC","Songti SC",Georgia,serif;
  font-size:18px; letter-spacing:2px; user-select:none; pointer-events:none;
  animation: iching-drift 24s ease-in-out infinite alternate;
}
@keyframes iching-drift {
  0%   { transform: translateY(-6px); }
  100% { transform: translateY(6px); }
}
.iching-host .home-center {
  position:relative; z-index:1; width:100%; height:100%;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
}
.iching-host .home-center .title { color:#3a2a1a; font-size:clamp(40px,11vw,64px); margin:0 0 4px; font-weight:600; letter-spacing:clamp(4px,1.6vw,8px); }
.iching-host .home-center .subtitle-zh { color:#3a2a1a; font-size:max(12px,3.2vw); opacity:.55; margin:0 0 24px; letter-spacing:4px; }
.iching-host .home-center .lead { font-size:max(11px,3vw); opacity:.5; margin:0 0 36px; }
.iching-host .actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
.iching-host .actions.row { margin-top:16px; transition: opacity .25s; }

/* Card */
.iching-host .hex-card {
  width:min(420px, 92vw); min-height:min(420px, 62vh);
  max-height:calc(100% - 8px); overflow:auto;      /* 小屏时卦辞可滚，不被裁 */
  background: linear-gradient(180deg, #f4ead5 0%, #ebdfbe 100%);
  color:#2a2520; border:1px solid #b89c6d; border-radius:6px;
  padding:28px 32px; box-shadow:0 6px 24px rgba(0,0,0,.5);
  font-family:"Source Han Serif SC","Songti SC",Georgia,serif;
  text-align:center; position:relative;
}
.iching-host .hex-lines { display:flex; flex-direction:column; align-items:center; gap:5px; margin:8px 0 16px; }
.iching-host .hex-lines .line { width:min(200px, 60vw); height:10px; opacity:0; transform:translateY(8px); transition: opacity .3s, transform .3s; }
.iching-host .hex-lines .line.show { opacity:1; transform:translateY(0); }
/* 阳爻：实线 */
.iching-host .hex-lines .line.yang { width:min(200px, 60vw); height:5px; background:#3a2a1a; border-radius:1px; margin:2.5px 0; }
/* 阴爻：虚线（中间断开）—— 用 CSS 做两段+gap */
.iching-host .hex-lines .line.yin { position:relative; height:5px; margin:2.5px auto; width:min(200px, 60vw); }
.iching-host .hex-lines .line.yin::before,
.iching-host .hex-lines .line.yin::after {
  content:""; position:absolute; top:0; height:100%; background:#3a2a1a; border-radius:1px;
}
.iching-host .hex-lines .line.yin::before { left:0; width:42%; }
.iching-host .hex-lines .line.yin::after  { right:0; width:42%; }
.iching-host .hex-name { font-size:clamp(24px,6.5vw,32px); font-weight:600; letter-spacing:clamp(4px,1.6vw,8px); color:#5c3a1a; opacity:0; transition: opacity .4s; }
.iching-host .hex-name.show { opacity:1; }
.iching-host .hex-pinyin { font-size:max(13px,3.4vw); color:#7a5a3a; font-style:italic; margin-top:2px; opacity:0; transition: opacity .4s; }
.iching-host .hex-pinyin.show { opacity:.8; }
.iching-host .hex-en { font-size:max(11px,3vw); color:#8a6a4a; font-style:italic; margin-bottom:14px; opacity:0; transition: opacity .4s; }
.iching-host .hex-en.show { opacity:.7; }
.iching-host .section-label { font-family:"Courier New",ui-monospace,monospace; font-size:max(10px,2.7vw); color:#7a5a3a; letter-spacing:2px; margin-top:14px; opacity:0; transition: opacity .4s; }
.iching-host .section-label.show { opacity:.7; }
.iching-host .hex-judgment { font-size:max(14px,3.6vw); line-height:1.8; margin:8px 0; opacity:0; transition: opacity .4s; }
.iching-host .hex-judgment.show { opacity:1; }
.iching-host .hex-image { font-size:max(13px,3.4vw); line-height:1.8; color:#5a4030; font-style:italic; opacity:0; transition: opacity .4s; }
.iching-host .hex-image.show { opacity:1; }

/* Modal */
.iching-host .modal[hidden] { display: none !important; }
.iching-host .modal { position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; z-index:50; }
.iching-host .modal-box { background:#f4ead5; color:#2a2520; padding:clamp(18px,5vw,28px) clamp(18px,5vw,32px); border-radius:8px; max-width:420px; width:min(90vw, 420px); max-height:80vh; overflow:auto; box-shadow:0 10px 40px rgba(0,0,0,.6); font-family:"Source Han Serif SC","Songti SC",serif; text-align:center; border:1px solid #b89c6d; }
.iching-host .modal-title { font-size:18px; font-weight:600; margin-bottom:14px; color:#5c3a1a; }
.iching-host .modal-text { font-size:max(13px,3.4vw); line-height:1.8; margin-bottom:20px; }
.iching-host .modal-actions { display:flex; gap:12px; justify-content:center; }
`;

const state = { drawn: null, hasDrawnOnce: false };

async function loadHexagrams() {
  const r = await fetch("./iching/hexagrams.json");
  return r.json();
}

function drawRandom(hexagrams) {
  return hexagrams[Math.floor(Math.random() * hexagrams.length)];
}

function renderLines(binary) {
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const isYang = (binary >> i) & 1;
    lines.push(isYang ? "yang" : "yin");
  }
  return lines; // 数组索引 0 = 第一爻（最底）
}

function buildShareText(h) {
  return [
    `我算到了第 ${h.id} 卦：${h.name_zh}（${h.name_pinyin} / ${h.name_en}）`,
    "",
    `卦辞：${h.judgment}`,
    `象传：${h.image}`,
    "",
    "我要问的问题是："
  ].join("\n");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildWordCloud(host) {
  const cloud = host.querySelector('[data-role="cloud"]');
  cloud.innerHTML = "";
  // 用 64 卦名做字云（这里我们硬编码 64 卦名单，与 JSON 顺序无关，名字也不需要一一对应）
  const names = [
    "乾","坤","屯","蒙","需","讼","师","比","小畜","履","泰","否","同人","大有","谦","豫",
    "随","蛊","临","观","噬嗑","贲","剥","复","无妄","大畜","颐","大过","坎","离","咸","恒",
    "遁","大壮","晋","明夷","家人","睽","蹇","解","损","益","夬","姤","萃","升","困","井",
    "革","鼎","震","艮","渐","归妹","丰","旅","巽","兑","涣","节","中孚","小过","既济","未济"
  ];
  // 64 卦位置：seeded random
  const seed = names.length;
  function rng(i) {
    const x = Math.sin(i * 12.9898 + seed) * 43758.5453;
    return x - Math.floor(x);
  }
  names.forEach((name, i) => {
    const el = document.createElement("div");
    el.className = "name";
    el.textContent = name;
    el.style.left = (rng(i) * 100) + "%";
    el.style.top = (rng(i + 100) * 100) + "%";
    el.style.animationDelay = ((i % 8) * 0.4) + "s";
    cloud.appendChild(el);
  });
}

function render(host, onCopy, onAI) {
  host.innerHTML = TPL;
  const styleEl = document.createElement("style");
  styleEl.textContent = CSS;
  host.appendChild(styleEl);

  const views = {
    home: host.querySelector('[data-view="home"]'),
    drawing: host.querySelector('[data-view="drawing"]')
  };
  const modal = host.querySelector('[data-role="modal"]');

  buildWordCloud(host);

  function showView(name) {
    Object.entries(views).forEach(([k, el]) => {
      el.hidden = k !== name;
    });
  }

  function showModal(title, text) {
    host.querySelector('[data-role="modal-title"]').textContent = title;
    host.querySelector('[data-role="modal-text"]').textContent = text;
    modal.hidden = false;
  }
  function hideModal() { modal.hidden = true; }

  async function doDraw(skipConfirm = false) {
    if (state.hasDrawnOnce && !skipConfirm) {
      showModal(
        "提醒",
        "如果一件事连续两次进行测算，就会破坏其发展，导致最后的算卦结果变得很不准确。\n\n请确定你的问题是否不一致。"
      );
      return;
    }
    const data = await loadHexagrams();
    state.drawn = drawRandom(data.hexagrams);
    state.hasDrawnOnce = true;
    await animateDraw(state.drawn);
  }

  async function animateDraw(h) {
    showView("drawing");

    // 重置所有内容
    const linesEl = views.drawing.querySelector('[data-role="lines"]');
    linesEl.innerHTML = "";
    const lineTypes = renderLines(h.binary);
    // 第一爻在最底，所以视觉上从下往上 = 数组顺序
    lineTypes.forEach(kind => {
      const el = document.createElement("div");
      el.className = "line " + kind;
      // yang = 实线（1 段）/ yin = 虚线（2 段，中间断开）
      el.innerHTML = kind === 'yang'
        ? '<div class="seg"></div>'
        : '<div class="seg"></div><div class="seg"></div>';
      linesEl.appendChild(el);
    });
    views.drawing.querySelector('[data-role="name"]').textContent = h.name_zh;
    views.drawing.querySelector('[data-role="pinyin"]').textContent = h.name_pinyin;
    views.drawing.querySelector('[data-role="en"]').textContent = `#${h.id} · ${h.name_en}`;
    views.drawing.querySelector('[data-role="judgment"]').textContent = h.judgment;
    views.drawing.querySelector('[data-role="image"]').textContent = h.image;

    // 重置可见
    views.drawing.querySelectorAll('.line, [data-role="name"], [data-role="pinyin"], [data-role="en"], [data-role="lbl1"], [data-role="lbl2"], [data-role="judgment"], [data-role="image"]')
      .forEach(el => el.classList.remove("show"));
    const actionsRow = views.drawing.querySelector('[data-role="actions"]');
    actionsRow.style.opacity = "0";
    actionsRow.style.pointerEvents = "none";

    // 6 爻逐爻（240ms 一爻）
    const lineEls = linesEl.querySelectorAll('.line');
    for (let i = 0; i < 6; i++) {
      lineEls[i].classList.add("show");
      await sleep(240);
    }
    // 卦名 + 拼音 + 英文
    views.drawing.querySelector('[data-role="name"]').classList.add("show");
    await sleep(160);
    views.drawing.querySelector('[data-role="pinyin"]').classList.add("show");
    views.drawing.querySelector('[data-role="en"]').classList.add("show");
    await sleep(160);
    // 卦辞
    views.drawing.querySelector('[data-role="lbl1"]').classList.add("show");
    views.drawing.querySelector('[data-role="judgment"]').classList.add("show");
    await sleep(200);
    // 象传
    views.drawing.querySelector('[data-role="lbl2"]').classList.add("show");
    views.drawing.querySelector('[data-role="image"]').classList.add("show");
    await sleep(160);
    // 按钮淡入
    actionsRow.style.opacity = "1";
    actionsRow.style.pointerEvents = "auto";
  }

  host.addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    if (action === "draw") await doDraw();
    else if (action === "redraw") await doDraw();
    else if (action === "copy") onCopy(buildShareText(state.drawn));
    else if (action === "ai") onAI();
    else if (action === "modal-cancel") hideModal();
    else if (action === "modal-confirm") { hideModal(); await doDraw(true); }
  });

  showView("home");
}

export function initIching(host, cbs) {
  render(host, cbs.onCopy, cbs.onAI);
}
