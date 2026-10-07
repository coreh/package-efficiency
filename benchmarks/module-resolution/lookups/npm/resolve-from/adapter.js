import resolveFrom from 'resolve-from'

export const operation = ({ base, specifiers }) => specifiers.map((s) => resolveFrom(base, s))
