require 'commonmarker'

OPTIONS = { render: { hardbreaks: false, github_pre_lang: false }, extension: { header_ids: nil } }
PLUGINS = { syntax_highlighter: nil }

def operation(text)
  Commonmarker.to_html(text, options: OPTIONS, plugins: PLUGINS)
end
