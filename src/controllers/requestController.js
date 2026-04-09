import { prisma } from '../prisma.js'

// POST /api/requests
export const createRequest = async (req, res) => {
  const { userId, itemId, quantity, reason } = req.body

  const request = await prisma.request.create({
    data: {
      userId,
      itemId,
      quantity,
      reason,
      status: 'pending'
    }
  })

  res.json(request)
}

// GET /api/requests/my
export const getMyRequests = async (req, res) => {
  const { userId } = req.query // nanti bisa dari auth

  const requests = await prisma.request.findMany({
    where: { userId: Number(userId) },
    include: { item: true }
  })

  res.json(requests)
}

// GET /api/requests/:id
export const getRequestById = async (req, res) => {
  const { id } = req.params

  const request = await prisma.request.findUnique({
    where: { id: Number(id) },
    include: { item: true, user: true }
  })

  res.json(request)
}

// PATCH /api/requests/:id/approve
export const approveRequest = async (req, res) => {
  const { id } = req.params

  const request = await prisma.request.update({
    where: { id: Number(id) },
    data: { status: 'approved' }
  })

  res.json(request)
}

// PATCH /api/requests/:id/reject
export const rejectRequest = async (req, res) => {
  const { id } = req.params

  const request = await prisma.request.update({
    where: { id: Number(id) },
    data: { status: 'rejected' }
  })

  res.json(request)
}