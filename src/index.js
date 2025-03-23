const express = require("express");
const cors = require("cors");
const morgan = require('morgan');
const errorHandler = require("./middlewares/errorHandler");
const {
    productRoutes, salesRoutes, customersRoutes,
    usersRoutes, stockRoutes, categoryRoutes,
    suppliersRoutes, receptionsRoutes, dashboardRoutes
} = require('./routes/index');

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['POST', 'GET', 'PUT']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(errorHandler);
// Usar rutas
const api = 'api';
app.use(`/${api}/products`, productRoutes);
app.use(`/${api}/users`, usersRoutes);
app.use(`/${api}/categories`, categoryRoutes);
app.use(`/${api}/suppliers`, suppliersRoutes);
app.use(`/${api}/receptions`, receptionsRoutes);
app.use(`/${api}/customers`, customersRoutes);
app.use(`/${api}/sales`, salesRoutes);
app.use(`/${api}/stock`, stockRoutes);
app.use(`/${api}/dashboard`, dashboardRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
