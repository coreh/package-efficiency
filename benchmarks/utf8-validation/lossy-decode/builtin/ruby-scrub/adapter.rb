# Untimed, once per fixture: the hex string becomes a binary string.
def prepare(value)
  [value].pack('H*')
end

# The buffer is shared by every call, and a Ruby string remembers whether it
# was valid once checked, so each call tags and scrubs a fresh view of it.
def operation(value)
  value.dup.force_encoding(Encoding::UTF_8).scrub("\u{FFFD}")
end
