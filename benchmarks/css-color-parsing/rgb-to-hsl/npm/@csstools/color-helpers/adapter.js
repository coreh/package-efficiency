import { sRGB_to_XYZ_D50, XYZ_D50_to_HSL } from '@csstools/color-helpers'
// No direct sRGB-to-HSL function: the package converts through XYZ. Channels are scaled to 0-1 as it expects.
export const operation = (c) => XYZ_D50_to_HSL(sRGB_to_XYZ_D50([c[0] / 255, c[1] / 255, c[2] / 255]))
