import express from 'express'

import {
    getAllUnits,
    createUnit,
    updateUnit,
    deleteUnit
} from "../controllers/unitController.js"

const router = express.Router()

router.get("/",getAllUnits)
router.post("/",createUnit)
router.put("/:id",updateUnit)
router.delete("/:id",deleteUnit)

export default router