import uriTemplates from 'uri-templates'
export const operation = ({ template, vars }) => uriTemplates(template).fill(vars)
