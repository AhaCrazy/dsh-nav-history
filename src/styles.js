const CSS = `
  .dnh-bar {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 30px;
    padding: 0 10px;
    font: inherit;
    font-size: 11.5px;
    line-height: 1;
    color: var(--dsw-alias-label-secondary);
    background: var(--dsw-alias-bg-base);
    border-top: 1px solid var(--dsw-alias-border-l1);
    overflow: hidden;
    user-select: none;
  }
  .dnh-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--dsw-alias-label-secondary);
    cursor: pointer;
  }
  .dnh-btn:hover:not(:disabled) {
    background: var(--dsw-alias-bg-layer-2);
    color: var(--dsw-alias-label-primary);
  }
  .dnh-btn:active:not(:disabled) {
    transform: translateY(0.5px);
  }
  .dnh-btn:disabled {
    opacity: 0.32;
    cursor: default;
  }
  .dnh-btn:focus-visible {
    outline: 2px solid var(--dsw-alias-brand-primary);
    outline-offset: 1px;
  }
  .dnh-sep {
    flex: none;
    width: 1px;
    height: 13px;
    margin: 0 3px;
    background: var(--dsw-alias-border-l1);
  }
  .dnh-loc {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--dsw-alias-label-primary);
    max-width: 46vw;
  }
  .dnh-loc-panel {
    color: var(--dsw-alias-label-secondary);
  }
  .dnh-item {
    appearance: none;
    flex: 0 1 auto;
    min-width: 0;
    max-width: 22ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--dsw-alias-label-secondary);
    font: inherit;
    font-size: 11.5px;
    line-height: 1;
    cursor: pointer;
  }
  .dnh-item:hover {
    background: var(--dsw-alias-bg-layer-2);
    color: var(--dsw-alias-label-primary);
  }
  .dnh-item-active {
    border-color: var(--dsw-alias-border-l2);
    background: var(--dsw-alias-bg-layer-2);
    color: var(--dsw-alias-label-primary);
    font-weight: 600;
  }
  .dnh-item-panel {
    color: var(--dsw-alias-label-secondary);
  }
  .dnh-count {
    flex: none;
    margin-left: auto;
    padding-left: 10px;
    font-variant-numeric: tabular-nums;
    opacity: 0.6;
  }
  .dnh-cfg {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid var(--dsw-alias-border-l1);
    border-radius: 10px;
    background: var(--dsw-alias-bg-layer-1);
  }
  .dnh-cfg-title {
    margin: 0;
    font-size: 14px;
    line-height: 1.3;
    font-weight: 600;
    color: var(--dsw-alias-label-primary);
  }
  .dnh-cfg-desc,
  .dnh-cfg-hint {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--dsw-alias-label-secondary);
  }
  .dnh-cfg-hint {
    opacity: 0.85;
  }
  .dnh-cfg-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .dnh-cfg-label {
    font-size: 12.5px;
    color: var(--dsw-alias-label-primary);
  }
  .dnh-cfg-choices {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--dsw-alias-border-l1);
    border-radius: 8px;
    background: var(--dsw-alias-bg-base);
  }
  .dnh-choice {
    appearance: none;
    width: 28px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--dsw-alias-label-secondary);
    font: inherit;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }
  .dnh-choice:hover {
    background: var(--dsw-alias-bg-layer-2);
    color: var(--dsw-alias-label-primary);
  }
  .dnh-choice-active {
    background: var(--dsw-alias-bg-layer-2);
    color: var(--dsw-alias-label-primary);
    font-weight: 650;
  }
  .dnh-choice:focus-visible {
    outline: 2px solid var(--dsw-alias-brand-primary);
    outline-offset: 1px;
  }
  .dnh-cfg-width {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .dnh-cfg-width input[type='range'] {
    width: 170px;
    accent-color: var(--dsw-alias-brand-primary);
    cursor: pointer;
  }
  .dnh-cfg-value {
    min-width: 54px;
    text-align: right;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--dsw-alias-label-secondary);
  }
`;

export { CSS };
