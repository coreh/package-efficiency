import createDebug from 'debug'
createDebug.enable('app:web:*,app:db:*,app:cache:*,app:auth:*,lib:http:*,worker:*,svc:billing:*')
export const operation = ({ ns }) => createDebug.enabled(ns)
