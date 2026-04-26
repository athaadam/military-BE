import {prisma} from "../prisma.js"

export const getAllUnits = async (req,res) => {
    try{
        const units = prisma.units.findMany({
            include: {
                users: true,
                warehouses: true
            }
        })

        res.json(units)
    }catch(error){
        res.status(500).json({error:error.message})
    }
}


export const createUnit = async (req,res) => {
    try{
        const {name} = req.body

        const unit = prisma.await.create({
            data: {name},
        })

        res.status(200).json(unit)
    }catch(error){
        res.status(500).json({error: error.message})
    }
}

export const updateUnit = async (req,res) => {
    try{
        const {id} = req.params;
        const {name} = req.body;

        const unit = await prisma.unit.update({
            where: {id:parseInt(id)},
            data:{name}
        })

        res.status(200).json(unit)
    }catch(error) {
        res.status(500).json({error:error.message})
    }
}


export const deleteUnit = async (req,res) => {
   try{
    const {id} = req.params;

    await prisma.unit.delete({
        where: {id: parseInt(id)}
    })

    res.status(200).json({message: "unit deleted"})
   }catch(err){
    res.status(500).json({error: err.message})
   }
   
}