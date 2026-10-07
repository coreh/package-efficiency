import { pbkdf2Sync } from 'node:crypto'
export const operation = ({ password, salt, iterations, length }) => pbkdf2Sync(password, salt, iterations, length, 'sha256')
