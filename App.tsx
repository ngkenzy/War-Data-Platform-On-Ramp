/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ClipboardCheck, 
  ArrowRight,
  RefreshCcw,
  Download,
  Info,
  User,
  Bot
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  InterviewData, 
  Message, 
  ReadinessReport, 
  SensitivityType, 
  DataFlowDirection, 
  Network, 
  DeliveryMethod 
} from './types';
import ArtifactViewer from './components/ArtifactViewer';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are the Advana Onramp AI Agent, a specialized Governance and DataOps expert for the War Data Platform (WDP). 
You are an AI-powered onboarding triage and decision engine.

1. DOCUMENT INGESTION & EXTRACTION:
Extract key fields from user input: System Name/Acronym, Data Owner/POC, Classification/Sensitivity (PII, PHI, CUI, etc.), Network (NIPR, SIPR, JWICS), Flow Direction (Sending/Receiving), Delivery Method, eMASS ID/DITPR ID, Data Steward/ISSM.
Mark each field as: 
- CONFIRMED (explicitly found)
- INFERRED (best estimate)
- UNKNOWN (not found)

2. INTELLIGENT TRIAGE & RISK ANALYSIS:
Identify RISKS AND INCONSISTENCIES:
- Classification mismatches (e.g., CUI on NIPR with external sharing)
- Security gaps (e.g., outbound flow without ATO/ATD)
- Governance gaps (missing DSA, missing data dictionary)
Assign severity: HIGH (Blocker), MEDIUM (Clarify), LOW (Informational).
Predict likely outcome: PASS, CONDITIONAL PASS, FAIL.

3. DECISION ENGINE:
Generate Recommended Path: DSA, MEMO, or DUA/PTA.
Provide Justification, Operational Recommendations, and Prioritized Actions.

4. WEIGHTED READINESS MODEL:
Calculate Readiness Score (0-100) and Confidence Level (HIGH/MEDIUM/LOW).

