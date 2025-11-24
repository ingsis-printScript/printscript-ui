import {OutlinedInput} from "@mui/material";
import {highlight, languages} from "prismjs";
import Editor from "react-simple-code-editor";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {forwardRef, useImperativeHandle, useState} from "react";
import {useSnippetExecution} from "../hooks/useSnippetExecution";

export interface SnippetExecutionHandle {
  startExecution: (code: string, version: string) => void;
  connect: () => void;
  disconnect: () => void;
}

export const SnippetExecution = forwardRef<SnippetExecutionHandle>((_, ref) => {
  const [input, setInput] = useState<string>("");
  const { output, sendInput, connect, disconnect, startExecution } = useSnippetExecution();

  useImperativeHandle(ref, () => ({
    startExecution,
    connect,
    disconnect,
  }));

  const code = output.join("\n");

  const handleEnter = (event: { key: string }) => {
    if (event.key === 'Enter') {
      sendInput(input);
      setInput("");
    }
  };

    return (
      <>
        <Bòx flex={1} overflow={"none"} minHeight={200} bgcolor={'black'} color={'white'} code={code}>
            <Editor
              value={code}
              padding={10}
              onValueChange={(code) => setInput(code)}
              highlight={(code) => highlight(code, languages.js, 'javascript')}
              maxLength={1000}
              style={{
                  fontFamily: "monospace",
                  fontSize: 17,
              }}
            />
        </Bòx>
        <OutlinedInput onKeyDown={handleEnter} value={input} onChange={e => setInput(e.target.value)} placeholder="Type here" fullWidth/>
      </>
    );
});