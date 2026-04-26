import {prisma} from "../prisma.js"

export const getWarehouses = async (req,res) => {
    try{
        const warehouses = await prisma.warehouse.findMany({
            include: {
                unit: true,
                items: true,
            }
        })

        res.status(200).json(warehouses)
    }catch(err){
        res.status(500).json({error: err.message})
    }
}

export const createWarehouse = async (req,res) => {
    try{
        const {name,unitId} = req.body;

        const warehouse = await prisma.warehouse.create({
            data:{
                name,
                unitId,
            }
        })

        res.status(200).json(warehouse)
    }catch(err){
        res.status(500).json({err: err.message})
    }
}

export const updateWarehouse = async (req,res) => {
    try{
        const {id} = req.params;
        const {name, unitId} = req.body;

        const warehouse = await prisma.warehouse.update({
            where: {id: Number(id)},
            data:{
                name,
                unitId,
            }
        })

        res.status(200).json(warehouse)
    }catch(err){
        res.status(500).json({error: err.message})
    }
}

export const deleteWarehouse = async (req,res) => {
    try{
        const {id} = req.params

        await prisma.warehouse.delete({
            where: {id: Number(id)},
        })

        res.status(200).json({message: "warehouse deleted!"})
    }catch(err){
        res.status(500).json({error: err.message})
    }
}