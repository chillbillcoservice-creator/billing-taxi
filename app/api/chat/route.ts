import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor'); // message ID for pagination

    const messages = await prisma.chatMessage.findMany({
      take: limit,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      where: {
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            role: true,
            isPilotVerified: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Also fetch pinned messages separately for fast top announcement bar
    const pinnedMessages = await prisma.chatMessage.findMany({
      where: {
        isPinned: true,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    return NextResponse.json({
      messages,
      pinnedMessages,
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
    });
  } catch (err: any) {
    console.error('Error fetching chat messages:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to send messages' }, { status: 401 });
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your account is suspended from chat' }, { status: 403 });
    }

    if (user.mutedUntil && new Date(user.mutedUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.mutedUntil).getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `You have been muted by a safety marshal/moderator. Time remaining: ${minutesLeft} minute(s).` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content, mediaUrl, mediaType = 'NONE', replyToId } = body;

    if (!content?.trim() && !mediaUrl) {
      return NextResponse.json({ error: 'Message content or media is required' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: user.id,
        content: content?.trim() || '',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || 'NONE',
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            role: true,
            isPilotVerified: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Detect @mentions in message (e.g. @pilot_arun)
    if (content) {
      const mentions = content.match(/@([a-zA-Z0-9_]+)/g);
      if (mentions) {
        const uniqueUsernames: string[] = Array.from(
          new Set(mentions.map((m: string) => m.slice(1).toLowerCase()))
        );
        const mentionedUsers = await prisma.user.findMany({
          where: {
            username: { in: uniqueUsernames },
            id: { not: user.id },
          },
        });

        for (const targetUser of mentionedUsers) {
          await prisma.notification.create({
            data: {
              userId: targetUser.id,
              type: 'CHAT_MENTION',
              title: `Mentioned by ${user.name} 💬`,
              message: `"${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
              link: '/chat',
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    console.error('Error posting chat message:', err);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}
