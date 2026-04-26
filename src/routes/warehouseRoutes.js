import express from 'express'

import {
    getWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
} from "../controllers/warehouseController.js"

const router = express.Router()

router.get("/",getWarehouses)
router.post("/",createWarehouse)
router.post("/:id",updateWarehouse)
router.post("/:id",deleteWarehouse)

export default router