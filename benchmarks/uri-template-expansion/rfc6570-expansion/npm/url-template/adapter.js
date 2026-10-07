import { parseTemplate } from 'url-template'
export const operation = ({ template, vars }) => parseTemplate(template).expand(vars)
