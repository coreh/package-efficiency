import { enable, enabled } from 'obug'
enable('app:web:*,app:db:*,app:cache:*,app:auth:*,lib:http:*,worker:*,svc:billing:*')
export const operation = ({ ns }) => enabled(ns)
