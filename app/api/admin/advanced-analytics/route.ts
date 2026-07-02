import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return !!user?.isAdmin;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminUserId = Number(searchParams.get("adminUserId"));

    if (!adminUserId) {
      return NextResponse.json(
        { message: "adminUserIdが必要です" },
        { status: 400 }
      );
    }

    if (!(await checkAdmin(adminUserId))) {
      return NextResponse.json(
        { message: "管理者権限がありません" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      include: {
        nft: true,
        stampLogs: {
          include: { spot: true },
          orderBy: { visitedAt: "asc" },
        },
        messages: true,
        votes: true,
        createdProposals: true,
      },
    });

    const spots = await prisma.spot.findMany({
      include: {
        stampLogs: true,
      },
    });

    const chatRooms = await prisma.chatRoom.findMany({
      include: {
        messages: {
          where: { isDeleted: false },
          include: {
            user: true,
          },
        },
      },
    });

    const proposals = await prisma.proposal.findMany({
      include: {
        votes: true,
        creator: true,
      },
    });

    const votes = await prisma.vote.findMany({
      include: {
        user: {
          include: { nft: true },
        },
        proposal: true,
        option: true,
      },
    });

    const totalUsers = users.length;

    const totalStampLogs = users.reduce(
      (sum, user) => sum + user.stampLogs.length,
      0
    );

    const usersVisitedMultipleSpots = users.filter(
      (user) => user.stampLogs.length >= 2
    ).length;

    const firstVisitSpotMap = new Map<string, number>();

    users.forEach((user) => {
      const firstLog = user.stampLogs[0];
      if (!firstLog) return;

      const key = `${firstLog.spot.floor}：${firstLog.spot.spotName}`;
      firstVisitSpotMap.set(key, (firstVisitSpotMap.get(key) ?? 0) + 1);
    });

    const firstVisitSpots = Array.from(firstVisitSpotMap.entries()).map(
      ([spotName, count]) => ({
        spotName,
        count,
      })
    );

    const spotVisitRanking = spots
      .map((spot) => ({
        id: spot.id,
        spotName: spot.spotName,
        floor: spot.floor,
        visitCount: spot.stampLogs.length,
      }))
      .sort((a, b) => b.visitCount - a.visitCount);

    const allMessages = chatRooms.flatMap((room) => room.messages);
    const totalMessages = allMessages.length;

    const chatUserIds = new Set(allMessages.map((message) => message.userId));

    const roomMessageCounts = chatRooms.map((room) => ({
      roomId: room.id,
      roomName: room.roomName,
      messageCount: room.messages.length,
    }));

    const userMessageMap = new Map<
      number,
      { userId: number; name: string | null; email: string; messageCount: number }
    >();

    allMessages.forEach((message) => {
      const current = userMessageMap.get(message.userId);

      if (current) {
        current.messageCount += 1;
      } else {
        userMessageMap.set(message.userId, {
          userId: message.userId,
          name: message.user.name,
          email: message.user.email,
          messageCount: 1,
        });
      }
    });

    const userMessageRanking = Array.from(userMessageMap.values()).sort(
      (a, b) => b.messageCount - a.messageCount
    );

    const totalProposals = proposals.length;
    const pendingProposals = proposals.filter(
      (proposal) => proposal.status === "pending"
    ).length;
    const approvedProposals = proposals.filter(
      (proposal) => proposal.status === "approved"
    ).length;

    const totalVotes = votes.length;
    const votedUserIds = new Set(votes.map((vote) => vote.userId));

    const proposalCreatorUserIds = new Set(
      proposals
        .map((proposal) => proposal.creatorUserId)
        .filter((id): id is number => id !== null)
    );

    const levelDistribution = [0, 1, 2, 3, 4].map((level) => ({
      level,
      userCount: users.filter((user) => user.nft?.level === level).length,
    }));

    const levelActivity = [0, 1, 2, 3, 4].map((level) => {
      const levelUsers = users.filter((user) => user.nft?.level === level);
      const levelUserIds = new Set(levelUsers.map((user) => user.id));

      return {
        level,
        userCount: levelUsers.length,
        messageCount: allMessages.filter((message) =>
          levelUserIds.has(message.userId)
        ).length,
        voteCount: votes.filter((vote) => levelUserIds.has(vote.userId)).length,
        proposalCount: proposals.filter(
          (proposal) =>
            proposal.creatorUserId !== null &&
            levelUserIds.has(proposal.creatorUserId)
        ).length,
      };
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalStampLogs,
        usersVisitedMultipleSpots,
        multipleVisitRate:
          totalUsers === 0
            ? 0
            : Math.round((usersVisitedMultipleSpots / totalUsers) * 100),
      },
      circulation: {
        spotVisitRanking,
        firstVisitSpots,
      },
      communication: {
        totalMessages,
        chatUserCount: chatUserIds.size,
        roomMessageCounts,
        userMessageRanking,
      },
      dao: {
        totalProposals,
        pendingProposals,
        approvedProposals,
        totalVotes,
        votedUserCount: votedUserIds.size,
        proposalCreatorUserCount: proposalCreatorUserIds.size,
      },
      level: {
        levelDistribution,
        levelActivity,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "分析データ取得に失敗しました" },
      { status: 500 }
    );
  }
}