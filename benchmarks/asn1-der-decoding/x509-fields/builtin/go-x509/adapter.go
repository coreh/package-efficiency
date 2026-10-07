package main

import (
	"crypto/x509"
	"encoding/hex"
)

type fields struct {
	Version       int    `json:"version"`
	Serial        string `json:"serial"`
	SubjectCN     string `json:"subjectCN"`
	IssuerCN      string `json:"issuerCN"`
	SubjectAttrs  int    `json:"subjectAttrs"`
	IssuerAttrs   int    `json:"issuerAttrs"`
	NotBefore     int64  `json:"notBefore"`
	NotAfter      int64  `json:"notAfter"`
	Extensions    int    `json:"extensions"`
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	raw, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return raw
}

func operation(value any) any {
	c, err := x509.ParseCertificate(value.([]byte))
	if err != nil {
		panic(err)
	}
	return &fields{
		Version:      c.Version,
		Serial:       c.SerialNumber.Text(16),
		SubjectCN:    c.Subject.CommonName,
		IssuerCN:     c.Issuer.CommonName,
		SubjectAttrs: len(c.Subject.Names),
		IssuerAttrs:  len(c.Issuer.Names),
		NotBefore:    c.NotBefore.Unix(),
		NotAfter:     c.NotAfter.Unix(),
		Extensions:   len(c.Extensions),
	}
}
