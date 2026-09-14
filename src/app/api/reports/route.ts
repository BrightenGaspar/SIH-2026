import { NextRequest, NextResponse } from 'next/server';
import { CreateReportPayload, ReportEntity } from '@/types/review';

const reportsStore: ReportEntity[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const myReports = reportsStore.filter((r) => r.reporterUserId === userId);

    return NextResponse.json({
      reports: myReports,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateReportPayload = await request.json();

    if (!body.reporterUserId || !body.reportType || !body.reason) {
      return NextResponse.json({ error: 'Missing required report fields (reporter, type, reason).' }, { status: 400 });
    }

    // Anti-Self Report Guard
    if (body.reportedUserId && body.reporterUserId === body.reportedUserId) {
      return NextResponse.json({ error: 'You cannot report yourself.' }, { status: 403 });
    }

    const newReport: ReportEntity = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      reporterUserId: body.reporterUserId,
      reporterRole: body.reporterRole,
      reporterDisplayName: body.reporterDisplayName,
      reportedUserId: body.reportedUserId,
      reportedRole: body.reportedRole,
      reportType: body.reportType,
      reason: body.reason,
      description: body.description?.trim(),
      transactionId: body.transactionId,
      productId: body.productId,
      orderItemId: body.orderItemId,
      reviewId: body.reviewId,
      status: 'UNDER_REVIEW', // Initial security status
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    reportsStore.unshift(newReport);

    return NextResponse.json({
      success: true,
      reportId: newReport.id,
      status: newReport.status,
      message: 'Your report has been submitted and will be reviewed by the safety and compliance team.',
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit report' }, { status: 500 });
  }
}
