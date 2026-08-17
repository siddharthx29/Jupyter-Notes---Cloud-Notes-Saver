import React, { useMemo } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Download,
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  onSave?: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  isDark?: boolean;
  readOnly?: boolean;
  onCursorChange?: (line: number, col: number) => void;
  editorRef?: React.RefObject<ReactCodeMirrorRef>;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  onSave,
  onCopy,
  onDownload,
  showLineNumbers = false,
  wordWrap = true,
  isDark = false,
  readOnly = false,
  onCursorChange,
  editorRef,
}) => {
  const customExtensions = useMemo(() => {
    const extensions = [];

    if (wordWrap) {
      extensions.push(EditorView.lineWrapping);
    }

    // Ctrl+S / Cmd+S interceptor to trigger note save
    extensions.push(
      EditorView.domEventHandlers({
        keydown: (event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            if (onSave) {
              onSave();
            }
            return true;
          }
          return false;
        },
      })
    );

    // Track cursor location (Line, Column)
    if (onCursorChange) {
      extensions.push(
        EditorView.updateListener.of((update) => {
          if (update.selectionSet || update.docChanged) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            const col = pos - line.from + 1;
            onCursorChange(line.number, col);
          }
        })
      );
    }

    // Jupyter Notebook Code theme
    extensions.push(
      EditorState.tabSize.of(4),
      EditorView.theme({
        '&': {
          backgroundColor: 'transparent',
          color: isDark ? '#f0f0f0' : '#000000',
          fontSize: '14px',
        },
        '.cm-scroller': {
          fontFamily: "'Source Code Pro', 'JetBrains Mono', Consolas, Monaco, monospace",
        },
        '.cm-content': {
          caretColor: isDark ? '#ffffff' : '#000000',
        },
        '&.cm-focused .cm-cursor': {
          borderLeftColor: isDark ? '#ffffff' : '#000000',
          borderLeftWidth: '1.5px',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          color: isDark ? '#777777' : '#9e9e9e',
        },
        '.cm-activeLineGutter': {
          color: '#2196f3 !important',
          fontWeight: 'bold',
        },
        '.cm-activeLine': {
          backgroundColor: 'rgba(33, 150, 243, 0.03)',
        },
      })
    );

    return extensions;
  }, [wordWrap, isDark, onSave, onCursorChange]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-white dark:bg-[#181818] p-4 sm:p-6 flex flex-col items-center">
      {/* Notebook Canvas Container */}
      <div className="w-full max-w-5xl flex-1 flex flex-col">
        {/* Jupyter Notebook Cell: Auto-Scales Vertically with Content */}
        <div className="w-full flex items-start gap-1 sm:gap-2 relative group select-text my-2">
          {/* Active Cell Left Blue Bar Indicator */}
          <div className="w-1.5 self-stretch min-h-[38px] bg-[#2196f3] rounded-full shadow-sm shrink-0" />

          {/* Left Prompt Label: [ ]: */}
          <div className="pt-2 pl-2 pr-1 select-none font-mono text-[13px] font-bold text-[#303f9f] dark:text-[#64b5f6] shrink-0 w-12 text-right">
            [&nbsp;&nbsp;]:
          </div>

          {/* Interior Cell Code Input Box (Auto-growing rectangle) */}
          <div className="flex-1 relative border border-[#2196f3] bg-[#f7f7f7] dark:bg-[#1e1e1e] rounded shadow-sm focus-within:ring-1 focus-within:ring-[#2196f3] focus-within:bg-white dark:focus-within:bg-[#1e1e1e] transition-all min-h-[38px]">
            {/* Top Right Mini Cell Action Toolbar */}
            <div className="absolute right-1.5 top-1 z-10 flex items-center gap-0.5 bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur rounded px-1 py-0.5 border border-[#e0e0e0] dark:border-[#333333] shadow-sm select-none opacity-70 hover:opacity-100 transition-opacity">
              <button
                onClick={onCopy}
                className="p-1 rounded hover:bg-[#f0f0f0] dark:hover:bg-[#333333] text-slate-600 dark:text-slate-300"
                title="Copy cell contents"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDownload}
                className="p-1 rounded hover:bg-[#f0f0f0] dark:hover:bg-[#333333] text-slate-600 dark:text-slate-300"
                title="Download cell as .txt"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {}}
                className="p-1 rounded hover:bg-[#f0f0f0] dark:hover:bg-[#333333] text-slate-600 dark:text-slate-300"
                title="Move cell up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {}}
                className="p-1 rounded hover:bg-[#f0f0f0] dark:hover:bg-[#333333] text-slate-600 dark:text-slate-300"
                title="Move cell down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {}}
                className="p-1 rounded hover:bg-[#f0f0f0] dark:hover:bg-[#333333] text-slate-600 dark:text-slate-300"
                title="Insert cell below"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChange('')}
                className="p-1 rounded hover:bg-[#f0f0f0] dark:hover:bg-[#333333] text-slate-600 dark:text-slate-300 hover:text-rose-500"
                title="Clear cell"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CodeMirror Inside Cell (Scales dynamically in height) */}
            <div className="w-full pr-28">
              <CodeMirror
                ref={editorRef}
                value={value}
                className="w-full"
                basicSetup={{
                  lineNumbers: showLineNumbers,
                  highlightActiveLineGutter: true,
                  highlightSpecialChars: false,
                  history: true,
                  drawSelection: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: false,
                  syntaxHighlighting: false,
                  bracketMatching: false,
                  closeBrackets: false,
                  autocompletion: false,
                  rectangularSelection: true,
                  crosshairCursor: false,
                  highlightActiveLine: true,
                  highlightSelectionMatches: false,
                  closeBracketsKeymap: false,
                  searchKeymap: true,
                  foldKeymap: false,
                  completionKeymap: false,
                  lintKeymap: false,
                }}
                extensions={customExtensions}
                onChange={(val) => onChange(val)}
                readOnly={readOnly}
                placeholder="Type or paste your Python code, text, symbols, or whitespace here... (Ctrl+S to save checkpoint)"
              />
            </div>
          </div>
        </div>

        {/* Blank space below cell (classic Jupyter document feel) */}
        <div
          className="flex-1 min-h-[300px] cursor-text"
          onClick={() => {
            if (editorRef?.current?.view) {
              editorRef.current.view.focus();
            }
          }}
        />
      </div>
    </div>
  );
};
