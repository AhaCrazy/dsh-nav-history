/**
 * dsh-nav-history — Host half.
 *
 * Intentionally empty: navigation history is a pure browser concern. The Host
 * row exists only so the bundle patch can mount the package and let the Web app
 * load its `./client` half. Nothing here touches tools, prompts, sessions or
 * the model.
 *
 * @module dsh-nav-history
 */

export const name = 'dsh-nav-history';

/** No host behaviour. */
export function apply() {}
