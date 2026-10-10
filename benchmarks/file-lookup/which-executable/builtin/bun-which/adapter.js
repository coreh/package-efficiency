export const operation = ({ path, commands }) => commands.map((name) => Bun.which(name, { PATH: path }))
