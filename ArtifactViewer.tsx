import { InterviewData, ReadinessReport } from '../types';
import { FileText, Download, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ArtifactViewerProps {
  type: 'DSA' | 'Request' | 'Report';
  data: InterviewData;
  report: ReadinessReport;
  onClose: () => void;
}

export default function ArtifactViewer({ type, data, report, onClose }: ArtifactViewerProps) {
  const renderDSA = () => (
    <div className="space-y-8 font-serif text-[#141414]">
      <div className="text-center border-b-2 border-[#141414] pb-4">
        <h1 className="text-2xl font-bold uppercase">Data Sharing Agreement (DSA)</h1>
        <p className="text-sm">Agreement ID: DSA_ADVANA_{data.sourceSystemAcronym?.value || 'PENDING'}</p>
        <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-bold uppercase border-b border-gray-300">1. PURPOSE</h2>
        <p className="text-sm leading-relaxed">
          Establish a management agreement between:
          <br />
          <strong>Office of the Secretary of Defense (OSD) Chief Digital & Artificial Intelligence Office (CDAO)</strong>
          <br />
          and
          <br />
          <strong>{data.parentAgency?.value || '[PARENT AGENCY]'}</strong>
          <br />
          regarding the development, management, operation, and security of data shared between:
          <br />
          <strong>Advancing Analytics (ADVANA)</strong>
          <br />
          and
          <br />
          <strong>{data.sourceSystemName?.value || '[SYSTEM NAME]'} ({data.sourceSystemAcronym?.value || '[ACRONYM]'})</strong>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold uppercase border-b border-gray-300">2. DATA DESCRIPTION</h2>
        <p className="text-sm leading-relaxed">
          <strong>Use Case:</strong> {data.businessUseCase?.value || 'N/A'}
        </p>
        <p className="text-sm">
          <strong>Financially Significant:</strong> {data.isFinanciallySignificant?.value ? 'YES' : 'NO'}
        </p>
        <p className="text-sm">
          <strong>Data Steward:</strong> {data.dataStewardName?.value || 'N/A'} ({data.dataStewardEmail?.value || 'N/A'})
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold uppercase border-b border-gray-300">3. SENSITIVE DATA TYPES</h2>
        <div className="text-sm space-y-1">
          {data.sensitivityTypes?.value?.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#141414] rounded-full"></span>
              <span>{t}</span>
            </div>
          )) || <p>No sensitive data types identified.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold uppercase border-b border-gray-300">4. DATA EXCHANGE DETAILS</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="opacity-60 uppercase text-[10px]">Flow Direction</p>
            <p className="font-bold">{data.flowDirection?.value || 'N/A'}</p>
          </div>
          <div>
            <p className="opacity-60 uppercase text-[10px]">Delivery Method</p>
            <p className="font-bold">{data.deliveryMethod?.value || 'N/A'}</p>
          </div>
          <div>
            <p className="opacity-60 uppercase text-[10px]">Frequency</p>
            <p className="font-bold">{data.frequency?.value || 'N/A'}</p>
          </div>
          <div>
            <p className="opacity-60 uppercase text-[10px]">Network</p>
            <p className="font-bold">{data.network?.value || 'N/A'}</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold uppercase border-b border-gray-300">5. AUTHORIZATION</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="opacity-60 uppercase text-[10px]">eMASS ID</p>
            <p className="font-bold">{data.eMassId?.value || 'N/A'}</p>
          </div>
          <div>
            <p className="opacity-60 uppercase text-[10px]">DITPR ID</p>
            <p className="font-bold">{data.ditprId?.value || 'N/A'}</p>
          </div>
          <div>
            <p className="opacity-60 uppercase text-[10px]">System ISSM</p>
            <p className="font-bold">{data.issmName?.value || 'N/A'}</p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderRequest = () => (
    <div className="space-y-6 font-mono text-[#141414] text-xs">
      <div className="border-2 border-[#141414] p-4 bg-gray-50">
        <h1 className="text-lg font-bold uppercase mb-2">WDP DATA CONNECTION REQUEST</h1>
        <p>SUMMARY: {data.sourceSystemAcronym?.value || data.sourceSystemName?.value} Onboarding</p>
        <p>STATUS: DRAFT / PENDING GOVERNANCE</p>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold border-b border-[#141414]">DRT CHECKLIST</h2>
        <div className="space-y-1">
          <p>[{data.businessUseCase?.value ? 'X' : ' '}] Business Requirements</p>
          <p>[{data.hasDataDictionary?.value ? 'X' : ' '}] Data Dictionary / Metadata</p>
          <p>[{data.sensitivityTypes?.value ? 'X' : ' '}] Sensitivity Assessment</p>
          <p>[{data.hasAtoAtd?.value ? 'X' : ' '}] Security Authorization (ATO/ATD)</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold border-b border-[#141414]">TECHNICAL SPECIFICATIONS</h2>
        <div className="grid grid-cols-2 gap-2">
          <span>NETWORK:</span> <span className="font-bold">{data.network?.value || 'TBD'}</span>
          <span>METHOD:</span> <span className="font-bold">{data.deliveryMethod?.value || 'TBD'}</span>
          <span>FREQUENCY:</span> <span className="font-bold">{data.frequency?.value || 'TBD'}</span>
          <span>S3 BUCKET:</span> <span className="font-bold truncate">wdp-{data.sourceSystemAcronym?.value?.toLowerCase() || 'tbd'}-ingest</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold border-b border-[#141414]">POINTS OF CONTACT</h2>
        <div className="space-y-1">
          <p>STEWARD: {data.dataStewardName?.value} ({data.dataStewardEmail?.value})</p>
          <p>ISSM: {data.issmName?.value} ({data.issmEmail?.value})</p>
        </div>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="space-y-6 text-[#141414]">
      <div className="bg-[#141414] text-white p-6">
        <h1 className="text-xl font-bold uppercase tracking-widest">Readiness & Risk Assessment</h1>
        <p className="text-xs opacity-60 mt-1">AI-Powered Compliance Scan | WDP-AGENT-V2</p>
      </div>

      <div className="p-6 space-y-8">
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-60">Executive Summary</h2>
          <div className="p-4 bg-gray-50 border border-[#141414] font-serif text-sm italic">
            "{report.summary}"
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-60">Readiness & Confidence</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-[#141414] p-4 text-center">
              <span className="text-xs uppercase opacity-60 block mb-1">Score</span>
              <span className="text-4xl font-mono font-bold">{report.score}%</span>
            </div>
            <div className="border border-[#141414] p-4 text-center">
              <span className="text-xs uppercase opacity-60 block mb-1">Confidence</span>
              <span className="text-4xl font-mono font-bold">{report.confidence}</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-60 text-red-600">Identified Risks & Blockers</h2>
          <div className="space-y-2">
            {report.blockers.map((b, i) => (
              <div key={`b-${i}`} className="p-3 border border-red-600 bg-red-50 text-xs font-mono">
                <strong>CRITICAL:</strong> {b}
              </div>
            ))}
            {report.risks.map((r, i) => (
              <div key={`r-${i}`} className={`p-3 border border-[#141414] bg-white text-xs font-mono`}>
                <strong>{r.severity} RISK:</strong> {r.message}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-60">Decision Engine Output</h2>
          <div className="space-y-4">
            <div className="p-4 bg-[#141414] text-white space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase opacity-60">Recommended Path</span>
                <span className="text-sm font-bold">{report.recommendedPath}</span>
              </div>
              <p className="text-xs opacity-80">{report.pathJustification}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Prioritized Actions</p>
              <ul className="space-y-1 text-xs font-mono">
                {report.prioritizedActions.map((a, i) => (
                  <li key={i}>- {a}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-[#141414]">
          <div className={`p-4 text-center font-bold uppercase text-sm ${
            report.finalRecommendation === 'READY TO SUBMIT' ? 'bg-green-500 text-white' : 'bg-gray-200'
          }`}>
            Final Recommendation: {report.finalRecommendation}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl border-2 border-[#141414]"
      >
        <div className="p-4 border-b border-[#141414] flex items-center justify-between bg-[#E4E3E0]">
          <div className="flex items-center gap-2">
            <FileText size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Preview: {type}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white transition-all rounded-sm flex items-center gap-2 text-[10px] font-bold uppercase">
              <Download size={14} /> Download PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-red-500 hover:text-white transition-all rounded-sm">
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-12 bg-white">
          <div className="max-w-2xl mx-auto shadow-sm p-8 border border-gray-100">
            {type === 'DSA' && renderDSA()}
            {type === 'Request' && renderRequest()}
            {type === 'Report' && renderReport()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
