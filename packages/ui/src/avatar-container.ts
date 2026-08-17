/** True only when the avatar should stretch inside a sized relative parent. */
export function shouldFillAvatarContainer(
  className: string,
  fill?: boolean,
): boolean {
  if (fill !== undefined) {
    return fill;
  }

  return /\bsize-full\b/.test(className) || /\binset-0\b/.test(className);
}
