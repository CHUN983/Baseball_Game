# 夢幻成真 — Field of Dreams

> 改編自 1989 年電影《夢幻成真》的互動視覺小說遊戲

---

## 遊戲簡介

Ray Kinsella 是愛荷華州的一個普通農夫。某個夜晚，他在玉米田裡聽到了一個神秘的聲音：

> *"If you build it, he will come."*

這是一個關於信念、犧牲與和解的故事。跟著三個聲音的引導，做出每一個影響命運的選擇，最終在親手蓋起的球場上，完成一場遲來的傳接球。

---

## 遊戲特色

- **視覺小說敘事** — 打字機效果對話、場景切換、角色立繪
- **三幕故事結構** — 以電影三個神秘聲音為主軸
  - *If you build it, he will come.*
  - *Ease his pain.*
  - *Go the distance.*
- **選擇分支系統** — 每個決定影響存款、時間與後續選項解鎖
- **打擊小遊戲 × 3** — 在三個關鍵時刻揮棒，結果影響對話走向
- **經濟評分系統** — 最終分數由剩餘存款與花費天數共同計算
- **成就系統** — 7 個隱藏成就，記錄你的選擇風格

---

## 操作方式

| 操作 | 動作 |
|------|------|
| 滑鼠左鍵 / Space / Enter | 推進對話、跳過打字機效果 |
| 滑鼠左鍵 | 選擇對話選項 |
| Space / 點擊畫面 | 打擊小遊戲揮棒 |

---

## 如何執行

### 本地執行（WSL2 / Linux / Mac）

```bash
cd baseballGame
python3 -m http.server 8080
```

在瀏覽器開啟：`http://localhost:8080`

### 線上遊玩

[→ 點此遊玩](https://CHUN983.github.io/Baseball_Game/)

---

## 技術架構

- **語言**：HTML5 / CSS3 / Vanilla JavaScript（無框架）
- **渲染**：DOM（視覺小說）+ Canvas（打擊小遊戲）
- **部署**：GitHub Pages

```
baseballGame/
├── index.html          # 入口
├── style.css           # 所有視覺樣式
├── js/
│   ├── story.js        # 故事資料（場景節點）
│   ├── state.js        # 遊戲狀態（存款、天數、旗標）
│   ├── engine.js       # 核心引擎（對話、選擇、切換）
│   └── minigame.js     # Canvas 打擊小遊戲
└── assets/
    ├── bg/             # 背景圖（.jpg/.png）
    └── characters/     # 角色立繪（.png，選配）
```

---

## 成就一覽

| 成就 | 解鎖條件 |
|------|---------|
| 夢想家 | Scene 1 立刻相信聲音 |
| 務實者 | Scene 1 先觀察再行動 |
| Annie 的力量 | 全力說服 Annie 一起相信 |
| 球場工匠 | 親手建造球場 |
| Go the distance. | 查過資料後帶 Mann 去 Fenway |
| 完美打擊 | 三場小遊戲全部打好 |
| 與父和解 | 完成遊戲 |

---

*改編自 Phil Alden Robinson 執導、1989 年上映的電影《Field of Dreams》*
