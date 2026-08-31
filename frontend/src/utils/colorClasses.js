// Maps a product color's `id` to its Tailwind classes for the swatch button.
// Written as complete, literal strings here (not built from database data or
// template-literal interpolation) so Tailwind's build-time scanner can always
// see and generate CSS for them - dynamic classes assembled at runtime (from
// a database, or via `bg-${color}-${shade}`-style interpolation) are invisible
// to that scanner and silently produce no CSS.
//
// Covers every standard Tailwind color name at one representative shade each,
// so any reasonably-named color id (e.g. "blue", "emerald") already works
// without needing a new entry. Add a specific override here only if a color
// needs a different shade than its default.
export const COLOR_SWATCH_CLASSES = {
  // Original product colors
  black: 'bg-gray-900 checked:outline-gray-900',
  white: 'bg-white checked:outline-gray-400',
  'iso-dots': 'bg-orange-200 checked:outline-gray-400',
  red: 'bg-red-600 checked:outline-gray-900',

  // Full standard Tailwind palette (neutrals)
  slate: 'bg-slate-500 checked:outline-gray-900',
  gray: 'bg-gray-500 checked:outline-gray-900',
  zinc: 'bg-zinc-500 checked:outline-gray-900',
  neutral: 'bg-neutral-500 checked:outline-gray-900',
  stone: 'bg-stone-500 checked:outline-gray-900',

  // Full standard Tailwind palette (colors)
  orange: 'bg-orange-500 checked:outline-gray-900',
  amber: 'bg-amber-500 checked:outline-gray-900',
  yellow: 'bg-yellow-500 checked:outline-gray-900',
  lime: 'bg-lime-500 checked:outline-gray-900',
  green: 'bg-green-500 checked:outline-gray-900',
  emerald: 'bg-emerald-500 checked:outline-gray-900',
  teal: 'bg-teal-500 checked:outline-gray-900',
  cyan: 'bg-cyan-500 checked:outline-gray-900',
  sky: 'bg-sky-500 checked:outline-gray-900',
  blue: 'bg-blue-500 checked:outline-gray-900',
  indigo: 'bg-indigo-500 checked:outline-gray-900',
  violet: 'bg-violet-500 checked:outline-gray-900',
  purple: 'bg-purple-500 checked:outline-gray-900',
  fuchsia: 'bg-fuchsia-500 checked:outline-gray-900',
  pink: 'bg-pink-500 checked:outline-gray-900',
  rose: 'bg-rose-500 checked:outline-gray-900',
}

export const DEFAULT_SWATCH_CLASSES = 'bg-gray-300 checked:outline-gray-900'

export function getSwatchClasses(colorId) {
  return COLOR_SWATCH_CLASSES[colorId] || DEFAULT_SWATCH_CLASSES
}