require 'openssl'
# Not timed: runs once per fixture.
def prepare(value)
  [value].pack('H*').freeze
end

def operation(der)
  cert = OpenSSL::X509::Certificate.new(der)
  subject = cert.subject.to_a
  issuer = cert.issuer.to_a
  {
    'version' => cert.version + 1,
    'serial' => cert.serial.to_s(16).downcase,
    'subjectCN' => (subject.find { |a| a[0] == 'CN' }&.at(1) || ''),
    'issuerCN' => (issuer.find { |a| a[0] == 'CN' }&.at(1) || ''),
    'subjectAttrs' => subject.length,
    'issuerAttrs' => issuer.length,
    'notBefore' => cert.not_before.to_i,
    'notAfter' => cert.not_after.to_i,
    'extensions' => cert.extensions.length
  }
end
