function startMinigame(canvas, label, callback) {
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  // 先顯示說明頁，確認後才開始
  showIntro(label, () => runGame(label, callback));

  // ── 說明頁 ──────────────────────────────────────────
  function showIntro(label, onStart) {
    const W = canvas.width, H = canvas.height;
    let started = false;
    let frame   = 0;
    let introId = null;

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

      // 背景
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0,   '#050518');
      bg.addColorStop(0.5, '#0d1f0d');
      bg.addColorStop(1,   '#1B3A1B');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ⚾ 標題
      ctx.fillStyle  = '#f0d080';
      ctx.font       = 'bold 26px Georgia, serif';
      ctx.textAlign  = 'center';
      ctx.fillText('⚾  打擊時機！', W / 2, H / 2 - 140);

      // 場景說明
      ctx.fillStyle = 'rgba(238,232,213,0.9)';
      ctx.font      = '17px Georgia, serif';
      ctx.fillText(label, W / 2, H / 2 - 95);

      // 分隔線
      ctx.strokeStyle = 'rgba(240,208,128,0.2)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, H / 2 - 68);
      ctx.lineTo(W / 2 + 200, H / 2 - 68);
      ctx.stroke();

      // 操作說明
      const lines = [
        '球將從左側投出，向右側打擊區飛去',
        '當球進入打擊區時，按下 SPACE 鍵揮棒',
        '也可以直接點擊畫面來揮棒',
        '',
        '時機越準確，結果越好！',
      ];
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font      = '15px Georgia, serif';
      lines.forEach((line, i) => {
        ctx.fillText(line, W / 2, H / 2 - 30 + i * 28);
      });

      // 閃爍的開始提示
      const pulse = 0.55 + 0.45 * Math.sin(frame / 25);
      ctx.fillStyle = `rgba(240, 208, 128, ${pulse})`;
      ctx.font      = 'bold 17px Georgia, serif';
      ctx.fillText('▶  點擊畫面或按 SPACE 鍵開始', W / 2, H / 2 + 115);

      frame++;
      introId = requestAnimationFrame(drawIntro);
    }

    drawIntro();
  }

  // ── 打擊遊戲主體 ─────────────────────────────────────
  function runGame(label, callback) {
    const W = canvas.width, H = canvas.height;

    const BALL_START_X  = 90;
    const BALL_Y        = H * 0.48;
    const BALL_RADIUS   = 16;
    const BALL_SPEED    = (W - 180) / 145;

    const ZONE_X        = W * 0.70;
    const ZONE_W        = W * 0.09;
    const ZONE_H        = 110;
    const ZONE_CENTER_X = ZONE_X + ZONE_W / 2;

    let ballX        = BALL_START_X;
    let swung        = false;
    let hitResult    = null;
    let resultFrames = 0;
    let animId       = null;

    function swing() {
      if (swung) return;
      swung     = true;
      hitResult = Math.abs(ballX - ZONE_CENTER_X) <= ZONE_W / 2;
      resultFrames = 100;
    }

    function onKey(e) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); swing(); }
    }
    document.addEventListener('keydown', onKey);
    canvas.addEventListener('click', swing);

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // 背景
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0,   '#050518');
      bg.addColorStop(0.5, '#0d1f0d');
      bg.addColorStop(1,   '#1B3A1B');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 地面線
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(0, BALL_Y + 36);
      ctx.lineTo(W, BALL_Y + 36);
      ctx.stroke();

      // 投手端
      ctx.beginPath();
      ctx.arc(65, BALL_Y, 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();

      // 打擊區
      const zoneTop = BALL_Y - ZONE_H / 2;
      if (!swung) {
        ctx.fillStyle   = 'rgba(255,255,255,0.06)';
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      } else {
        ctx.fillStyle   = hitResult ? 'rgba(80,220,80,0.12)' : 'rgba(220,80,80,0.12)';
        ctx.strokeStyle = hitResult ? 'rgba(80,220,80,0.55)'  : 'rgba(220,80,80,0.45)';
      }
      ctx.lineWidth = 2;
      ctx.fillRect(ZONE_X, zoneTop, ZONE_W, ZONE_H);
      ctx.strokeRect(ZONE_X, zoneTop, ZONE_W, ZONE_H);

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font      = '12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('打擊區', ZONE_CENTER_X, zoneTop + ZONE_H + 18);

      // 球
      if (!swung || hitResult !== null) {
        ctx.beginPath();
        ctx.arc(ballX, BALL_Y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle   = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth   = 1;
        ctx.stroke();
        // 縫線
        ctx.strokeStyle = '#d04040';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.arc(ballX - 5, BALL_Y, 9, -0.45, 0.45);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ballX + 5, BALL_Y, 9, Math.PI - 0.45, Math.PI + 0.45);
        ctx.stroke();
      }

      // 場景標題
      ctx.fillStyle = 'rgba(240,208,128,0.88)';
      ctx.font      = 'bold 17px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, 54);

      // 提示
      if (!swung) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font      = '15px Georgia, serif';
        ctx.fillText('按 SPACE 鍵或點擊畫面揮棒！', W / 2, H - 56);
      }

      // 結果文字
      if (swung && hitResult !== null) {
        const p     = 1 - resultFrames / 100;
        const alpha = p < 0.2 ? p / 0.2 : p > 0.8 ? (1 - p) / 0.2 : 1;
        ctx.globalAlpha = alpha;
        ctx.font        = 'bold 58px Georgia, serif';
        ctx.textAlign   = 'center';
        ctx.fillStyle   = hitResult ? '#80ff80' : '#ff8080';
        ctx.fillText(hitResult ? 'PERFECT!' : 'MISS...', W / 2, BALL_Y - 70);
        ctx.globalAlpha = 1;
      }
    }

    function loop() {
      if (!swung) {
        ballX += BALL_SPEED;
        if (ballX > W - 60) {
          swung        = true;
          hitResult    = false;
          resultFrames = 100;
        }
      } else if (resultFrames > 0) {
        resultFrames--;
        if (resultFrames === 0) {
          document.removeEventListener('keydown', onKey);
          canvas.removeEventListener('click', swing);
          cancelAnimationFrame(animId);
          callback(hitResult);
          return;
        }
      }
      draw();
      animId = requestAnimationFrame(loop);
    }

    loop();
  }
}
