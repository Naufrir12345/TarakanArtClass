import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private prisma: PrismaService) { }

    @Get('summary')
    async getSummary() {
        const income = await this.prisma.income.aggregate({ _sum: { amount: true } });
        const expense = await this.prisma.expense.aggregate({ _sum: { amount: true } });
        return { 
            totalIncome: Number(income._sum.amount ?? 0), 
            totalExpense: Number(expense._sum.amount ?? 0) 
        };
    }

    @Get('transactions')
    async getTransactions() {
        const incomes = await this.prisma.income.findMany({
            orderBy: { date: 'desc' }
        });
        const expenses = await this.prisma.expense.findMany({
            orderBy: { date: 'desc' }
        });

        // Merge and tag them
        const transactions = [
            ...incomes.map(item => ({
                id: item.id,
                type: 'income',
                amount: Number(item.amount),
                category: item.category,
                note: item.note,
                date: item.date,
            })),
            ...expenses.map(item => ({
                id: item.id,
                type: 'expense',
                amount: Number(item.amount),
                category: item.category,
                note: item.note,
                date: item.date,
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return transactions;
    }

    @Post('income')
    async addIncome(@Body() body: { amount: number; category: string; note?: string; date?: string }) {
        return this.prisma.income.create({
            data: {
                amount: body.amount,
                category: body.category,
                note: body.note,
                date: body.date ? new Date(body.date) : new Date(),
            }
        });
    }

    @Post('expense')
    async addExpense(@Body() body: { amount: number; category: string; note?: string; date?: string }) {
        return this.prisma.expense.create({
            data: {
                amount: body.amount,
                category: body.category,
                note: body.note,
                date: body.date ? new Date(body.date) : new Date(),
            }
        });
    }
}