import { Router, Request, Response } from "express";
import prisma from "../db/client";
import tokenVerify from "../middleware/auth";

const router = Router();

router.get("/:questionId", async (req: Request, res: Response) => {
    const { questionId } = req.params;
    try {
        const comments = await prisma.comment.findMany({
            where: {
                questionId: questionId
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        rating: true,
                        createdAt: true
                    }
                }
            } 
        })
        const commentCount = await prisma.comment.count({
            where: {
                questionId: questionId
            }
        })
        return res.status(200).json({ comments, commentCount });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
    
});

router.post("/:questionId", tokenVerify, async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const { content } = req.body;
    const userId = (req as any).userId;

    if (!content) {
        return res.status(400).json({ message: "Content is required" });
    }

    try {
        const comment = await prisma.comment.create({
            data: {
                content: content,
                questionId: questionId,
                userId: userId
            }
        })
        return res.status(201).json({ comment });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
    
});

router.put("/:commentId", tokenVerify, async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = (req as any).userId;

    if (!content) {
        return res.status(400).json({ message: "Content is required" });
    }

    try {
        const existingComment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!existingComment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (existingComment.userId !== userId) {
            return res.status(403).json({ message: "Not authorized to update this comment" });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content }
        });

        return res.status(200).json({ comment: updatedComment });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
