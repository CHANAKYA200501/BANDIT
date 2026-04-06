import React from 'react';
import { Html } from '@react-three/drei';

/**
 * FloatingCard — Displays scan results as floating 3D cards near the globe.
 * Uses drei's Html component for CSS content rendered in 3D space.
 */
export default function FloatingCard({ data, position = [2.5, 1.5, 1], onClose }) {
  if (!data) return null;

  const riskColor = data.risk_level >= 80 ? '#e24b4a' : data.risk_level >= 50 ? '#f0ad4e' : '#4ade80';
  const riskLabel = data.risk_level >= 80 ? 'CRITICAL' : data.risk_level >= 50 ? 'MEDIUM' : 'LOW';

  return (
    <Html position={position} center distanceFactor={8} zIndexRange={[100, 0]}>
      <div style={{
        background: 'rgba(31, 40, 51, 0.92)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${riskColor}40`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '220px',
        maxWidth: '260px',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${riskColor}20`,
        animation: 'floatCardIn 0.4s ease-out',
        pointerEvents: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            SCAN RESULT
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
                fontSize: '16px', padding: '0', lineHeight: '1',
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Risk Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
        }}>
          <div style={{
            background: riskColor, color: 'white', borderRadius: '20px',
            padding: '3px 10px', fontSize: '10px', fontWeight: 'bold',
          }}>
            {riskLabel} — {data.risk_level}%
          </div>
          <span style={{ color: '#9ca3af', fontSize: '10px' }}>
            Conf: {data.confidence}%
          </span>
        </div>

        {/* Risk Bar */}
        <div style={{
          height: '4px', background: '#374151', borderRadius: '2px',
          marginBottom: '10px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${data.risk_level}%`, background: riskColor,
            borderRadius: '2px', transition: 'width 0.8s ease',
          }} />
        </div>

        {/* Model Info */}
        {data.ml_prediction && (
          <div style={{ color: '#6b7280', fontSize: '10px', marginBottom: '6px' }}>
            Model: {data.ml_prediction.model}
          </div>
        )}

        {/* Verdicts */}
        {data.api_verdicts && (
          <div style={{ marginTop: '6px' }}>
            {Object.entries(data.api_verdicts).slice(0, 3).map(([api, verdict]) => (
              <div key={api} style={{
                display: 'flex', justifyContent: 'space-between', padding: '2px 0',
                fontSize: '10px',
              }}>
                <span style={{ color: '#9ca3af', textTransform: 'capitalize' }}>{api.replace(/_/g, ' ')}</span>
                <span style={{
                  color: verdict === 'malicious' || verdict === 'dangerous' || verdict === 'listed' ? '#e24b4a' : '#4ade80',
                  fontWeight: 'bold',
                }}>
                  {verdict.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Html>
  );
}
