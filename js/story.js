// 故事資料層
// character 欄位：指定該場景顯示哪個角色立繪（null = 不顯示）

const STORY = {

  prologue: {
    bg: 'farm', character: null,
    lines: [
      { speaker: '旁白', text: '1989年，愛荷華州。' },
      { speaker: '旁白', text: 'Ray Kinsella 是一個普通的農夫，帶著妻子 Annie 和女兒 Karin，在這片廣袤的玉米田裡討生活。' },
      { speaker: '旁白', text: '農場是他們的一切，也是壓在肩上最沉的債務。' },
      { speaker: 'Ray',  text: '（望著眼前無盡的玉米田）如果有一天這一切都消失了……我還剩什麼？' },
    ],
    next: 'scene1'
  },

  // ── 第一幕："If you build it, he will come." ──────────
  scene1: {
    bg: 'cornfield_night', character: null,
    lines: [
      { speaker: '旁白', text: '夜晚，Ray 獨自在玉米田裡巡視。' },
      { speaker: '旁白', text: '玉米葉在夜風中沙沙作響，然後——' },
      { speaker: '聲音', text: '蓋了它，他們就會來。' },
      { speaker: 'Ray',  text: '（四下張望）什麼聲音？' },
      { speaker: '聲音', text: '蓋了它，他們就會來。' },
      { speaker: 'Ray',  text: '（自語）……一座棒球場？' },
    ],
    choices: [
      {
        text: 'A．相信那個聲音，當晚就開始規劃球場',
        effect: { money: -20000, days: 0 },
        flags: ['dreamer'],
        next: 'scene2'
      },
      {
        text: 'B．先觀察幾週，等聲音再出現再說',
        effect: { money: 8000, days: 20 },
        flags: ['pragmatist'],
        next: 'scene1b'
      }
    ]
  },

  scene1b: {
    bg: 'cornfield_night', character: null,
    lines: [
      { speaker: '旁白', text: '你選擇等待。農作豐收，帳戶多了一點餘裕。' },
      { speaker: '旁白', text: '但那個聲音沒有消失。二十天後的深夜——' },
      { speaker: '聲音', text: '蓋了它，他們就會來。' },
      { speaker: 'Ray',  text: '（這次沒有猶豫）我知道了。我知道該怎麼做了。' },
      { speaker: '旁白', text: '（但拖延的代價是，施工費用漲了。）' },
    ],
    effect: { money: -28000, days: 0 },
    next: 'scene2'
  },

  scene2: {
    bg: 'farm', character: 'annie',
    lines: [
      { speaker: 'Ray',   text: 'Annie，我有件事要告訴你。' },
      { speaker: 'Ray',   text: '我想把玉米田的一部分……改建成一座棒球場。' },
      { speaker: 'Annie', text: '（停頓良久）Ray，你在說什麼？' },
      { speaker: 'Ray',   text: '我聽到了聲音。「蓋了它，他們就會來。」我沒有辦法忽視它。' },
      { speaker: 'Annie', text: '……你是認真的。' },
    ],
    choices: [
      {
        text: 'A．「Annie，我需要你相信我，這不只是一時衝動。」',
        effect: { money: 0, days: 5 },
        flags: ['annie_supporter'],
        next: 'scene2_annie'
      },
      {
        text: 'B．「我知道聽起來很瘋，但我已經決定了。」',
        effect: { money: 0, days: 0 },
        next: 'scene3'
      }
    ]
  },

  scene2_annie: {
    bg: 'farm', character: 'annie',
    lines: [
      { speaker: 'Annie', text: '（沉默了很長時間）' },
      { speaker: 'Annie', text: '好。我不知道這是不是對的……' },
      { speaker: 'Annie', text: '但如果你這麼確定，我就陪你一起瘋。' },
      { speaker: 'Ray',   text: '（握住她的手）謝謝你，Annie。' },
    ],
    next: 'scene3'
  },

  scene3: {
    bg: 'field_construct', character: null,
    lines: [
      { speaker: '旁白', text: '動工的那天，鄰居們都出來看熱鬧——沒有一個人看好這件事。' },
      { speaker: '旁白', text: 'Ray 開始把玉米田的一角剷平，整地，立桿，畫出壘包。' },
    ],
    choices: [
      {
        text: 'A．雇用專業施工隊，快速完成',
        effect: { money: -15000, days: 0 },
        flags: ['pro_builder'],
        next: 'scene4'
      },
      {
        text: 'B．自己動手蓋，每一塊板子親手釘上去',
        effect: { money: -3000, days: 15 },
        flags: ['craftsman'],
        next: 'scene4'
      }
    ]
  },

  scene4: {
    bg: 'farm', character: 'annie',
    lines: [
      { speaker: '旁白',  text: '球場終於完工了。但銀行的帳單也跟著來了。' },
      { speaker: 'Annie', text: 'Ray，我們的帳戶快撐不住了——' },
      { speaker: 'Ray',   text: '我知道。我在想辦法。' },
      { speaker: '旁白',  text: '你必須設法渡過這場財務危機。' },
    ],
    choices: [
      {
        text: 'A．賣掉東側的部分農地，立刻止血',
        effect: { money: 12000, days: 0 },
        next: 'scene4_land'
      },
      {
        text: 'B．向銀行申請貸款，先撐過去',
        effect: { money: 10000, days: 0 },
        flags: ['has_loan'],
        next: 'scene4_loan'
      },
      {
        text: 'C．請 Annie 聯絡親友，借錢度過難關',
        effect: { money: 10000, days: 5 },
        require: 'annie_supporter',
        next: 'scene4_friends'
      }
    ]
  },

  scene4_land: {
    bg: 'farm', character: null,
    lines: [
      { speaker: '旁白', text: '你賣掉了東側的一塊農地。很痛，但帳單付了。' },
      { speaker: 'Ray',  text: '（望著少了一截的土地）值得的。一定值得的。' },
    ],
    next: 'minigame1_intro'
  },

  scene4_loan: {
    bg: 'farm', character: null,
    lines: [
      { speaker: '旁白', text: '銀行批准了貸款。暫時喘過氣了，但利息的壓力還在。' },
      { speaker: 'Ray',  text: '先撐過去。其他的，之後再說。' },
    ],
    next: 'minigame1_intro'
  },

  scene4_friends: {
    bg: 'farm', character: 'annie',
    lines: [
      { speaker: 'Annie', text: '我去打電話給我哥哥。他一定會借我們的。' },
      { speaker: '旁白',  text: '幾天後，一筆錢轉進帳戶。沒有利息，只有信任。' },
      { speaker: 'Ray',   text: '有你真好，Annie。' },
    ],
    next: 'minigame1_intro'
  },

  minigame1_intro: {
    bg: 'field_night', character: 'joe',
    lines: [
      { speaker: '旁白', text: '某個夜晚，球場的燈光奇蹟般地亮了起來。' },
      { speaker: '旁白', text: '玉米葉撥開，一個穿著古老球衣的身影從田裡走了出來。' },
      { speaker: 'Ray',  text: '（震驚）你是……Shoeless Joe Jackson？' },
      { speaker: 'Joe',  text: '（環顧四周，深深吸了一口氣）這是天堂嗎？' },
      { speaker: 'Ray',  text: '不……這是愛荷華。' },
      { speaker: 'Joe',  text: '（微笑）愛荷華。那你想打一場嗎？' },
    ],
    minigame: true,
    minigameLabel: 'Shoeless Joe 投出一顆快速球！',
    pitchConfig: { speed: 0.0072, ballRate: 0.22, charKey: 'ray' },
    onGood: 'minigame1_good',
    onMiss: 'minigame1_miss'
  },

  minigame1_good: {
    bg: 'field_night', character: 'joe',
    lines: [
      { speaker: '旁白', text: '球飛了出去，越過了外野。Joe 點頭，眼神裡有光。' },
      { speaker: 'Joe',  text: '1919年，他們說我們扔掉了一場世界大賽。' },
      { speaker: 'Joe',  text: '我在等有人讓我們再打一次。謝謝你蓋了這個地方，Ray。' },
      { speaker: 'Ray',  text: '你還會回來嗎？' },
      { speaker: 'Joe',  text: '（轉身走向玉米田）如果你繼續相信的話。' },
    ],
    next: 'act2_voice'
  },

  minigame1_miss: {
    bg: 'field_night', character: 'joe',
    lines: [
      { speaker: '旁白', text: '球從手套邊緣滑過。Joe 笑了出來。' },
      { speaker: 'Joe',  text: '不錯，但還需要練習。' },
      { speaker: 'Joe',  text: '……謝謝你蓋了這個地方，Ray。' },
      { speaker: 'Ray',  text: '（呆站著）他知道我的名字。' },
    ],
    next: 'act2_voice'
  },

  // ── 第二幕："Ease his pain." ───────────────────────
  act2_voice: {
    bg: 'cornfield_night', character: null,
    lines: [
      { speaker: '旁白', text: '幾個星期後，Ray 在田裡工作，又聽到了聲音。' },
      { speaker: '聲音', text: '撫平他的痛苦。' },
      { speaker: 'Ray',  text: '（停下手邊的工作）他？誰的痛苦？' },
      { speaker: '旁白', text: '腦海裡，一個名字浮現出來——' },
      { speaker: '旁白', text: '「Terence Mann。」' },
    ],
    next: 'scene5'
  },

  scene5: {
    bg: 'boston_street', character: 'annie',
    lines: [
      { speaker: '旁白',  text: 'Terence Mann。60年代激勵過無數人的作家，現在隱居在波士頓，拒絕一切訪問。' },
      { speaker: 'Ray',   text: '我要去波士頓找他。' },
      { speaker: 'Annie', text: '你——現在就去？' },
      { speaker: 'Ray',   text: '就是現在。' },
    ],
    choices: [
      {
        text: 'A．立刻出發去波士頓',
        effect: { money: -2000, days: 0 },
        next: 'scene6'
      },
      {
        text: 'B．先查清楚 Mann 的資料再出發',
        effect: { money: -1000, days: 7 },
        next: 'scene5b'
      }
    ]
  },

  scene5b: {
    bg: 'farm', character: null,
    lines: [
      { speaker: '旁白', text: '你花了幾天查資料。Terence Mann，著有《Mecca》等四部小說，60年代的文化偶像。' },
      { speaker: '旁白', text: '但他後來消失了——沒有新作，沒有公開露面，像是對這個世界關了門。' },
      { speaker: '旁白', text: '有一篇舊採訪提到他年輕時熱愛棒球，最喜歡的球隊是波士頓紅襪。' },
      { speaker: 'Ray',  text: '（自語）棒球……也許這是個突破口。' },
      { speaker: '旁白', text: '帶著這個線索，你出發了。' },
    ],
    flags: ['researched_mann'],
    next: 'scene6'
  },

  scene6: {
    bg: 'boston_street', character: 'mann',
    lines: [
      { speaker: '旁白', text: '你找到了 Mann 住的公寓。他只開了一條門縫，打量著你。' },
      { speaker: 'Mann', text: '我不接受採訪。' },
      { speaker: 'Ray',  text: '我不是記者。我只是……有個聲音叫我來找你。' },
      { speaker: 'Mann', text: '（冷笑）聲音。所有人都有理由騷擾別人。' },
    ],
    choices: [
      {
        text: 'A．「我知道這很荒唐，但請聽我說完我的夢。」',
        effect: { money: 0, days: 3 },
        next: 'scene7_a'
      },
      {
        text: 'B．「我有兩張紅襪隊的票，今晚在 Fenway Park。」',
        effect: { money: -500, days: 0 },
        require: 'researched_mann',
        flags: ['go_the_distance'],
        next: 'scene6b'
      }
    ]
  },

  scene6b: {
    bg: 'fenway', character: 'mann',
    lines: [
      { speaker: '旁白', text: 'Mann 沉默了一下，然後把門打開了。' },
      { speaker: '旁白', text: '你們並肩坐在 Fenway Park 的看台上。比賽進行到第七局——' },
      { speaker: '旁白', text: '記分板上突然閃過一個名字。' },
      { speaker: 'Ray',  text: '（瞪大眼睛）Archibald "Moonlight" Graham……' },
      { speaker: 'Mann', text: '（表情凝固）你也看到了？' },
      { speaker: 'Ray',  text: '你也看到了？' },
      { speaker: 'Mann', text: '（長時間沉默）……我們得去一個地方。' },
    ],
    next: 'scene7_b'
  },

  scene7_a: {
    bg: 'field_night', character: 'mann',
    lines: [
      { speaker: '旁白', text: '你花了三天說服 Mann。最終，他站在愛荷華州的球場前。' },
      { speaker: '旁白', text: '場上的燈光亮著，鬼魂球員在練習，Mann 沉默良久。' },
      { speaker: 'Mann', text: '我不知道該相信什麼……但我在這裡了。' },
      { speaker: 'Mann', text: '（低聲）我已經很久沒有感覺到這個了。' },
      { speaker: 'Ray',  text: '感覺到什麼？' },
      { speaker: 'Mann', text: '希望。' },
    ],
    next: 'act3_voice'
  },

  scene7_b: {
    bg: 'field_night', character: 'mann',
    lines: [
      { speaker: '旁白', text: 'Mann 站在愛荷華州的球場前，看著燈光下那些打球的身影。' },
      { speaker: 'Mann', text: '我在 Fenway 就知道我必須來。' },
      { speaker: 'Mann', text: '（長時間沉默）我已經很久沒有感覺到這個了。' },
      { speaker: 'Ray',  text: '感覺到什麼？' },
      { speaker: 'Mann', text: '活著的感覺。' },
    ],
    next: 'act3_voice'
  },

  // ── 第三幕："Go the distance." ─────────────────────
  act3_voice: {
    bg: 'field_night', character: 'mann',
    lines: [
      { speaker: '旁白', text: '深夜，Ray 望著空曠的球場，第三個聲音響起。' },
      { speaker: '聲音', text: '走完這段距離。' },
      { speaker: 'Ray',  text: '……什麼距離？' },
      { speaker: '旁白', text: '記分板上，燈光拼出一個地名：' },
      { speaker: '旁白', text: '「Chisholm, Minnesota」' },
      { speaker: 'Mann', text: '（在身後）Moonlight Graham 的故鄉。' },
    ],
    next: 'scene8'
  },

  scene8: {
    bg: 'chisholm', character: null,
    lines: [
      { speaker: '旁白', text: 'Archibald "Moonlight" Graham——1905年，他在大聯盟只打了半局，從未正式上場打擊就退休了。' },
      { speaker: '旁白', text: '一個讓夢想停在一半的人。' },
      { speaker: 'Ray',  text: '我們要去找他。' },
    ],
    choices: [
      {
        text: 'A．和 Mann 一起出發',
        effect: { money: -1500, days: 0 },
        next: 'scene8_together'
      },
      {
        text: 'B．自己一個人去',
        effect: { money: -800, days: 5 },
        next: 'scene8_solo'
      }
    ]
  },

  scene8_together: {
    bg: 'chisholm', character: 'mann',
    lines: [
      { speaker: '旁白', text: '你和 Mann 一起開車前往明尼蘇達州。一路上，Mann 講著 Graham 的故事。' },
      { speaker: 'Mann', text: '他後來成了那個小鎮的醫生。照顧了幾十年的孩子。' },
      { speaker: 'Mann', text: '也許……那才是他真正的夢想，只是他自己不知道。' },
      { speaker: '旁白', text: '在一條夜路上，你們看見一個年輕人在路邊搭便車。' },
    ],
    next: 'minigame2_intro'
  },

  scene8_solo: {
    bg: 'chisholm', character: null,
    lines: [
      { speaker: '旁白', text: '你獨自開車，在陌生的公路上行駛。' },
      { speaker: 'Ray',  text: '（自語）Moonlight Graham……你的夢是什麼？' },
      { speaker: '旁白', text: '幾天後，在一條夜路上，你看見一個年輕人在路邊搭便車。' },
    ],
    next: 'minigame2_intro'
  },

  minigame2_intro: {
    bg: 'field_day', character: 'archie_young',
    lines: [
      { speaker: '旁白',   text: '那個年輕人就是 Archie Graham——Moonlight Graham，年輕時的樣子。' },
      { speaker: 'Archie', text: '我在找一個能讓我打完那場未完成比賽的地方。' },
      { speaker: 'Ray',    text: '我知道那個地方在哪裡。' },
      { speaker: '旁白',   text: '你帶他回到了愛荷華的球場。燈光為他亮起。' },
      { speaker: 'Archie', text: '（站在打擊區，深吸一口氣）準備好了。' },
    ],
    minigame: true,
    minigameLabel: 'Moonlight Graham 的打席——他等了整整一生！',
    pitchConfig: { speed: 0.0065, ballRate: 0.34, charKey: 'archie_young' },
    onGood: 'minigame2_good',
    onMiss: 'minigame2_miss'
  },

  minigame2_good: {
    bg: 'field_day', character: 'archie_young',
    lines: [
      { speaker: '旁白',   text: '球飛了出去。一記安打。Archie 跑上了一壘。' },
      { speaker: '旁白',   text: '他停下來，望著手中的球棒，眼眶紅了。' },
      { speaker: 'Archie', text: '這就夠了。一輩子，就夠了。' },
    ],
    next: 'scene9'
  },

  minigame2_miss: {
    bg: 'field_day', character: 'archie_young',
    lines: [
      { speaker: '旁白',   text: '球飛過，揮空了。Archie 放下球棒，卻在微笑。' },
      { speaker: 'Archie', text: '能站在這裡……比任何安打都值得。' },
    ],
    next: 'scene9'
  },

  scene9: {
    bg: 'field_night', bgm: 'bgm_climax', character: null,
    lines: [
      { speaker: '旁白', text: '比賽繼續著。Archie 在場上，和鬼魂球員們一起打球。' },
      { speaker: '旁白', text: '然後——Karin 從看台上站起來，踩空了。' },
      { speaker: 'Ray',  text: '（衝過去）Karin！' },
      { speaker: '旁白', text: '女孩噎住了，臉色蒼白。' },
      { speaker: '旁白', text: 'Archie 站在白線前。' },
      { speaker: '旁白', text: '白線這一側，是球場，是他等了一輩子的夢。跨過去，就再也無法回來。' },
      { speaker: '旁白', text: '他跨了過去。' },
      { speaker: '旁白', text: '他的身影老去，成了照顧這個小鎮幾十年的老醫生。' },
    ],
    next: 'scene9_doc'
  },

  scene9_doc: {
    bg: 'field_night', bgm: 'bgm_climax', character: 'archie_old',
    lines: [
      { speaker: 'Doc Graham', text: '（穩穩地照顧著 Karin）沒事了，孩子。' },
      { speaker: '旁白',       text: '他轉頭，對 Ray 點了點頭，然後走進黑暗裡，消失了。' },
    ],
    next: 'scene10'
  },

  scene10: {
    bg: 'field_night', bgm: 'bgm_climax', character: 'john',
    lines: [
      { speaker: '旁白', text: '夜深了。球員們陸陸續續走回玉米田。' },
      { speaker: '旁白', text: '最後一個人摘下捕手面具，轉過身來。' },
      { speaker: 'Ray',  text: '（聲音顫抖）……' },
      { speaker: '旁白', text: '那是他在照片裡認識了一輩子的臉——年輕的，充滿希望的。' },
      { speaker: '旁白', text: '是他的父親，John Kinsella，年輕時的樣子。' },
    ],
    choices: [
      { text: 'A．（哽咽地）「……爸。」',   next: 'scene10_a' },
      { text: 'B．「你……想打一場嗎？」',    next: 'scene10_b' }
    ]
  },

  scene10_a: {
    bg: 'field_night', bgm: 'bgm_climax', character: 'john',
    lines: [
      { speaker: 'Ray',  text: '（哽咽）……爸。' },
      { speaker: 'John', text: '（愣了一下，緩緩點頭）嗯。' },
      { speaker: 'John', text: '你……長大了。' },
      { speaker: 'Ray',  text: '（鼻子泛酸）我們從來沒有……一起打過球。' },
    ],
    next: 'minigame3_intro'
  },

  scene10_b: {
    bg: 'field_night', bgm: 'bgm_climax', character: 'john',
    lines: [
      { speaker: 'Ray',  text: '（聲音沙啞）你……想打一場嗎？' },
      { speaker: 'John', text: '（沉默片刻，嘴角上揚）我一直在等這句話。' },
      { speaker: 'Ray',  text: '（眼眶泛紅）那我們開始吧。' },
    ],
    next: 'minigame3_intro'
  },

  minigame3_intro: {
    bg: 'field_night', bgm: 'bgm_climax', character: 'john',
    lines: [
      { speaker: '旁白', text: '就在這片他親手蓋起來的球場上，Ray 第一次和他的父親打球。' },
    ],
    minigame: true,
    minigameLabel: '父子傳接球——人生中最重要的一場。',
    pitchConfig: { speed: 0.006, ballRate: 0.10, charKey: 'ray' },
    onGood: 'minigame3_good',
    onMiss: 'minigame3_miss'
  },

  minigame3_good: {
    bg: 'field_night', bgm: 'bgm_climax', character: 'john',
    lines: [
      { speaker: '旁白', text: '球穩穩落進手套。父親站在那裡，微笑著看著他。' },
      { speaker: 'John', text: '你比我想像中還要厲害。' },
      { speaker: 'Ray',  text: '（笑著，淚水卻流了下來）爸，我有好多話想說——' },
      { speaker: 'John', text: '（搖搖頭）不用說。你蓋了這個地方，我來了。' },
      { speaker: 'John', text: '這就是你說的一切了。' },
    ],
    next: 'ending'
  },

  minigame3_miss: {
    bg: 'field_night', bgm: 'bgm_climax', character: 'john',
    lines: [
      { speaker: '旁白', text: '球滾落了。父親走上前，把球撿起來，輕輕放回 Ray 手中。' },
      { speaker: 'John', text: '沒關係。' },
      { speaker: 'John', text: '你從來就不喜歡棒球——但你來了。' },
      { speaker: 'John', text: '你蓋了這個地方，讓我有機會回來……這就夠了，Ray。' },
    ],
    next: 'ending'
  },

  ending: {
    bg: 'field_final', character: 'mann',
    lines: [
      { speaker: '旁白', text: '那一夜，公路上排起了長長的車隊，從四面八方向這片球場駛來。' },
      { speaker: 'Mann', text: '（站在 Ray 身旁）人們會來的，Ray。' },
      { speaker: 'Mann', text: '他們不知道為什麼，但他們會來。因為這裡有他們需要的東西。' },
      { speaker: 'Ray',  text: '（望著滿天星斗）是什麼？' },
      { speaker: 'Mann', text: '重新相信自己的機會。' },
    ],
    isEnding: true
  }
};
