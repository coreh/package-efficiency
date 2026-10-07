ANSI = /\e\[[0-?]*[ -\/]*[@-~]|\e\][^\a\e]*(?:\a|\e\\)/
def operation(value)
  value.gsub(ANSI, '')
end
