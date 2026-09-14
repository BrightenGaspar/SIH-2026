import { apiClient } from '@/lib/apiClient';
import { CreateReportPayload, ReportEntity } from '@/types/review';

export const reportService = {
  /**
   * Submit an incident or violation report
   */
  async submitReport(payload: CreateReportPayload): Promise<{ success: boolean; reportId?: string; status?: string; message?: string; error?: string }> {
    try {
      const res = await apiClient<{ success: boolean; reportId: string; status: string; message: string }>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to submit report. Please try again.',
      };
    }
  },

  /**
   * Fetch submitted reports by the current user
   */
  async getMyReports(userId: string): Promise<ReportEntity[]> {
    try {
      const res = await apiClient<{ reports: ReportEntity[] }>('/api/reports', {
        method: 'GET',
        params: { userId },
      });
      return res.reports || [];
    } catch {
      return [];
    }
  },
};
