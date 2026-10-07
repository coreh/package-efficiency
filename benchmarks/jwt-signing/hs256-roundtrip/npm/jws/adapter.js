import jws from 'jws'
export const operation = ({ claims, secret }) => {
  const token = jws.sign({ header: { alg: 'HS256', typ: 'JWT' }, payload: claims, secret })
  if (!jws.verify(token, 'HS256', secret)) throw new Error('invalid signature')
  return { claims: jws.decode(token).payload, token }
}
