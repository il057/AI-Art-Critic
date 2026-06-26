interface NotepadWindowProps {
  content: string;
}

/**
 * Reusable retro Notepad (记事本.exe) window body component.
 * Renders a Win95-style menu bar and a scrollable pre-formatted text area.
 * Used by both the 帮助.txt and 更新日志.txt windows.
 */
export function NotepadWindow({ content }: NotepadWindowProps) {
  return (
    <div className="flex-1 flex flex-col bg-white text-black text-xs font-mono select-text overflow-hidden h-full">
      {/* Menu bar */}
      <div className="flex gap-4 px-2 py-1 bg-[#c0c0c0] border-b border-gray-400 select-none text-[11px] font-bold text-gray-800">
        <span className="hover:bg-[#000080] hover:text-white px-1 cursor-default">文件(F)</span>
        <span className="hover:bg-[#000080] hover:text-white px-1 cursor-default">编辑(E)</span>
        <span className="hover:bg-[#000080] hover:text-white px-1 cursor-default">搜索(S)</span>
        <span className="hover:bg-[#000080] hover:text-white px-1 cursor-default">帮助(H)</span>
      </div>
      {/* Document area */}
      <div className="flex-grow p-4 overflow-y-auto bg-white border-t border-gray-800 leading-relaxed font-bold text-gray-900 whitespace-pre-wrap select-text selection:bg-[#000080] selection:text-white">
        {content}
      </div>
    </div>
  );
}
