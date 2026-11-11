# 🇨🇴 Validador Normativo de Movilidad Eléctrica en Colombia (Ley 2486 de 2025 vs. Resolución 160 de 2017)

Aplicación web estática (Single Page Application), rápida y 100% responsiva (Mobile-First), diseñada para evaluar en tiempo real la clasificación legal de patinetas eléctricas, bicicletas de pedaleo asistido, monociclos y ciclomotores en Colombia.

## 📋 Reglas de Negocio Implementadas

| Criterio | Categoría VELMPU (Ley 2486 de 2025) | Categoría Ciclomotor / Moto Eléctrica (Res. 160 de 2017) |
| :--- | :--- | :--- |
| **Condición Técnica** | `potencia <= 1000 W` (Art. 2) **Y** `peso <= 60 kg` **Y** `velocidad <= 40 km/h` **Y** `tipo !== 'moped'` | Supera cualquiera de los límites anteriores o es tipo `moped` |
| **SOAT, Placa/RUNT, Licencia y RTM** | **Exento** (Art. 15) | **Exento** si `peso <= 60 kg` **O** `velocidad <= 40 km/h` (Art. 15). **Obligatorio** solo si pesa > 60 kg **y** supera 40 km/h |
| **Pasajeros** | Solo el conductor (Art. 96-1 num. 2), salvo vehículo diseñado para ello según MinTransporte | Máx. 1 acompañante |
| **Edad < 12 años** | Prohibido en infraestructura pública (Inmovilización) | Prohibido (Inmovilización) |
| **Edad 12 a 15 años** | Exclusivamente en **ciclorrutas** (Prohibido calzada) | Prohibido (Edad mínima licencia A1: 16 años) |
| **Edad >= 16 años** | Habilitado en ciclorrutas (≤ 25 km/h) y carril derecho urbano (≤ 40 km/h) | Habilitado en vías vehiculares (con licencia A1/A2 si no está exento) |
| **Carreteras Nacionales** | Prohibido, **excepto** bicicletas eléctricas (`ebike`) o tramos con ciclorruta | Permitido (con documentación si no está exento) |
| **Sanciones** | Literal G completo (G.1 a G.14), 6 SMLDV; inmovilización por casco, embriaguez y edad | Código Nacional de Tránsito (multas por documentos solo si no está exento) |
| **Alerta Bogotá D.C.** | Aviso preventivo (regulación distrital, no Ley 2486) para vehículos `> 350 W` o sin pedaleo asistido en ciclorrutas | Prohibido circular en ciclorrutas |

> La Ley 2486 solo fija expresamente la potencia nominal de los VELMPU (≤ 1000 W) y delega el resto de especificaciones técnicas, cascos y prendas en el Ministerio de Transporte (Art. 7). Los topes de 60 kg y 40 km/h se usan como criterio conservador de clasificación, tomados del Art. 15.

## 📁 Estructura del Proyecto

```text
ev_legal_checker_co/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD automático hacia GitHub Pages (ejecuta tests + build)
├── scripts/
│   └── build.js                # Empaquetador estático hacia ./dist
├── src/
│   ├── components/
│   │   ├── icons.js            # Iconografía vectorial SVG
│   │   ├── VehicleForm.js      # Formulario reactivo con sliders y marcadores legales
│   │   └── ResultsDashboard.js # Panel de resultados en tiempo real tipo semáforo
│   ├── app.js                  # Controlador SPA, sincronización de URL y modo claro/oscuro
│   ├── rulesEngine.js          # Motor de reglas de negocio puro (desacoplado del DOM)
│   └── rulesEngine.test.js     # Suite de pruebas unitarias de casos borde
├── styles/
│   └── main.css                # Estilos personalizados de sliders y accesibilidad
├── index.html                  # Entrada principal Mobile-First con Tailwind CSS
└── package.json                # Scripts de test, build y despliegue en GitHub Pages
```

## 🧪 Ejecución de Pruebas y Build

```bash
# Ejecutar pruebas unitarias del motor de reglas
npm test

# Generar carpeta ./dist lista para GitHub Pages
npm run build
```
