// Station points are representative. Hotel and store pins use a POI or the official
// address geocoded by Japan's Geospatial Information Authority, including indoor shops.
window.NAMBA_DATA = {
  defaultOrigin: 'hotel-arashi',
  hotel: {
    id: 'hotel-arashi',
    name: 'Hotel Arashi Namba No.001', japanese: '嵐ホテル 難波店 No.001', labelJa: '嵐ホテル 難波店',
    label: '嵐酒店 No.001',
    address: '大阪市浪速区元町1-1-1',
    coords: [34.667049, 135.497803],
    directionsOrigin: 'Hotel Arashi Namba No.001 大阪市浪速区元町1-1-1',
    source: 'https://www.city.osaka.lg.jp/kenko/cmsfiles/contents/0000382/382418/20260731ryokan.pdf'
  },
  stations: [
    {
      id: 'kintetsu', japanese: '大阪難波駅（近鉄／阪神）', labelJa: '大阪難波駅', name: '大阪難波站（近鐵／阪神）', label: '大阪難波站',
      detail: '近鐵 A01／阪神 HS41', coords: [34.6671965, 135.499139],
      directionsOrigin: '大阪難波駅 近鉄 阪神',
      source: 'https://www.kintetsu.co.jp/soukatsu/kounai/nanba.html'
    },
    {
      id: 'metro', japanese: 'なんば駅（御堂筋線）', labelJa: 'なんば駅（御堂筋線）', name: '地鐵難波站（御堂筋線）', label: '地鐵難波站',
      detail: 'Osaka Metro M20', coords: [34.6663576, 135.5003519],
      directionsOrigin: 'なんば駅 御堂筋線 Osaka Metro',
      source: 'https://subway.osakametro.co.jp/station_guide/M/m20/map.php'
    },
    {
      id: 'nankai', japanese: 'なんば駅（南海）', labelJa: 'なんば駅（南海）', name: '南海難波站', label: '南海難波站',
      detail: '南海電鐵 NK01', coords: [34.6634111, 135.5019111],
      directionsOrigin: 'なんば駅 南海電鉄',
      source: 'https://www.nankai.co.jp/traffic/station/namba.html'
    },
    {
      id: 'jr', japanese: 'JR難波駅', labelJa: 'JR難波駅', name: 'JR 難波站', label: 'JR 難波站',
      detail: 'JR 西日本', coords: [34.6663845, 135.4953524],
      directionsOrigin: 'JR難波駅 大阪',
      source: 'https://eki.jr-odekake.net/premises?id=0620833'
    }
  ],
  places: [
    {
      id: 'horai', name: '551 蓬萊本店', japanese: '551蓬莱 本店',
      category: 'restaurant', detail: '豬肉包、港式點心', detailJa: '豚まん・中華点心',
      address: '大阪市中央区難波3-6-3', coords: [34.6664252, 135.5012706],
      source: 'https://www.551horai.co.jp/shop/list/13/',
      aliases: ['551 Horai', '肉包', '豚まん']
    },
    {
      id: 'ichiran', name: '一蘭 道頓堀店別館', japanese: '一蘭 道頓堀店別館',
      category: 'restaurant', detail: '豚骨拉麵', detailJa: 'とんこつラーメン',
      address: '大阪市中央区道頓堀1-4-16', coords: [34.668461, 135.503174],
      source: 'https://ichiran.com/shop/kinki/dotonbori-south/',
      aliases: ['Ichiran', 'ramen', '拉麺', '一兰']
    },
    {
      id: 'kani', name: '蟹道樂 道頓堀本店', japanese: 'かに道楽 道頓堀本店',
      category: 'restaurant', detail: '蟹料理', detailJa: 'かに料理',
      address: '大阪市中央区道頓堀1-6-18', coords: [34.668793, 135.501572],
      source: 'https://douraku.co.jp/area/shop/menu/?shop_id=1',
      aliases: ['Kani Doraku', 'crab', '蟹道楽', '螃蟹']
    },
    {
      id: 'teppan-jinja', name: '鐵板神社 總本店', japanese: '鉄板神社 総本店',
      category: 'restaurant', foodStyle: ['teppanyaki'],
      detail: '鐵板串燒', detailJa: '鉄板で焼く創作串',
      address: '大阪市中央区難波1-4-6 ミフネ難波ビル 1F', coords: [34.667336, 135.501801],
      source: 'https://www.teppan-jinjya.com/sennichimae/',
      aliases: ['Teppan Jinja', '串料理']
    },
    {
      id: 'minami', name: '鐵板燒 Minami', japanese: '鉄板焼「みなみ」',
      category: 'restaurant', foodStyle: ['teppanyaki'],
      detail: '和牛、海鮮｜大阪南海瑞士酒店 10F', detailJa: '和牛・魚介｜スイスホテル南海大阪 10F',
      address: '大阪市中央区難波5-1-60 スイスホテル南海大阪 10F', coords: [34.664169, 135.501330],
      source: 'https://swissotelnankaiosaka.com/ja/restaurants-and-bars/minami/',
      aliases: ['Swissôtel', 'Swissotel', '神戶牛']
    },
    {
      id: 'torikizoku-namba-west', name: '鳥貴族 難波西店', japanese: '鳥貴族 ナンバ西店',
      category: 'restaurant', foodStyle: ['izakaya'],
      detail: '雞肉串燒居酒屋｜2F', detailJa: '焼鳥居酒屋｜2F',
      address: '大阪市中央区難波4-5-14 2F', coords: [34.665009, 135.499771],
      source: 'https://map.torikizoku.co.jp/detail/110/',
      aliases: ['Torikizoku', '烤雞串', '焼き鳥']
    },
    {
      id: 'isomaru-nankaidori', name: '磯丸水產 難波南海通店', japanese: '磯丸水産 なんば南海通り店',
      category: 'restaurant', foodStyle: ['izakaya'],
      detail: '海鮮居酒屋、烤貝類', detailJa: '海鮮居酒屋・浜焼き',
      address: '大阪市中央区難波千日前11-22 ダイハイ千日前ビル 1–3F', coords: [34.665428, 135.503387],
      source: 'https://isomaru.jp/1461/',
      aliases: ['Isomaru Suisan', '刺身', '浜焼き']
    },
    {
      id: 'sushiro-amza', name: '壽司郎 難波 AMZA 店', japanese: 'スシロー 難波アムザ店',
      category: 'restaurant', foodStyle: ['sushi'],
      detail: '迴轉壽司｜AMZA 1000 4F', detailJa: '回転寿司｜アムザ1000 4F',
      address: '大阪市中央区千日前2-9-17 アムザ1000 4F', coords: [34.666762, 135.503475],
      source: 'https://www.akindo-sushiro.co.jp/shop/detail.php?id=2225',
      aliases: ['Sushiro', '回轉壽司']
    },
    {
      id: 'daiki-nambacity', name: '大起水產迴轉壽司 難波 CITY 店', japanese: '大起水産回転寿司 なんばCITY店',
      category: 'restaurant', foodStyle: ['sushi'],
      detail: '迴轉壽司｜難波 CITY 南館 1F', detailJa: '回転寿司｜なんばCITY 南館 1F',
      address: '大阪市浪速区難波中2-10-1 なんばCITY 南館 1F', coords: [34.661746, 135.502962],
      source: 'https://shop.daiki-suisan.co.jp/detail/sushi-10/',
      aliases: ['Daiki Suisan', '回轉壽司']
    },
    {
      id: 'baccano', name: 'BACCANO 咖啡餐吧', japanese: 'Cafe＆Bar BACCANO（バッカーノ）',
      category: 'restaurant', foodStyle: ['breakfast'],
      detail: '咖啡、熱三文治｜APA 酒店 1F', detailJa: 'コーヒー・ホットサンド｜アパホテル 1F',
      visitNote: '官網早餐時段 07:00–11:00',
      address: '大阪市浪速区湊町1-2-13 アパホテル＆リゾート〈大阪なんば駅前タワー〉1F', coords: [34.666111, 135.496445],
      source: 'https://cafe-bar-baccano.com/',
      aliases: ['三明治', 'Sandwich', '早午餐', 'brunch']
    },
    {
      id: 'casablanca', name: 'Casablanca 難波河畔咖啡廳', japanese: 'カサブランカ難波リバーサイド',
      category: 'restaurant', foodStyle: ['breakfast'],
      detail: '河畔早餐、貝果及咖啡', detailJa: '川沿いの朝食・ベーグル・コーヒー',
      visitNote: '官網標示 07:00 開始供應早餐',
      address: '大阪市中央区西心斎橋2-6-7', coords: [34.669256, 135.498383],
      source: 'https://www.casablanca-osaka.jp/',
      aliases: ['Casablanca Namba Riverside', '早午餐', 'brunch', 'bagel']
    },
    {
      id: 'familymart', name: 'FamilyMart 近鐵難波東改札外店', japanese: 'ファミリーマート 近鉄難波駅東改札外店',
      category: 'convenience', detail: '大阪難波站東閘口外', detailJa: '大阪難波駅東改札外',
      address: '大阪市中央区難波4-1-17', coords: [34.666874, 135.500031],
      source: 'https://www.inq.family.co.jp/familymart/QA_Customer/web/knowledge/15441/1/%E9%96%A2%E8%A5%BF.pdf',
      aliases: ['全家', 'Family Mart', '超商']
    },
    {
      id: 'seven', name: '7-Eleven JR 難波站東店', japanese: 'セブン-イレブン JR難波駅東',
      category: 'convenience', detail: '飯糰、飯盒及飲品', detailJa: 'おにぎり・お弁当・飲み物',
      address: '大阪市浪速区元町1-2-17', coords: [34.666096, 135.496765],
      source: 'https://www.sej.co.jp/products/gashapon/shoplist/?product=sintyan_okurumi_2506_4',
      aliases: ['7 Eleven', '7-11', '超商', '便當']
    },
    {
      id: 'lawson', name: 'Lawson 難波中二丁目店', japanese: 'ローソン 難波中二丁目',
      category: 'convenience', detail: '小食、飲品及日用品', detailJa: '軽食・飲み物・日用品',
      address: '大阪市浪速区難波中2-6-17', coords: [34.662449, 135.503281],
      source: 'https://crew.lawson.co.jp/jobfind-pc/job/Kansai/5844',
      aliases: ['羅森', '超商']
    },
    {
      id: 'familymart-yotsubashi', name: 'FamilyMart 四橋難波站前店', japanese: 'ファミリーマート 四つ橋なんば駅前店',
      category: 'convenience', detail: '飯糰、飯盒及飲品', detailJa: 'おにぎり・お弁当・飲み物',
      address: '大阪市浪速区難波中1-3-10', coords: [34.665331, 135.498235],
      source: 'https://store.family.co.jp/points/34413',
      aliases: ['全家', 'Family Mart', '超商', '四つ橋線', '便當']
    },
    {
      id: 'familymart-nambanaka', name: 'FamilyMart 難波中一丁目店', japanese: 'ファミリーマート 難波中一丁目店',
      category: 'convenience', detail: '零食、飲品及日用品', detailJa: 'お菓子・飲み物・日用品',
      address: '大阪市浪速区難波中1-15-21', coords: [34.664075, 135.499637],
      source: 'https://store.family.co.jp/points/33605',
      aliases: ['全家', 'Family Mart', '超商']
    },
    {
      id: 'lawson-saiwaicho', name: 'Lawson 幸町一丁目店', japanese: 'ローソン 幸町一丁目',
      category: 'convenience', detail: '酒店西面，可買小食及飲品', detailJa: 'ホテルの西側｜軽食・飲み物',
      address: '大阪市浪速区幸町1-3-9', coords: [34.668327, 135.493134],
      source: 'https://crew.lawson.co.jp/jobfind-pc/job/Kansai/108171',
      aliases: ['羅森', '超商', 'Saiwaicho', '飯店']
    },
    {
      id: 'life', name: 'LIFE Central Square 難波店', japanese: 'セントラルスクエアなんば店',
      category: 'supermarket', detail: '生鮮、熟食及日用品', detailJa: '生鮮食品・お惣菜・日用品',
      address: '大阪市浪速区湊町1-2-3', coords: [34.666981, 135.49678],
      source: 'https://store.lifecorp.jp/detail/west219/',
      aliases: ['ライフ', '超級市場', 'Life Namba']
    },
    {
      id: 'bioral', name: 'BIO-RAL 難波 Marui 店', japanese: 'ビオラル なんばマルイ店',
      category: 'supermarket', detail: '有機食品｜難波 Marui B1F', detailJa: 'オーガニック食品｜なんばマルイ B1F',
      address: '大阪市中央区難波3-8-9 なんばマルイ B1F', coords: [34.665663, 135.501001],
      source: 'https://store.lifecorp.jp/detail/west452/',
      aliases: ['Bioral', '丸井', '超級市場']
    },
    {
      id: 'seijo', name: '成城石井 難波 CITY 店', japanese: '成城石井 なんばCITY店',
      category: 'supermarket', detail: '零食、熟食｜難波 CITY 本館 B2F', detailJa: 'お菓子・お惣菜｜なんばCITY 本館 B2F',
      address: '大阪市中央区難波5-1-60 なんばCITY 本館 B2F', coords: [34.663699, 135.501909],
      source: 'https://shop.seijoishii.com/seijoishii/spot/detail?code=0126',
      aliases: ['Seijo Ishii', '進口食品', '超級市場']
    },
    {
      id: 'maruhachi-namba', name: 'Maruhachi 超市 難波店', japanese: 'スーパーマルハチ なんば店',
      category: 'supermarket', detail: '生鮮食材、熟食及日常食品', detailJa: '生鮮食品・お惣菜・食料品',
      address: '大阪市浪速区湊町2-1-9', coords: [34.664526, 135.495417],
      source: 'https://www.supermaruhachi.co.jp/shop/nanba/',
      aliases: ['丸八', '超級市場', '超市', 'Minatomachi', 'grocery']
    },
    {
      id: 'ikari-nankai', name: 'Ikari 超市 南海難波店', japanese: 'いかり南海なんば店',
      category: 'supermarket', detail: '熟食、生鮮、甜點｜難波 SkyO 3F', detailJa: '惣菜・生鮮食品・洋菓子｜なんばスカイオ 3F',
      address: '大阪市中央区難波5-1-60 なんばスカイオ 3F', coords: [34.663870, 135.500792],
      source: 'https://www.ikarisuper.com/info/author/nankai_nanba/',
      aliases: ['超級市場', '便當', 'Ikari Supermarket']
    },
    {
      id: 'aprice-sennichimae', name: 'A-Price 難波千日前店', japanese: 'A-プライス難波千日前店',
      category: 'supermarket', detail: '業務用食材、冷凍食品｜1F', detailJa: '業務用食材・冷凍食品｜1F',
      address: '大阪市中央区難波千日前9-11 千日前セントラル会館 1F', coords: [34.664169, 135.503448],
      source: 'https://tcc.to-ho.co.jp/shop/',
      aliases: ['超級市場', '大包裝', 'エープライス']
    },
    {
      id: 'donki-dotonbori-midosuji', name: '唐吉訶德 道頓堀御堂筋店', japanese: 'ドン・キホーテ道頓堀御堂筋店',
      category: 'shopping', detail: '綜合折扣店｜日用品、零食及手信', detailJa: 'ディスカウントストア｜日用品・お菓子・お土産',
      address: '大阪市中央区西心斎橋2-5-9', coords: [34.669231, 135.499878],
      source: 'https://www.donki.com/store/shop_detail.php?shop_id=373',
      aliases: ['驚安殿堂', 'Don Don Donki', 'Don Quijote', 'Donki', '紀念品', '手信', '伴手禮']
    },
    {
      id: 'daiso-nansandori', name: 'DAISO 難波南三通店', japanese: 'DAISO なんばなんさん通店',
      category: 'shopping', detail: '百圓雜貨、文具及日用品', detailJa: '100円ショップ｜雑貨・文具・日用品',
      address: '大阪市浪速区難波中2-2-17', coords: [34.663116, 135.503448],
      source: 'https://www.daiso-sangyo.co.jp/shop/detail/007361',
      aliases: ['大創', 'ダイソー', '100円均一', '百元店', '旅行用品']
    },
    {
      id: 'daikoku-namba-motomachi', name: '大國藥妝 難波元町店', japanese: 'ダイコクドラッグ なんば元町店',
      category: 'shopping', detail: '藥妝、護膚及日用品', detailJa: 'ドラッグストア｜スキンケア・日用品',
      address: '大阪市浪速区難波中3-5-13 朝日生命難波ビル', coords: [34.662266, 135.498154],
      source: 'https://daikokudrug.com/store/393/',
      aliases: ['大國藥局', '大国药妆', 'Daikoku Drug', '化妝品', '免稅']
    },
    {
      id: 'muji-namba-city', name: '無印良品 難波 CITY 店', japanese: '無印良品 なんばCITY',
      category: 'shopping', detail: '旅行用品、護膚及生活雜貨｜南館 2F', detailJa: '旅行用品・スキンケア・生活小物｜南館 2F',
      address: '大阪市中央区難波5-1-60 なんばCITY 南館 2F', coords: [34.662731, 135.502752],
      source: 'https://www.muji.com/jp/ja/shop/detail/%E3%81%AA%E3%82%93%E3%81%B0%EF%BC%A3%EF%BC%A9%EF%BC%B4%EF%BC%B9/061540',
      aliases: ['MUJI', '旅遊用品', '收納']
    }
  ]
};
