import jwt from 'jsonwebtoken'
export const operation = ({ claims, secret }) => {
  const token = jwt.sign(claims, secret, { algorithm: 'HS256' })
  return { claims: jwt.verify(token, secret, { algorithms: ['HS256'] }), token }
}
