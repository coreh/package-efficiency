# Registrable domain of a host

One operation takes a host name (`staging.mail.globex-37.co.uk`) and returns
its registrable domain (`globex-37.co.uk`): the public suffix plus one label,
according to the Public Suffix List. A host that is only a public suffix
(`co.uk`, `com`) has none, and the result is `null` (`nil`, `None`).

The 720 hosts (594 distinct) are generated deterministically from single
labels (`com`, `de`, `jp`), multi-label suffixes (`co.uk`, `com.br`, `ne.jp`,
`gov.cn`), internationalized suffixes already in punycode (`xn--p1ai`),
wildcard rules (`*.ck`, `*.fk`, `*.np`, ...) and the exception to one
(`www.ck`), each with zero to three subdomain labels, and with bare suffixes
(one host in twelve) that must give `null`. Every host is lower case.

## What counts as correct

The result must equal the registrable domain the generator wrote: an exact
string, or `null`. A split at the last dot, or at the last two labels, fails.

## Snapshots and what is left out

Packages bundle different snapshots of the list, and some include the private
section (`github.io`, `blogspot.com`) and some do not. The fixtures use only
ICANN-section suffixes that have been in the list for years, and no label in
front of a suffix is itself a private-section rule, so every snapshot and
both settings agree. Hosts under an unlisted suffix are not used, because
packages differ in whether the unknown last label counts as a suffix.
Wildcards that were removed recently (`*.kh`) are not used.

A package that downloads the list at run time is not eligible with its
default settings. `tldextract` does by default; its documented offline form,
`TLDExtract(suffix_list_urls=())`, built once, uses the snapshot in the wheel
and is what runs.

## Packages

Each runs with default options, the way its documentation shows.

- `tldts` (`getDomain`) and `psl` (`get`), npm.
- `tldextract` (`suffix_list_urls=()`) and `tld` (`get_tld`), PyPI. `tld`
  returns a bare suffix as its own "fld"; the adapter maps that to `None`.
- `public_suffix` (`PublicSuffix.domain`) and `domain_name`
  (`DomainName.new(host).domain`), RubyGems.
- `golang.org/x/net/publicsuffix` (`EffectiveTLDPlusOne`), Go.

No standard library does this, so there are no `builtin` adapters. Not
included: JSR and crates (`psl`, `publicsuffix`, `addr`), which the brief did
not list; Python `publicsuffix2` and `publicsuffixlist`, Go `weppos/publicsuffix-go`
are other candidates.

See [shared methodology](../../README.md) for timing and reproduction.
