import uriTemplate from 'uri-template'
export const operation = ({ template, vars }) => uriTemplate.parse(template).expand(vars)
