import { Matrix, multiply } from '@maths/matrix'
export const operation = ({ n, a, b }) => multiply(new Matrix(a, n, n), new Matrix(b, n, n))
