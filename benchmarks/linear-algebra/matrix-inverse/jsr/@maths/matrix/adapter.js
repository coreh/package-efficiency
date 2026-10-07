import { Matrix, invert } from '@maths/matrix'
export const operation = ({ n, a }) => invert(new Matrix(a, n, n))
