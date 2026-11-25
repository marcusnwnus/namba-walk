(() => {
  const search = document.getElementById('japanese-search');
  const categories = document.getElementById('japanese-categories');
  const status = document.getElementById('japanese-status');
  const results = document.getElementById('japanese-phrases');
  const copyStatus = document.getElementById('japanese-copy-status');
  if (!search || !categories || !status || !results || !copyStatus) return;

  const phraseGroups = [
    {
      id: 'everyday', label: '常用', phrases: [
        ['すみません。', 'Sumimasen.', '唔該。', '打擾 不好意思 請問'],
        ['こんにちは。', 'Konnichiwa.', '你好。', '打招呼 問候'],
        ['ありがとうございます。', 'Arigatou gozaimasu.', '多謝。', '謝謝'],
        ['お願いします。', 'Onegai shimasu.', '麻煩你。', '拜託'],
        ['日本語がよく分かりません。', 'Nihongo ga yoku wakarimasen.', '我唔係好識日文。', '唔明 不懂日語'],
        ['ゆっくり話してください。', 'Yukkuri hanashite kudasai.', '唔該講慢少少。', '慢一點'],
        ['ここに書いてください。', 'Koko ni kaite kudasai.', '麻煩寫喺度。', '寫低 寫下來'],
        ['トイレはどこですか。', 'Toire wa doko desu ka?', '請問洗手間喺邊？', '廁所 化粧室 お手洗い'],
      ],
    },
    {
      id: 'short', label: '短句', phrases: [
        ['はい。', 'Hai.', '係。', '是 好 確認 肯定'],
        ['いいえ。', 'Iie.', '唔係。', '否 不是 否定'],
        ['大丈夫です。', 'Daijoubu desu.', '冇問題。', '沒問題 冇事 唔使'],
        ['分かりました。', 'Wakarimashita.', '明白喇。', '明白了 知道 聽明'],
        ['分かりません。', 'Wakarimasen.', '我唔明。', '不明白 不知道 聽唔明'],
        ['もう一度、お願いします。', 'Mou ichido, onegai shimasu.', '麻煩再講一次。', '重複 再說一遍'],
        ['ちょっと待ってください。', 'Chotto matte kudasai.', '唔該等一等。', '等陣 稍等 等一下'],
        ['少しだけ。', 'Sukoshi dake.', '少少就夠。', '一點點 一點就好 分量'],
        ['どこですか。', 'Doko desu ka?', '喺邊度？', '哪裡 在哪 位置 問路'],
        ['ここ。', 'Koko.', '呢度。', '這裡 這邊 位置'],
        ['そこ。', 'Soko.', '嗰度。', '那裡 那邊 位置'],
        ['右。', 'Migi.', '右邊。', '右轉 向右 方向'],
        ['左。', 'Hidari.', '左邊。', '左轉 向左 方向'],
        ['まっすぐ。', 'Massugu.', '直行。', '直去 直走 一直向前 方向'],
        ['入口。', 'Iriguchi.', '入口。', '入閘 進口 車站'],
        ['出口。', 'Deguchi.', '出口。', '出閘 出口指示 車站'],
        ['一人です。', 'Hitori desu.', '一位。', '一個人 1名 入座 枱'],
        ['これください。', 'Kore kudasai.', '唔該要呢個。', '點餐 要這個 購物'],
        ['店内で。', 'Tennai de.', '堂食。', '喺度食 內用 店內 點餐'],
        ['持ち帰りで。', 'Mochikaeri de.', '外賣。', '外帶 拎走 打包 點餐'],
        ['カードで。', 'Kaado de.', '用卡畀。', '信用卡 信用咭 碌卡 刷卡 付款'],
        ['別々で。', 'Betsubetsu de.', '唔該分開畀錢。', '分開埋單 各自付款 分開結帳'],
        ['袋は要りません。', 'Fukuro wa irimasen.', '唔使袋。', '膠袋 購物袋 不用袋 レジ袋'],
        ['これでいいです。', 'Kore de ii desu.', '呢個就得。', '就這個 確認 選擇'],
      ],
    },
    {
      id: 'transport', label: '交通', phrases: [
        ['駅はどこですか。', 'Eki wa doko desu ka?', '請問車站喺邊？', '地鐵 鐵路 電車'],
        ['難波方面は何番線ですか。', 'Namba houmen wa nanbansen desu ka?', '去難波要喺幾多號月台上車？', '車站 地鐵 なんば ホーム'],
        ['この電車は関西空港に行きますか。', 'Kono densha wa Kansai kuukou ni ikimasu ka?', '呢班列車會唔會去關西機場？', '方向 關空 南海 乗り場'],
        ['どちら方面に乗ればいいですか。', 'Dochira houmen ni noreba ii desu ka?', '請問要搭邊個方向嘅列車？', '地鐵 鐵路 方面'],
        ['どの駅で乗り換えますか。', 'Dono eki de norikaemasu ka?', '請問喺邊個站轉車？', '換乘 轉乘 地鐵'],
        ['この切符で乗れますか。', 'Kono kippu de noremasu ka?', '我可唔可以用呢張車飛搭車？', '車票 乘車券'],
        ['エレベーターのある出口はどこですか。', 'Erebeetaa no aru deguchi wa doko desu ka?', '有升降機嘅出口喺邊？', '電梯 升降電梯 無障礙'],
      ],
    },
    {
      id: 'food', label: '食飯', phrases: [
        ['二人です。', 'Futari desu.', '兩位。', '入座 枱 桌 2名 二名'],
        ['メニューを見せてください。', 'Menyuu o misete kudasai.', '唔該畀我睇吓餐牌。', '菜單 點餐'],
        ['中国語のメニューはありますか。', 'Chuugokugo no menyuu wa arimasu ka?', '有冇中文餐牌？', '中文版 華語 菜單 點餐'],
        ['これをお願いします。', 'Kore o onegai shimasu.', '唔該要呢個。', '點餐 呢款'],
        ['豚肉が入っていますか。', 'Butaniku ga haitte imasu ka?', '呢款有冇豬肉？', '成分 食材 含有'],
        ['豚肩ロースで、すき焼きをお願いします。', 'Buta kata roosu de, sukiyaki o onegai shimasu.', '唔該用豬梅頭肉做壽喜燒。', '豬肉 豬肩肉 豚肉 壽喜鍋 鍋物'],
        ['すき焼きだしでお願いします。', 'Sukiyaki dashi de onegai shimasu.', '唔該用壽喜燒湯底。', '豬肉 壽喜鍋 湯汁 割り下'],
        ['お水をください。', 'Omizu o kudasai.', '唔該畀杯水我。', '飲水 清水'],
        ['お会計をお願いします。', 'Okaikei o onegai shimasu.', '唔該埋單。', '結帳 結賬 付款 買單'],
      ],
    },
    {
      id: 'shopping', label: '購物', phrases: [
        ['これはいくらですか。', 'Kore wa ikura desu ka?', '呢個幾多錢？', '價錢 價格 費用'],
        ['試着してもいいですか。', 'Shichaku shite mo ii desu ka?', '可唔可以試身？', '試衫 試穿 試着室'],
        ['別のサイズはありますか。', 'Betsu no saizu wa arimasu ka?', '有冇其他碼數？', '尺寸 大細'],
        ['クレジットカードは使えますか。', 'Kurejitto kaado wa tsukaemasu ka?', '可唔可以用信用卡畀錢？', '信用咭 刷卡 碌卡 付款 支付'],
        ['現金でお願いします。', 'Genkin de onegai shimasu.', '我用現金畀錢，唔該。', '現金付款 支付 現金結帳'],
        ['免税にできますか。', 'Menzei ni dekimasu ka?', '呢件貨品可唔可以免稅？', '退稅 免稅手續 免税'],
        ['レシートをいただけますか。', 'Reshiito o itadakemasu ka?', '唔該畀張收據我。', '單據 小票 領収書'],
      ],
    },
    {
      id: 'hotel', label: '酒店', phrases: [
        ['予約しています。チェックインをお願いします。', 'Yoyaku shite imasu. Chekkuin o onegai shimasu.', '我有預訂，想辦理入住。', '訂房 登記入住 check-in'],
        ['予約の確認をお願いします。', 'Yoyaku no kakunin o onegai shimasu.', '唔該幫我確認預訂。', '訂房 訂單 予約確認'],
        ['チェックイン前に荷物を預けられますか。', 'Chekkuin mae ni nimotsu o azukeraremasu ka?', '入住前可唔可以寄存行李？', '寄放行李 行李寄存 行李箱'],
        ['チェックアウトをお願いします。', 'Chekkuauto o onegai shimasu.', '唔該幫我辦理退房。', '離店 check-out'],
        ['チェックアウト後も荷物を預けられますか。', 'Chekkuauto go mo nimotsu o azukeraremasu ka?', '退房後可唔可以寄存行李？', '寄放行李 行李寄存 行李箱'],
        ['Wi-Fiのパスワードは何ですか。', 'Waifai no pasuwaado wa nan desu ka?', '請問 Wi-Fi 密碼係乜嘢？', '無線網絡 上網 wifi'],
        ['部屋のドアが開きません。', 'Heya no doa ga akimasen.', '我開唔到房門。', '房卡 門匙 門鎖 カードキー'],
      ],
    },
    {
      id: 'help', label: '求助', phrases: [
        ['助けてください。', 'Tasukete kudasai.', '請幫幫我。', '救命 緊急'],
        ['道に迷いました。', 'Michi ni mayoimashita.', '我迷咗路。', '迷路 問路'],
        ['財布をなくしました。', 'Saifu o nakushimashita.', '我唔見咗銀包。', '遺失 錢包 失物'],
        ['パスポートをなくしました。', 'Pasupooto o nakushimashita.', '我唔見咗護照。', '遺失 失物'],
        ['警察を呼んでください。', 'Keisatsu o yonde kudasai.', '請幫我報警。', '警察 緊急'],
        ['救急車を呼んでください。', 'Kyuukyuusha o yonde kudasai.', '請幫我叫救護車。', '急救 緊急 救護'],
        ['病院はどこですか。', 'Byouin wa doko desu ka?', '請問醫院喺邊？', '醫生 看醫生 睇醫生 醫療'],
      ],
    },
  ];

  const normalize = (value) => value.normalize('NFKC').toLowerCase();
  const groups = phraseGroups.map(({ id, label, phrases }) => ({
    id,
    label,
    phrases: phrases.map(([japanese, romaji, translation, keywords], index) => ({
      japanese,
      romaji,
      translation,
      audioSource: `./japanese-audio/${id}-${index + 1}.mp3?v=27`,
      searchable: normalize(`${japanese} ${romaji} ${translation} ${keywords}`),
    })),
  }));

  let activeCategory = '';
  let lastCopy = 0;
  let playback;
  let playbackRate = 1;

  const applyPlaybackRate = (audio) => {
    audio.defaultPlaybackRate = playbackRate;
    audio.playbackRate = playbackRate;
  };

  const stopPlayback = () => {
    if (!playback) return;
    const { audio, button } = playback;
    playback = undefined;
    button.setAttribute('aria-pressed', 'false');
    button.title = '播放日文';
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };

  const togglePlayback = async (button, source, playbackStatus) => {
    const wasActive = playback?.button === button;
    stopPlayback();
    if (wasActive) return;

    playbackStatus.textContent = '';
    const audio = new Audio();
    if ('preservesPitch' in audio) audio.preservesPitch = true;
    else if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = true;
    playback = { audio, button };
    button.setAttribute('aria-pressed', 'true');
    button.title = '停止播放';

    const reportFailure = () => {
      if (playback?.audio !== audio) return;
      stopPlayback();
      playbackStatus.textContent = '暫時未能播放，請再試。';
    };

    audio.addEventListener('ended', () => {
      if (playback?.audio === audio) stopPlayback();
    }, { once: true });
    audio.addEventListener('error', reportFailure, { once: true });
    audio.src = source;
    applyPlaybackRate(audio);

    try {
      await audio.play();
    } catch {
      reportFailure();
    }
  };

  const createPhraseCard = ({ japanese, romaji, translation, audioSource }) => {
    const card = document.createElement('li');
    card.className = 'japanese-card';

    const phrase = document.createElement('p');
    phrase.className = 'ja japanese-card-phrase';
    phrase.lang = 'ja';
    phrase.textContent = japanese;

    const pronunciation = document.createElement('p');
    pronunciation.className = 'japanese-card-romaji';
    pronunciation.lang = 'ja-Latn';
    pronunciation.textContent = romaji;

    const meaning = document.createElement('p');
    meaning.className = 'japanese-card-meaning';
    meaning.textContent = translation;

    const actions = document.createElement('div');
    actions.className = 'japanese-card-actions';

    const audioButton = document.createElement('button');
    audioButton.className = 'japanese-play-button';
    audioButton.type = 'button';
    audioButton.title = '播放日文';
    audioButton.setAttribute('aria-label', `播放日文「${translation}」`);
    audioButton.setAttribute('aria-pressed', 'false');

    const svgNamespace = 'http://www.w3.org/2000/svg';
    const speakerIcon = document.createElementNS(svgNamespace, 'svg');
    speakerIcon.setAttribute('class', 'icon');
    speakerIcon.setAttribute('aria-hidden', 'true');
    const speakerSymbol = document.createElementNS(svgNamespace, 'use');
    speakerSymbol.setAttribute('href', '#i-speaker');
    speakerIcon.append(speakerSymbol);
    audioButton.append(speakerIcon);

    const playbackStatus = document.createElement('p');
    playbackStatus.className = 'japanese-play-status japanese-card-feedback';
    playbackStatus.setAttribute('role', 'status');
    audioButton.addEventListener('click', () => togglePlayback(audioButton, audioSource, playbackStatus));

    const copyButton = document.createElement('button');
    copyButton.className = 'japanese-copy-button';
    copyButton.type = 'button';
    copyButton.textContent = '複製日文';
    copyButton.setAttribute('aria-label', `複製日文「${translation}」`);

    const feedback = document.createElement('span');
    feedback.className = 'japanese-card-feedback';
    feedback.hidden = true;
    feedback.setAttribute('aria-hidden', 'true');

    copyButton.addEventListener('click', async () => {
      const attempt = ++lastCopy;
      copyStatus.textContent = '';
      feedback.hidden = true;
      let copied = false;
      try {
        if (window.NAMBA_COPY_TEXT) {
          copied = await window.NAMBA_COPY_TEXT(japanese);
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(japanese);
          copied = true;
        }
      } catch {
        // The phrase remains selectable when clipboard access fails.
      }
      if (!card.isConnected || attempt !== lastCopy) return;
      feedback.textContent = copied ? '已複製' : '請長按或選取日文複製。';
      feedback.hidden = false;
      copyStatus.textContent = copied ? `已複製日文「${translation}」` : '未能複製。請長按或選取日文複製。';
    });

    actions.append(audioButton, copyButton, feedback);
    card.append(phrase, pronunciation, meaning, actions, playbackStatus);
    return card;
  };

  const render = () => {
    stopPlayback();
    const terms = normalize(search.value).split(/[\p{P}\s]+/u).filter(Boolean);
    let count = 0;
    const sections = [];
    for (const { id, label, phrases } of groups) {
      if (activeCategory && activeCategory !== id) continue;
      const matches = phrases.filter(({ searchable }) => terms.every((term) => searchable.includes(term)));
      if (!matches.length) continue;

      const heading = document.createElement('h2');
      heading.id = `japanese-group-${id}`;
      heading.textContent = label;

      const list = document.createElement('ul');
      list.className = 'japanese-list';
      list.setAttribute('role', 'list');
      list.append(...matches.map(createPhraseCard));

      const section = document.createElement('section');
      section.className = 'japanese-group';
      section.setAttribute('aria-labelledby', heading.id);
      section.append(heading, list);
      sections.push(section);
      count += matches.length;
    }

    copyStatus.textContent = '';
    results.replaceChildren(...sections);
    status.textContent = count ? `顯示 ${count} 句` : '搵唔到短句。試吓其他關鍵字，或者揀「全部」。';
  };

  const filters = [{ id: '', label: '全部' }, ...groups];
  const buttons = filters.map(({ id, label }) => {
    const button = document.createElement('button');
    button.className = 'food-pill';
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(id === activeCategory));
    button.setAttribute('aria-controls', results.id);
    button.addEventListener('click', () => {
      if (activeCategory === id) return;
      activeCategory = id;
      for (const filter of buttons) filter.setAttribute('aria-pressed', String(filter === button));
      render();
    });
    return button;
  });

  categories.replaceChildren(...buttons);
  const rateButtons = document.querySelectorAll('#japanese-speed [data-playback-rate]');
  for (const button of rateButtons) {
    button.addEventListener('click', () => {
      playbackRate = Number(button.dataset.playbackRate);
      for (const control of rateButtons) control.setAttribute('aria-pressed', String(control === button));
      if (playback) applyPlaybackRate(playback.audio);
    });
  }
  search.addEventListener('input', (event) => {
    if (event.isComposing) stopPlayback();
    else render();
  });
  search.addEventListener('compositionend', render);
  document.addEventListener('namba:viewchange', ({ detail: { view } }) => {
    if (view !== 'japanese') stopPlayback();
  });
  window.addEventListener('pagehide', stopPlayback);
  render();
})();
