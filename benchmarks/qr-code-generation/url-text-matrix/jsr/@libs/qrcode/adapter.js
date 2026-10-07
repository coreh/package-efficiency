import { qrcode } from '@libs/qrcode'
const levels = ['LOW', 'MEDIUM', 'QUARTILE', 'HIGH']
export const operation = ({ text, level }) => qrcode(text, { output: 'array', ecl: levels[level] })
