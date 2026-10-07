import { qrCode, EcLevel } from '@levischuck/tiny-qr'
const levels = [EcLevel.L, EcLevel.M, EcLevel.Q, EcLevel.H]
export const operation = ({ text, level }) => qrCode({ data: text, ec: levels[level] }).matrix
