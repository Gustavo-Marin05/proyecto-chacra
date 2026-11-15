"""Ficha de cultivos de Chacra Futura.

POR VALIDAR: valores generales, no ajustados a una zona. Un técnico local debe revisarlos.

Fuente de `agua_mm` (necesidad de agua de toda la campaña) y `ciclo_meses`:
FAO, Irrigation Water Management: Training Manual No. 3, "Irrigation Water Needs"
(Brouwer y Heibloem, 1986), cuadros de necesidad de agua estacional y de duración del cultivo.
Se usa el punto medio del rango publicado.

Excepciones y supuestos propios, sin fuente todavía:
  - Haba: el manual solo trae "frijol"; se usa ese rango de agua y un ciclo estimado de 5 meses.
  - Cebada: mismo rango que el trigo en la fuente; se asume un mes menos de ciclo.
  - `helada` y `forraje` son clasificaciones agronómicas generales.

Fuente del rastrojo (`residuo_t_ha`): IPCC, 2006 Guidelines for National Greenhouse Gas
Inventories, vol. 4, cap. 11, cuadro 11.2 y ecuación 11.7 (sin cambios en el Refinamiento de 2019):

    cosecha seca (kg/ha) = rendimiento fresco (kg/ha) × DRY
    rastrojo (t/ha de materia seca) = cosecha seca / 1000 × pendiente + intercepto

`ipcc` guarda (DRY, pendiente, intercepto) de la fila del cuadro que corresponde a cada cultivo:
Maize, Wheat, Barley, Potato y, para haba y arveja, "Beans & pulses" (no hay fila propia).
Solo cuenta el rastrojo sobre el suelo, no las raíces. El ajuste de la regresión es bueno en
cereales (R² 0,68 a 0,76) y flojo en leguminosas (0,28) y papa (0,18).

Fuente de `rendimiento_kg_ha`: FAOSTAT, Cultivos y productos de ganadería, Bolivia, elemento
"Yield", promedio 2020-2024 (archivo del 23-12-2025). Maíz, papa, trigo y cebada son cifras
oficiales; haba y arveja (grano seco) son estimaciones de la FAO. Es el promedio del país: no
cambia con el lugar, el riego ni el clima de la campaña.
"""

from idioma import tr

CULTIVOS = {
    "maiz": {
        "nombre": "Maíz", "familia": "gramíneas", "leguminosa": False,
        "agua_mm": (500, 800), "ciclo_meses": 5, "helada": "sensible",
        "forraje": True,
        "rendimiento_kg_ha": 2550, "ipcc": (0.87, 1.03, 0.61),
    },
    "papa": {
        "nombre": "Papa", "familia": "solanáceas", "leguminosa": False,
        "agua_mm": (500, 700), "ciclo_meses": 4, "helada": "sensible",
        "forraje": False,
        "rendimiento_kg_ha": 6469, "ipcc": (0.22, 0.10, 1.06),
    },
    "trigo": {
        "nombre": "Trigo", "familia": "gramíneas", "leguminosa": False,
        "agua_mm": (450, 650), "ciclo_meses": 5, "helada": "tolerante",
        "forraje": False,
        "rendimiento_kg_ha": 1470, "ipcc": (0.89, 1.51, 0.52),
    },
    "haba": {
        "nombre": "Haba", "familia": "leguminosas", "leguminosa": True,
        "agua_mm": (300, 500), "ciclo_meses": 5, "helada": "tolerante",
        "forraje": False,
        "rendimiento_kg_ha": 894, "ipcc": (0.91, 1.13, 0.85),
    },
    "cebada": {
        "nombre": "Cebada", "familia": "gramíneas", "leguminosa": False,
        "agua_mm": (450, 650), "ciclo_meses": 4, "helada": "tolerante",
        "forraje": True,
        "rendimiento_kg_ha": 882, "ipcc": (0.89, 0.98, 0.59),
    },
    "arveja": {
        "nombre": "Arveja", "familia": "leguminosas", "leguminosa": True,
        "agua_mm": (350, 500), "ciclo_meses": 3, "helada": "tolerante",
        "forraje": False,
        "rendimiento_kg_ha": 1434, "ipcc": (0.91, 1.13, 0.85),
    },
}

NOMBRES_EN = {"maiz": "Maize", "papa": "Potato", "trigo": "Wheat", "haba": "Faba bean", "cebada": "Barley", "arveja": "Pea"}
FAMILIAS_EN = {"gramíneas": "grasses", "solanáceas": "nightshades", "leguminosas": "legumes"}


def fuente():
    return tr("Ficha de cultivos: FAO, manual de riego n.º 3 (1986), valores generales por validar en la zona.",
              "Crop sheet: FAO irrigation manual no. 3 (1986), general values still to be validated locally.")


def fuente_residuo():
    return tr("Rastrojo: regresión del IPCC (2006, vol. 4, cuadro 11.2) con el rendimiento promedio de Bolivia (FAOSTAT, 2020-2024).",
              "Crop residue: IPCC regression (2006, vol. 4, table 11.2) with Bolivia's average yield (FAOSTAT, 2020-2024).")


def nombre(cultivo):
    return tr(CULTIVOS[cultivo]["nombre"], NOMBRES_EN[cultivo])


def familia(nombre_es):
    return tr(nombre_es, FAMILIAS_EN[nombre_es])


def necesidad(cultivo):
    bajo, alto = CULTIVOS[cultivo]["agua_mm"]
    return (bajo + alto) / 2


def residuo_t_ha(cultivo):
    """Rastrojo que queda sobre el suelo, en toneladas de materia seca por hectárea (IPCC 2006)."""
    ficha = CULTIVOS[cultivo]
    seca, pendiente, intercepto = ficha["ipcc"]
    return ficha["rendimiento_kg_ha"] * seca / 1000 * pendiente + intercepto
