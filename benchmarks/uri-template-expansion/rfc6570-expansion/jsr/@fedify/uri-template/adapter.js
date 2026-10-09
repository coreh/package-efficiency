import { Template } from '@fedify/uri-template'
export const operation = ({ template, vars }) => new Template(template).expand(vars)
