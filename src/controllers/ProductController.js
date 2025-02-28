const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProductController {
    async create(req, res) {
        try {
            const { name, price, description, stock } = req.body;

            const product = await prisma.product.create({
                data: {
                    name,
                    price: Number(price),
                    description,
                    stock: Number(stock) || 0
                }
            });

            return res.status(201).json(product);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async list(req, res) {
        try {
            const products = await prisma.product.findMany();
            return res.json(products);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, price, description, stock } = req.body;

            const product = await prisma.product.update({
                where: { id: Number(id) },
                data: {
                    name,
                    price: Number(price),
                    description,
                    stock: Number(stock)
                }
            });

            return res.json(product);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            await prisma.product.delete({
                where: { id: Number(id) }
            });

            return res.status(204).send();
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;

            const product = await prisma.product.findUnique({
                where: { id: Number(id) }
            });

            if (!product) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            return res.json(product);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new ProductController(); 