import UriTemplate from 'uri-template-lite'
export const operation = ({ template, vars }) => UriTemplate.expand(template, vars)
