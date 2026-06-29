import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkAdmin(userId: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    return !!user?.isAdmin;
}

export async function PATCH(req: Request) {
    try {
        const { adminUserId, proposalId } = await req.json();

        if (!adminUserId || !proposalId) {
            return NextResponse.json(
                { message: "adminUserIdとproposalIdが必要です" },
                { status: 400 }
            );
        }

        if (!(await checkAdmin(Number(adminUserId)))) {
            return NextResponse.json(
                { message: "管理者権限がありません" },
                { status: 403 }
            );
        }

        const proposal = await prisma.proposal.findUnique({
            where: {
                id: Number(proposalId),
            },
            include: {
                chatRoom: true,
            },
        });

        if (!proposal) {
            return NextResponse.json(
                { message: "Proposalが見つかりません" },
                { status: 404 }
            );
        }

        if (proposal.status === "approved") {
            return NextResponse.json(
                { message: "このProposalはすでに承認済みです" },
                { status: 400 }
            );
        }

        let chatRoomId = proposal.chatRoomId;

        if (!chatRoomId) {
            const chatRoom = await prisma.chatRoom.create({
                data: {
                    roomName: `${proposal.title}議論ルーム`,
                    description: `Proposal「${proposal.title}」について話し合うためのチャットルームです。`,
                },
            });

            chatRoomId = chatRoom.id;
        }

        const updatedProposal = await prisma.proposal.update({
            where: {
                id: proposal.id,
            },
            data: {
                status: "approved",
                chatRoomId,
            },
            include:{

                chatRoom: true,
                options: true,
            },
        });

        return NextResponse.json({
            message: "Proposalを承認しました",
            proposal: updatedProposal,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Proposal承認に失敗しました" },
            { status: 500 }
        );
    }
}