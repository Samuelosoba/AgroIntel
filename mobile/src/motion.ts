// Motion: every animation in the app uses one standard ease-in-out curve and
// short durations, so movement stays calm and consistent — no springs or bounces.
import { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";

/** Standard ease-in-out. */
export const ease = Easing.inOut(Easing.ease);

export const duration = { fast: 150, base: 250, slow: 500 } as const;

/** Config for `withTiming`, e.g. `withTiming(1, timing())`. */
export const timing = (ms: number = duration.base) => ({ duration: ms, easing: ease });

/** Delay for the nth item of a staggered list, capped so long lists don't drag. */
export const stagger = (index: number) => Math.min(index, 6) * 40;

/** Fade in place. */
export const fadeIn = (delay = 0) => FadeIn.duration(duration.base).easing(ease).delay(delay);

/** Fade in while rising a few pixels. */
export const riseIn = (delay = 0) =>
  FadeInDown.duration(duration.base).easing(ease).delay(delay).withInitialValues({ transform: [{ translateY: 8 }] });

export const fadeOut = () => FadeOut.duration(duration.fast).easing(ease);

/** Remaining items easing into the space left by a removed one. */
export const reflow = () => LinearTransition.duration(duration.base).easing(ease);
