# Historias de datos

Dashboard en Angular para explorar los registros de personas desaparecidas en
México entre 2011 y 2020.

## Ejecutar

```bash
npm install
npm start
```

Después abre `http://localhost:4200/`.

La visualización usa el libro `Base de datos -Personas-desaparecidas-2011-2020.xlsx`.
El activo web generado a partir de la primera hoja se encuentra en
`public/data/dashboard-data.json`. Incluye filtros por año, entidad y condición,
tarjetas de indicadores, tendencia anual y distribuciones por edad y sexo.

## Ejecutar con Docker

```bash
docker compose up --build
```

Después abre `http://localhost:8080/`.
