// config: { label, speed, ballRate, charKey }
// charKey = pitcher's character portrait; batter is always ray.png
function startMinigame(canvas, config, callback) {
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  showIntro(config.label, () => runGame(config, callback));

  // ── 說明頁 ──────────────────────────────────────────
  function showIntro(label, onStart) {
    const W = canvas.width, H = canvas.height;
    let started = false, frame = 0, introId = null;

    function start() {
      if (started) return;
      started = true;
      document.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClickIntro);
      cancelAnimationFrame(introId);
      onStart();
    }
    function onKey(e) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); start(); }
    }
    function onClickIntro() { start(); }
    document.addEventListener('keydown', onKey);
    canvas.addEventListener('click', onClickIntro);

    function drawIntro() {
      if (started) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle  = '#f0d080';
      ctx.font       = 'bold 26px Georgia, serif';
      ctx.textAlign  = 'center';
      ctx.fillText('⚾  打擊時機！', W / 2, H / 2 - 160);

      ctx.fillStyle = 'rgba(238,232,213,0.9)';
      ctx.font      = '17px Georgia, serif';
      ctx.fillText(label, W / 2, H / 2 - 115);

      ctx.strokeStyle = 'rgba(240,208,128,0.2)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, H / 2 - 88); ctx.lineTo(W / 2 + 200, H / 2 - 88);
      ctx.stroke();

      const lines = [
        '球從投手手中投出，飛向好球帶',
        '移動滑鼠，將準心對準來球',
        '在球抵達時按下左鍵揮棒！',
        '',
        '打到球有機率出現界外球',
        '界外球不算三振（最多累積兩好球）',
        '累積 3 個好球（STRIKE）→ 三振出局',
        '累積 4 個壞球（BALL）→ 四壞保送',
        '打出安打 → 直接獲勝！',
      ];
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font      = '15px Georgia, serif';
      lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 - 32 + i * 27));

      const pulse = 0.55 + 0.45 * Math.sin(frame / 25);
      ctx.fillStyle = `rgba(240,208,128,${pulse})`;
      ctx.font      = 'bold 17px Georgia, serif';
      ctx.fillText('▶  點擊畫面或按 SPACE 鍵開始', W / 2, H / 2 + 230);

      frame++;
      introId = requestAnimationFrame(drawIntro);
    }
    drawIntro();
  }

  // ── 打擊遊戲主體 ─────────────────────────────────────
  function runGame(cfg, callback) {
    const W = canvas.width, H = canvas.height;
    const SPEED     = cfg.speed    || 0.007;
    const BALLRATE  = cfg.ballRate || 0.28;
    const FOUL_RATE = 0.30;

    // 直向手機偵測（H 顯著大於 W）
    const isPortrait = H > W * 1.2;

    // 版面常數（直向時改用 W 為基準，避免比例失衡）
    const PITCHER  = isPortrait
      ? { x: W * 0.75, y: H * 0.32 }
      : { x: W * 0.72, y: H * 0.35 };
    const ZONE     = isPortrait
      ? { x: W * 0.22, y: H * 0.28, w: W * 0.22, h: W * 0.32 }
      : { x: W * 0.26, y: H * 0.30, w: W * 0.16, h: H * 0.32 };
    const ZONE_CX  = ZONE.x + ZONE.w / 2;
    const ZONE_CY  = ZONE.y + ZONE.h / 2;
    const HOME     = { x: ZONE_CX, y: H * 0.78 };

    // 角色立繪高度：直向時以 W 為上限，避免過高
    const BATTER_H  = Math.min(H * 0.60, W * 0.40);
    const PITCHER_H = Math.min(H * 0.38, W * 0.26);

    // 球數
    let balls = 0, strikes = 0;

    // 每球狀態
    let phase      = 'between'; // between | pitching | swing_anim | result | done
    let phaseAge   = 0;
    let t          = 0;
    let inZone     = true;
    let tgtX = ZONE_CX, tgtY = ZONE_CY;
    let swung      = false, swungT = 0;
    let pitchResult= null;  // hit_perfect | hit_good | foul | swinging_strike | called_strike | ball
    let swingArc   = 0;
    let doneWin    = false;
    let firstPitch = true;
    let lastResult = null;

    // 滑鼠位置
    let mouseX = W / 2, mouseY = H / 2;

    // 打者永遠是 Ray；投手是 cfg.charKey
    const batterImg = new Image();
    let batterLoaded = false;
    batterImg.onload  = () => { batterLoaded = true; };
    batterImg.src = 'assets/characters/ray.png';

    const pitcherImg = new Image();
    let pitcherLoaded = false;
    pitcherImg.onload  = () => { pitcherLoaded = true; };
    pitcherImg.src = cfg.charKey ? `assets/characters/${cfg.charKey}.png` : '';

    let animId = null;

    // 隱藏系統游標，改用自繪準心
    canvas.style.cursor = 'none';

    // ── 事件 ─────────────────────────────────────────────
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onCanvasClick);

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    function onCanvasClick(e) {
      if (phase !== 'pitching' || swung) return;
      const rect = canvas.getBoundingClientRect();
      trySwingAt(e.clientX - rect.left, e.clientY - rect.top);
    }

    // ── 揮棒判定（滑鼠點擊位置） ───────────────────────────
    function trySwingAt(clickX, clickY) {
      swung    = true;
      swungT   = t;
      swingArc = 0;
      phase    = 'swing_anim';

      const { bx, by, br } = getBallPos();
      const dist      = Math.sqrt((clickX - bx) ** 2 + (clickY - by) ** 2);
      const hitRadius = br * 4.0;

      if (dist <= hitRadius) {
        if (Math.random() < FOUL_RATE) {
          pitchResult = 'foul';
        } else {
          pitchResult = dist < br * 1.5 ? 'hit_perfect' : 'hit_good';
        }
        playOnce('assets/sfx/sfx_hit.mp3');
      } else {
        pitchResult = 'swinging_strike';
        playOnce('assets/sfx/sfx_miss.mp3');
      }
    }

    // ── 下一球 ───────────────────────────────────────────
    function nextPitch() {
      inZone = firstPitch ? true : Math.random() > BALLRATE;
      firstPitch = false;

      if (inZone) {
        tgtX = ZONE.x + ZONE.w * (0.15 + Math.random() * 0.70);
        tgtY = ZONE.y + ZONE.h * (0.15 + Math.random() * 0.70);
      } else {
        const dir = Math.floor(Math.random() * 4);
        const mg  = W * 0.09;
        if      (dir === 0) { tgtX = ZONE_CX + (Math.random() - 0.5) * ZONE.w * 0.6;      tgtY = ZONE.y - mg * (0.6 + Math.random() * 0.7); }
        else if (dir === 1) { tgtX = ZONE_CX + (Math.random() - 0.5) * ZONE.w * 0.6;      tgtY = ZONE.y + ZONE.h + mg * (0.6 + Math.random() * 0.7); }
        else if (dir === 2) { tgtX = ZONE.x  - mg * (0.6 + Math.random() * 0.7);          tgtY = ZONE_CY + (Math.random() - 0.5) * ZONE.h * 0.6; }
        else                { tgtX = ZONE.x  + ZONE.w + mg * (0.6 + Math.random() * 0.7); tgtY = ZONE_CY + (Math.random() - 0.5) * ZONE.h * 0.6; }
      }

      t = 0; swung = false; swungT = 0; pitchResult = null;
      phase = 'pitching'; phaseAge = 0;
    }

    // ── 結果處理 ─────────────────────────────────────────
    function applyResult() {
      lastResult = pitchResult;

      if (pitchResult === 'hit_perfect' || pitchResult === 'hit_good') {
        doneWin = true; phase = 'done'; phaseAge = 0; return;
      }
      if (pitchResult === 'foul') {
        // 界外球：兩好球以前累積好球數，兩好球後不再增加（不會三振）
        if (strikes < 2) strikes++;
        phase = 'result'; phaseAge = 0; return;
      }
      if (pitchResult === 'swinging_strike' || pitchResult === 'called_strike') {
        strikes++;
        if (strikes >= 3) { doneWin = false; phase = 'done'; phaseAge = 0; return; }
      }
      if (pitchResult === 'ball') {
        balls++;
        if (balls >= 4) { doneWin = false; phase = 'done'; phaseAge = 0; return; }
      }
      phase = 'result'; phaseAge = 0;
    }

    // ── 主迴圈 ───────────────────────────────────────────
    function loop() {
      phaseAge++;

      switch (phase) {
        case 'between':
          if (phaseAge >= 75) nextPitch();
          break;

        case 'pitching':
          t += SPEED;
          if (t >= 1) {
            t = 1;
            pitchResult = inZone ? 'called_strike' : 'ball';
            if (pitchResult === 'ball') playOnce('assets/sfx/sfx_miss.mp3', 0.4);
            applyResult();
          }
          break;

        case 'swing_anim':
          swingArc = Math.min(1, swingArc + 0.075);
          t        = Math.min(1, t + SPEED);
          if (swingArc >= 1) applyResult();
          break;

        case 'result':
          if (phaseAge >= 90) { phase = 'between'; phaseAge = 0; }
          break;

        case 'done':
          if (phaseAge >= 120) {
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('click', onCanvasClick);
            cancelAnimationFrame(animId);
            canvas.style.cursor = '';
            callback(doneWin);
            return;
          }
          break;
      }

      draw();
      animId = requestAnimationFrame(loop);
    }
    loop();

    // ── 繪圖函式 ─────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(0,0,0,0.40)';
      ctx.fillRect(0, 0, W, H);

      drawPerspective();
      drawHomePlate();
      drawZone();
      drawPitcherPortrait();
      drawBatter();
      drawBall();
      drawMouseCrosshair();
      if (swung) drawSwingArc();
      drawScoreboard();
      drawResultText();
    }

    function drawPerspective() {
      const vx = W * 0.34, vy = H * 0.44;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth   = 1;
      [-0.30, -0.12, 0.06, 0.20, 0.35].forEach(a => {
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(a) * W * 1.8, vy + Math.abs(Math.sin(a)) * H * 1.5);
        ctx.stroke();
      });
    }

    function drawZone() {
      const { x, y, w, h } = ZONE;

      ctx.strokeStyle = 'rgba(255,220,50,0.14)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([]);
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(x + w / 3 * i, y); ctx.lineTo(x + w / 3 * i, y + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + h / 3 * i); ctx.lineTo(x + w, y + h / 3 * i); ctx.stroke();
      }

      ctx.fillStyle   = 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,220,50,0.80)';
      ctx.lineWidth   = 2;
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,220,50,0.50)';
      ctx.font      = '11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('好 球 帶', x + w / 2, y + h + 18);
    }

    function drawPitcherPortrait() {
      const ph = PITCHER_H;
      const py = H * 0.56 - ph;
      const px = W * 0.73;

      if (pitcherLoaded) {
        const aspect = pitcherImg.naturalWidth / pitcherImg.naturalHeight;
        const pw     = ph * aspect;
        ctx.globalAlpha = 0.72;
        ctx.drawImage(pitcherImg, px - pw / 2, py, pw, ph);
        ctx.globalAlpha = 1;
      } else {
        // 備用線條人
        const sx = PITCHER.x, sy = PITCHER.y, s = H * 0.052;
        const c  = 'rgba(210,230,215,0.55)';
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(sx, sy - s * 1.4, s * 0.58, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(sx - s * 0.44, sy - s * 0.8, s * 0.88, s * 1.5);
        ctx.strokeStyle = c; ctx.lineWidth = s * 0.26; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx - s * 0.2, sy - s * 0.4);
        ctx.quadraticCurveTo(sx + s * 1.4, sy - s * 1.1, sx + s * 2.1, sy - s * 0.5);
        ctx.stroke();
        [sx - s * 0.28, sx + s * 0.28].forEach(lx => {
          ctx.beginPath(); ctx.moveTo(lx, sy + s * 0.7);
          ctx.lineTo(lx + (lx > sx ? s * 0.35 : -s * 0.35), sy + s * 1.8); ctx.stroke();
        });
      }
    }

    function drawHomePlate() {
      const hx = HOME.x, hy = HOME.y, pw = W * 0.023;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(hx, hy - pw * 0.7); ctx.lineTo(hx + pw, hy);
      ctx.lineTo(hx + pw, hy + pw * 0.6); ctx.lineTo(hx - pw, hy + pw * 0.6);
      ctx.lineTo(hx - pw, hy); ctx.closePath(); ctx.fill();
    }

    function drawBatter() {
      const bh  = BATTER_H;
      const by  = H - bh - H * 0.04;
      const bx  = W * 0.02;

      if (batterLoaded) {
        const aspect = batterImg.naturalWidth / batterImg.naturalHeight;
        const bw     = bh * aspect;
        ctx.drawImage(batterImg, bx, by, bw, bh);
      } else {
        const bw = bh * 0.52;
        ctx.fillStyle = 'rgba(140,140,140,0.35)';
        ctx.beginPath(); ctx.arc(bx + bw / 2, by + bh * 0.12, bh * 0.11, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(bx + bw * 0.2, by + bh * 0.22, bw * 0.6, bh * 0.56);
      }

      // 靜止球棒
      if (!swung || phase === 'between') {
        const aspect = batterLoaded ? batterImg.naturalWidth / batterImg.naturalHeight : 0.52;
        const bw     = bh * aspect;
        const batX   = bx + bw * 0.90;
        const batY   = by + bh * 0.44;
        drawBatShape(batX, batY, batX + W * 0.075, batY - H * 0.24, 0.92);
      }
    }

    function drawBatShape(x1, y1, x2, y2, alpha) {
      const dx    = x2 - x1, dy = y2 - y1;
      const len   = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // 在旋轉座標系裡畫棒子：沿 x 軸（0→len），y 軸為寬度
      const hw    = len * 0.014;   // 把手半寬
      const bw    = len * 0.055;   // 桶身半寬
      const knobR = len * 0.032;
      const t1    = len * 0.30;    // 肩部起點
      const t2    = len * 0.46;    // 肩部終點
      const tapeL = len * 0.22;    // 膠帶長度

      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(angle);

      // ── 1. 圓柱體底色：漸層沿 y 軸（垂直截面）──
      const cylGrad = ctx.createLinearGradient(0, -bw, 0, bw);
      cylGrad.addColorStop(0.00, `rgba(240, 198, 110, ${alpha})`);
      cylGrad.addColorStop(0.22, `rgba(198, 152,  80, ${alpha})`);
      cylGrad.addColorStop(0.58, `rgba(148, 102,  46, ${alpha})`);
      cylGrad.addColorStop(1.00, `rgba( 85,  45,  15, ${alpha})`);

      ctx.beginPath();
      ctx.moveTo(0,   -hw);
      ctx.lineTo(t1,  -hw);
      ctx.lineTo(t2,  -bw);
      ctx.lineTo(len, -bw);
      ctx.lineTo(len,  bw);
      ctx.lineTo(t2,   bw);
      ctx.lineTo(t1,   hw);
      ctx.lineTo(0,    hw);
      ctx.closePath();
      ctx.fillStyle = cylGrad;
      ctx.fill();

      // ── 2. 握把膠帶（深色） ──
      const tapeGrad = ctx.createLinearGradient(0, -hw, 0, hw);
      tapeGrad.addColorStop(0,   `rgba(68, 44, 24, ${alpha})`);
      tapeGrad.addColorStop(0.5, `rgba(38, 22, 10, ${alpha})`);
      tapeGrad.addColorStop(1,   `rgba(25, 14,  5, ${alpha})`);
      ctx.beginPath();
      ctx.rect(0, -hw * 1.02, tapeL, hw * 2.04);
      ctx.fillStyle = tapeGrad;
      ctx.fill();

      // 膠帶橫紋
      ctx.strokeStyle = `rgba(95, 62, 35, ${alpha * 0.6})`;
      ctx.lineWidth = 0.9;
      ctx.setLineDash([2, 3]);
      for (let i = 0; i <= 6; i++) {
        const tx = (i / 6) * tapeL;
        ctx.beginPath();
        ctx.moveTo(tx, -hw * 1.1);
        ctx.lineTo(tx,  hw * 1.1);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── 3. 桶身中心高光 ──
      const hlGrad = ctx.createLinearGradient(t2, 0, len, 0);
      hlGrad.addColorStop(0,   `rgba(255,248,205,0)`);
      hlGrad.addColorStop(0.35,`rgba(255,248,205,${alpha * 0.38})`);
      hlGrad.addColorStop(0.75,`rgba(255,235,168,${alpha * 0.25})`);
      hlGrad.addColorStop(1,   `rgba(255,220,140,0)`);
      const hlw = bw * 0.30;
      ctx.beginPath();
      ctx.rect(t2, -hlw, len - t2, hlw * 2);
      ctx.fillStyle = hlGrad;
      ctx.fill();

      // ── 4. 輪廓線 ──
      ctx.strokeStyle = `rgba(60, 32, 10, ${alpha * 0.65})`;
      ctx.lineWidth   = 1.3;
      ctx.beginPath();
      ctx.moveTo(0,   -hw);
      ctx.lineTo(t1,  -hw);
      ctx.lineTo(t2,  -bw);
      ctx.lineTo(len, -bw);
      ctx.lineTo(len,  bw);
      ctx.lineTo(t2,   bw);
      ctx.lineTo(t1,   hw);
      ctx.lineTo(0,    hw);
      ctx.closePath();
      ctx.stroke();

      // ── 5. 旋鈕（knob） ──
      ctx.beginPath();
      ctx.arc(0, 0, knobR, 0, Math.PI * 2);
      const kg = ctx.createRadialGradient(-knobR * 0.35, -knobR * 0.35, 0, 0, 0, knobR);
      kg.addColorStop(0, `rgba(188, 138, 65, ${alpha})`);
      kg.addColorStop(1, `rgba( 78,  40, 13, ${alpha})`);
      ctx.fillStyle = kg;
      ctx.fill();
      ctx.strokeStyle = `rgba(52, 26, 7, ${alpha * 0.7})`;
      ctx.lineWidth   = 1;
      ctx.stroke();

      ctx.restore();
    }

    function getBallPos() {
      const prog = phase === 'pitching' ? t
                 : phase === 'swing_anim' ? Math.min(1, swungT + swingArc * 0.18)
                 : 1;
      return {
        bx:   PITCHER.x + (tgtX - PITCHER.x) * prog,
        by:   PITCHER.y + (tgtY - PITCHER.y) * prog,
        br:   3 + prog * 16,
        prog,
      };
    }

    function drawBall() {
      if (phase === 'between' || phase === 'done') return;
      const { bx, by, br, prog } = getBallPos();

      // 好打時機光暈
      if (phase === 'pitching' && prog >= 0.65 && inZone && !swung) {
        ctx.beginPath();
        ctx.arc(bx, by, br + 11, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,170,0.13)';
        ctx.fill();
      }

      // 球體
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#dddddd'; ctx.lineWidth = 1; ctx.stroke();

      // 縫線
      ctx.strokeStyle = '#cc3333'; ctx.lineWidth = Math.max(1, br * 0.10);
      ctx.beginPath(); ctx.arc(bx - br * 0.28, by, br * 0.65, -0.4, 0.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx + br * 0.28, by, br * 0.65, Math.PI - 0.4, Math.PI + 0.4); ctx.stroke();

      // 球上的十字紅點（擊球參考點，投球開始後逐漸顯現）
      if (phase === 'pitching' && !swung) {
        const fade = Math.min(0.90, prog * 2.2);
        ctx.strokeStyle = `rgba(255,50,50,${fade})`;
        ctx.lineWidth   = 1.8;
        ctx.setLineDash([4, 3]);
        const cr = br * 2.6;
        ctx.beginPath(); ctx.moveTo(bx - cr, by); ctx.lineTo(bx + cr, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by - cr); ctx.lineTo(bx, by + cr); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,50,50,${fade})`;
        ctx.fill();
      }
    }

    function drawMouseCrosshair() {
      // 自繪滑鼠準心（全程顯示）
      if (phase === 'done') return;

      const isPitching = phase === 'pitching' && !swung;
      let color = 'rgba(255,255,255,0.40)';
      let inRange = false;

      if (isPitching) {
        const { bx, by, br } = getBallPos();
        const dist = Math.sqrt((mouseX - bx) ** 2 + (mouseY - by) ** 2);
        inRange = dist <= br * 4.0;
        color   = inRange ? 'rgba(80,255,100,0.90)' : 'rgba(255,255,255,0.65)';
      }

      const size = 13;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(mouseX - size, mouseY); ctx.lineTo(mouseX + size, mouseY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mouseX, mouseY - size); ctx.lineTo(mouseX, mouseY + size); ctx.stroke();
      ctx.beginPath(); ctx.arc(mouseX, mouseY, size * 0.65, 0, Math.PI * 2); ctx.stroke();

      if (inRange) {
        ctx.fillStyle = 'rgba(80,255,100,0.85)';
        ctx.font      = 'bold 12px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('擊！', mouseX, mouseY - size - 5);
      }
    }

    function drawSwingArc() {
      const bh     = BATTER_H;
      const pivot  = { x: W * 0.17, y: (H - bh - H * 0.04) + bh * 0.44 };
      const radius = isPortrait ? Math.min(W * 0.13, bh * 0.35) : W * 0.13;
      const startA = -Math.PI * 0.88;
      const sweep  = Math.PI * 0.82 * Math.min(1, swingArc);
      const fade   = Math.max(0, 0.9 - swingArc * 0.55);
      const curA   = startA + sweep;

      // 淡化殘影弧線
      ctx.strokeStyle = `rgba(200,155,85,${fade * 0.22})`;
      ctx.lineWidth   = W * 0.003;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.arc(pivot.x, pivot.y, radius, startA, curA);
      ctx.stroke();

      // 棒子本體（沿當前角度）
      const barrelLen = radius * 1.05;
      const knobBack  = radius * 0.10;
      const knobX   = pivot.x - Math.cos(curA) * knobBack;
      const knobY   = pivot.y - Math.sin(curA) * knobBack;
      const barrelX = pivot.x + Math.cos(curA) * barrelLen;
      const barrelY = pivot.y + Math.sin(curA) * barrelLen;
      drawBatShape(knobX, knobY, barrelX, barrelY, fade);
    }

    function drawScoreboard() {
      const sh = 72;
      ctx.fillStyle = 'rgba(0,0,0,0.70)';
      ctx.fillRect(0, 0, W, sh);
      ctx.strokeStyle = 'rgba(240,208,128,0.22)';
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(0, sh); ctx.lineTo(W, sh); ctx.stroke();

      const cx   = W / 2;
      const dotR = 7, gap = dotR * 2 + 7;

      ctx.fillStyle = 'rgba(240,208,128,0.85)';
      ctx.font      = 'bold 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(cfg.label, cx, 22);

      // STRIKE 燈
      const sX = cx - 120;
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.font      = '11px Courier New';
      ctx.textAlign = 'right';
      ctx.fillText('STRIKE', sX - dotR - 6, 52);
      for (let i = 0; i < 2; i++) {
        ctx.beginPath(); ctx.arc(sX + i * gap, 48, dotR, 0, Math.PI * 2);
        if (i < strikes) { ctx.fillStyle = '#ff6666'; ctx.fill(); }
        else { ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5; ctx.stroke(); }
      }

      // BALL 燈
      const bX = cx + 60;
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.font      = '11px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText('BALL', bX + 3 * gap + dotR + 6, 52);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(bX + i * gap, 48, dotR, 0, Math.PI * 2);
        if (i < balls) { ctx.fillStyle = '#6688ff'; ctx.fill(); }
        else { ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5; ctx.stroke(); }
      }

      if (strikes === 2 && balls === 3) {
        ctx.fillStyle = 'rgba(255,200,60,0.9)';
        ctx.font      = 'bold 12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('▲ 滿球數！下一球決定勝負', cx, 66);
      } else if (strikes === 2) {
        ctx.fillStyle = 'rgba(255,120,80,0.75)';
        ctx.font      = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('兩好球，再一個好球出局！', cx, 66);
      } else if (balls === 3) {
        ctx.fillStyle = 'rgba(100,150,255,0.75)';
        ctx.font      = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('三壞球，再一個壞球保送！', cx, 66);
      }
    }

    function drawResultText() {
      const showResult = phase === 'result' || phase === 'done'
        || (phase === 'between' && phaseAge < 45 && lastResult !== null);

      if (!showResult) return;

      let text = '', color = '#ffffff';
      const r = (phase === 'done' || (phase === 'between' && lastResult)) ? lastResult : pitchResult;

      if (phase === 'done') {
        if (doneWin) {
          text  = r === 'hit_perfect' ? 'PERFECT！' : 'SAFE HIT！';
          color = '#80ff80';
        } else if (strikes >= 3) {
          text = '三振出局…'; color = '#ff7070';
        } else {
          text = '四壞球保送'; color = '#6688ff';
        }
      } else {
        switch (r) {
          case 'swinging_strike': text = 'STRIKE！';  color = '#ff9060'; break;
          case 'called_strike':   text = '好  球！';  color = '#ffb060'; break;
          case 'ball':            text = '壞  球！';  color = '#6688ff'; break;
          case 'foul':            text = '界外球！';  color = '#ffdd44'; break;
          case 'hit_perfect':     text = 'PERFECT！'; color = '#80ff80'; break;
          case 'hit_good':        text = 'SAFE HIT！'; color = '#b0ff60'; break;
        }
      }

      if (!text) return;

      const agePct = phase === 'done' ? phaseAge / 30
                   : phase === 'between' ? 1 - phaseAge / 45
                   : Math.min(1, phaseAge / 12);

      ctx.globalAlpha = Math.max(0, Math.min(1, agePct));
      ctx.font        = 'bold 58px Georgia, serif';
      ctx.textAlign   = 'center';
      ctx.fillStyle   = color;
      ctx.fillText(text, W / 2, H * 0.52);
      ctx.globalAlpha = 1;
    }
  }
}
