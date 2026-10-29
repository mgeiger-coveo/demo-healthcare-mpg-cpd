/**
 * Utility function to concatenate classNames conditionally
 * Similar to the `clsx` or `classnames` library
 */
export default function cx(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(" ");
}
