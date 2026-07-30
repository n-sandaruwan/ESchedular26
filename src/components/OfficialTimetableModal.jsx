import React from 'react';

function OfficialTimetableModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = './TimeTable-Elec.pdf';
    link.download = 'TimeTable-Elec.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-surface border border-white/10 rounded-2xl max-w-5xl w-full p-5 shadow-2xl space-y-4">
        
        {/* Modal Controls Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
              Preview Official Timetable (PDF)
            </h3>
            <p className="text-xs text-on-surface-variant">TimeTable-Elec.pdf • Department of Electrical & Information Engineering</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="btn-electric px-4 py-2 rounded-xl text-xs font-label-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.4)]"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-container border border-white/5 text-on-surface-variant hover:text-on-surface cursor-pointer"
              title="Close Preview"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Embedded Exact PDF Preview */}
        <div className="w-full h-[75vh] rounded-xl overflow-hidden bg-surface-container border border-white/10 relative">
          <iframe
            src="./TimeTable-Elec.pdf#toolbar=1&navpanes=0"
            title="Official Timetable PDF Preview"
            className="w-full h-full border-none rounded-xl"
          />
        </div>

      </div>
    </div>
  );
}

export default OfficialTimetableModal;
