import { StdUriTemplate } from '@std-uritemplate/std-uritemplate'
export const operation = ({ template, vars }) => StdUriTemplate.expand(template, vars)
