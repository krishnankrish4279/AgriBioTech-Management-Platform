import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export interface TermDefinition {
  term: string;
  simpleEnglish: string;
  tamilTitle: string;
  tamilDesc: string;
}

export const GLOSSARY: Record<string, TermDefinition> = {
  BIOFERTILIZER: {
    term: 'Biofertilizer',
    simpleEnglish: 'Natural living microbes (bacteria & fungi) that feed roots and enrich soil without chemicals.',
    tamilTitle: 'உயிர் உரம் (Bio-Fertilizer)',
    tamilDesc: 'மண்ணின் வளத்தை பெருக்கி வேர்களுக்கு சத்தூட்டும் இயற்கை நுண்ணுயிர் உரம்.',
  },
  BIOPESTICIDE: {
    term: 'Biopesticide',
    simpleEnglish: 'Eco-friendly pest spray made from neem and beneficial bacteria that stops pests safely.',
    tamilTitle: 'உயிர் பூச்சிக்கொல்லி (Bio-Pesticide)',
    tamilDesc: 'வேம்பு மற்றும் நன்மை செய்யும் பாக்டீரியாவால் செய்யப்பட்ட இயற்கை பூச்சி விரட்டி.',
  },
  BIOCONTROL: {
    term: 'Biocontrol / Biological Control',
    simpleEnglish: 'Using friendly protector insects or good fungi to stop pests naturally.',
    tamilTitle: 'உயிரியல் கட்டுப்பாடு (Biocontrol)',
    tamilDesc: 'நன்மை செய்யும் பூச்சிகள் மற்றும் பூஞ்சைகள் மூலம் பயிர் பூச்சிகளை இயற்கை வழியில் கட்டுப்படுத்துதல்.',
  },
  VARIETY: {
    term: 'Crop Variety / Cultivar',
    simpleEnglish: 'A specially bred seed type selected for high yield, disease defense, or drought tolerance.',
    tamilTitle: 'விதை ரகம் (Crop Variety)',
    tamilDesc: 'அதிக விளைச்சல் மற்றும் வறட்சி தாங்கும் திறன் கொண்ட தேர்ந்தெடுக்கப்பட்ட விதை வகை.',
  },
  BIOTECH_TRAITS: {
    term: 'Biotech Traits',
    simpleEnglish: 'Special genetic protections bred into the seed against bollworms, drought, or heat.',
    tamilTitle: 'மரபணு சிறப்பு குணங்கள் (Biotech Traits)',
    tamilDesc: 'பயிரில் பூச்சி மற்றும் வறட்சியை தாங்கி வளரும் வகையில் உள்ள இயற்கை எதிர்ப்பு குணங்கள்.',
  },
  DISEASE_RESISTANCE: {
    term: 'Disease Resistance',
    simpleEnglish: 'The plant’s natural ability to resist infections like blast, blight, or leaf curl.',
    tamilTitle: 'நோய் எதிர்ப்பு திறன் (Disease Resistance)',
    tamilDesc: 'கருகல், இலைச்சுருள் போன்ற கொடிய நோய்கள் தாக்காமல் பயிர் தன்னைத்தானே பாதுகாக்கும் திறன்.',
  },
  PATHOGEN: {
    term: 'Pathogen / Disease Agent',
    simpleEnglish: 'The microscopic fungus, bacteria, virus, or pest causing plant damage.',
    tamilTitle: 'நோய் கிருமி (Pathogen)',
    tamilDesc: 'பயிரை தாக்கி நோய் உண்டாக்கும் பூஞ்சை, பாக்டீரியா அல்லது வைரஸ் கிருமி.',
  },
  QUARANTINE: {
    term: 'Quarantine / Containment',
    simpleEnglish: 'Isolating the infected plant patch to prevent the disease from spreading across your entire field.',
    tamilTitle: 'தனிமைப்படுத்துதல் (Containment)',
    tamilDesc: 'நோய் மற்ற பயிர்களுக்கு பரவாமல் இருக்க பாதிக்கப்பட்ட இடத்தை சுற்றிலும் தடுத்து நிறுத்துதல்.',
  },
  MATURITY_DAYS: {
    term: 'Maturity Days',
    simpleEnglish: 'Total number of days from sowing to full harvest readiness.',
    tamilTitle: 'அறுவடை காலம் (Maturity Period)',
    tamilDesc: 'விதை விதைத்த நாளில் இருந்து அறுவடைக்கு தயாராகும் மொத்த நாட்கள்.',
  },
  EXPECTED_YIELD: {
    term: 'Expected Yield',
    simpleEnglish: 'Estimated harvest quantity per acre under standard water and nutrient care.',
    tamilTitle: 'எதிர்பார்க்கப்படும் மகசூல் (Expected Yield)',
    tamilDesc: 'சரியான பாசனம் மற்றும் உரமிடுதலின் மூலம் ஏக்கருக்கு கிடைக்கக்கூடிய உத்தேச மகசூல்.',
  },
  ACTIVE_OUTBREAK: {
    term: 'Active Outbreak',
    simpleEnglish: 'Disease currently active in the area; requires rapid field inspection and treatment.',
    tamilTitle: 'தீவிர பாதிப்பு (Active Outbreak)',
    tamilDesc: 'பயிர்களில் நோய் தீவிரமாக பரவி வருகிறது; உடனடி கவனிப்பு மற்றும் தெளிப்பு தேவை.',
  },
  UNDER_INVESTIGATION: {
    term: 'Under Investigation',
    simpleEnglish: 'Agronomist or expert is reviewing symptoms to recommend the best bio-treatment.',
    tamilTitle: 'ஆய்வில் உள்ளது (Under Investigation)',
    tamilDesc: 'வேளாண் அதிகாரி ஆய்வு செய்கிறார்; விரைவில் சரியான மருந்து ஆலோசனை வழங்கப்படும்.',
  },
  CONTAINED: {
    term: 'Contained',
    simpleEnglish: 'Spread has been stopped with treatment; crops are recovering.',
    tamilTitle: 'கட்டுப்படுத்தப்பட்டது (Contained)',
    tamilDesc: 'மருந்து தெளித்ததால் நோய் பரவுவது நின்று பயிர் மீண்டு வருகிறது.',
  },
  RESOLVED: {
    term: 'Resolved / Clear',
    simpleEnglish: 'Crop has fully recovered, and the farm plot is now healthy and clear.',
    tamilTitle: 'தீர்க்கப்பட்டது (Resolved)',
    tamilDesc: 'பயிர் பூரணமாக குணமாகி நிலம் ஆரோக்கியமாக உள்ளது.',
  },
  SOIL_MOISTURE: {
    term: 'Soil Moisture',
    simpleEnglish: 'Amount of water in the root zone: Dry (needs water), Optimal (just right), or Wet.',
    tamilTitle: 'மண் ஈரப்பதம் (Soil Moisture)',
    tamilDesc: 'பயிர் வேர்களில் உள்ள நீர் அளவு: வறண்டது (தண்ணீர் தேவை), மிதமானது (சரியானது), ஈரமானது.',
  },
};

interface TermHelperProps {
  termKey: keyof typeof GLOSSARY | string;
  showBadge?: boolean;
  inlineLabel?: string;
  tamilLabel?: string;
}

export const TermHelper: React.FC<TermHelperProps> = ({
  termKey,
  showBadge = false,
  inlineLabel,
  tamilLabel,
}) => {
  const [open, setOpen] = useState(false);
  const info = GLOSSARY[termKey] || {
    term: inlineLabel || termKey,
    simpleEnglish: 'Agricultural and crop protection guidance.',
    tamilTitle: tamilLabel || 'விவசாய வழிகாட்டல்',
    tamilDesc: 'பயிர் பாதுகாப்பு மற்றும் எளிய விவசாய விளக்கம்.',
  };

  const label = inlineLabel || info.term;
  const tamil = tamilLabel || info.tamilTitle;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
      <span>{label}</span>
      {tamil && (
        <span
          style={{
            fontSize: '0.78em',
            color: '#34d399',
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '1px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          {tamil}
        </span>
      )}
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
        title="Click for farmer explanation"
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
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
            <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
              {info.tamilTitle}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35, marginTop: '2px' }}>
              {info.tamilDesc}
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

export default TermHelper;
