import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building, 
  Award, 
  FileText, 
  Lock, 
  ArrowUpRight, 
  CreditCard,
  PieChart,
  AlertTriangle,
  Receipt,
  Layers,
  Sparkles
} from 'lucide-react';
import { NavTab } from '../../components/Sidebar';

interface CFODashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const CFODashboardView: React.FC<CFODashboardViewProps> = ({ onNavigate }) => {
  const { user, canViewFinancials } = useAuth();
  const { financials, resolveApproval } = usePortalData();

  if (!canViewFinancials) {
    return (
      <div className="restricted-screen">
        <div className="restricted-card bento-card" style={{ maxWidth: 520, textAlign: 'center', padding: '40px 32px' }}>
          <div className="neu-inset-box" style={{ width: 68, height: 68, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--danger)' }}>
            <Lock size={32} />
          </div>
          <div className="neo-sub-roman" style={{ color: 'var(--danger)' }}>RESTRICTED FINANCIAL CLEARANCE REQUIRED</div>
          <h2 className="neo-serif-title" style={{ fontSize: 24, margin: '8px 0 14px' }}>
            Treasury Access Prohibited
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            You are authenticated as <strong>{user?.full_name} ({user?.role.toUpperCase()})</strong>.
            Financial metrics, treasury balances, investor cap tables, and burn rates are restricted to CFO, CEO, and authorized trustees.
          </p>
          <button className="neu-pill-btn primary" style={{ margin: '0 auto' }} onClick={() => onNavigate('dashboard')}>
            Return to Authorized View
          </button>
        </div>
      </div>
    );
  }

  // Format currency in Indian Rupees format
  const formatINR = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const pendingApprovals = financials.approvals.filter(a => a.status === 'pending');

  return (
    <div className="view-container">
      {/* Neo-Classical Top Header with Roman Inscription */}
      <div className="view-header-row" style={{ alignItems: 'center' }}>
        <div>
          <div className="neo-sub-roman">FISCUS ET THESAURUS • TREASURY & CAPITAL GOVERNANCE</div>
          <h2 className="neo-serif-title" style={{ fontSize: 28, marginTop: 4 }}>
            Treasury & Financial Deck
          </h2>
          <p className="view-subtitle">
            Chief Financial Officer • David Sterling • Capital allocation, burn rate control, investor relations & disbursements.
          </p>
        </div>

        <div className="view-actions-row">
          <button className="neu-pill-btn" onClick={() => onNavigate('files')}>
            <FileText size={14} style={{ color: 'var(--neo-gold)' }} />
            <span>Audit Reports</span>
          </button>
          <button className="neu-pill-btn primary" onClick={() => onNavigate('executive_room')}>
            <Lock size={14} />
            <span>Executive Chamber</span>
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* Bento Box 1: Treasury Balance & Runway (Span 8) */}
        <div className="bento-card bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="badge-gold">
              <Lock size={12} /> Confidential Financial Governance
            </span>
            <span className="badge-live-os">
              <span className="pulsing-green-dot" /> Escrow Reconciled
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Total Liquid Treasury Balance
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
                {formatINR(financials.cash_balance)}
              </div>
              <div style={{ fontSize: 12.5, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <CheckCircle2 size={13} /> HDFC Institutional Escrow & Current Accounts
              </div>
            </div>

            {/* Neumorphic Runway Gauge */}
            <div className="neu-inset-box" style={{ padding: '14px 20px', minWidth: 220, textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--neo-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Fiscal Runway
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-serif)' }}>
                {financials.runway_months} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>months</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Burn @ {formatINR(financials.monthly_burn)}/mo
              </div>
            </div>
          </div>

          {/* 4 Mini Neumorphic Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Revenue</span>
                <TrendingUp size={13} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{formatINR(financials.monthly_revenue)}</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>+18.4% contracts</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expenses</span>
                <TrendingDown size={13} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{formatINR(financials.monthly_expenses)}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>Cloud GPUs & R&D</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Net Burn</span>
                <TrendingDown size={13} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{formatINR(financials.monthly_burn)}</div>
              <div style={{ fontSize: 10.5, color: '#10b981', marginTop: 3 }}>-4.2% optimized</div>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Capital Raised</span>
                <Building size={13} style={{ color: '#c084fc' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{formatINR(financials.total_funding)}</div>
              <div style={{ fontSize: 10.5, color: '#c084fc', marginTop: 3 }}>Seed + MeitY</div>
            </div>
          </div>
        </div>

        {/* Bento Box 2: Cap Table & Capital Structure (Span 4) */}
        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">I • CAP TABLE STRUCTURE</span>
            <Building size={16} style={{ color: '#c084fc' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {financials.investors.map((inv) => (
              <div key={inv.id} className="neu-inset-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{inv.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.type} • {inv.stage}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--neo-gold)', fontFamily: 'var(--font-serif)' }}>
                    {formatINR(inv.commitment)}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Commitment</div>
                </div>
              </div>
            ))}
          </div>

          {/* Government Grants Card */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Deeptech Grants
              </span>
              <Award size={14} style={{ color: '#38bdf8' }} />
            </div>
            {financials.grants.map((grt) => (
              <div key={grt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{grt.name} ({grt.agency})</span>
                <strong style={{ color: '#38bdf8' }}>{formatINR(grt.amount)}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 3: Disbursement & Expense Approvals (Span 7) */}
        <div className="bento-card bento-col-7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} style={{ color: 'var(--neo-gold)' }} />
              <span className="neo-sub-roman">II • DISBURSEMENT APPROVALS</span>
            </div>
            <span className="badge-gold">
              {pendingApprovals.length} Action Needed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {financials.approvals.map((approval) => (
              <div 
                key={approval.id} 
                className="neu-inset-box" 
                style={{ 
                  padding: '14px 16px',
                  borderLeft: approval.status === 'pending' ? '3px solid var(--neo-gold)' : approval.status === 'approved' ? '3px solid #10b981' : '3px solid #ef4444'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{approval.title}</h4>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Requested by <strong style={{ color: 'var(--text-main)' }}>{approval.requested_by}</strong> • {approval.department}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--neo-gold)', fontFamily: 'var(--font-serif)' }}>
                    {formatINR(approval.amount)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date: {approval.date}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {approval.status === 'pending' ? (
                      <>
                        <button 
                          className="btn-tiny-success"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }}
                          onClick={() => resolveApproval(approval.id, 'approved')}
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button 
                          className="btn-tiny-danger"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11.5, borderRadius: 6, cursor: 'pointer' }}
                          onClick={() => resolveApproval(approval.id, 'rejected')}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    ) : (
                      <span className={`status-pill status-${approval.status}`} style={{ fontSize: 10.5, padding: '2px 8px' }}>
                        {approval.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 4: Financial Governance & Invoices Radar (Span 5) */}
        <div className="bento-card bento-col-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="neo-sub-roman">III • AUDIT & INVOICES RADAR</span>
            <Receipt size={16} style={{ color: '#38bdf8' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>Pending Accounts Payable</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                  {formatINR(financials.pending_payments_total)}
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                3 vendor invoices pending clearance: Shenzhen optical lens samples, AWS Bedrock GPU instance batch, and UI animation production.
              </p>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>Tax & Statutory Filing</span>
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>COMPLIANT</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                Q3 GST filings reconciled with zero notice flags. Form 16 and TDS certificates generated on schedule.
              </p>
            </div>

            <div className="neu-inset-box" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>Treasury Escrow Yield</span>
                <span style={{ fontSize: 11, color: 'var(--neo-gold)', fontWeight: 600 }}>6.85% APY</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                Surplus capital deployed in overnight liquid treasury funds generates monthly interest yield offsetting administrative overhead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
