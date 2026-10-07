import jwt from 'jsonwebtoken'
export const operation = ({ token, secret }) => {
  try {
    return { status: 'valid', claims: jwt.verify(token, secret, { algorithms: ['HS256'] }) }
  } catch (error) {
    return { status: error.name === 'TokenExpiredError' ? 'expired' : 'invalid-signature', claims: null }
  }
}
