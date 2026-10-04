// Four geographic anchors within the existing island coordinates.
// Evidence checked against the primary sources below on 2026-10-04.
// Revelation 1:9 identifies the island, not any of these four individual sites.
const MUNICIPALITY_SOURCE = 'https://patmos.gov.gr/%CF%80%CE%B5%CF%81%CE%B9%CE%B3%CF%81%CE%B1%CF%86%CE%AE-%CE%B4%CE%AE%CE%BC%CE%BF%CF%85/';

export const ISLAND_CONTEXT = {
  id: 'patmos',
  name: '밧모섬',
  kind: '성경의장소',
  summary: '요한계시록 1장 9절에서 요한이 머물렀다고 밝힌 섬입니다.',
  details: '요한은 하나님의 말씀과 예수의 증언 때문에 밧모라는 섬에 있었다고 기록합니다. 본문은 섬 안의 상륙 지점, 동굴, 이동 경로를 특정하지 않습니다. 이 풍경은 실제 밧모의 해안과 능선을 바탕으로 요한의 시대를 상상한 재구성입니다.',
  sourceUrl: 'https://bible.usccb.org/bible/revelation/1',
};

export const ISLAND_PLACES = [
  {
    id: 'landing',
    name: '스칼라 만',
    x: -81.878,
    z: 3.715,
    kind: '지리의장소',
    summary: '바다에서 밧모섬으로 들어오는 풍경을 바라봅니다.',
    details: '스칼라는 오늘날 밧모의 주요 항구가 있는 곳입니다. 이 장면은 만의 실제 위치를 바탕으로 현대 항만 시설이 없는 해안을 상상합니다. 요한의 정확한 상륙 지점이나 1세기 부두 배치를 확인한 모습은 아닙니다.',
    sourceUrl: MUNICIPALITY_SOURCE,
  },
  {
    id: 'cave',
    name: '계시의 동굴',
    x: -81.134,
    z: 40.051,
    kind: '전승의장소',
    summary: '요한이 계시를 기록한 자리로 전해지는 동굴입니다.',
    details: '스칼라와 호라 사이의 동굴은 요한이 계시록을 구술한 장소로 전해집니다. UNESCO도 이 연결을 전승으로 소개합니다. 성경 본문은 이 동굴을 특정하지 않으며, 여기의 암반과 입구는 1세기 모습을 실측해 복원한 것이 아닙니다.',
    sourceUrl: 'https://whc.unesco.org/en/list/942/',
  },
  {
    id: 'petra',
    name: '페트라 · 칼리카추',
    x: -26.527,
    z: 108.321,
    kind: '지리의장소',
    summary: '그리코스 만 곁, 바다와 암반이 만나는 해안입니다.',
    details: '밧모 남동쪽 그리코스 만에는 페트라 해변과 칼리카추 바위가 있습니다. 이곳은 만과 바위의 상대 위치를 따라 섬의 자연 지형을 살피는 자리입니다. 요한의 방문 장소로 단정하지 않으며, 암반의 세부 형태는 시각적 재구성입니다.',
    sourceUrl: MUNICIPALITY_SOURCE,
  },
  {
    id: 'north',
    name: '캄보스 만',
    x: -6.004,
    z: -103.379,
    kind: '지리의장소',
    summary: '섬 북동쪽, 낮은 언덕에서 바다로 이어지는 만입니다.',
    details: '캄보스는 밧모 북동쪽의 낮은 언덕과 해안 만으로 이어지는 지역입니다. 이 풍경은 섬의 북쪽 지형을 둘러보는 자리로 마련했습니다. 오늘의 마을 배치를 요한의 시대로 옮긴 모습은 아니며, 당시의 농가나 식생 분포를 확정하지 않습니다.',
    sourceUrl: MUNICIPALITY_SOURCE,
  },
];
