import React, { useState } from 'react';
import { Info } from 'lucide-react';

export interface TermDefinition {
  term: string;
  simpleEnglish: string;
  farmerNote?: string;
}

export const GLOSSARY: Record<string, TermDefinition> = {
  BIOFERTILIZER: {
    term: 'Biofertilizer',
    simpleEnglish: 'Natural living microbes (beneficial bacteria and fungi) that nourish plant roots and enrich the soil naturally.',
    farmerNote: 'Helps improve soil health and nutrient uptake without chemical residues.',
  },
  BIOPESTICIDE: {
    term: 'Biopesticide',
    simpleEnglish: 'Targeted, eco-friendly crop protection made from natural plant extracts or beneficial microbes to suppress pest populations.',
    farmerNote: 'Protects crops while preserving beneficial pollinators and soil health.',
  },
  BIOCONTROL: {
    term: 'Biological Control',
    simpleEnglish: 'Using natural beneficial organisms, such as protector insects or friendly fungi, to help manage crop pests and diseases.',
    farmerNote: 'A natural approach to keep pest numbers below damaging levels.',
  },
  VARIETY: {
    term: 'Crop Variety / Cultivar',
    simpleEnglish: 'A selectively bred crop type chosen for reliable harvest yield, disease defense, or climate resilience.',
    farmerNote: 'Different varieties perform best under specific regional soil and water conditions.',
  },
  BIOTECH_TRAITS: {
    term: 'Insect Protection & Biotech Features',
    simpleEnglish: 'Specific characteristics developed in the crop to assist against target caterpillar pests, drought, or heat stress.',
    farmerNote: 'Helps minimize yield loss from target insect feeding when present in the verified record.',
  },
  DISEASE_RESISTANCE: {
    term: 'Disease Resistance Information',
    simpleEnglish: 'The natural capability of a crop variety to withstand specific infections, such as blast, blight, or fruit rot.',
    farmerNote: 'Protection depends on the specific disease strain, weather, and overall growing conditions.',
  },
  PATHOGEN: {
    term: 'Disease Agent / Pathogen',
    simpleEnglish: 'A microscopic fungus, bacteria, or virus that causes damage to leaves, stems, roots, or fruit.',
    farmerNote: 'Prompt diagnosis allows targeted biological control before infection spreads.',
  },
  QUARANTINE: {
    term: 'Containment & Quarantine',
    simpleEnglish: 'Managing and isolating affected crop areas to stop disease or pests from moving into neighboring healthy plots.',
    farmerNote: 'Applying barrier treatments prevents field-wide spread.',
  },
  MATURITY_DAYS: {
    term: 'Maturity Duration',
    simpleEnglish: 'The estimated number of days from sowing until the crop is ready for harvest.',
    farmerNote: 'Helps schedule water, nutrition, and harvest operations efficiently.',
  },
  EXPECTED_YIELD: {
    term: 'Expected Yield Range',
    simpleEnglish: 'The estimated harvest quantity per acre under standard agronomic management and adequate irrigation.',
    farmerNote: 'Actual yields vary depending on weather, soil fertility, and pest pressure.',
  },
  ACTIVE_OUTBREAK: {
    term: 'Active Outbreak',
    simpleEnglish: 'An active disease or pest issue identified in the area that warrants field inspection and prompt care.',
    farmerNote: 'Review recommended treatment protocols to safeguard your crop.',
  },
  UNDER_INVESTIGATION: {
    term: 'Under Investigation',
    simpleEnglish: 'Field agronomists or plant specialists are evaluating symptoms to provide an accurate diagnosis and prescription.',
    farmerNote: 'Recommended remedies will be published as soon as assessment completes.',
  },
  CONTAINED: {
    term: 'Contained',
    simpleEnglish: 'Disease progression has been halted through applied treatments and the plants are recovering.',
    farmerNote: 'Continue monitoring according to agronomist instructions.',
  },
  RESOLVED: {
    term: 'Resolved',
    simpleEnglish: 'The crop has recovered from the issue and the farm plot has returned to normal healthy status.',
    farmerNote: 'Normal cultivation practices can continue.',
  },
  SOIL_MOISTURE: {
    term: 'Soil Moisture',
    simpleEnglish: 'The amount of available moisture in the root zone: Dry (irrigation needed), Optimal, or Wet.',
    farmerNote: 'Maintaining optimal root moisture reduces crop vulnerability to infections.',
  },
};

interface TermHelperProps {
  termKey: keyof typeof GLOSSARY | string;
  showBadge?: boolean;
  inlineLabel?: string;
}

export const TermHelper: React.FC<TermHelperProps> = ({
  termKey,
  inlineLabel,
}) => {
  const [open, setOpen] = useState(false);
  const info = GLOSSARY[termKey] || {
    term: inlineLabel || termKey,
    simpleEnglish: 'Agricultural and crop protection guidance.',
    farmerNote: 'Consult your local field agronomist for customized recommendations.',
  };

  const label = inlineLabel || info.term;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Click for plain English explanation"
        aria-label="Explain agricultural term"
      >
        <Info size={13} color="#06b6d4" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            background: 'rgba(11, 18, 33, 0.98)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            padding: '12px 14px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.7)',
            width: '280px',
            zIndex: 1000,
            pointerEvents: 'auto',
            textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff', marginBottom: '4px' }}>
            🌾 {info.term}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#e2e8f0', lineHeight: 1.4, marginBottom: '6px' }}>
            {info.simpleEnglish}
          </div>
          {info.farmerNote && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
              <div style={{ fontSize: '0.72rem', color: '#34d399', lineHeight: 1.35 }}>
                ℹ️ {info.farmerNote}
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export default TermHelper;
