import csv
import sys

# Si le pasás un archivo al ejecutarlo, usa ese. Si no, busca gastos.csv
archivo = sys.argv[1] if len(sys.argv) > 1 else "gastos.csv"


def pesos(numero):
    # 1234567 -> $1.234.567
    return "$" + f"{numero:,.0f}".replace(",", ".")


# 1. Leer el CSV
gastos = []
with open(archivo, encoding="utf-8-sig") as f:
    lector = csv.DictReader(f)
    for fila in lector:
        gastos.append({
            "descripcion": fila["descripcion"],
            "monto": float(fila["monto"]),
            "categoria": fila["categoria"],
        })

if not gastos:
    print("El archivo no tiene gastos.")
    sys.exit()

# 2. Calcular
total = sum(g["monto"] for g in gastos)
promedio = total / len(gastos)
mayor = max(gastos, key=lambda g: g["monto"])

por_categoria = {}
for g in gastos:
    por_categoria[g["categoria"]] = por_categoria.get(g["categoria"], 0) + g["monto"]

# 3. Mostrar
print("RESUMEN DE GASTOS")
print("-" * 30)
print(f"Cantidad de gastos: {len(gastos)}")
print(f"Total gastado: {pesos(total)}")
print(f"Promedio por gasto: {pesos(promedio)}")
print(f"Gasto más grande: {mayor['descripcion']} ({pesos(mayor['monto'])})")
print()
print("Por categoría:")
for categoria, suma in sorted(por_categoria.items(), key=lambda par: par[1], reverse=True):
    print(f"  {categoria}: {pesos(suma)}")