import bcrypt from 'bcryptjs'
import { prisma } from '../prisma.js'

// GET all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        unit: true,
      },
    })

    res.status(200).json({
      message: 'Users retrieved successfully',
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        unitId: user.unitId,
        unit: user.unit,
      })),
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve users', error: error.message })
  }
}

// GET single user
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        unit: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        unitId: user.unitId,
        unit: user.unit,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user', error: error.message })
  }
}

// POST create user
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, unitId } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Check if unit exists (if provided)
    if (unitId) {
      const unitExists = await prisma.unit.findUnique({
        where: { id: unitId },
      })

      if (!unitExists) {
        return res.status(400).json({ message: 'Unit not found' })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        unitId: unitId || null,
      },
      include: {
        unit: true,
      },
    })

    res.status(201).json({
      message: 'User created successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        unitId: user.unitId,
        unit: user.unit,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user', error: error.message })
  }
}

// PUT update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, password, role, unitId } = req.body

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if new email already exists (and is different from current)
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' })
      }
    }

    // Check if unit exists (if provided)
    if (unitId && unitId !== user.unitId) {
      const unitExists = await prisma.unit.findUnique({
        where: { id: unitId },
      })

      if (!unitExists) {
        return res.status(400).json({ message: 'Unit not found' })
      }
    }

    // Build update data
    const updateData = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (password) updateData.password = await bcrypt.hash(password, 10)
    if (role) updateData.role = role
    if (unitId !== undefined) updateData.unitId = unitId || null

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        unit: true,
      },
    })

    res.status(200).json({
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        unitId: updatedUser.unitId,
        unit: updatedUser.unit,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error: error.message })
  }
}

// DELETE user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if user has requests
    const userRequests = await prisma.request.findMany({
      where: { userId: parseInt(id) },
    })

    if (userRequests.length > 0) {
      return res.status(400).json({
        message: `Cannot delete user. User has ${userRequests.length} request(s).`,
      })
    }

    // Check if user has logs
    const userLogs = await prisma.log.findMany({
      where: { userId: parseInt(id) },
    })

    if (userLogs.length > 0) {
      return res.status(400).json({
        message: `Cannot delete user. User has ${userLogs.length} log(s).`,
      })
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) },
    })

    res.status(200).json({
      message: 'User deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message })
  }
}
