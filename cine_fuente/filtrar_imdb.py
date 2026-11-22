# Lee de stdin un TSV de IMDb y deja solo las filas cuyo id (en la columna indicada) está en la lista.
# Uso: curl ... | gzip -dc | python filtrar_imdb.py lista_ids.tsv columna_id salida.tsv
import sys, io
ids = set(l.rstrip("\r\n").split("\t")[0] for l in io.open(sys.argv[1], encoding="utf-8"))
col = int(sys.argv[2])
out = io.open(sys.argv[3], "w", encoding="utf-8")
inp = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
out.write(inp.readline())
n = 0
for l in inp:
    c = l.split("\t", col + 2)
    if c[col] in ids:
        out.write(l)
        n += 1
print(n, "filas")
