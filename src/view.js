import { MAX_ENTRY_WIDTH, MAX_VISIBLE, MIN_ENTRY_WIDTH, MIN_VISIBLE, WIDTH_STEP } from './constants.js';

/**
 * Plugin-detail configuration card. `React` is injected by the caller so this
 * module stays free of bundler globals and is directly unit-testable.
 */
function createConfigSection(React, controller, fallbackT) {
  const h = React.createElement;
  return function NavHistorySettings(props) {
    const t = props && typeof props.t === 'function' ? props.t : fallbackT;
    const [maxVisible, setMaxVisible] = React.useState(controller.getMaxVisible());
    const [entryWidth, setEntryWidth] = React.useState(controller.getEntryWidth());
    React.useEffect(() => {
      let alive = true;
      const sync = () => {
        if (!alive) return;
        setMaxVisible(controller.getMaxVisible());
        setEntryWidth(controller.getEntryWidth());
      };
      const off = controller.subscribe(sync);
      sync();
      return () => {
        alive = false;
        off();
      };
    }, []);

    // Rendered by the plugin manager's per-bundle configuration entry, so
    // this card only ever appears on this bundle's own detail page.
    const choices = [];
    for (let value = MIN_VISIBLE; value <= MAX_VISIBLE; value += 1) choices.push(value);

    return h(
      'section',
      {
        className: 'dnh-cfg',
        'data-dsh-nav-history-config': '',
        'aria-label': t('config.title'),
      },
      h(
        'div',
        { className: 'dnh-cfg-head' },
        h('h3', { className: 'dnh-cfg-title' }, t('config.title')),
        h('p', { className: 'dnh-cfg-desc' }, t('config.desc')),
      ),
      h(
        'div',
        { className: 'dnh-cfg-row' },
        h('span', { className: 'dnh-cfg-label' }, t('config.maxVisible')),
        h(
          'div',
          { className: 'dnh-cfg-choices', role: 'radiogroup', 'aria-label': t('config.maxVisible') },
          ...choices.map((value) =>
            h(
              'button',
              {
                key: String(value),
                type: 'button',
                role: 'radio',
                'aria-checked': value === maxVisible,
                className: `dnh-choice${value === maxVisible ? ' dnh-choice-active' : ''}`,
                onClick: () => controller.setMaxVisible(value),
              },
              String(value),
            ),
          ),
        ),
      ),
      h('p', { className: 'dnh-cfg-hint' }, t('config.hint')),
      h(
        'div',
        { className: 'dnh-cfg-row' },
        h('span', { className: 'dnh-cfg-label' }, t('config.entryWidth')),
        h(
          'div',
          { className: 'dnh-cfg-width' },
          h('input', {
            type: 'range',
            min: MIN_ENTRY_WIDTH,
            max: MAX_ENTRY_WIDTH,
            step: WIDTH_STEP,
            value: entryWidth,
            'aria-label': t('config.entryWidth'),
            onChange: (event) => controller.setEntryWidth(Number(event.target.value)),
          }),
          h('span', { className: 'dnh-cfg-value' }, t('config.widthValue').replace('{width}', String(entryWidth))),
        ),
      ),
      h('p', { className: 'dnh-cfg-hint' }, t('config.widthHint')),
      h('p', { className: 'dnh-cfg-hint' }, t('config.shortcuts')),
    );
  };
}

/** Back/forward chevron, built as a component so the bar owns no markup helpers. */
function createNavIcon(React) {
  const h = React.createElement;
  return function NavIcon({ direction }) {
    const path = direction === 'back'
      ? 'M9.8 3.6 5.2 8l4.6 4.4'
      : 'M6.2 3.6 10.8 8l-4.6 4.4';
    return h(
      'svg',
      {
        viewBox: '0 0 16 16',
        width: 14,
        height: 14,
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block' },
      },
      h('path', {
        d: path,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
    );
  };
}

/** Bottom history strip: arrows, the visible window of pages and the n/m counter. */
function createNavBar(React, controller, fallbackT) {
  const h = React.createElement;
  const NavIcon = createNavIcon(React);
  return function NavBar(props) {
    const t = props && typeof props.t === 'function' ? props.t : fallbackT;
    const [snapshot, setSnapshot] = React.useState(controller.getSnapshot());
    React.useEffect(() => {
      let alive = true;
      const refresh = () => {
        if (alive) setSnapshot(controller.getSnapshot());
      };
      const off = controller.subscribe(refresh);
      refresh();
      return () => {
        alive = false;
        off();
      };
    }, []);

    const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || '');
    const backKey = mac ? '⌘[' : 'Alt+←';
    const forwardKey = mac ? '⌘]' : 'Alt+→';
    const count = snapshot.length > 1
      ? t('count')
        .replace('{index}', String(snapshot.index + 1))
        .replace('{total}', String(snapshot.length))
      : '';

    const children = [
      h(
        'button',
        {
          type: 'button',
          className: 'dnh-btn',
          disabled: !snapshot.canBack,
          title: `${t('back')} (${backKey})`,
          'aria-label': t('back'),
          onClick: () => controller.back(),
        },
        h(NavIcon, { direction: 'back' }),
      ),
      h(
        'button',
        {
          type: 'button',
          className: 'dnh-btn',
          disabled: !snapshot.canForward,
          title: `${t('forward')} (${forwardKey})`,
          'aria-label': t('forward'),
          onClick: () => controller.forward(),
        },
        h(NavIcon, { direction: 'forward' }),
      ),
      h('span', { className: 'dnh-sep', 'aria-hidden': 'true' }),
    ];

    if (snapshot.items.length <= 1) {
      const current = snapshot.items[0];
      children.push(
        h(
          'span',
          {
            key: 'current',
            className: snapshot.kind === 'panel' ? 'dnh-loc dnh-loc-panel' : 'dnh-loc',
            style: { maxWidth: `${snapshot.entryWidth}px` },
            title: (current && current.label) || snapshot.label || t('empty'),
          },
          (current && current.label) || snapshot.label || t('empty'),
        ),
      );
    } else {
      for (const item of snapshot.items) {
        children.push(
          h(
            'button',
            {
              key: `entry-${item.index}`,
              type: 'button',
              className: `dnh-item${item.active ? ' dnh-item-active' : ''}${item.kind === 'panel' ? ' dnh-item-panel' : ''}`,
              style: { maxWidth: `${snapshot.entryWidth}px` },
              title: item.label || t('empty'),
              'aria-current': item.active ? 'page' : undefined,
              onClick: () => controller.jumpTo(item.index),
            },
            item.label || t('empty'),
          ),
        );
      }
    }

    if (count !== '') {
      children.push(h('span', { key: 'count', className: 'dnh-count', 'aria-hidden': 'true' }, count));
    }

    return h(
      'div',
      {
        className: 'dnh-bar',
        role: 'toolbar',
        'aria-label': t('bar'),
        'data-dsh-nav-history': 'bar',
      },
      ...children,
    );
  };
}

export { createConfigSection, createNavIcon, createNavBar };
