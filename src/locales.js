const zh = {
  back: '后退',
  forward: '前进',
  empty: '暂无历史',
  label: '页面历史',
  bar: '页面历史导航',
  hint: 'Alt+← / Alt+→',
  count: '{index}/{total}',
  config: {
    title: '导航栏',
    desc: '控制底部页面历史导航条最多同时显示多少个页面。',
    maxVisible: '最多显示条目数',
    hint: '设为 1 时只显示当前页面；大于 1 时显示当前页面前后的页面，可直接点击跳转。可选范围 1–7。',
    entryWidth: '每个页面的最大宽度',
    widthValue: '{width} px',
    widthHint: '限制每个页面记录在导航条中的最大宽度，超出部分省略。可选范围 64–320 像素。',
    shortcuts: '「后退 / 前进」快捷键可在 设置 → 通用 → 快捷键 中查看和修改。',
  },
};
const en = {
  back: 'Back',
  forward: 'Forward',
  empty: 'No history',
  label: 'History',
  bar: 'Navigation history',
  hint: 'Alt+Left / Alt+Right',
  count: '{index}/{total}',
  config: {
    title: 'Navigation bar',
    desc: 'How many pages the bottom history strip shows at once.',
    maxVisible: 'Maximum visible entries',
    hint: 'Set to 1 to show only the current page. Above 1 the strip also shows neighbouring pages you can click. Allowed range: 1–7.',
    entryWidth: 'Maximum width per page',
    widthValue: '{width} px',
    widthHint: 'Caps how wide one page entry may grow in the strip; longer titles are truncated. Allowed range: 64–320 px.',
    shortcuts: 'The Back / Forward shortcuts can be viewed and rebound in Settings → General → Shortcuts.',
  },
};

export { zh, en };
