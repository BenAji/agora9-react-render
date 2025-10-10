/**
 * AGORA Company Order Panel Component
 * 
 * Lightweight drag-and-drop reordering for company tickers
 * Uses @dnd-kit for smooth, accessible reordering
 * 
 * SAFETY: No API calls, pure UI component
 */

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Save, RotateCcw } from 'lucide-react';
import { CompanyRow } from '../../types/calendar';

// =====================================================================================
// SORTABLE COMPANY ITEM COMPONENT
// =====================================================================================

interface SortableCompanyItemProps {
  company: CompanyRow;
  index: number;
}

const SortableCompanyItem: React.FC<SortableCompanyItemProps> = ({ company, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-company-item"
    >
      <div
        className="drag-handle"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </div>
      
      <div className="company-info">
        <div className="company-ticker">
          {company.ticker_symbol}
        </div>
        <div className="company-name">
          {company.company_name}
        </div>
      </div>
      
      <div className="company-index">
        {index + 1}
      </div>
    </div>
  );
};

// =====================================================================================
// COMPANY ORDER PANEL COMPONENT
// =====================================================================================

interface CompanyOrderPanelProps {
  companies: CompanyRow[];
  onOrderChange: (newOrder: CompanyRow[]) => void;
  isVisible: boolean;
  onClose: () => void;
}

const CompanyOrderPanel: React.FC<CompanyOrderPanelProps> = ({
  companies,
  onOrderChange,
  isVisible,
  onClose
}) => {
  const [localCompanies, setLocalCompanies] = useState<CompanyRow[]>(companies);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local state when companies prop changes
  useEffect(() => {
    setLocalCompanies(companies);
    setHasChanges(false);
  }, [companies]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = localCompanies.findIndex(company => company.id === active.id);
      const newIndex = localCompanies.findIndex(company => company.id === over?.id);

      const newOrder = arrayMove(localCompanies, oldIndex, newIndex);
      setLocalCompanies(newOrder);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    onOrderChange(localCompanies);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalCompanies(companies);
    setHasChanges(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="company-order-backdrop"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="company-order-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title">
            <GripVertical size={20} />
            <span>Reorder Companies</span>
          </div>
          <button 
            className="close-button"
            onClick={onClose}
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Instructions */}
        <div className="panel-instructions">
          <p>Drag companies to reorder them on the calendar</p>
        </div>

        {/* Company List */}
        <div className="company-list-container">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localCompanies.map(company => company.id)}
              strategy={verticalListSortingStrategy}
            >
              {localCompanies.map((company, index) => (
                <SortableCompanyItem
                  key={company.id}
                  company={company}
                  index={index}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Actions */}
        <div className="panel-actions">
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={!hasChanges}
            title="Reset to original order"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          
          <button
            className="save-button"
            onClick={handleSave}
            disabled={!hasChanges}
            title="Save new order"
          >
            <Save size={16} />
            Save Order
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .company-order-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .company-order-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-left: 1px solid #444;
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #444;
          background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
        }

        .close-button {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #444;
          color: #ffffff;
        }

        .panel-instructions {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #333;
        }

        .panel-instructions p {
          margin: 0;
          color: #ccc;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .company-list-container {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .company-list-container::-webkit-scrollbar {
          display: none;
        }

        .sortable-company-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
          border: 1px solid #444;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: grab;
        }

        .sortable-company-item:hover {
          border-color: #ffd700;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.1);
        }

        .sortable-company-item:active {
          cursor: grabbing;
        }

        .drag-handle {
          color: #888;
          cursor: grab;
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.2s ease;
        }

        .drag-handle:hover {
          color: #ffd700;
        }

        .company-info {
          flex: 1;
          min-width: 0;
        }

        .company-ticker {
          font-size: 1rem;
          font-weight: 700;
          color: #ffd700;
          margin-bottom: 0.25rem;
          letter-spacing: 0.5px;
        }

        .company-name {
          font-size: 0.875rem;
          color: #ccc;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .company-index {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #444;
          color: #fff;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .panel-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #444;
          background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
        }

        .reset-button,
        .save-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid #444;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reset-button {
          background: transparent;
          color: #888;
        }

        .reset-button:hover:not(:disabled) {
          background: #444;
          color: #fff;
        }

        .save-button {
          background: #ffd700;
          color: #1a1a1a;
          border-color: #ffd700;
        }

        .save-button:hover:not(:disabled) {
          background: #d4af37;
          border-color: #d4af37;
        }

        .reset-button:disabled,
        .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .company-order-panel {
            width: 100%;
            max-width: 100vw;
          }
        }
      `}</style>
    </>
  );
};

export default CompanyOrderPanel;
