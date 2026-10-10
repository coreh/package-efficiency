import which from 'which'

export const operation = ({ path, commands }) => commands.map((name) => which.sync(name, { path, nothrow: true }))
