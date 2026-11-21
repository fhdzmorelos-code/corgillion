#!/bin/sh
# uso: wdq.sh consulta.rq salida.json
curl -sS -G "https://query.wikidata.org/sparql" --data-urlencode "query@$1" --data-urlencode "format=json" \
  -H "Accept: application/sparql-results+json" -A "TriviaGeoBuilder/1.0 (educational game data)" -m 300 -o "$2" -w "%{http_code} %{time_total}s %{size_download}B\n"
