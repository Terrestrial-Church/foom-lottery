import React, { useState, useEffect } from 'react';

const logo = `
███████╗ ██████╗  ██████╗ ███╗   ███╗     ██████╗ █████╗ ███████╗██╗  ██╗
██╔════╝██╔═══██╗██╔═══██╗████╗ ████║    ██╔════╝██╔══██╗╚══███╔╝██║  ██║
█████╗  ██║   ██║██║   ██║██╔████╔██║    ██║     ███████║  ███╔╝ ███████║
██╔══╝  ██║   ██║██║   ██║██║╚██╔╝██║    ██║     ██╔══██║ ███╔╝  ██╔══██║
██║     ╚██████╔╝╚██████╔╝██║ ╚═╝ ██║    ╚██████╗██║  ██║███████╗██║  ██║
╚═╝      ╚═════╝  ╚═════╝ ╚═╝     ╚═╝     ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
`;

const fullLines = [
  "F",
  "FO",
  "FOO",
  "FOOM",
  "FOOM.",
  "FOOM.C",
  "FOOM.CA",
  "FOOM.CAS",
  "FOOM.CASH",
  ...logo.trim().split('\n'),
  "Loading.",
  "Loading..",
  "Loading...",
  "FOOM.Cash - Bridge",
  "FOOM.Cash - Bridge to",
  "FOOM.Cash - Bridge to After",
  "FOOM.Cash - Bridge to After Life."
];

const TerminalStyle = () => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);

  useEffect(() => {
    if (displayedLines.length < fullLines.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => [...prev, fullLines[prev.length]]);
      }, 250); // czas na jedną linię – możesz go zmienić
      return () => clearTimeout(timeout);
    }
  }, [displayedLines]);

  return (
    <div
      style={{
        background: '#000',
        color: '#0f0',
        fontFamily: 'monospace',
        whiteSpace: 'pre',
        padding: '20px',
        minHeight: '400px',
        fontSize: '14px',
        borderRadius: '10px',
        lineHeight: '1.4',
      }}
    >
      {displayedLines.join('\n')}
    </div>
  );
};

export default TerminalStyle;
