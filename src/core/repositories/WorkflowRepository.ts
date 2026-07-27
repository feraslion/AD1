import { db } from '../database/index.ts';
import { auditLogs } from '../database/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';

export interface WorkflowRule {
  id: string;
  name: string;
  entityType: 'purchase_request' | 'expense_request' | 'discount' | 'journal_entry';
  minAmount: number;
  approverRole: string;
  autoApproveBelow?: boolean;
}

export interface ApprovalRequest {
  id: string;
  ruleId: string;
  entityType: string;
  entityId: string;
  requesterName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  approverNotes?: string;
  createdAt: string;
}

// In-memory / persistent workflow store
const defaultRules: WorkflowRule[] = [
  { id: 'rule-pr-1000', name: 'موافقة طلبات الشراء > 1000 ريال', entityType: 'purchase_request', minAmount: 1000, approverRole: 'manager' },
  { id: 'rule-exp-500', name: 'موافقة المصروفات > 500 ريال', entityType: 'expense_request', minAmount: 500, approverRole: 'finance_manager' },
  { id: 'rule-disc-20', name: 'موافقة الخصومات > 20%', entityType: 'discount', minAmount: 20, approverRole: 'store_manager' },
];

let approvalQueue: ApprovalRequest[] = [];

export class WorkflowRepository {
  static getRules(): WorkflowRule[] {
    return defaultRules;
  }

  static addRule(rule: Omit<WorkflowRule, 'id'>): WorkflowRule {
    const newRule = { ...rule, id: `rule_${Date.now()}` };
    defaultRules.push(newRule);
    return newRule;
  }

  static async submitForApproval(data: {
    entityType: 'purchase_request' | 'expense_request' | 'discount' | 'journal_entry';
    entityId: string;
    requesterName: string;
    amount: number;
  }): Promise<{ required: boolean; approvalRequest?: ApprovalRequest; autoApproved?: boolean }> {
    const applicableRule = defaultRules.find(r => r.entityType === data.entityType && data.amount >= r.minAmount);
    
    if (!applicableRule) {
      return { required: false, autoApproved: true };
    }

    const appReq: ApprovalRequest = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ruleId: applicableRule.id,
      entityType: data.entityType,
      entityId: data.entityId,
      requesterName: data.requesterName,
      amount: data.amount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    approvalQueue.push(appReq);
    return { required: true, approvalRequest: appReq, autoApproved: false };
  }

  static async approveRequest(id: string, approverName: string, notes?: string): Promise<ApprovalRequest> {
    const req = approvalQueue.find(r => r.id === id);
    if (!req) throw new Error('طلب الموافقة غير موجود');
    
    req.status = 'approved';
    req.approverNotes = `${approverName}: ${notes || 'تمت الموافقة'}`;
    return req;
  }

  static async rejectRequest(id: string, approverName: string, notes?: string): Promise<ApprovalRequest> {
    const req = approvalQueue.find(r => r.id === id);
    if (!req) throw new Error('طلب الموافقة غير موجود');

    req.status = 'rejected';
    req.approverNotes = `${approverName}: ${notes || 'تم الرفض'}`;
    return req;
  }

  static getPendingApprovals(): ApprovalRequest[] {
    return approvalQueue.filter(r => r.status === 'pending');
  }

  static getAllApprovals(): ApprovalRequest[] {
    return approvalQueue;
  }
}
