import { prisma } from "../prisma.js";

export const repairItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, status } = req.body;

    const item = await prisma.item.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({ message: "Item tidak ditemukan" });
    }

    const repair = await prisma.repair.create({
      data: {
        itemId: Number(id),
        description,
        status: status || "proses",
      },
    });

    await prisma.item.update({
      where: { id: Number(id) },
      data: {
        condition: "diperbaiki",
      },
    });

    res.status(200).json({
      message: "Item berhasil diperbaiki",
      repair,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};