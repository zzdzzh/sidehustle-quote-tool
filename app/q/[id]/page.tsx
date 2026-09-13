'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Milestone {
  name: string;
  amount: number;
}

interface Quote {
  id: string;
  quote_no: string;
  client_name: string;
  client_contact_masked: string;
  scope: string;
  milestones: string;
  total_amount: number;
  deposit_amount: number;
  deposit_percentage: number;
  exclusions: string;
  validity_days: number;
  status: 'pending' | 'confirmed';
  confirmed_at: string | null;
  created_at: string;
}

export default function QuotePage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/quotes/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('未找到报价单');
        return res.json();
      })
      .then(data => {
        setQuote(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleConfirm = async () => {
    if (!id || confirming) return;
    
    setConfirming(true);
    
    try {
      const response = await fetch(`/api/quotes/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setQuote(prev => prev ? { ...prev, status: 'confirmed' } : null);
      } else {
        alert(data.error || '确认失败，请稍后再试');
      }
    } catch (err) {
      alert('网络错误，请稍后再试');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-message">加载中...</div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h1 className="error-title">未找到报价单</h1>
          <p className="error-message">{error || '报价单不存在或已过期'}</p>
        </div>
      </div>
    );
  }

  const milestones: Milestone[] = JSON.parse(quote.milestones);
  const expiryDate = new Date(quote.created_at);
  expiryDate.setDate(expiryDate.getDate() + quote.validity_days);

  return (
    <div className="container">
      <div className="quote-card">
        <div className="header">
          <div className="header-left">
            <span className="icon">📋</span>
            <h1 className="quote-no">报价单 {quote.quote_no}</h1>
          </div>
          <span className={`badge ${quote.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}`}>
            {quote.status === 'confirmed' ? '已确认' : '待确认'}
          </span>
        </div>

        <div className="section">
          <div className="section-title">项目</div>
          <div className="section-content">{quote.scope}</div>
        </div>

        <div className="section">
          <div className="section-title">基于现有品牌视觉与业务需求，完成官网 UI/UX 重构、前端开发与功能集成。</div>
        </div>

        <div className="section">
          <div className="section-title">里程碑</div>
          <div className="milestones">
            {milestones.map((milestone, index) => (
              <div key={index} className="milestone-item">
                <span className="milestone-name">{milestone.name}</span>
                <span className="milestone-amount">¥ {milestone.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="price-section">
          <div className="price-label">报价金额</div>
          <div className="price">¥ {quote.total_amount.toLocaleString()}</div>
          <div className="deposit-info">
            <span className="deposit-badge">定金建议 ≥{quote.deposit_percentage}%</span>
            <span className="deposit-text">建议定金 ¥{quote.deposit_amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="section">
          <div className="section-title">不包含项</div>
          <div className="exclusions">
            <div className="section-content">{quote.exclusions}</div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">报价有效期</div>
          <div className="section-content">
            {quote.validity_days} 天（至 {expiryDate.toLocaleDateString('zh-CN')}）
          </div>
        </div>

        <div className="section">
          <div className="section-title">客户信息</div>
          <div className="section-content">
            {quote.client_name} · {quote.client_contact_masked}
          </div>
        </div>

        {quote.status === 'pending' ? (
          <button 
            className="confirm-button"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? '确认中...' : '确认报价'}
          </button>
        ) : (
          <div className="confirmed-text">
            ✓ 报价已确认
            {quote.confirmed_at && (
              <div style={{ marginTop: '8px', fontSize: '13px' }}>
                确认时间：{new Date(quote.confirmed_at).toLocaleString('zh-CN')}
              </div>
            )}
          </div>
        )}

        <div className="footer">
          <div>🔒 由 Freelance Dev Platform 提供</div>
          <div style={{ marginTop: '4px' }}>安全 · 透明 · 可追溯</div>
        </div>
      </div>
    </div>
  );
}
