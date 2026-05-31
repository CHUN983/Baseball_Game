// config: { label, speed, ballRate, charKey }
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
      ctx.fillText('⚾  打擊時機！', W / 2, H / 2 - 150);

      ctx.fillStyle = 'rgba(238,232,213,0.9)';
      ctx.font      = '17px Georgia, serif';
      ctx.fillText(label, W / 2, H / 2 - 105);

      ctx.strokeStyle = 'rgba(240,208,128,0.2)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, H / 2 - 78); ctx.lineTo(W / 2 + 200, H / 2 - 78);
      ctx.stroke();

      const lines = [
        '球從投手手中投出，飛向好球帶',
        '好球帶內的球 → 按 SPACE 揮棒！',
        '壞球帶外的球 → 忍住不揮，等好球',
        '',
        '累積 3 個好球（STRIKE）→ 三振出局',
        '累積 4 個壞球（BALL）→ 四壞保送',
        '打出安打 → 直接獲勝！',
      ];
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font      = '15px Georgia, serif';
      lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 - 22 + i * 28));

      const pulse = 0.55 + 0.45 * Math.sin(frame / 25);
      ctx.fillStyle = `rgba(240,208,128,${pulse})`;
      ctx.font      = 'bold 17px Georgia, serif';
      ctx.fillText('▶  點擊畫面或按 SPACE 鍵開始', W / 2, H / 2 + 140);

      frame++;
      introId = requestAnimationFrame(drawIntro);
    }
    drawIntro();
  }

  // ── 打擊遊戲主體 ─────────────────────────────────────
  function runGame(cfg, callback) {
    const W = canvas.width, H = canvas.height;
    const SPEED    = cfg.speed    || 0.007;
    const BALLRATE = cfg.ballRate || 0.28;

    // 版面常數
    const PITCHER  = { x: W * 0.60, y: H * 0.40 };
    const ZONE     = { x: W * 0.44, y: H * 0.27, w: W * 0.18, h: H * 0.31 };
    const ZONE_CX  = ZONE.x + ZONE.w / 2;
    const ZONE_CY  = ZONE.y + ZONE.h / 2;
    const HOME     = { x: W * 0.53, y: H * 0.80 };

    // 球數
    let balls = 0, strikes = 0;

    // 每球狀態
    let phase      = 'between'; // between | pitching | swing_anim | result | done
    let phaseAge   = 0;
    let t          = 0;
    let inZone     = true;
    let tgtX = ZONE_CX, tgtY = ZONE_CY;
    let swung      = false, swungT = 0;
    let pitchResult= null;  // hit_perfect | hit_good | swinging_strike | called_strike | ball
    let swingArc   = 0;
    let doneWin    = false;
    let firstPitch = true;
    let lastResult = null;  // 保留上一球結果，between 階段顯示

    // 打者立繪
    const charImg = new Image();
    let charLoaded = false;
    charImg.onload  = () => { charLoaded = true; };
    charImg.src = cfg.charKey ? `assets/characters/${cfg.charKey}.png` : '';

    let animId = null;

    // ── 事件 ─────────────────────────────────────────────
    function onKey(e) {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      e.preventDefault();
      trySwing();
    }
    function onCanvasClick() { trySwing(); }
    document.addEventListener('keydown', onKey);
    canvas.addEventListener('click', onCanvasClick);

    // ── 揮棒判定 ─────────────────────────────────────────
    function trySwing() {
      if (phase !== 'pitching' || swung) return;
      swung    = true;
      swungT   = t;
      swingArc = 0;
      phase    = 'swing_anim';

      const inWindow = t >= 0.72 && t <= 0.97;
      if (inWindow && inZone) {
        const dist = Math.abs(t - 0.86);
        pitchResult = dist < 0.06 ? 'hit_perfect' : dist < 0.13 ? 'hit_good' : 'swinging_strike';
      } else {
        pitchResult = 'swinging_strike';
      }

      const isHit = pitchResult === 'hit_perfect' || pitchResult === 'hit_good';
      playOnce(isHit ? 'assets/sfx/sfx_hit.mp3' : 'assets/sfx/sfx_miss.mp3');
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
        if      (dir === 0) { tgtX = ZONE_CX + (Math.random() - 0.5) * ZONE.w * 0.6;  tgtY = ZONE.y - mg * (0.6 + Math.random() * 0.7); }
        else if (dir === 1) { tgtX = ZONE_CX + (Math.random() - 0.5) * ZONE.w * 0.6;  tgtY = ZONE.y + ZONE.h + mg * (0.6 + Math.random() * 0.7); }
        else if (dir === 2) { tgtX = ZONE.x  - mg * (0.6 + Math.random() * 0.7);      tgtY = ZONE_CY + (Math.random() - 0.5) * ZONE.h * 0.6; }
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
          if (phaseAge >= 85) nextPitch();
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
            document.removeEventListener('keydown', onKey);
            canvas.removeEventListener('click', onCanvasClick);
            cancelAnimationFrame(animId);
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

      // 半透明遮罩（讓底層 #bg 顯示但稍暗）
      ctx.fillStyle = 'rgba(0,0,0,0.40)';
      ctx.fillRect(0, 0, W, H);

      drawPerspective();
      drawHomePlate();
      drawPitcher();
      drawZone();
      drawBatter();
      drawBall();
      if (swung) drawSwingArc();
      drawScoreboard();
      drawResultText();
    }

    function drawPerspective() {
      const vx = W * 0.56, vy = H * 0.44;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth   = 1;
      [-0.20, -0.08, 0.04, 0.16, 0.28].forEach(a => {
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(a) * W * 1.8, vy + Math.abs(Math.sin(a)) * H * 1.5);
        ctx.stroke();
      });
    }

    function drawZone() {
      const { x, y, w, h } = ZONE;

      // 好球帶內格線
      ctx.strokeStyle = 'rgba(255,220,50,0.14)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([]);
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(x + w / 3 * i, y); ctx.lineTo(x + w / 3 * i, y + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + h / 3 * i); ctx.lineTo(x + w, y + h / 3 * i); ctx.stroke();
      }

      // 外框虛線
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

    function drawPitcher() {
      const px = PITCHER.x, py = PITCHER.y;
      const s  = H * 0.052;
      const c  = 'rgba(210,230,215,0.55)';

      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(px, py - s * 1.4, s * 0.58, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(px - s * 0.44, py - s * 0.8, s * 0.88, s * 1.5);

      ctx.strokeStyle = c; ctx.lineWidth = s * 0.26; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px - s * 0.2, py - s * 0.4);
      ctx.quadraticCurveTo(px + s * 1.4, py - s * 1.1, px + s * 2.1, py - s * 0.5);
      ctx.stroke();

      [px - s * 0.28, px + s * 0.28].forEach(lx => {
        ctx.beginPath();
        ctx.moveTo(lx, py + s * 0.7);
        ctx.lineTo(lx + (lx > px ? s * 0.35 : -s * 0.35), py + s * 1.8);
        ctx.stroke();
      });
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
      const bh  = H * 0.60;
      const by  = H - bh - H * 0.04;
      const bx  = W * 0.02;

      if (charLoaded) {
        const aspect = charImg.naturalWidth / charImg.naturalHeight;
        const bw     = bh * aspect;
        ctx.drawImage(charImg, bx, by, bw, bh);
      } else {
        const bw = bh * 0.52;
        ctx.fillStyle = 'rgba(140,140,140,0.35)';
        ctx.beginPath(); ctx.arc(bx + bw / 2, by + bh * 0.12, bh * 0.11, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(bx + bw * 0.2, by + bh * 0.22, bw * 0.6, bh * 0.56);
      }

      // 靜止球棒
      if (!swung || phase === 'between') {
        const aspect = charLoaded ? charImg.naturalWidth / charImg.naturalHeight : 0.52;
        const bw     = bh * aspect;
        const batX   = bx + bw * 0.90;
        const batY   = by + bh * 0.44;
        ctx.strokeStyle = 'rgba(175,125,65,0.88)';
        ctx.lineWidth   = W * 0.0055;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(batX, batY);
        ctx.lineTo(batX + W * 0.075, batY - H * 0.24);
        ctx.stroke();
      }
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
      if (phase === 'pitching' && prog >= 0.68 && inZone && !swung) {
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

      // 準星（接近好打點時顯示）
      if (phase === 'pitching' && prog >= 0.58 && !swung) {
        const fadeIn = Math.min(0.8, (prog - 0.58) * 5);
        ctx.strokeStyle = `rgba(255,60,60,${fadeIn})`;
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([4, 3]);
        const cr = br * 2.8;
        ctx.beginPath(); ctx.moveTo(bx - cr, by); ctx.lineTo(bx + cr, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by - cr); ctx.lineTo(bx, by + cr); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    function drawSwingArc() {
      const pivot  = { x: W * 0.17, y: H * 0.63 };
      const radius = W * 0.13;
      const startA = -Math.PI * 0.88;
      const sweep  = Math.PI * 0.82 * Math.min(1, swingArc);
      const fade   = Math.max(0, 0.9 - swingArc * 0.55);

      ctx.strokeStyle = `rgba(175,125,65,${fade})`;
      ctx.lineWidth   = W * 0.0055;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.arc(pivot.x, pivot.y, radius, startA, startA + sweep);
      ctx.stroke();
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

      // 場景標題
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

      // 滿球數警示
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
      // 在 between 階段顯示上一球結果（淡出）
      const showResult = phase === 'result' || phase === 'done'
        || (phase === 'between' && phaseAge < 45 && lastResult !== null);

      if (!showResult) return;

      let text = '', color = '#ffffff';
      const r = phase === 'done' ? lastResult : pitchResult;

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
          case 'swinging_strike': text = 'STRIKE！'; color = '#ff9060'; break;
          case 'called_strike':   text = '好  球！'; color = '#ffb060'; break;
          case 'ball':            text = '壞  球！'; color = '#6688ff'; break;
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
