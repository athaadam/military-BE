import { prisma } from '../prisma.js'

// GET /api/items
export const getAllItems = async (req, res) => {
  const items = await prisma.item.findMany({
    include: { warehouse: true }
  })
  res.json(items)
}

// GET /api/items/:id
export const getItemById = async (req, res) => {
  const { id } = req.params

  const item = await prisma.item.findUnique({
    where: { id: Number(id) }
  })

  if (!item) return res.status(404).json({ message: 'Item not found' })

  res.json(item)
}

// POST /api/items
export const createItem = async (req, res) => {
  const { name, category, stock, condition, warehouseId } = req.body

  const item = await prisma.item.create({
    data: { name, category, stock, condition, warehouseId }
  })

  res.json(item)
}

// PUT /api/items/:id
export const updateItem = async (req, res) => {
  const { id } = req.params

  const item = await prisma.item.update({
    where: { id: Number(id) },
    data: req.body
  })

  res.json(item)
}

// DELETE /api/items/:id
export const deleteItem = async (req, res) => {
  const { id } = req.params

  await prisma.item.delete({
    where: { id: Number(id) }
  })

  res.json({ message: 'Item deleted' })
}

// PATCH /api/items/:id/status
export const updateItemStatus = async (req, res) => {
  const { id } = req.params
  const { condition } = req.body

  const item = await prisma.item.update({
    where: { id: Number(id) },
    data: { condition }
  })

  res.json(item)
}