5. INTERVIEW MODE:
Do NOT ask redundant questions. Prioritize missing critical fields.
Be precise, authoritative, and move the user toward a submission-ready package.`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Good day. I am the Advana Onramp AI Agent. I have been upgraded to an AI-powered triage and decision engine. I can now extract parameters from unstructured text or documents and provide intelligent risk analysis. To begin, please provide any details you have about the system onboarding, or paste a draft summary.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [data, setData] = useState<InterviewData>({});
  const [report, setReport] = useState<ReadinessReport>({ 
    score: 0, 
    confidence: 'LOW',
    summary: 'Awaiting initial data ingestion.',
    blockers: [], 
    risks: [],
    recommendedPath: 'TBD',
    pathJustification: 'Insufficient data for path recommendation.',
    prioritizedActions: [],
    finalRecommendation: 'HOLD – NEEDS WORK'
  });
  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat');
  const [viewerType, setViewerType] = useState<'DSA' | 'Request' | 'Report' | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              reply: { type: "string" },
              extractedData: {
                type: "object",
                properties: {
                  dataOwner: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  parentAgency: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  sourceSystemName: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  sourceSystemAcronym: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  businessUseCase: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  flowDirection: { type: "object", properties: { value: { type: "string", enum: ["Sending", "Receiving", "Both"] }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  deliveryMethod: { type: "object", properties: { value: { type: "string", enum: ["S3", "API", "SFG", "Other"] }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  frequency: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  sensitivityTypes: { type: "object", properties: { value: { type: "array", items: { type: "string" } }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  isFinanciallySignificant: { type: "object", properties: { value: { type: "boolean" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  network: { type: "object", properties: { value: { type: "string", enum: ["NIPR", "SIPR", "JWICS"] }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  eMassId: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  ditprId: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  dataStewardName: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  issmName: { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  hasDataDictionary: { type: "object", properties: { value: { type: "boolean" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } },
                  hasAtoAtd: { type: "object", properties: { value: { type: "boolean" }, status: { type: "string", enum: ["CONFIRMED", "INFERRED", "UNKNOWN"] } } }
                }
              },
              analysis: {
                type: "object",
                properties: {
                  score: { type: "integer" },
                  confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                  summary: { type: "string" },
                  blockers: { type: "array", items: { type: "string" } },
                  risks: { 
                    type: "array", 
                    items: { 
                      type: "object", 
                      properties: { 
                        severity: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] }, 
                        message: { type: "string" } 
                      } 
                    } 
                  },
                  recommendedPath: { type: "string" },
                  pathJustification: { type: "string" },
                  prioritizedActions: { type: "array", items: { type: "string" } },
                  finalRecommendation: { type: "string", enum: ["READY TO SUBMIT", "HOLD – NEEDS WORK", "HIGH RISK – ESCALATE"] }
                }
              }
            },
            required: ["reply", "analysis"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (result.extractedData) {
        setData(prev => {
          const newData = { ...prev };
          Object.keys(result.extractedData).forEach(key => {
            const field = result.extractedData[key];
            if (field && field.status !== 'UNKNOWN') {
              newData[key] = field;
            }
          });
          return newData;
        });
      }

      if (result.analysis) {
        setReport(result.analysis);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-4 flex items-center justify-between bg-[#E4E3E0] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] flex items-center justify-center rounded-sm">
            <ShieldCheck className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase">Advana Onramp</h1>
            <p className="text-[10px] font-mono opacity-60 uppercase tracking-widest">AI Decision Support Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 border border-[#141414] rounded-full text-xs font-mono bg-white">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            TRIAGE: ACTIVE
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Left: Chat Interface */}
        <section className="flex-1 flex flex-col border-r border-[#141414] bg-white">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-[#141414] text-white' : 'bg-[#E4E3E0] border border-[#141414]'}`}>
                    {m.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-sm ${m.role === 'assistant' ? 'bg-[#F5F5F5] border border-gray-200' : 'bg-[#141414] text-white shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    <span className="text-[10px] opacity-40 mt-2 block font-mono">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-[#141414] text-white rounded-sm flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div className="bg-[#F5F5F5] p-4 rounded-sm border border-gray-200">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-[#141414] bg-[#E4E3E0]">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Paste system data, document text, or ask a question..."
                className="w-full bg-white border border-[#141414] p-4 pr-12 focus:outline-none focus:ring-1 focus:ring-[#141414] text-sm font-mono min-h-[60px] max-h-[200px] resize-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 bottom-4 p-2 bg-[#141414] text-white hover:bg-opacity-90 disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Right: Dashboard & Preview */}
        <section className="w-[450px] flex flex-col bg-[#E4E3E0] overflow-y-auto border-l border-[#141414]">
          {/* Tabs */}
          <div className="flex border-b border-[#141414]">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-[#141414] text-white' : 'bg-white/50 hover:bg-white'}`}
            >
              READINESS & RISK
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-[#141414] text-white' : 'bg-white/50 hover:bg-white'}`}
            >
              ARTIFACT PREVIEW
            </button>
          </div>

          <div className="p-6 space-y-8">
            {activeTab === 'chat' ? (
              <>
                {/* Readiness Score & Confidence */}
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Readiness Score</h3>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-mono font-bold ${report.score >= 80 ? 'text-green-600' : report.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {report.score}
                        </span>
                        <span className="text-sm opacity-50 font-mono">/ 100</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Confidence</h3>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${
                        report.confidence === 'HIGH' ? 'bg-green-100 border-green-500 text-green-700' :
                        report.confidence === 'MEDIUM' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
                        'bg-red-100 border-red-500 text-red-700'
                      }`}>
                        {report.confidence}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-300 rounded-none border border-[#141414] p-[1px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${report.score}%` }}
                      className={`h-full ${report.score >= 80 ? 'bg-green-500' : report.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    />
                  </div>
                  <p className="text-[11px] leading-snug p-3 bg-white border border-[#141414] font-mono italic">
                    "{report.summary}"
                  </p>
                </div>

                {/* Risks & Blockers */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-[#141414] pb-1">Triage Report</h3>
                  <div className="space-y-2">
                    {report.blockers.map((b, i) => (
                      <div key={`blocker-${i}`} className="bg-red-600 text-white p-3 flex gap-3 items-start shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider">CRITICAL BLOCKER</p>
                          <p className="text-[11px] font-mono leading-tight">{b}</p>
                        </div>
                      </div>
                    ))}
                    {report.risks.map((r, i) => (
                      <div key={`risk-${i}`} className={`p-3 flex gap-3 items-start border border-[#141414] bg-white`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                          r.severity === 'MEDIUM' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-blue-500'
                        }`} />
                        <div className="space-y-1">
                          <p className={`text-[9px] font-bold uppercase tracking-wider opacity-60`}>{r.severity} RISK</p>
                          <p className="text-[11px] font-mono leading-tight">{r.message}</p>
                        </div>
                      </div>
                    ))}
                    {report.blockers.length === 0 && report.risks.length === 0 && (
                      <div className="p-4 bg-green-50 border border-green-500 text-green-700 text-[11px] font-mono text-center">
                        NO ACTIVE RISKS DETECTED
                      </div>
                    )}
                  </div>
                </div>

                {/* Decision Engine */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-[#141414] pb-1">Decision Engine</h3>
                  <div className="bg-[#141414] text-white p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest opacity-50">Recommended Path</p>
                      <p className="text-xl font-bold tracking-tight">{report.recommendedPath}</p>
                      <p className="text-[10px] opacity-70 font-mono italic">{report.pathJustification}</p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-white/20">
                      <p className="text-[9px] uppercase tracking-widest opacity-50">Operational Steps</p>
                      <ul className="space-y-1">
                        {report.prioritizedActions.map((a, i) => (
                          <li key={i} className="text-[10px] font-mono flex gap-2">
                            <span className="opacity-40">{i+1}.</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Field Status */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-[#141414] pb-1">Extraction Matrix</h3>
                  <div className="bg-white border border-[#141414] overflow-hidden">
                    <table className="w-full text-left text-[10px] font-mono">
                      <thead>
                        <tr className="bg-gray-100 border-b border-[#141414]">
                          <th className="p-2 border-r border-[#141414]">PARAMETER</th>
                          <th className="p-2">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(data).map(([key, field]) => field && (
                          <tr key={key}>
                            <td className="p-2 border-r border-[#141414] uppercase opacity-70">{key.replace(/([A-Z])/g, ' $1')}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold ${
                                (field as any).status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                (field as any).status === 'INFERRED' ? 'bg-blue-100 text-blue-700 italic' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {(field as any).status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`p-4 border-2 font-bold text-center uppercase tracking-widest text-sm ${
                    report.finalRecommendation === 'READY TO SUBMIT' ? 'bg-green-500 text-white border-green-600 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' :
                    report.finalRecommendation === 'HOLD – NEEDS WORK' ? 'bg-yellow-400 text-[#141414] border-yellow-600' :
                    'bg-red-600 text-white border-red-800'
                  }`}>
                  {report.finalRecommendation}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest">SUBMISSION PACKAGE</h3>
                  <button className="p-1.5 border border-[#141414] hover:bg-white transition-all bg-white">
                    <RefreshCcw size={14} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div onClick={() => setViewerType('Report')}>
                    <ArtifactCard 
                      title="Readiness & Risk Assessment" 
                      status={report.score >= 50 ? 'VERIFIED' : 'ACTION REQ'}
                      description="AI-generated triage and decision report."
                    />
                  </div>
                  <div onClick={() => setViewerType('DSA')}>
                    <ArtifactCard 
                      title="Data Sharing Agreement (DSA)" 
                      status={data.sourceSystemName?.status === 'CONFIRMED' && data.sensitivityTypes?.status === 'CONFIRMED' ? 'Ready' : 'Incomplete'}
                      description="Pre-filled metadata for MAKA Edge DSA."
                    />
                  </div>
                  <div onClick={() => setViewerType('Request')}>
                    <ArtifactCard 
                      title="Connection Request Packet" 
                      status={data.network?.status === 'CONFIRMED' ? 'Ready' : 'Incomplete'}
                      description="Consolidated packet for WDP engineering."
                    />
                  </div>
                </div>

                {report.finalRecommendation === 'READY TO SUBMIT' && (
                  <button className="w-full bg-[#141414] text-white p-4 flex items-center justify-center gap-2 uppercase text-xs font-bold tracking-widest hover:bg-opacity-90 transition-all shadow-[6px_6px_0px_0px_rgba(20,20,20,0.3)]">
                    <Download size={16} /> DOWNLOAD ALL ARTIFACTS
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {viewerType && (
          <ArtifactViewer 
            type={viewerType} 
            data={data} 
            report={report}
            onClose={() => setViewerType(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ArtifactCard({ title, status, description }: { title: string, status: string, description: string }) {
  return (
    <div className="bg-white border border-[#141414] p-4 space-y-2 group hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-tight">{title}</h4>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono border ${status === 'Ready' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
          {status}
        </span>
      </div>
      <p className="text-[10px] opacity-60 leading-tight">{description}</p>
      <div className="flex justify-end pt-2">
        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all" />
      </div>
    </div>
  );
}

