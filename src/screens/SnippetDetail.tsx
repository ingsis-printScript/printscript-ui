import {useEffect, useState} from "react";
import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Alert, Box, CircularProgress, IconButton, Menu, MenuItem, Tooltip, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {
  useUpdateSnippetById
} from "../utils/queries.tsx";
import {useFormatSnippet, useGetSnippetById, useShareSnippet} from "../utils/queries.tsx";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {BugReport, Delete, Download, Save, Share} from "@mui/icons-material";
import {ShareSnippetModal} from "../components/snippet-detail/ShareSnippetModal.tsx";
import {TestSnippetModal} from "../components/snippet-test/TestSnippetModal.tsx";
import {Snippet} from "../utils/snippet.ts";
import {SnippetExecution} from "./SnippetExecution.tsx";
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import {queryClient} from "../App.tsx";
import {DeleteConfirmationModal} from "../components/snippet-detail/DeleteConfirmationModal.tsx";

type SnippetDetailProps = {
  id: string;
  handleCloseModal: () => void;
}

const DownloadButton = ({snippet}: { snippet?: Snippet }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {mutateAsync: formatSnippet, isLoading: isFormatLoading} = useFormatSnippet();

  if (!snippet) return null;

  const handleDownload = async (formatted: boolean) => {
    setAnchorEl(null);

    let content = snippet.content;

    if (formatted) {
      try {
        content = await formatSnippet({
          snippetId: snippet.id,
          code: snippet.content
        });
      } catch (error) {
        console.error("Error formatting snippet:", error);
        alert("Error formatting snippet. Please try again.");
        return;
      }
    }

    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${snippet.name}.${snippet.extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Tooltip title="Download">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Download/>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleDownload(false)}>
          Download Original
        </MenuItem>
        <MenuItem onClick={() => handleDownload(true)} disabled={isFormatLoading}>
          Download Formatted
        </MenuItem>
      </Menu>
    </>
  );
}

export const SnippetDetail = (props: SnippetDetailProps) => {
  const {id, handleCloseModal} = props;
  const [code, setCode] = useState(
      ""
  );
  const [shareModalOpened, setShareModalOpened] = useState(false)
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false)
  const [testModalOpened, setTestModalOpened] = useState(false);

  const {data: snippet, isLoading} = useGetSnippetById(id);
  const {mutate: shareSnippet, isLoading: loadingShare} = useShareSnippet()
  const {mutate: formatSnippet, isLoading: isFormatLoading, data: formatSnippetData} = useFormatSnippet()
  const {mutate: updateSnippet, isLoading: isUpdateSnippetLoading} = useUpdateSnippetById({onSuccess: () => queryClient.invalidateQueries(['snippet', id])})

  useEffect(() => {
    if (snippet) {
      setCode(snippet.content);
    }
  }, [snippet]);

  useEffect(() => {
    if (formatSnippetData) {
      setCode(formatSnippetData)
    }
  }, [formatSnippetData])


  async function handleShareSnippet(userId: string) {
    shareSnippet({snippetId: id, userId})
  }

  return (
      <Box p={4} minWidth={'60vw'}>
        <Box width={'100%'} p={2} display={'flex'} justifyContent={'flex-end'}>
          <CloseIcon style={{cursor: "pointer"}} onClick={handleCloseModal}/>
        </Box>
        {
          isLoading ? (<>
            <Typography fontWeight={"bold"} mb={2} variant="h4">Loading...</Typography>
            <CircularProgress/>
          </>) : <>
            <Typography variant="h4" fontWeight={"bold"}>{snippet?.name ?? "Snippet"}</Typography>
            {snippet?.description && (
              <Typography variant="body1" color="text.secondary" sx={{mb: 1}}>
                {snippet.description}
              </Typography>
            )}
            <Box display="flex" flexDirection="row" gap="8px" padding="8px">
              <Tooltip title={"Share"}>
                <IconButton onClick={() => setShareModalOpened(true)}>
                  <Share/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Test"}>
                <IconButton onClick={() => setTestModalOpened(true)}>
                  <BugReport/>
                </IconButton>
              </Tooltip>
              <DownloadButton snippet={snippet}/>
              {/*<Tooltip title={runSnippet ? "Stop run" : "Run"}>*/}
              {/*  <IconButton onClick={() => setRunSnippet(!runSnippet)}>*/}
              {/*    {runSnippet ? <StopRounded/> : <PlayArrow/>}*/}
              {/*  </IconButton>*/}
              {/*</Tooltip>*/}
              {/* TODO: we can implement a live mode*/}
              <Tooltip title={"Format"}>
                <IconButton onClick={() => formatSnippet({ snippetId: id, code })} disabled={isFormatLoading}>
                  <ReadMoreIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Save changes"}>
                <IconButton color={"primary"} onClick={() => updateSnippet({id: id, updateSnippet: {content: code}})} disabled={isUpdateSnippetLoading || snippet?.content === code} >
                  <Save />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Delete"}>
                <IconButton onClick={() => setDeleteConfirmationModalOpen(true)} >
                  <Delete color={"error"} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box display={"flex"} gap={2}>
              <Bòx flex={1} height={"fit-content"} overflow={"none"} minHeight={"500px"} bgcolor={'black'} color={'white'} code={code}>
                <Editor
                    value={code}
                    padding={10}
                    onValueChange={(code) => setCode(code)}
                    highlight={(code) => highlight(code, languages.js, "javascript")}
                    maxLength={1000}
                    style={{
                      minHeight: "500px",
                      fontFamily: "monospace",
                      fontSize: 17,
                    }}
                />
              </Bòx>
            </Box>
            <Box pt={1} flex={1} marginTop={2}>
              <Alert severity="info">Output</Alert>
              <SnippetExecution />
            </Box>
          </>
        }
        <ShareSnippetModal loading={loadingShare || isLoading} open={shareModalOpened}
                           onClose={() => setShareModalOpened(false)}
                           onShare={handleShareSnippet}/>
        <TestSnippetModal open={testModalOpened} onClose={() => setTestModalOpened(false)}/>
        <DeleteConfirmationModal open={deleteConfirmationModalOpen} onClose={() => setDeleteConfirmationModalOpen(false)} id={snippet?.id ?? ""} setCloseDetails={handleCloseModal} />
      </Box>
  );
}

