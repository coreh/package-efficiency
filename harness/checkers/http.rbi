# typed: true
# Minimal Roda boundary for the exercised API. Routing DSL and JSON values are
# intentionally dynamic; this does not pretend to type-check the framework.
class Roda
  extend T::Sig
  sig { params(name: Symbol).void }
  def self.plugin(name); end
  sig { params(block: T.proc.bind(Roda).params(r: T.untyped).returns(T.untyped)).void }
  def self.route(&block); end
  sig { returns(T::Hash[String, String]) }
  def response; end
  sig { returns(T.untyped) }
  def request; end
  sig { returns(T.proc.params(env: T::Hash[String, T.untyped]).returns(T::Array[T.untyped])) }
  def self.app; end
end
