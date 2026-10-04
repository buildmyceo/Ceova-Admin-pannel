import React, { useState } from 'react';
import { FileText, Download, Lock, Search, Folder, Plus, Eye, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FilesView: React.FC = () => {
  const { isCSuite, canViewFinancials } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'all' | 'sop' | 'tech' | 'confidential' | 'brand'>('all');

  const files = [
    {
      id: 'f1',
      name: 'Ceova_CCTV_Hardware_Spec_v1.0.pdf',
      category: 'tech',
      size: '2.4 MB',
      updated: 'Oct 02, 2026',
      restricted: false,
      author: 'Elena Rostova (CTO)'
    },
    {
      id: 'f2',
      name: 'YOLOv11_INT8_Quantization_Benchmark.json',
      category: 'tech',
      size: '480 KB',
      updated: 'Oct 03, 2026',
      restricted: false,
      author: 'Rahul Sharma'
    },
    {
      id: 'f3',
      name: 'Hardware_Procurement_Vendor_SOP.pdf',
      category: 'sop',
      size: '1.1 MB',
      updated: 'Sept 28, 2026',
      restricted: false,
      author: 'Aarav Singhania (COO)'
    },
    {
      id: 'f4',
      name: 'Ceova_Brand_Guidelines_and_3D_Tokens.pdf',
      category: 'brand',
      size: '8.6 MB',
      updated: 'Oct 01, 2026',
      restricted: false,
      author: 'Sophia Chen (CMO)'
    },
    {
      id: 'f5',
      name: 'Ceova_Series_A_Term_Sheet_Evaluation.pdf',
      category: 'confidential',
      size: '1.8 MB',
      updated: 'Oct 04, 2026',
      restricted: true,
      author: 'Harshit & David Sterling'
    },
    {
      id: 'f6',
      name: 'Q3_MeitY_Grant_Expense_Audit_Filing.pdf',
      category: 'confidential',
      size: '3.2 MB',
      updated: 'Oct 01, 2026',
      restricted: true,
      author: 'David Sterling (CFO)'
    }
  ];

  const filteredFiles = files.filter(f => {
    if (activeCategory === 'all') return true;
    return f.category === activeCategory;
  });

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h2>Files, Documentation & Company SOPs</h2>
          <p className="view-subtitle">
            Central repository of technical architectures, hardware specifications, brand kits, and executive briefs.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <button 
          className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All Files ({files.length})
        </button>
        <button 
          className={`filter-chip ${activeCategory === 'tech' ? 'active' : ''}`}
          onClick={() => setActiveCategory('tech')}
        >
          Technical & Specs
        </button>
        <button 
          className={`filter-chip ${activeCategory === 'sop' ? 'active' : ''}`}
          onClick={() => setActiveCategory('sop')}
        >
          Company SOPs
        </button>
        <button 
          className={`filter-chip ${activeCategory === 'brand' ? 'active' : ''}`}
          onClick={() => setActiveCategory('brand')}
        >
          Brand & Media
        </button>
        <button 
          className={`filter-chip executive-chip ${activeCategory === 'confidential' ? 'active' : ''}`}
          onClick={() => setActiveCategory('confidential')}
        >
          🔒 Confidential
        </button>
      </div>

      <div className="files-grid">
        {filteredFiles.map((file) => {
          const isLocked = file.restricted && !isCSuite;

          return (
            <div key={file.id} className={`file-card ${isLocked ? 'locked-file' : ''}`}>
              <div className="file-card-top">
                <div className="file-icon-box">
                  {file.restricted ? (
                    <Lock size={20} style={{ color: '#f59e0b' }} />
                  ) : (
                    <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                  )}
                </div>
                <span className="file-size-tag">{file.size}</span>
              </div>

              <div className="file-card-info">
                <div className="file-title-text">{file.name}</div>
                <div className="file-author-sub">Uploaded by: {file.author}</div>
                <div className="file-date-sub">{file.updated}</div>
              </div>

              <div className="file-card-footer">
                {isLocked ? (
                  <span className="locked-file-note">Executive Clearance Required</span>
                ) : (
                  <button className="btn-tiny-secondary">
                    <Download size={12} /> Download
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
