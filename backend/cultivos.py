"""Ficha de cultivos de Chacra Futura.

POR VALIDAR: valores generales, no ajustados a una zona. Un técnico local debe revisarlos.

Fuente de `agua_mm` (necesidad de agua de toda la campaña) y `ciclo_meses`:
FAO, Irrigation Water Management: Training Manual No. 3, "Irrigation Water Needs"
(Brouwer y Heibloem, 1986), cuadros de necesidad de agua estacional y de duración del cultivo.
Se usa el punto medio del rango publicado.

Excepciones y supuestos propios, sin fuente todavía:
  - Haba: el manual solo trae "frijol"; se usa ese rango de agua y un ciclo estimado de 5 meses.
  - Cebada: mismo rango que el trigo en la fuente; se asume un mes menos de ciclo.
  - `helada`, `forraje` y `residuo` son clasificaciones agronómicas generales.
"""

CULTIVOS = {
    "maiz": {
        "nombre": "Maíz", "familia": "gramíneas", "leguminosa": False,
        "agua_mm": (500, 800), "ciclo_meses": 5, "helada": "sensible",
        "forraje": True, "residuo": "alto",
    },
    "papa": {
        "nombre": "Papa", "familia": "solanáceas", "leguminosa": False,
        "agua_mm": (500, 700), "ciclo_meses": 4, "helada": "sensible",
        "forraje": False, "residuo": "bajo",
    },
    "trigo": {
        "nombre": "Trigo", "familia": "gramíneas", "leguminosa": False,
        "agua_mm": (450, 650), "ciclo_meses": 5, "helada": "tolerante",
        "forraje": False, "residuo": "alto",
    },
    "haba": {
        "nombre": "Haba", "familia": "leguminosas", "leguminosa": True,
        "agua_mm": (300, 500), "ciclo_meses": 5, "helada": "tolerante",
        "forraje": False, "residuo": "medio",
    },
    "cebada": {
        "nombre": "Cebada", "familia": "gramíneas", "leguminosa": False,
        "agua_mm": (450, 650), "ciclo_meses": 4, "helada": "tolerante",
        "forraje": True, "residuo": "alto",
    },
    "arveja": {
        "nombre": "Arveja", "familia": "leguminosas", "leguminosa": True,
        "agua_mm": (350, 500), "ciclo_meses": 3, "helada": "tolerante",
        "forraje": False, "residuo": "medio",
    },
}

FUENTE = "Ficha de cultivos: FAO, manual de riego n.º 3 (1986), valores generales por validar en la zona."


def necesidad(cultivo):
    bajo, alto = CULTIVOS[cultivo]["agua_mm"]
    return (bajo + alto) / 2
