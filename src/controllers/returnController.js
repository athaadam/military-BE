import { prisma } from '../prisma.js'

// POST create return
export const createReturn = async (req, res) => {
  try {
    const { requestId, conditionAfter } = req.body

    // Validate input
    if (!requestId || !conditionAfter) {
      return res.status(400).json({ message: 'requestId and conditionAfter are required' })
    }

    // Check if request exists
    const request = await prisma.request.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        item: true,
        user: true,
      },
    })

    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    // Create return
    const returnRecord = await prisma.return.create({
      data: {
        requestId: parseInt(requestId),
        conditionAfter,
      },
      include: {
        request: {
          include: {
            item: true,
            user: true,
          },
        },
      },
    })

    res.status(201).json({
      message: 'Return created successfully',
      data: {
        id: returnRecord.id,
        requestId: returnRecord.requestId,
        conditionAfter: returnRecord.conditionAfter,
        request: returnRecord.request,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to create return', error: error.message })
  }
}

// GET all returns
export const getAllReturns = async (req, res) => {
  try {
    const returns = await prisma.return.findMany({
      include: {
        request: {
          include: {
            item: true,
            user: true,
          },
        },
      },
    })

    res.status(200).json({
      message: 'Returns retrieved successfully',
      data: returns,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve returns', error: error.message })
  }
}

// GET single return
export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params

    const returnRecord = await prisma.return.findUnique({
      where: { id: parseInt(id) },
      include: {
        request: {
          include: {
            item: true,
            user: true,
          },
        },
      },
    })

    if (!returnRecord) {
      return res.status(404).json({ message: 'Return not found' })
    }

    res.status(200).json({
      message: 'Return retrieved successfully',
      data: returnRecord,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve return', error: error.message })
  }
}
