// Scene commentary adapts the approved storyboard; it is not the author's essay text.
// The traveler selects a chapter, rides there automatically, and may observe without a timer or collection gate.
// sunHeight is a normalized direction.y; all weather is authored per episode.
export const DEFAULT_JOURNEY_ID = '01';
export const JOURNEY = [
  {
    "id": "P",
    "chapter": null,
    "title": "섬이 아직 수평선일 때",
    "meaning": "파도와 수평선을 바라보며 섬으로 다가갑니다. 분주하던 시선이 천천히 머물 자리를 찾습니다.",
    "staging": "난간과 돛줄 너머로 섬이 겹쳐 보인다. 깊은 남색 물 위의 반사가 흔들리고, 먼 두 숨기둥과 순차 잠수가 지나간다.",
    "environment": {
      "time": "늦은 오후",
      "weather": "옅은 해무 · 낮은 햇빛",
      "wind": "일정한 측풍",
      "wildlife": "큰 향유고래와 작은 개체 · 멀리 나는 갈매기",
      "playerAdjustable": false
    },
    "sourceTitle": null,
    "authorTextAvailable": false,
    "place": "sea",
    "atmosphere": {
      "sunHeight": 0.17,
      "sunIntensity": 3.2,
      "hemiIntensity": 1.7,
      "exposure": 0.91,
      "fogColor": "#a1aaa1",
      "fogDensity": 0.0055,
      "cloud": 0.32,
      "wind": 0.32,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "난간 너머의 섬 윤곽",
      "수면 위 길게 흔들리는 빛"
    ],
    "sketch": "assets/journal-day-01.jpg"
  },
  {
    "id": "01",
    "chapter": 1,
    "title": "외딴 섬에 위탁된 말씀",
    "meaning": "외딴 자리에서도 말씀은 시작됩니다. 고립을 넘어 공동체로 이어지는 말씀의 길을 생각해 봅니다.",
    "staging": "프롤로그의 배가 만 안으로 들어온다. 원작의 섬 윤곽과 갑판 구도를 다시 볼 수 있고, 돌해안의 작은 계류 지점에 내린다.",
    "environment": {
      "time": "같은 날 늦은 오후",
      "weather": "맑음 · 바깥 바다에만 해무",
      "wind": "만 안의 약한 바람",
      "wildlife": "갈매기 · 얕은 물의 작은 물고기",
      "playerAdjustable": false
    },
    "sourceTitle": "외딴 섬에 위탁된 말씀",
    "authorTextAvailable": true,
    "place": "landing",
    "atmosphere": {
      "sunHeight": 0.17,
      "sunIntensity": 3.2,
      "hemiIntensity": 1.7,
      "exposure": 0.91,
      "fogColor": "#a1aaa1",
      "fogDensity": 0.0055,
      "cloud": 0.32,
      "wind": 0.25,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "계류줄과 목선의 결",
      "만 안과 바깥 바다의 거리"
    ],
    "sketch": "assets/journal-day-01.jpg"
  },
  {
    "id": "02",
    "chapter": 2,
    "title": "처음 사랑이 남긴 방향",
    "meaning": "처음 사랑이 가리키던 방향을 다시 바라봅니다. 낮아짐과 의지함으로 관계를 새롭게 하는 길입니다.",
    "staging": "관목길과 돌지형 위로 새의 그림자가 지나간다. 굽은 길에서 항구가 점차 멀어진다.",
    "environment": {
      "time": "밝은 오전",
      "weather": "건조하고 맑음",
      "wind": "강한 바람",
      "wildlife": "원작처럼 큰 새 한 마리 · 종은 미확정",
      "playerAdjustable": false
    },
    "sourceTitle": "처음 사랑이 남긴 방향",
    "authorTextAvailable": true,
    "place": "olive",
    "atmosphere": {
      "sunHeight": 0.53,
      "sunIntensity": 3.0,
      "hemiIntensity": 1.75,
      "exposure": 0.96,
      "fogColor": "#aebcc0",
      "fogDensity": 0.0028,
      "cloud": 0.16,
      "wind": 0.76,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "오래된 나무의 굽은 줄기",
      "굽이치는 돌길과 풀"
    ],
    "sketch": "assets/journal-day-02.jpg"
  },
  {
    "id": "03",
    "chapter": 3,
    "title": "침묵 속에서 드러나는 마음",
    "meaning": "고요 속에서 지금의 마음을 돌아봅니다. 회개와 기다림은 스스로의 모습을 정직하게 알아차리는 데서 시작됩니다.",
    "staging": "원작의 높은 바위벽과 낮은 돌 쉼터를 유지한다. 들어설수록 바람 소리가 줄고 밝은 바깥이 틈으로 보인다.",
    "environment": {
      "time": "한낮",
      "weather": "바깥은 밝고 쉼터는 깊은 그늘",
      "wind": "바위 뒤에서 잦아드는 바람",
      "wildlife": "가까운 바위틈의 작은 도마뱀",
      "playerAdjustable": false
    },
    "sourceTitle": "침묵 속에서 드러나는 마음",
    "authorTextAvailable": true,
    "place": "cave",
    "atmosphere": {
      "sunHeight": 0.84,
      "sunIntensity": 3.1,
      "hemiIntensity": 1.73,
      "exposure": 0.94,
      "fogColor": "#b6c2be",
      "fogDensity": 0.0031,
      "cloud": 0.14,
      "wind": 0.2,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "바위 틈으로 들어오는 빛",
      "그늘 안에서 바라본 바깥"
    ],
    "sketch": "assets/journal-day-03.jpg"
  },
  {
    "id": "04",
    "chapter": 4,
    "title": "보이지 않는 중심",
    "meaning": "바람에 흔들리는 풍경 앞에서 삶의 중심을 돌아봅니다. 예배는 흩어진 시선을 하나님께로 모으는 시간입니다.",
    "staging": "원작처럼 나무와 풀이 같은 방향으로 휘어진다. 움직이는 주변과 변함없는 수평선이 대비된다.",
    "environment": {
      "time": "늦은 오전",
      "weather": "맑음 · 빠르게 흐르는 구름",
      "wind": "북쪽에서 일정하게 강한 바람",
      "wildlife": "바람을 타는 먼 새",
      "playerAdjustable": false
    },
    "sourceTitle": "보이지 않는 중심",
    "authorTextAvailable": true,
    "place": "ridge",
    "atmosphere": {
      "sunHeight": 0.65,
      "sunIntensity": 3.05,
      "hemiIntensity": 1.7,
      "exposure": 0.94,
      "fogColor": "#a8babd",
      "fogDensity": 0.0032,
      "cloud": 0.42,
      "wind": 0.9,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "같은 방향으로 기운 나무",
      "바람 너머의 수평선"
    ],
    "sketch": "assets/journal-day-04.jpg"
  },
  {
    "id": "05",
    "chapter": 5,
    "title": "울음이 깨어남",
    "meaning": "울음 속에서 시선이 깨어납니다. 어린양이 하시는 일을 바라보며, 눈물을 머금은 자리에서 기다립니다.",
    "staging": "원작 넝쿨의 짙은 잎과 수직 빗줄기를 중심으로 둔다. 물방울이 잎 끝에 모이고 지면으로 떨어진다.",
    "environment": {
      "time": "해 질 무렵",
      "weather": "지속되는 부드러운 비",
      "wind": "잎을 조금 흔드는 약한 바람",
      "wildlife": "잎 뒤의 달팽이 · 물소리가 중심",
      "playerAdjustable": false
    },
    "sourceTitle": "눈물과 깨어남",
    "authorTextAvailable": true,
    "place": "garden",
    "atmosphere": {
      "sunHeight": 0.11,
      "sunIntensity": 1.35,
      "hemiIntensity": 1.41,
      "exposure": 0.97,
      "fogColor": "#8d9da2",
      "fogDensity": 0.009,
      "cloud": 0.84,
      "wind": 0.24,
      "rain": 0.72,
      "night": 0
    },
    "observations": [
      "넝쿨 아래 떨어지는 비",
      "잎 그늘의 작은 물길"
    ],
    "sketch": "assets/journal-day-05.jpg"
  },
  {
    "id": "06",
    "chapter": 6,
    "title": "흔들리는 세계 앞의 자리",
    "meaning": "거센 물결 앞에서 우리가 의지해 온 것들의 흔들림을 느낍니다. 무엇이 나를 붙들고 있는지 조용히 돌아봅니다.",
    "staging": "같은 바위 양쪽에서 외해의 파도와 만의 잔잔함이 달라진다. 카메라 흔들림보다 소리·거품·풀의 움직임으로 압박을 만든다.",
    "environment": {
      "time": "오후",
      "weather": "짙은 구름 · 거친 물결",
      "wind": "돌풍이 반복되는 강풍",
      "wildlife": "바위 뒤로 피하는 갈매기",
      "playerAdjustable": false
    },
    "sourceTitle": "흔들리는 세계 앞의 자리",
    "authorTextAvailable": true,
    "place": "petra",
    "atmosphere": {
      "sunHeight": 0.38,
      "sunIntensity": 1.05,
      "hemiIntensity": 1.24,
      "exposure": 0.91,
      "fogColor": "#82969d",
      "fogDensity": 0.008,
      "cloud": 0.94,
      "wind": 1.0,
      "rain": 0.16,
      "night": 0
    },
    "observations": [
      "바위 바깥의 거친 물결",
      "큰 바위 뒤의 작은 자리"
    ]
  },
  {
    "id": "07",
    "chapter": 7,
    "title": "기억되는 이름",
    "meaning": "하나님은 사람의 이름과 눈물을 잊지 않으십니다. 어린양의 돌봄 안에서 내가 속한 자리를 바라봅니다.",
    "staging": "첫 도착 때의 계류줄과 배를 다시 만난다. 여러 물건에 서로 다른 소유의 흔적이 남아 있다.",
    "environment": {
      "time": "흐린 아침",
      "weather": "가랑비 · 만 밖은 거친 바다",
      "wind": "해안에서는 약한 바람",
      "wildlife": "둥지를 지키는 해안의 새",
      "playerAdjustable": false
    },
    "sourceTitle": "표시된 자리와 보호",
    "authorTextAvailable": true,
    "place": "landing",
    "atmosphere": {
      "sunHeight": 0.3,
      "sunIntensity": 1.2,
      "hemiIntensity": 1.43,
      "exposure": 0.97,
      "fogColor": "#9dadae",
      "fogDensity": 0.0085,
      "cloud": 0.83,
      "wind": 0.3,
      "rain": 0.34,
      "night": 0
    },
    "observations": [
      "빗속에 남아 있는 계류줄",
      "목선 곁의 보호된 물가"
    ]
  },
  {
    "id": "08",
    "chapter": 8,
    "title": "다음 울림을 기다리는 침묵",
    "meaning": "침묵 속에서도 기도는 이어집니다. 흔들린 삶에 질서가 회복되기를 바라며 다음 울림을 기다립니다.",
    "staging": "6장에서 거칠었던 물가를 재방문한다. 흔들림이 줄고 소리가 하나씩 멀어진다.",
    "environment": {
      "time": "해가 진 직후",
      "weather": "맑고 낮은 잔물결",
      "wind": "거의 무풍",
      "wildlife": "멀리 한 번 지나가는 새 · 소리의 빈자리",
      "playerAdjustable": false
    },
    "sourceTitle": "다음 울림을 기다리는 침묵",
    "authorTextAvailable": true,
    "place": "petra",
    "atmosphere": {
      "sunHeight": -0.08,
      "sunIntensity": 0.45,
      "hemiIntensity": 0.88,
      "exposure": 1.05,
      "fogColor": "#647983",
      "fogDensity": 0.0045,
      "cloud": 0.16,
      "wind": 0.06,
      "rain": 0,
      "night": 0.2
    },
    "observations": [
      "해가 진 뒤의 잔물결",
      "큰 바위의 어두운 윤곽"
    ]
  },
  {
    "id": "09",
    "chapter": 9,
    "title": "경고를 듣는 귀",
    "meaning": "익숙한 길이 흐려질 때 작은 소리에 귀를 기울입니다. 경고 앞에서 깨어 있는 마음과 듣는 태도를 돌아봅니다.",
    "staging": "익숙한 쉼터의 바깥 길이 안개에 가려진다. 흔들리는 가지와 돌 위의 느슨한 끈 소리가 방향을 드러낸다.",
    "environment": {
      "time": "흐린 낮",
      "weather": "짙은 안개",
      "wind": "간헐적으로 부는 바람",
      "wildlife": "모습보다 소리로 먼저 느끼는 작은 새",
      "playerAdjustable": false
    },
    "sourceTitle": "경고를 듣는 귀",
    "authorTextAvailable": true,
    "place": "cave",
    "atmosphere": {
      "sunHeight": 0.35,
      "sunIntensity": 0.65,
      "hemiIntensity": 1.36,
      "exposure": 1.0,
      "fogColor": "#a6b2b0",
      "fogDensity": 0.024,
      "cloud": 0.96,
      "wind": 0.43,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "안개에 가려지는 바깥길",
      "가까운 돌의 드러난 결"
    ]
  },
  {
    "id": "10",
    "chapter": 10,
    "title": "달고 쓴 작은 책",
    "meaning": "말씀을 아는 기쁨과 그 말씀대로 살아가는 무게가 함께 다가옵니다. 달고 쓴 말씀을 오늘의 삶으로 받아들입니다.",
    "staging": "3장의 쉼터 안쪽 짧은 굴이 열린다. 따뜻한 입구 빛과 거친 돌벽, 손에 든 작은 글의 대비.",
    "environment": {
      "time": "오후",
      "weather": "굴 바깥은 맑음 · 안은 어둡고 서늘함",
      "wind": "굴 안은 무풍",
      "wildlife": "입구에서만 보이는 작은 나방",
      "playerAdjustable": false
    },
    "sourceTitle": "달고 쓴 작은 책",
    "authorTextAvailable": true,
    "place": "cave",
    "atmosphere": {
      "sunHeight": 0.43,
      "sunIntensity": 2.7,
      "hemiIntensity": 1.38,
      "exposure": 0.92,
      "fogColor": "#9fadae",
      "fogDensity": 0.0045,
      "cloud": 0.26,
      "wind": 0.08,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "그늘 안과 바깥의 밝기",
      "말씀을 펼칠 작은 자리"
    ]
  },
  {
    "id": "11",
    "chapter": 11,
    "title": "함께 살아내는 증언",
    "meaning": "고난과 죽음 너머에도 증언은 이어집니다. 함께 살아내는 믿음 안에서 서로의 자리를 돌아봅니다.",
    "staging": "5장의 넝쿨 아래에 쉬어 갈 자리를 넓힌다. 비에 지워진 글의 흔적과 남아 있는 두 기록이 보인다.",
    "environment": {
      "time": "늦은 오후",
      "weather": "구름 사이로 비치는 빛",
      "wind": "약한 바람",
      "wildlife": "돌담 위 작은 새 두 마리",
      "playerAdjustable": false
    },
    "sourceTitle": "교회의 자리를 마련하는 일",
    "authorTextAvailable": true,
    "place": "garden",
    "atmosphere": {
      "sunHeight": 0.26,
      "sunIntensity": 2.25,
      "hemiIntensity": 1.51,
      "exposure": 0.98,
      "fogColor": "#abb2a8",
      "fogDensity": 0.0048,
      "cloud": 0.56,
      "wind": 0.27,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "함께 자라는 두 나무",
      "구름 사이로 드는 빛"
    ]
  },
  {
    "id": "12",
    "chapter": 12,
    "title": "연약한 생명을 감싸는 자리",
    "meaning": "연약한 생명이 머물 수 있는 자리를 바라봅니다. 그리스도의 승리 안에서 주어지는 보호와 피난처를 생각합니다.",
    "staging": "폭우의 물길이 바위 앞에서 갈라지고 안쪽 둥지는 젖지 않는다. 용의 몸 대신 생명을 압박하는 물과 그 물을 가르는 땅을 보여준다.",
    "environment": {
      "time": "해 질 무렵",
      "weather": "바깥은 소나기 · 안쪽은 비를 피함",
      "wind": "굴 밖에서만 강한 바람",
      "wildlife": "보호된 틈의 둥지와 어미 새",
      "playerAdjustable": false
    },
    "sourceTitle": "연약한 생명을 감싸는 자리",
    "authorTextAvailable": true,
    "place": "cave",
    "atmosphere": {
      "sunHeight": 0.12,
      "sunIntensity": 1.1,
      "hemiIntensity": 1.21,
      "exposure": 0.93,
      "fogColor": "#82959b",
      "fogDensity": 0.0105,
      "cloud": 0.91,
      "wind": 0.79,
      "rain": 0.83,
      "night": 0
    },
    "observations": [
      "비를 맞는 바위의 바깥",
      "비를 피하는 깊은 그늘"
    ]
  },
  {
    "id": "13",
    "chapter": 13,
    "title": "무엇이 나를 움직이는가",
    "meaning": "무엇이 나의 선택을 움직이고, 누구에게 마음을 내어주고 있는지 돌아봅니다. 익숙한 질서 안에서 경배의 방향을 살핍니다.",
    "staging": "익숙한 정박지의 통로에 같은 표식과 장부가 반복된다. 빛나는 앞면 뒤로 좁아진 길과 노동의 흔적이 드러난다.",
    "environment": {
      "time": "한낮",
      "weather": "건조하고 눈부심",
      "wind": "반복적으로 흔드는 강한 바람",
      "wildlife": "열린 하늘로 날아가는 갈매기",
      "playerAdjustable": false
    },
    "sourceTitle": "무엇이 움직임의 중심인가",
    "authorTextAvailable": true,
    "place": "landing",
    "atmosphere": {
      "sunHeight": 0.86,
      "sunIntensity": 3.5,
      "hemiIntensity": 1.77,
      "exposure": 0.96,
      "fogColor": "#b7c1b9",
      "fogDensity": 0.0032,
      "cloud": 0.1,
      "wind": 0.76,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "강한 빛 아래의 정박지",
      "줄과 물건 사이의 길"
    ]
  },
  {
    "id": "14",
    "chapter": 14,
    "title": "끝까지 살아내는 열매",
    "meaning": "열매를 기다리는 시간에도 삶은 이어집니다. 끝까지 깨어 있는 인내와 함께 회복되는 기쁨을 바라봅니다.",
    "staging": "5장에서 젖어 있던 잎의 공간을 다시 본다. 넝쿨 옆 무화과에는 익은 열매와 아직 푸른 열매가 함께 있다.",
    "environment": {
      "time": "따뜻한 오후",
      "weather": "맑음",
      "wind": "잎을 흔드는 미풍",
      "wildlife": "열매 주변의 작은 새 · 벌은 멀리",
      "playerAdjustable": false
    },
    "sourceTitle": "익은 것을 알아보는 때",
    "authorTextAvailable": true,
    "place": "garden",
    "atmosphere": {
      "sunHeight": 0.34,
      "sunIntensity": 3.0,
      "hemiIntensity": 1.68,
      "exposure": 0.96,
      "fogColor": "#aeb7aa",
      "fogDensity": 0.004,
      "cloud": 0.15,
      "wind": 0.22,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "잎이 만드는 작은 그늘",
      "돌담 안의 함께하는 자리"
    ]
  },
  {
    "id": "15",
    "chapter": 15,
    "title": "어둠 속에서도 이어지는 노래",
    "meaning": "어둠이 남아 있는 동안에도 노래는 이어집니다. 하나님의 성품과 약속을 신뢰하며 밤하늘 아래 머뭅니다.",
    "staging": "4장의 기울어진 나무가 별하늘 아래 실루엣으로 돌아온다. 아래의 작은 등불과 멀리서 들리는 사람의 노래.",
    "environment": {
      "time": "깊은 밤",
      "weather": "구름 틈으로 넓게 열린 별하늘",
      "wind": "꾸준한 밤바람",
      "wildlife": "동물은 멀고 드물게 · 별과 소리에 집중",
      "playerAdjustable": false
    },
    "sourceTitle": "해결되기 전에 시작되는 찬양",
    "authorTextAvailable": true,
    "place": "ridge",
    "atmosphere": {
      "sunHeight": -0.28,
      "sunIntensity": 0,
      "hemiIntensity": 0.35,
      "exposure": 1.08,
      "fogColor": "#243449",
      "fogDensity": 0.0035,
      "cloud": 0.18,
      "wind": 0.52,
      "rain": 0,
      "night": 1
    },
    "observations": [
      "능선 위의 별하늘",
      "밤바람에 기우는 나무"
    ]
  },
  {
    "id": "16",
    "chapter": 16,
    "title": "막힌 길을 다시 여는 일",
    "meaning": "막힌 흐름 앞에서 마음의 완고함을 돌아봅니다. 하나님의 공의가 향하는 회복의 길에 귀를 기울입니다.",
    "staging": "2장의 길 아래 얕은 물홈이 낙엽과 흙에 막혀 있다. 비가 닿으면 물은 낮은 방향으로 모인다.",
    "environment": {
      "time": "비 오기 전의 오후",
      "weather": "먹구름 · 장면 후반 작은 빗물",
      "wind": "점차 강해지는 고정된 바람 흐름",
      "wildlife": "돌 아래로 들어가는 작은 도마뱀",
      "playerAdjustable": false
    },
    "sourceTitle": "막힌 길을 다시 여는 일",
    "authorTextAvailable": true,
    "place": "olive",
    "atmosphere": {
      "sunHeight": 0.32,
      "sunIntensity": 1.0,
      "hemiIntensity": 1.21,
      "exposure": 0.93,
      "fogColor": "#82959b",
      "fogDensity": 0.009,
      "cloud": 0.92,
      "wind": 0.82,
      "rain": 0.22,
      "night": 0
    },
    "observations": [
      "돌 사이의 마른 물길",
      "비를 앞둔 어두운 하늘"
    ]
  },
  {
    "id": "17",
    "chapter": 17,
    "title": "화려한 자리의 공허",
    "meaning": "화려한 자리의 빛과 그림자를 함께 바라봅니다. 권력과 욕망 뒤에 가려진 사람의 아픔을 생각합니다.",
    "staging": "정박지 창고 안의 금빛 천과 그릇, 비어 있는 중심 자리. 뒷문에서는 화물을 옮긴 손과 밧줄의 마모가 보인다.",
    "environment": {
      "time": "낮은 해가 비치는 오후",
      "weather": "맑음 · 실내는 짙은 그림자",
      "wind": "창가의 약한 바람",
      "wildlife": "문턱에서 잠깐 보이는 작은 새",
      "playerAdjustable": false
    },
    "sourceTitle": "화려한 자리의 공허",
    "authorTextAvailable": true,
    "place": "landing",
    "atmosphere": {
      "sunHeight": 0.18,
      "sunIntensity": 3.0,
      "hemiIntensity": 1.38,
      "exposure": 0.91,
      "fogColor": "#a5ad9c",
      "fogDensity": 0.005,
      "cloud": 0.18,
      "wind": 0.2,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "밝은 물가와 짙은 그늘",
      "물건이 놓인 정박지"
    ]
  },
  {
    "id": "18",
    "chapter": 18,
    "title": "거래가 끝난 뒤 남는 것",
    "meaning": "거래가 멈춘 뒤, 우리는 무엇을 잃었다고 슬퍼하는지 돌아봅니다. 물건의 가치 너머에 있는 사람의 자리를 바라봅니다.",
    "staging": "17장의 같은 창고와 길. 천과 물건이 걷히고 빈 상자, 저울, 밧줄의 그림자가 남는다.",
    "environment": {
      "time": "같은 장소의 밤",
      "weather": "비가 막 지난 젖은 바닥",
      "wind": "약한 바람",
      "wildlife": "소리가 줄고 물가에만 작은 물고기",
      "playerAdjustable": false
    },
    "sourceTitle": "거래가 끝난 뒤 남는 것",
    "authorTextAvailable": true,
    "place": "landing",
    "atmosphere": {
      "sunHeight": -0.23,
      "sunIntensity": 0,
      "hemiIntensity": 0.32,
      "exposure": 1.1,
      "fogColor": "#2b3b4b",
      "fogDensity": 0.006,
      "cloud": 0.48,
      "wind": 0.2,
      "rain": 0,
      "night": 1
    },
    "observations": [
      "밤의 바다에 남는 반사",
      "사람이 머물 작은 자리"
    ]
  },
  {
    "id": "19",
    "chapter": 19,
    "title": "초대를 위해 비워 둔 자리",
    "meaning": "함께 앉을 자리가 마련되어 있습니다. 어린양의 잔치에 초대받은 기쁨을 생각하며 빈 식탁 앞에 머뭅니다.",
    "staging": "넝쿨 아래 공동 식탁에 서로 다른 그릇과 빈자리가 있다. 웅장한 궁전이나 전투 대신 초대받는 자리를 만든다.",
    "environment": {
      "time": "초저녁",
      "weather": "맑고 부드러운 공기",
      "wind": "식탁의 작은 불빛이 견디는 미풍",
      "wildlife": "넝쿨 위의 저녁 새",
      "playerAdjustable": false
    },
    "sourceTitle": "함께 앉도록 마련된 자리",
    "authorTextAvailable": false,
    "place": "garden",
    "atmosphere": {
      "sunHeight": -0.055,
      "sunIntensity": 0.7,
      "hemiIntensity": 1.02,
      "exposure": 1.04,
      "fogColor": "#7b858a",
      "fogDensity": 0.0048,
      "cloud": 0.2,
      "wind": 0.16,
      "rain": 0,
      "night": 0.1
    },
    "observations": [
      "넝쿨 아래 비어 있는 식탁",
      "서로 다른 그릇의 자리"
    ]
  },
  {
    "id": "20",
    "chapter": 20,
    "title": "긴 시간을 살아내는 통치",
    "meaning": "오래된 나무와 어린 잎 사이에서 긴 시간을 바라봅니다. 누구의 통치에 속하여 오늘을 살아가는지 돌아봅니다.",
    "staging": "2장의 오래된 올리브와 곁의 어린 나무를 다시 만난다. 나무껍질과 새 잎의 차이로 시간을 느낀다.",
    "environment": {
      "time": "이른 아침",
      "weather": "옅은 안개가 낀 맑은 날",
      "wind": "약한 아침바람",
      "wildlife": "오래된 나무와 어린 나무 사이를 오가는 작은 새",
      "playerAdjustable": false
    },
    "sourceTitle": "긴 시간을 살아내는 통치",
    "authorTextAvailable": true,
    "place": "olive",
    "atmosphere": {
      "sunHeight": 0.15,
      "sunIntensity": 2.5,
      "hemiIntensity": 1.51,
      "exposure": 0.98,
      "fogColor": "#afbab2",
      "fogDensity": 0.009,
      "cloud": 0.24,
      "wind": 0.22,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "오래된 줄기와 어린 잎",
      "옅은 아침 안개 너머의 길"
    ]
  },
  {
    "id": "21",
    "chapter": 21,
    "title": "함께 거하는 빛",
    "meaning": "처음 도착한 자리에서 함께 거하는 삶을 다시 바라봅니다. 하나님이 우리와 함께하시는 회복의 빛을 생각합니다.",
    "staging": "도착·통제·거래를 보았던 같은 정박지의 문이 열리고 작은 등불이 연결된다. 높은 신전 대신 서로 이어지는 길과 사람의 자리가 중심이다.",
    "environment": {
      "time": "해가 진 직후",
      "weather": "비가 그친 맑은 저녁",
      "wind": "거의 무풍",
      "wildlife": "사람 가까이 돌아온 작은 새",
      "playerAdjustable": false
    },
    "sourceTitle": "하나님과 함께 거하는 질서",
    "authorTextAvailable": true,
    "place": "landing",
    "atmosphere": {
      "sunHeight": -0.065,
      "sunIntensity": 0.6,
      "hemiIntensity": 0.97,
      "exposure": 1.06,
      "fogColor": "#79868e",
      "fogDensity": 0.0036,
      "cloud": 0.15,
      "wind": 0.05,
      "rain": 0,
      "night": 0.14
    },
    "observations": [
      "처음 도착했던 물가",
      "만을 따라 이어지는 자리"
    ]
  },
  {
    "id": "22",
    "chapter": 22,
    "title": "그 말씀대로 오십시오",
    "meaning": "물과 나무 곁에서 마지막 초청에 귀를 기울입니다. 말씀을 있는 그대로 받아들이며 삶의 주도권을 내어드립니다.",
    "staging": "5장에서 비가 내리던 잎 아래에 얕은 물길이 보인다. 같은 잎이 첫 빛을 받는다. 거대한 영구 하천을 실제 밧모에 있었다고 주장하지 않는다.",
    "environment": {
      "time": "동트기 전부터 첫 빛까지",
      "weather": "맑음 · 작은 물방울",
      "wind": "잔잔한 바람",
      "wildlife": "잎 사이로 시작되는 새소리",
      "playerAdjustable": false
    },
    "sourceTitle": "그 말씀대로 오십시오",
    "authorTextAvailable": true,
    "place": "garden",
    "atmosphere": {
      "sunHeight": 0.035,
      "sunIntensity": 1.4,
      "hemiIntensity": 1.22,
      "exposure": 1.02,
      "fogColor": "#a5acb0",
      "fogDensity": 0.0055,
      "cloud": 0.14,
      "wind": 0.17,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "잎 아래 이어지는 물길",
      "잎 끝에 닿는 첫 빛"
    ]
  },
  {
    "id": "E",
    "chapter": null,
    "title": "같은 바다, 달라진 시선",
    "meaning": "같은 바다를 달라진 시선으로 바라봅니다. 마음에 남은 풍경과 말씀을 품고, 서두르지 않고 머물러 봅니다.",
    "staging": "프롤로그의 배와 섬을 반대 시선에서 본다. 남긴 기록과 그림을 배 위에서 다시 펼칠 수 있다.",
    "environment": {
      "time": "고요한 아침",
      "weather": "맑음 · 밝아진 수평선",
      "wind": "온화한 측풍",
      "wildlife": "먼 갈매기 · 고래는 필수 이벤트로 반복하지 않음",
      "playerAdjustable": false
    },
    "sourceTitle": null,
    "authorTextAvailable": false,
    "place": "sea",
    "atmosphere": {
      "sunHeight": 0.3,
      "sunIntensity": 2.7,
      "hemiIntensity": 1.68,
      "exposure": 0.98,
      "fogColor": "#aebdc0",
      "fogDensity": 0.0038,
      "cloud": 0.17,
      "wind": 0.28,
      "rain": 0,
      "night": 0
    },
    "observations": [
      "되돌아본 섬의 윤곽",
      "같은 바다의 아침빛"
    ]
  }
];
