#!/bin/sh

set -euo pipefail

mkdir -p ssl
pushd ssl

if [[ ! -f ca.key ]] && [[ ! -f ca.pem ]]; then
  openssl ecparam -name prime256v1 -genkey -noout -out ca.key
  openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.pem -subj "/CN=localhost CA"
else
  echo "CA key and certificate already exist, skipping generation."
fi

openssl ecparam -name prime256v1 -genkey -noout -out server.key
openssl req -new -key server.key -out server.csr -config server.cnf
openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out server.crt -days 365 -sha256 -extfile server.cnf -extensions req_ext
popd

